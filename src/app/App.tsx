import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell, Home, Grid3X3, User,
  ChevronRight, FileText, ShieldCheck, HeartPulse, AlertTriangle,
  MapPin, Clock, Phone, QrCode, CheckCircle2, Circle, XCircle,
  Search, X, Check, CreditCard, ArrowUpRight, Receipt, Landmark,
  Building2, Plane, Settings, LogOut, BadgeCheck, ChevronDown,
  ChevronUp, Globe, MessageCircle, Send, Sparkles, Fingerprint,
  Lock, BookOpen, Briefcase, Leaf, Wallet, ArrowLeftRight, RefreshCw,
  RotateCcw, Camera, type LucideIcon,
} from "lucide-react";
import "../styles/fonts.css";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary: "#123C69",
  primaryPressed: "#0D2C4E",
  accent: "#2E6FCC",
  canvas: "#F5F7FA",
  surface: "#FFFFFF",
  border: "#E3E8EF",
  textPrimary: "#1A2433",
  textSecondary: "#667085",
  textTertiary: "#98A2B3",
  iconTileTint: "#EAF1FA",
  lguTint: "#F3EFEA",
  successText: "#17864D",
  successBg: "#E7F7EF",
  warningText: "#B77A12",
  warningBg: "#FDF3DF",
  dangerText: "#C13333",
  dangerBg: "#FBEAEA",
  goldAccent: "#FCD116",
};

const shadow = {
  card: "0px 2px 8px rgba(16,24,40,0.06)",
  hero: "0px 4px 16px rgba(16,24,40,0.10)",
};

const nunito = "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// ─── Data Model ────────────────────────────────────────────────────────────────

type VerificationStatus = "Verified" | "Pending" | "Action Needed";
type ActivityStatus = "Pending" | "Processing" | "Approved" | "Rejected";
type LguUpdateType = "Advisory" | "Health" | "Deadline" | "Event";

interface UserEntity {
  id: string;
  firstName: string;
  fullName: string;
  profilePhoto: string | null;
  registeredCity: string;
  registeredBarangay: string;
  verificationStatus: VerificationStatus;
  idNumber: string;
  ewalletBalance: number;
  mobileNumber: string;
}

interface NotificationEntity {
  id: string;
  title: string;
  shortBody: string;
  read: boolean;
  timestamp: string;
  linkedSection: string;
}

interface LguUpdateEntity {
  id: string;
  cityBarangayCode: string;
  type: LguUpdateType;
  headline: string;
  shortDescription: string;
  thumbnailImage: string;
  publishedAt: string;
  expiresAt: string;
  detailLink: string;
}

interface FeedCardEntity {
  id: string;
  illustration: string;
  headline: string;
  supportingLine: string;
  ctaLabel: string;
  ctaDestination: string;
  priorityScore: number;
  eligibilityRule: string | null;
}

interface AnnouncementEntity {
  id: string;
  bannerImage: string;
  categoryLabel: string;
  headline: string;
  publishedAt: string;
  expiresAt: string;
  link: string;
  displayOrder: number;
}

// Extension point: once the eReport API is integrated, status transitions
// here (Pending → Processing → Approved/Rejected) are the natural trigger
// for an eMessage SMS notification — same server-side sendSms() helper
// used by the verification flow, called from wherever eReport's webhook/
// poll result lands server-side. Not wired yet — no eReport spec to build
// against.
interface ActivityItemEntity {
  id: string;
  serviceName: string;
  status: ActivityStatus;
  statusDetail: string;
  submittedAt: string;
  updatedAt: string;
  receiptLink: string;
}

// ─── eCitizenPH Intelligence Layer types ──────────────────────────────────────

type EmploymentStatus = "employed" | "self-employed" | "student" | "unemployed" | "retired" | "ofw" | "";
type IncomeBracket = "under10k" | "10k-24k" | "24k-60k" | "over60k" | "";

interface CitizenProfile {
  age: number;
  region: string;
  employmentStatus: EmploymentStatus;
  incomeBracket: IncomeBracket;
  hasSchoolAgeDependents: boolean;
  isSoloParent: boolean;
  isPWD: boolean;
  isMicroEntrepreneur: boolean;
}

const DEFAULT_CITIZEN_PROFILE: CitizenProfile = {
  age: 34, region: "Region III — Gitnang Luzon", employmentStatus: "employed",
  incomeBracket: "10k-24k", hasSchoolAgeDependents: true,
  isSoloParent: false, isPWD: false, isMicroEntrepreneur: false,
};

interface MatchedRule {
  description: string;
  matched: boolean;
}

interface ProgramRec {
  id: string;
  name: string;
  agency: string;
  agencyColor: string;
  description: string;
  matchPercent: number;
  matchedRules: MatchedRule[];
  ctaLabel: string;
  requiredDocuments: string[];
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

const CURRENT_USER: UserEntity = {
  id: "usr-001",
  firstName: "Juan",
  fullName: "Juan dela Cruz",
  profilePhoto: null,
  registeredCity: "Malolos",
  registeredBarangay: "Brgy. San Pablo Norte",
  verificationStatus: "Verified",
  idNumber: "PSN-•••• •••• 1234",
  ewalletBalance: 1_240.50,
  mobileNumber: "+639170000001", // demo number — no real SMS form exists yet, see DEMO_DEMOGRAPHICS
};

const NOTIFICATIONS: NotificationEntity[] = [
  { id: "notif-001", title: "E-ID Renewal Approved", shortBody: "Your Electronic ID renewal has been approved.", read: false, timestamp: "2026-07-20T09:15:00", linkedSection: "activity" },
  { id: "notif-002", title: "Business Permit Update", shortBody: "Your application is being reviewed.", read: false, timestamp: "2026-07-18T14:30:00", linkedSection: "activity" },
  { id: "notif-003", title: "PhilHealth Konsulta", shortBody: "Libreng konsultasyon available sa inyong lugar.", read: true, timestamp: "2026-07-14T08:00:00", linkedSection: "health" },
];

const LGU_UPDATES: LguUpdateEntity[] = [
  {
    id: "lgu-001",
    cityBarangayCode: "MALOLOS-MAIN",
    type: "Advisory",
    headline: "Pasuspindihin ang klase bukas sa lahat ng antas",
    shortDescription: "Dahil sa malakas na ulan at posibleng pagbaha sa ilang bahagi ng lungsod, sususpindihin ang lahat ng klase bukas.",
    thumbnailImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=200&fit=crop&auto=format",
    publishedAt: "2026-07-20T18:00:00",
    expiresAt: "2026-07-22T00:00:00",
    detailLink: "/updates/lgu-001",
  },
  {
    id: "lgu-002",
    cityBarangayCode: "MALOLOS-MAIN",
    type: "Health",
    headline: "Libreng Bakuna Kontra-Flu sa Lahat ng Barangay",
    shortDescription: "Available para sa lahat ng residente na may edad 18 pataas. Magdala ng valid ID. Walang appointment na kailangan.",
    thumbnailImage: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=200&fit=crop&auto=format",
    publishedAt: "2026-07-18T08:00:00",
    expiresAt: "2026-07-28T17:00:00",
    detailLink: "/updates/lgu-002",
  },
  {
    id: "lgu-003",
    cityBarangayCode: "MALOLOS-MAIN",
    type: "Deadline",
    headline: "Deadline: Business Permit Renewal — Hulyo 31",
    shortDescription: "I-renew ang inyong business permit bago mag-Hulyo 31 para maiwasan ang penalty. Online renewal na available.",
    thumbnailImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=200&fit=crop&auto=format",
    publishedAt: "2026-07-01T08:00:00",
    expiresAt: "2026-07-31T23:59:00",
    detailLink: "/updates/lgu-003",
  },
];

const FEED_CARDS: FeedCardEntity[] = [
  {
    id: "feed-001",
    illustration: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=720&h=405&fit=crop&auto=format",
    headline: "I-renew ang iyong National ID bago mag-expire",
    supportingLine: "Mag-e-expire na sa 30 araw — i-renew na ngayon.",
    ctaLabel: "Alamin →",
    ctaDestination: "/renew-id",
    priorityScore: 95,
    eligibilityRule: "ID expires within 30 days",
  },
  {
    id: "feed-002",
    illustration: "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=720&h=405&fit=crop&auto=format",
    headline: "Qualify ka ba sa DSWD 4Ps?",
    supportingLine: "Batay sa iyong profile, posibleng eligible ka.",
    ctaLabel: "Alamin →",
    ctaDestination: "/4ps",
    priorityScore: 85,
    eligibilityRule: null,
  },
  {
    id: "feed-003",
    illustration: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=720&h=405&fit=crop&auto=format",
    headline: "Libreng konsultasyon sa PhilHealth Konsulta",
    supportingLine: "Available sa mga miyembro ng PhilHealth.",
    ctaLabel: "Alamin →",
    ctaDestination: "/health/konsulta",
    priorityScore: 70,
    eligibilityRule: null,
  },
];

const ANNOUNCEMENTS: AnnouncementEntity[] = [
  {
    id: "ann-001",
    bannerImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&h=420&fit=crop&auto=format",
    categoryLabel: "KALUSUGAN",
    headline: "Libreng konsultasyon sa lahat ng barangay ngayong Hulyo",
    publishedAt: "2026-07-01T00:00:00",
    expiresAt: "2026-07-31T23:59:00",
    link: "/announcements/ann-001",
    displayOrder: 1,
  },
  {
    id: "ann-002",
    bannerImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=700&h=420&fit=crop&auto=format",
    categoryLabel: "EDUKASYON",
    headline: "CHED TES applications bukas na para sa AY 2026–2027",
    publishedAt: "2026-07-05T00:00:00",
    expiresAt: "2026-08-31T23:59:00",
    link: "/announcements/ann-002",
    displayOrder: 2,
  },
  {
    id: "ann-003",
    bannerImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=700&h=420&fit=crop&auto=format",
    categoryLabel: "NEGOSYO",
    headline: "DTI KMME registration extended hanggang Agosto 31",
    publishedAt: "2026-07-08T00:00:00",
    expiresAt: "2026-08-31T23:59:00",
    link: "/announcements/ann-003",
    displayOrder: 3,
  },
];

const ACTIVITY_ITEMS: ActivityItemEntity[] = [
  { id: "act-001", serviceName: "E-ID Renewal", status: "Approved", statusDetail: "Naaprubahan", submittedAt: "2026-07-18T10:00:00", updatedAt: "2026-07-20T09:00:00", receiptLink: "/activity/act-001" },
  { id: "act-002", serviceName: "Business Permit", status: "Pending", statusDetail: "Isinasaalang-alang", submittedAt: "2026-07-16T14:00:00", updatedAt: "2026-07-18T11:00:00", receiptLink: "/activity/act-002" },
  { id: "act-003", serviceName: "PhilHealth ID", status: "Processing", statusDetail: "Pinoproseso", submittedAt: "2026-07-13T09:00:00", updatedAt: "2026-07-15T14:00:00", receiptLink: "/activity/act-003" },
  { id: "act-004", serviceName: "Scholarship Form", status: "Rejected", statusDetail: "Tinanggihan", submittedAt: "2026-07-08T08:00:00", updatedAt: "2026-07-10T10:00:00", receiptLink: "/activity/act-004" },
];

// ─── Recommendation Engine ─────────────────────────────────────────────────────

function computeRecommendations(profile: CitizenProfile): ProgramRec[] {
  const age = profile.age || 0;
  const isLowIncome = profile.incomeBracket === "under10k" || profile.incomeBracket === "10k-24k";
  const isMidOrLow = isLowIncome || profile.incomeBracket === "24k-60k";
  const isStudent = profile.employmentStatus === "student";
  const isUnemployed = profile.employmentStatus === "unemployed";
  const isSelfEmployed = profile.employmentStatus === "self-employed";
  const isInformalWorker = isUnemployed || isSelfEmployed;

  const rawPrograms = [
    {
      id: "4ps", name: "DSWD 4Ps", fullName: "Pantawid Pamilyang Pilipino Program",
      agency: "DSWD", agencyColor: "#CE1126",
      description: "Monthly cash grants for education and health for the poorest Filipino families.",
      ctaLabel: "Check Eligibility",
      requiredDocuments: [
        "Verified PhilSys National ID (or PSN)",
        "Barangay Certificate of Residency",
        "Certificate of Indigency or proof of household income",
        "Child's Birth Certificate / School Enrollment Certificate (if claiming education grant)",
      ],
      rules: [
        { description: "Buwanang kita: ₱15k–₱24,999 (nasa hangganan ng programa)", matched: isLowIncome },
        { description: "May anak sa paaralan (kwalipikado)", matched: profile.hasSchoolAgeDependents },
        { description: "Rehiyon III (saklaw ng 4Ps)", matched: profile.region.includes("III") || profile.region.includes("Gitnang Luzon") },
        { description: "Solo Parent (hindi na-check — hindi disqualifier)", matched: profile.isSoloParent },
      ],
    },
    {
      id: "konsulta", name: "PhilHealth Konsulta", fullName: "PhilHealth Konsulta Package",
      agency: "PhilHealth", agencyColor: "#0038A8",
      description: "Free outpatient consultations, diagnostics, and medicines at accredited clinics.",
      ctaLabel: "Find a Provider",
      requiredDocuments: [
        "Verified PhilSys National ID (or PSN)",
        "PhilHealth Member Data Record (MDR) or PhilHealth Number",
        "Proof of residency within the accredited facility's catchment area",
      ],
      rules: [
        { description: "Filipino citizen", matched: true },
        { description: "May PhilHealth coverage", matched: ["employed", "self-employed", "ofw"].includes(profile.employmentStatus) },
        { description: "Anumang antas ng kita", matched: true },
        { description: "Hindi pa nag-avail ng Konsulta ngayong taon", matched: true },
      ],
    },
    {
      id: "kmme", name: "DTI KMME", fullName: "Kapatid Mentor ME (KMME)",
      agency: "DTI", agencyColor: "#B77A12",
      description: "Free business mentoring pairing micro-entrepreneurs with Filipino business leaders.",
      ctaLabel: "Register for Free",
      requiredDocuments: [
        "Verified PhilSys National ID (or PSN)",
        "DTI Business Name Registration (or Barangay Business Clearance for micro-enterprises)",
        "Proof of business address / operation",
      ],
      rules: [
        { description: "Self-employed o may micro-enterprise", matched: isSelfEmployed || profile.isMicroEntrepreneur },
        { description: "Monthly household income below ₱60,000", matched: isMidOrLow },
        { description: "Filipino citizen", matched: true },
        { description: "Aktibong nagpapatakbo ng negosyo", matched: isSelfEmployed || profile.isMicroEntrepreneur },
      ],
    },
    {
      id: "tes", name: "CHED Tulong Dunong", fullName: "Tertiary Education Subsidy (TES)",
      agency: "CHED", agencyColor: "#2E6FCC",
      description: "Free tuition and monthly living allowance for poor and low-income students in public HEIs.",
      ctaLabel: "Apply via CHED",
      requiredDocuments: [
        "Verified PhilSys National ID (or PSN)",
        "Certificate of Registration / Enrollment from a public HEI",
        "Barangay Certificate of Indigency or income documentation",
        "Latest report card or transcript of records",
      ],
      rules: [
        { description: "Estudyante o may college-age dependent", matched: isStudent || profile.hasSchoolAgeDependents },
        { description: "Monthly household income below ₱60,000", matched: isMidOrLow },
        { description: "Enrolled sa public HEI", matched: isStudent },
        { description: "Filipino citizen", matched: true },
      ],
    },
    {
      id: "tupad", name: "DOLE TUPAD", fullName: "Tulong Panghanapbuhay sa Ating Disadvantaged Workers",
      agency: "DOLE", agencyColor: "#667085",
      description: "10–30 days paid community work for displaced, seasonal, and underemployed workers.",
      ctaLabel: "Apply via Barangay",
      requiredDocuments: [
        "Verified PhilSys National ID (or PSN)",
        "Barangay Certification of unemployment / underemployment",
        "DOLE/PESO registration form",
      ],
      rules: [
        { description: "Kasalukuyang walang trabaho o underemployed", matched: isUnemployed },
        { description: "18 taong gulang o mas matanda", matched: age >= 18 },
        { description: "Informal economy worker", matched: isInformalWorker },
        { description: "Monthly household income below ₱24,000", matched: isLowIncome },
      ],
    },
    {
      id: "pwd", name: "PWD Privileges (RA 10524)", fullName: "PWD Privileges",
      agency: "NCDA / LGU", agencyColor: "#C13333",
      description: "20% discount & VAT exemption on medicines, medical services, transport, and more.",
      ctaLabel: "Get PWD ID",
      requiredDocuments: [
        "Verified PhilSys National ID (or PSN)",
        "Medical Certificate confirming disability (from a licensed physician)",
        "2x2 ID photo",
        "Barangay Certificate of Residency",
      ],
      rules: [
        { description: "Person with Disability (PWD)", matched: profile.isPWD },
        { description: "May hawak o mag-a-apply ng PWD ID", matched: profile.isPWD },
        { description: "Filipino citizen", matched: true },
        { description: "Nakatala sa barangay", matched: true },
      ],
    },
  ];

  return rawPrograms
    .map((p) => {
      const matchCount = p.rules.filter((r) => r.matched).length;
      const matchPercent = Math.round((matchCount / p.rules.length) * 100);
      return { id: p.id, name: p.name, agency: p.agency, agencyColor: p.agencyColor, description: p.description, matchPercent, matchedRules: p.rules, ctaLabel: p.ctaLabel, requiredDocuments: p.requiredDocuments };
    })
    .filter((p) => p.matchPercent >= 25)
    .sort((a, b) => b.matchPercent - a.matchPercent);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function shortDatePH(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

// ─── Sunburst Emblem ──────────────────────────────────────────────────────────

function SunburstEmblem({ size = 24, active = true }: { size?: number; active?: boolean }) {
  const navy = active ? "#0038A8" : "#98A2B3";
  const gold = active ? "#FCD116" : "#C2CADB";
  const red  = active ? "#CE1126" : "#8E9BAD";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill={navy} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path key={angle} d="M 10.6,8.2 L 12,2 L 13.4,8.2 Z"
          fill={gold} transform={`rotate(${angle}, 12, 12)`} />
      ))}
      <circle cx="12" cy="12" r="4.6" fill={red} />
      <circle cx="12" cy="12" r="2.1" fill={gold} />
    </svg>
  );
}

// ─── Primitives ────────────────────────────────────────────────────────────────

type SectionState = "loading" | "ready" | "error";

function Skeleton({ w, h, radius = 10 }: { w?: string | number; h: number; radius?: number }) {
  return <div style={{ width: w ?? "100%", height: h, borderRadius: radius, background: C.border, flexShrink: 0 }} />;
}

function SectionError({ name, onRetry }: { name: string; onRetry: () => void }) {
  return (
    <button onClick={onRetry} style={{ width: "100%", minHeight: 52, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", padding: "12px 16px" }}>
      <AlertTriangle size={16} color={C.textTertiary} strokeWidth={1.8} aria-hidden="true" />
      <span style={{ fontSize: 14, color: C.textSecondary }}>Hindi ma-load ang {name}. I-tap para subukan muli.</span>
    </button>
  );
}

function EyebrowRow({ label, actionLabel, onAction }: { label: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.textTertiary, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>{label}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ fontSize: 14, fontWeight: 500, color: C.accent, background: "none", border: "none", cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── Shared eGovPH Header ─────────────────────────────────────────────────────

const STATUS_BAR_H = 44;
const TOP_BAR_H = 56;
const DIGITAL_ID_STRIP_H = 60;
const BOTTOM_NAV_H = 56;
const SAFE_BOTTOM = 28;

function ECitizenAppBar({ unreadCount, onQrScan, onDevHandoff }: { unreadCount: number; onQrScan: () => void; onDevHandoff: () => void }) {
  return (
    <div style={{ position: "absolute", top: STATUS_BAR_H, left: 0, right: 0, height: TOP_BAR_H, display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: 16, background: C.surface, borderBottom: `1px solid ${C.border}`, zIndex: 20 }}>
      {/* Left cluster */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <SunburstEmblem size={28} active={true} />
        <span style={{ fontFamily: nunito, fontSize: 16, fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.01em" }}>eGovPH</span>
      </div>

      {/* Right cluster */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {/* Concept Prototype badge — tap to open Dev Handoff (Step 14) */}
        <button onClick={onDevHandoff} aria-label="Open Dev Handoff — eVerify Integration"
          style={{ fontFamily: nunito, fontSize: 11, fontWeight: 600, color: C.warningText, background: C.warningBg, borderRadius: 8, padding: "6px 10px", marginRight: 12, whiteSpace: "nowrap", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          ⚙️ Concept Prototype
        </button>
        {/* Bell */}
        <button aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: "none", border: "none", cursor: "pointer" }}>
          <Bell size={24} color={C.textPrimary} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 999, background: "#CE1126", border: `2px solid ${C.surface}` }} />
          )}
        </button>
        {/* QR */}
        <button aria-label="Scan QR code" onClick={onQrScan} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}>
          <QrCode size={24} color={C.textPrimary} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

// ─── Digital ID Strip ─────────────────────────────────────────────────────────

function DigitalIDStrip() {
  return (
    <div style={{
      position: "absolute",
      top: STATUS_BAR_H + TOP_BAR_H,
      left: 0, right: 0,
      height: DIGITAL_ID_STRIP_H,
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      borderLeft: `4px solid ${C.goldAccent}`,
      zIndex: 19,
      display: "flex",
      alignItems: "center",
      paddingLeft: 16,
      paddingRight: 16,
      gap: 8,
    }}>
      {/* Avatar */}
      <div style={{ width: 36, height: 36, borderRadius: 999, background: C.primary, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: nunito, fontSize: 12, fontWeight: 700, color: "#fff" }}>JD</span>
      </div>
      {/* Info */}
      <div>
        <p style={{ fontFamily: nunito, fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: 0, lineHeight: "19px" }}>Juan dela Cruz</p>
        <p style={{ fontFamily: nunito, fontSize: 12, fontWeight: 400, color: C.successText, margin: 0, lineHeight: "16px" }}>PSN: •••• •••• 1234 &nbsp;✓ Verified</p>
      </div>
    </div>
  );
}

// ─── Pull-to-Refresh Scroll Container ─────────────────────────────────────────

const PTR_THRESHOLD = 64;
const PTR_INDICATOR_H = 48;

function ScrollContent({ top, bottomPad, onRefresh, children }: { top: number; bottomPad: number; onRefresh: () => Promise<void>; children: React.ReactNode }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollEl = useRef<HTMLDivElement>(null);

  const trigger = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setPullY(0);
    await onRefresh();
    setRefreshing(false);
  }, [refreshing, onRefresh]);

  const onTouchStart = useCallback((e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = scrollEl.current;
    if (!el || el.scrollTop > 0) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy < 0) return;
    setPullY(Math.min(PTR_THRESHOLD, dy * 0.45));
  }, [refreshing]);
  const onTouchEnd = useCallback(() => {
    if (pullY >= PTR_THRESHOLD) trigger();
    else setPullY(0);
  }, [pullY, trigger]);

  return (
    <div ref={scrollEl} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      style={{ position: "absolute", top, left: 0, right: 0, bottom: 0, overflowY: "auto", scrollbarWidth: "none", background: C.canvas }}>
      <div style={{ height: refreshing ? PTR_INDICATOR_H : pullY * (PTR_INDICATOR_H / PTR_THRESHOLD), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: pullY === 0 ? "height 0.3s ease" : "none" }}>
        <div style={{ width: 28, height: 28, borderRadius: 999, border: `2.5px solid ${C.border}`, borderTopColor: C.primary, opacity: refreshing ? 1 : pullY / PTR_THRESHOLD, animation: refreshing ? "ptr-spin 0.7s linear infinite" : "none" }} />
        <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <div role="main" style={{ paddingBottom: bottomPad }}>{children}</div>
    </div>
  );
}

// ─── QR Scanner Modal ─────────────────────────────────────────────────────────

function QrScannerModal({ onClose }: { onClose: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { btnRef.current?.focus(); }, []);
  return (
    <div role="dialog" aria-modal="true" aria-label="QR code scanner" style={{ position: "absolute", inset: 0, zIndex: 100, background: "#0A0F1A", display: "flex", flexDirection: "column", borderRadius: 48, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 16px 16px" }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>I-scan ang QR Code</p>
        <button ref={btnRef} aria-label="Close" onClick={onClose} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", borderRadius: 999, border: "none", cursor: "pointer" }}>
          <X size={20} color="#fff" strokeWidth={2} />
        </button>
      </div>
      <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>I-point sa kahit anong government QR code</p>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 240, height: 240 }}>
          {[{ top: 0, left: 0, borderTop: "3px solid #fff", borderLeft: "3px solid #fff", borderRadius: "12px 0 0 0" }, { top: 0, right: 0, borderTop: "3px solid #fff", borderRight: "3px solid #fff", borderRadius: "0 12px 0 0" }, { bottom: 0, left: 0, borderBottom: "3px solid #fff", borderLeft: "3px solid #fff", borderRadius: "0 0 0 12px" }, { bottom: 0, right: 0, borderBottom: "3px solid #fff", borderRight: "3px solid #fff", borderRadius: "0 0 12px 0" }].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 32, height: 32, ...s }} />
          ))}
          <div style={{ position: "absolute", left: 12, right: 12, top: "40%", height: 2, background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, borderRadius: 999 }} />
        </div>
      </div>
      <div style={{ padding: "24px 32px 48px", display: "flex", justifyContent: "center", gap: 40 }}>
        {[{ Icon: FileText, label: "Mula sa Gallery" }].map(({ Icon, label }) => (
          <button key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={24} color="#fff" strokeWidth={1.8} />
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Notification Badge ────────────────────────────────────────────────────────

function NotifBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span style={{ position: "absolute", top: 6, right: 6, minWidth: count >= 10 ? 18 : 8, height: count >= 10 ? 18 : 8, borderRadius: 999, background: "#CE1126", border: `2px solid ${C.surface}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", paddingInline: count >= 10 ? 3 : 0, lineHeight: 1 }}>
      {count >= 10 ? count : ""}
    </span>
  );
}

// ─── Activity status tokens ────────────────────────────────────────────────────

const ACTIVITY_STATUS: Record<ActivityStatus, { color: string; bg: string; taglishLabel: string; Icon: LucideIcon }> = {
  Pending:    { color: C.warningText, bg: C.warningBg,  taglishLabel: "Isinasaalang-alang", Icon: Clock },
  Processing: { color: C.accent,     bg: C.iconTileTint, taglishLabel: "Pinoproseso",        Icon: RotateCcw },
  Approved:   { color: C.successText, bg: C.successBg,   taglishLabel: "Naaprubahan",         Icon: CheckCircle2 },
  Rejected:   { color: C.dangerText,  bg: C.dangerBg,    taglishLabel: "Tinanggihan",         Icon: XCircle },
};

// ─── Hero / Digital ID Card ───────────────────────────────────────────────────

function HeroCard({ onOpenIdQr }: { onOpenIdQr: () => void }) {
  const quickIcons: { Icon: LucideIcon; label: string }[] = [
    { Icon: Wallet, label: "Wallet" },
    { Icon: FileText, label: "Documents" },
    { Icon: ArrowLeftRight, label: "Transfer" },
  ];
  return (
    <div style={{ margin: "0 16px" }}>
      <div style={{ background: "linear-gradient(135deg, #123C69 0%, #1B4C82 100%)", borderRadius: 20, padding: 20, boxShadow: shadow.hero, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -48, right: -48, width: 180, height: 180, borderRadius: 999, background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -24, left: -24, width: 120, height: 120, borderRadius: 999, background: "rgba(255,255,255,0.04)" }} />

        {/* Row 1 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.70)", letterSpacing: "0.04em", textTransform: "uppercase", margin: 0 }}>Digital ID</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px" }}>
            <Check size={12} color="#fff" strokeWidth={2.5} />
            <span style={{ fontFamily: nunito, fontSize: 12, fontWeight: 500, color: "#fff" }}>Verified</span>
          </span>
        </div>

        {/* Name */}
        <p style={{ fontFamily: nunito, fontSize: 20, fontWeight: 700, lineHeight: "26px", color: "#fff", marginTop: 24, marginBottom: 0 }}>Juan dela Cruz</p>

        {/* Action row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button onClick={onOpenIdQr} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: C.primary, borderRadius: 999, padding: "12px 20px", fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            <QrCode size={16} strokeWidth={2} />
            View QR Code
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            {quickIcons.map(({ Icon, label }) => (
              <button key={label} aria-label={label} title={label} style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                <Icon aria-hidden="true" size={18} color="#fff" strokeWidth={1.8} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NGA Tiles Section ────────────────────────────────────────────────────────

const NGA_TILES: { label: string; Icon: LucideIcon }[] = [
  { label: "E-ID", Icon: CreditCard },
  { label: "Permits", Icon: FileText },
  { label: "PhilHealth", Icon: HeartPulse },
  { label: "SSS", Icon: ShieldCheck },
  { label: "Scholarships", Icon: BookOpen },
  { label: "PNP", Icon: ShieldCheck },
  { label: "LGU Pay", Icon: Landmark },
  { label: "Civil Reg", Icon: Receipt },
  { label: "DFA", Icon: Plane },
  { label: "DOLE", Icon: Briefcase },
  { label: "DA", Icon: Leaf },
  { label: "DICT", Icon: Globe },
];

function NGATilesSection() {
  return (
    <div style={{ margin: "24px 16px 0" }}>
      <EyebrowRow label="Mga Serbisyo" actionLabel="Lahat →" onAction={() => {}} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", columnGap: 12, rowGap: 20 }}>
        {NGA_TILES.map(({ label, Icon }) => (
          <button key={label} aria-label={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, minHeight: 44 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: C.iconTileTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon aria-hidden="true" size={28} color={C.primary} strokeWidth={1.8} />
            </div>
            <p style={{ fontFamily: nunito, fontSize: 12, fontWeight: 500, lineHeight: "16px", color: C.textPrimary, textAlign: "center", marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", maxWidth: "100%" }}>
              {label}
            </p>
          </button>
        ))}
      </div>
      <button style={{ display: "block", width: "100%", marginTop: 12, fontSize: 14, fontWeight: 500, color: C.accent, background: "none", border: "none", cursor: "pointer", textAlign: "center", minHeight: 44 }}>
        Lahat ng Serbisyo (24)
      </button>
    </div>
  );
}

// ─── LGU Wedge ────────────────────────────────────────────────────────────────

const LGU_CHIP: Record<LguUpdateType, { text: string; bg: string; label: string }> = {
  Advisory: { text: "#B77A12", bg: "#FDF3DF", label: "Advisory" },
  Health:   { text: "#0F7C7C", bg: "#E3F5F5", label: "Health" },
  Deadline: { text: "#123C69", bg: "#EAF1FA", label: "Deadline" },
  Event:    { text: "#6E4AA6", bg: "#F3EEFB", label: "Event" },
};

function LguWedge({ updates, sectionState = "ready", onRetry }: { updates: LguUpdateEntity[]; sectionState?: SectionState; onRetry?: () => void }) {
  const [slide, setSlide] = useState(0);
  const activeSlide = Math.min(slide, Math.max(0, updates.length - 1));

  if (sectionState === "loading") {
    return <div style={{ margin: "24px 16px" }}><div style={{ background: C.lguTint, borderRadius: 20, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}><Skeleton h={16} w={150} /><Skeleton h={88} radius={12} /></div></div>;
  }
  if (sectionState === "error") {
    return <div style={{ margin: "24px 16px" }}><SectionError name="Malolos Updates" onRetry={onRetry ?? (() => {})} /></div>;
  }

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return "kakatapos lang";
    if (h < 24) return `${h} oras na ang nakalipas`;
    return `${Math.floor(h / 24)} araw na ang nakalipas`;
  }

  const latestTs = updates.length ? updates.reduce((a, b) => (a.publishedAt > b.publishedAt ? a : b)).publishedAt : null;

  return (
    <div style={{ margin: "24px 16px 0", position: "relative" }}>
      <div style={{ background: C.lguTint, borderRadius: 20, padding: 16, boxShadow: shadow.card, position: "relative", overflow: "hidden" }}>
        {/* Decorative concentric circles */}
        <svg aria-hidden style={{ position: "absolute", bottom: -32, right: -32, pointerEvents: "none" }} width="160" height="160" viewBox="0 0 160 160" fill="none">
          {[140, 110, 80, 50, 24].map((r) => (
            <circle key={r} cx="160" cy="160" r={r} stroke={C.primary} strokeWidth="1.5" strokeOpacity="0.04" fill="none" />
          ))}
        </svg>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={16} color={C.primary} strokeWidth={2} />
            <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.primary, margin: 0 }}>Malolos Updates</p>
          </div>
          {latestTs && <p style={{ fontSize: 11, fontWeight: 500, color: C.textSecondary }}>Na-update {relativeTime(latestTs)}</p>}
        </div>

        {/* Slide */}
        {updates.length > 0 && (() => {
          const u = updates[activeSlide];
          const chip = LGU_CHIP[u.type];
          return (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 88, height: 88, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: C.border }}>
                <img src={u.thumbnailImage} alt={u.headline} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, color: chip.text, background: chip.bg }}>
                  {chip.label}
                </span>
                <p style={{ fontSize: 16, fontWeight: 700, lineHeight: "22px", color: C.textPrimary, marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {u.headline}
                </p>
                <p style={{ fontSize: 13, color: C.textSecondary, marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {u.shortDescription}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Dots */}
        {updates.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
            {updates.map((_, i) => (
              <button key={i} aria-label={`Update ${i + 1}`} aria-pressed={i === activeSlide} onClick={() => setSlide(i)}
                style={{ width: i === activeSlide ? 16 : 6, height: 6, borderRadius: 999, background: i === activeSlide ? C.primary : C.textTertiary, opacity: i === activeSlide ? 1 : 0.4, border: "none", padding: 0, cursor: "pointer", transition: "width 0.2s", minWidth: 6 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── For You Feed ─────────────────────────────────────────────────────────────

function ForYouFeed({ cards, sectionState = "ready", onRetry }: { cards: FeedCardEntity[]; sectionState?: SectionState; onRetry?: () => void }) {
  if (sectionState === "loading") {
    return (
      <div style={{ margin: "24px 16px 0" }}>
        <EyebrowRow label="Para Sa Iyo" />
        {[0, 1].map((i) => (
          <div key={i} style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <Skeleton h={Math.round((358 - 32) * 9 / 16)} radius={0} />
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton h={18} />
              <Skeleton w="70%" h={14} />
              <Skeleton w={100} h={36} radius={12} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (sectionState === "error") {
    return <div style={{ margin: "24px 16px 0" }}><EyebrowRow label="Para Sa Iyo" /><SectionError name="Para Sa Iyo" onRetry={onRetry ?? (() => {})} /></div>;
  }

  return (
    <div style={{ margin: "24px 16px 0" }}>
      <EyebrowRow label="Para Sa Iyo" actionLabel="Higit pa →" onAction={() => {}} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {cards.map((card) => (
          <div key={card.id} style={{ background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ aspectRatio: "16/9", background: C.border, overflow: "hidden" }}>
              <img src={card.illustration} alt={card.headline} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 700, lineHeight: "22px", color: C.textPrimary, margin: 0 }}>{card.headline}</p>
              <p style={{ fontSize: 13, color: C.textSecondary, marginTop: 4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{card.supportingLine}</p>
              <div style={{ marginTop: 12 }}>
                <button style={{ display: "inline-flex", alignItems: "center", padding: "10px 16px", borderRadius: 12, background: C.primary, color: "#fff", fontFamily: nunito, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  {card.ctaLabel}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button style={{ display: "block", width: "100%", marginTop: 16, fontSize: 14, fontWeight: 500, color: C.accent, background: "none", border: "none", cursor: "pointer", textAlign: "center", minHeight: 44 }}>
        Tingnan lahat
      </button>
    </div>
  );
}

// ─── National Announcement Carousel ──────────────────────────────────────────

const SHELL_W = 390;
const CARD_W = Math.round(SHELL_W * 0.85);
const CARD_GAP = 12;
const LEAD_INSET = 16;
const AUTOPLAY_MS = 6000;

function AnnouncementCarousel({ announcements, sectionState = "ready", onRetry }: { announcements: AnnouncementEntity[]; sectionState?: SectionState; onRetry?: () => void }) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = announcements.length;

  const scrollTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(idx, count - 1));
    el.scrollTo({ left: clamped * (CARD_W + CARD_GAP), behavior: "smooth" });
    setActive(clamped);
  }, [count]);

  const startAutoplay = useCallback(() => {
    if (count <= 1) return;
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % count;
        scrollRef.current?.scrollTo({ left: next * (CARD_W + CARD_GAP), behavior: "smooth" });
        return next;
      });
    }, AUTOPLAY_MS);
  }, [count]);

  useEffect(() => {
    startAutoplay();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [startAutoplay]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setActive(Math.max(0, Math.min(Math.round(el.scrollLeft / (CARD_W + CARD_GAP)), count - 1)));
  }, [count]);

  if (sectionState === "loading") {
    return (
      <div style={{ margin: "24px 0 0" }}>
        <div style={{ margin: "0 16px 12px" }}><EyebrowRow label="Mga Pambansang Abiso" /></div>
        <div style={{ display: "flex", gap: 12, paddingLeft: 16, overflow: "hidden" }}>
          <Skeleton w={CARD_W} h={140} radius={20} />
          <Skeleton w={CARD_W * 0.3} h={140} radius={20} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: "24px 0 0" }}>
      <div style={{ margin: "0 16px 12px" }}><EyebrowRow label="Mga Pambansang Abiso" /></div>
      <div ref={scrollRef} onScroll={onScroll} onTouchStart={() => { if (autoRef.current) clearInterval(autoRef.current); }}
        style={{ display: "flex", gap: CARD_GAP, overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", paddingLeft: LEAD_INSET, paddingRight: LEAD_INSET, WebkitOverflowScrolling: "touch" }}>
        {announcements.map((ann) => (
          <div key={ann.id} style={{ flexShrink: 0, width: CARD_W, height: 140, borderRadius: 20, overflow: "hidden", scrollSnapAlign: "start", position: "relative", background: "#123C69", boxShadow: shadow.hero, cursor: "pointer" }}>
            <img src={ann.bannerImage} alt={ann.headline} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
            <div style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
              <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{ann.categoryLabel}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", margin: 0 }}>{ann.headline}</p>
            </div>
          </div>
        ))}
      </div>
      {count > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
          {announcements.map((_, i) => (
            <button key={i} aria-label={`Abiso ${i + 1}`} aria-pressed={i === active} onClick={() => scrollTo(i)}
              style={{ width: i === active ? 16 : 6, height: 6, borderRadius: 999, background: i === active ? C.primary : C.textTertiary, opacity: i === active ? 1 : 0.35, border: "none", padding: 0, cursor: "pointer", transition: "width 0.25s", minWidth: 6 }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quick Tracker ────────────────────────────────────────────────────────────

function QuickTracker({ items, onViewAll, sectionState = "ready", onRetry }: { items: ActivityItemEntity[]; onViewAll: () => void; sectionState?: SectionState; onRetry?: () => void }) {
  if (sectionState === "loading") {
    return (
      <div style={{ margin: "24px 16px 0" }}>
        <EyebrowRow label="Kamakailang Aktibidad" />
        <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          {[0, 1, 2].map((i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: C.border, margin: "0 16px" }} />}
              <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
                <Skeleton w={32} h={32} radius={999} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}><Skeleton w="60%" h={13} /><Skeleton w="40%" h={12} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (sectionState === "error") {
    return <div style={{ margin: "24px 16px 0" }}><EyebrowRow label="Kamakailang Aktibidad" /><SectionError name="Aktibidad" onRetry={onRetry ?? (() => {})} /></div>;
  }

  const rows = items.slice(0, 4);

  return (
    <div style={{ margin: "24px 16px 0" }}>
      <EyebrowRow label="Kamakailang Aktibidad" actionLabel="Lahat →" onAction={onViewAll} />
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {rows.map((item, idx) => {
          const s = ACTIVITY_STATUS[item.status];
          return (
            <div key={item.id}>
              {idx > 0 && <div style={{ height: 1, background: C.border, margin: "0 16px" }} />}
              <button aria-label={`${item.serviceName}, ${s.taglishLabel}`}
                style={{ width: "100%", height: 64, display: "flex", alignItems: "center", padding: "0 16px", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <s.Icon aria-hidden="true" size={16} color={s.color} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{item.serviceName}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: s.color, margin: 0 }}>{s.taglishLabel}</p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 500, color: C.textTertiary, flexShrink: 0, whiteSpace: "nowrap" }}>{shortDatePH(item.updatedAt)}</p>
                <ChevronRight aria-hidden="true" size={16} color={C.textTertiary} strokeWidth={2} style={{ flexShrink: 0 }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Government Services Page (Screen 10) ─────────────────────────────────────

const NATIONAL_SERVICES: { label: string; agency: string; Icon: LucideIcon }[] = [
  { label: "NBI Clearance Appointment", agency: "NBI", Icon: ShieldCheck },
  { label: "National ID Reissuance", agency: "PhilSys / PSA", Icon: CreditCard },
  { label: "Birth Certificate Request", agency: "PSA", Icon: FileText },
  { label: "Certificate of No Marriage (CENOMAR)", agency: "PSA", Icon: FileText },
  { label: "Passport Renewal", agency: "DFA", Icon: Plane },
  { label: "PhilHealth ID Request", agency: "PhilHealth", Icon: HeartPulse },
  { label: "SSS E-Services", agency: "SSS", Icon: ShieldCheck },
  { label: "Pag-IBIG Fund Services", agency: "HDMF", Icon: Landmark },
];

const LOCAL_SERVICES: { label: string; agency: string; Icon: LucideIcon }[] = [
  { label: "Barangay Clearance", agency: "LGU", Icon: ShieldCheck },
  { label: "Business Permit", agency: "LGU", Icon: FileText },
  { label: "Real Property Tax", agency: "LGU", Icon: Landmark },
];

function ServiceRow({ label, agency, Icon, isLast, onClick }: { label: string; agency: string; Icon: LucideIcon; isLast: boolean; onClick?: () => void }) {
  return (
    <div>
      <button aria-label={label} onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", height: 64, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.iconTileTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={24} color={C.primary} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: 0, lineHeight: "20px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
          <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>{agency}</p>
        </div>
        <ChevronRight size={16} color={C.textTertiary} strokeWidth={2} style={{ flexShrink: 0 }} />
      </button>
      {!isLast && <div style={{ height: 1, background: C.border, margin: "0 16px" }} />}
    </div>
  );
}

// ─── eReport: shared small form controls ───────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontFamily: nunito, fontSize: 13, fontWeight: 600, color: C.textPrimary, display: "block", marginBottom: 6 }}>{children}</label>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 48, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface,
  fontFamily: nunito, fontSize: 14, color: C.textPrimary, outline: "none", boxSizing: "border-box", paddingInline: 12,
};

function EreportSelect({ value, onChange, options, placeholder, disabled, loading }: {
  value: string; onChange: (v: string) => void; options: EreportOption[]; placeholder: string; disabled?: boolean; loading?: boolean;
}) {
  return (
    <select value={value} disabled={disabled || loading} onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, color: value ? C.textPrimary : C.textTertiary, opacity: disabled && !loading ? 0.5 : 1 }}>
      <option value="">{loading ? "Naglo-load…" : placeholder}</option>
      {options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
    </select>
  );
}

// ─── eReport: File a Report modal ──────────────────────────────────────────

type ReportStep = "form" | "submitting" | "success" | "failed";

function ReportModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<ReportStep>("form");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | undefined>();
  const [smsNotified, setSmsNotified] = useState(false);

  const [reportTypes, setReportTypes] = useState<EreportOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  const [regions, setRegions] = useState<EreportOption[]>([]);
  const [provinces, setProvinces] = useState<EreportOption[]>([]);
  const [municipalities, setMunicipalities] = useState<EreportOption[]>([]);
  const [barangays, setBarangays] = useState<EreportOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  const [reportType, setReportType] = useState("");
  const [regionCode, setRegionCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [municipalityCode, setMunicipalityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [evidencesText, setEvidencesText] = useState("");
  const [firstName, setFirstName] = useState(CURRENT_USER.firstName);
  const [lastName, setLastName] = useState("Dela Cruz");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("juan.delacruz@email.com");
  const [mobile, setMobile] = useState(CURRENT_USER.mobileNumber.replace(/^\+/, ""));

  // Load report types + regions once
  useEffect(() => {
    let cancelled = false;
    setLoadingTypes(true);
    Promise.all([fetchEreportDataset("report_types"), fetchEreportDataset("regions")]).then(([types, regionsRes]) => {
      if (cancelled) return;
      if (!types.ok || !regionsRes.ok) setDatasetError(types.message || regionsRes.message || "Hindi ma-load ang eReport datasets.");
      setReportTypes(types.options);
      setRegions(regionsRes.options);
      setLoadingTypes(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Cascading location fetches
  useEffect(() => {
    setProvinceCode(""); setMunicipalityCode(""); setBarangayCode("");
    setProvinces([]); setMunicipalities([]); setBarangays([]);
    if (!regionCode) return;
    let cancelled = false;
    setLoadingProvinces(true);
    fetchEreportDataset("provinces", { region_code: regionCode }).then((res) => {
      if (cancelled) return;
      setProvinces(res.options);
      setLoadingProvinces(false);
    });
    return () => { cancelled = true; };
  }, [regionCode]);

  useEffect(() => {
    setMunicipalityCode(""); setBarangayCode("");
    setMunicipalities([]); setBarangays([]);
    if (!provinceCode) return;
    let cancelled = false;
    setLoadingMunicipalities(true);
    fetchEreportDataset("municipalities", { province_code: provinceCode }).then((res) => {
      if (cancelled) return;
      setMunicipalities(res.options);
      setLoadingMunicipalities(false);
    });
    return () => { cancelled = true; };
  }, [provinceCode]);

  useEffect(() => {
    setBarangayCode("");
    setBarangays([]);
    if (!municipalityCode) return;
    let cancelled = false;
    setLoadingBarangays(true);
    fetchEreportDataset("barangays", { municipality_code: municipalityCode }).then((res) => {
      if (cancelled) return;
      setBarangays(res.options);
      setLoadingBarangays(false);
    });
    return () => { cancelled = true; };
  }, [municipalityCode]);

  const isValid = reportType && regionCode && provinceCode && municipalityCode && barangayCode
    && subject.trim() && message.trim() && firstName.trim() && lastName.trim() && email.trim() && mobile.trim();

  async function handleSubmit() {
    setStep("submitting");
    const evidences = evidencesText.split("\n").map((s) => s.trim()).filter(Boolean);
    const result = await submitEreportComplaint({
      mobile: mobile.replace(/\D/g, ""), first_name: firstName.trim(), last_name: lastName.trim(),
      gender, complainant_email: email.trim(), report_type: reportType, subject: subject.trim(), message: message.trim(),
      evidences, region_code: regionCode, province_code: provinceCode, municipality_code: municipalityCode, barangay_code: barangayCode,
    });
    if (result.ok) {
      setCaseNumber(result.caseNumber);
      setSmsNotified(Boolean(result.smsNotified));
      setStep("success");
    } else {
      setSubmitError(result.message ?? "Hindi na-submit ang report.");
      setStep("failed");
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="File a Report"
      style={{ position: "absolute", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: 48, overflow: "hidden" }}>
      <div style={{ background: C.surface, borderRadius: "20px 20px 48px 48px", boxShadow: shadow.hero, flex: 1, maxHeight: "92%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Mag-file ng Reklamo (eReport)</p>
          <button aria-label="Close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: C.canvas, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color={C.textPrimary} strokeWidth={2} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 24px" }}>
          {step === "form" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {datasetError && (
                <div style={{ background: C.dangerBg, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={13} color={C.dangerText} strokeWidth={2.5} />
                  <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 600, color: C.dangerText, margin: 0 }}>{datasetError}</p>
                </div>
              )}

              <div>
                <FieldLabel>Uri ng Report</FieldLabel>
                <EreportSelect value={reportType} onChange={setReportType} options={reportTypes} placeholder="Pumili ng uri" loading={loadingTypes} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldLabel>Pangalan</FieldLabel>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <FieldLabel>Apelyido</FieldLabel>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldLabel>Kasarian</FieldLabel>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Mobile Number</FieldLabel>
                  <input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="numeric" placeholder="639XXXXXXXXX" style={inputStyle} />
                </div>
              </div>

              <div>
                <FieldLabel>Email</FieldLabel>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ height: 1, background: C.border }} />

              <div>
                <FieldLabel>Rehiyon</FieldLabel>
                <EreportSelect value={regionCode} onChange={setRegionCode} options={regions} placeholder="Pumili ng rehiyon" loading={loadingTypes} />
              </div>
              <div>
                <FieldLabel>Probinsya</FieldLabel>
                <EreportSelect value={provinceCode} onChange={setProvinceCode} options={provinces} placeholder="Pumili ng probinsya" disabled={!regionCode} loading={loadingProvinces} />
              </div>
              <div>
                <FieldLabel>Munisipyo / Lungsod</FieldLabel>
                <EreportSelect value={municipalityCode} onChange={setMunicipalityCode} options={municipalities} placeholder="Pumili ng munisipyo/lungsod" disabled={!provinceCode} loading={loadingMunicipalities} />
              </div>
              <div>
                <FieldLabel>Barangay</FieldLabel>
                <EreportSelect value={barangayCode} onChange={setBarangayCode} options={barangays} placeholder="Pumili ng barangay" disabled={!municipalityCode} loading={loadingBarangays} />
              </div>

              <div style={{ height: 1, background: C.border }} />

              <div>
                <FieldLabel>Paksa</FieldLabel>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Maikling pamagat ng report" style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Detalye</FieldLabel>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ilarawan ang insidente" rows={4}
                  style={{ ...inputStyle, height: "auto", paddingBlock: 10, resize: "vertical", fontFamily: nunito }} />
              </div>
              <div>
                <FieldLabel>Evidence (opsyonal — mga link sa larawan, isang URL bawat linya)</FieldLabel>
                <textarea value={evidencesText} onChange={(e) => setEvidencesText(e.target.value)} placeholder={"https://example.com/image1.jpg"} rows={2}
                  style={{ ...inputStyle, height: "auto", paddingBlock: 10, resize: "vertical", fontFamily: nunito }} />
                <p style={{ fontFamily: nunito, fontSize: 11, color: C.textTertiary, marginTop: 6 }}>Walang file upload — i-host muna ang larawan kung saan man at i-paste ang link dito.</p>
              </div>

              <button disabled={!isValid} onClick={handleSubmit}
                style={{ width: "100%", height: 48, borderRadius: 12, background: isValid ? C.primary : C.border, color: isValid ? "#fff" : C.textTertiary, fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: isValid ? "pointer" : "not-allowed" }}>
                I-submit ang Report
              </button>
            </div>
          )}

          {step === "submitting" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60 }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, border: `4px solid ${C.border}`, borderTopColor: C.primary, animation: "spin 0.9s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontFamily: nunito, fontSize: 13, color: C.textSecondary, marginTop: 16 }}>Isinusumite ang iyong report…</p>
            </div>
          )}

          {step === "success" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: 999, background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={40} color={C.successText} strokeWidth={2.5} />
              </div>
              <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.successText, textAlign: "center", marginTop: 12 }}>Naitala ang Report</p>
              {caseNumber && (
                <p style={{ fontFamily: nunito, fontSize: 15, fontWeight: 700, color: C.textPrimary, textAlign: "center", marginTop: 8 }}>Case #: {caseNumber}</p>
              )}
              {smsNotified && (
                <p style={{ fontFamily: nunito, fontSize: 12, color: C.textSecondary, textAlign: "center", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <MessageCircle size={12} color={C.textSecondary} strokeWidth={2} /> SMS confirmation ipinadala sa {mobile}
                </p>
              )}
              <p style={{ fontFamily: nunito, fontSize: 12, color: C.textTertiary, textAlign: "center", marginTop: 12 }}>Panatilihin ang case number para sa pag-track ng status.</p>
              <button onClick={onClose} style={{ width: "100%", height: 48, borderRadius: 12, background: C.successText, color: "#fff", fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 24 }}>
                Isara
              </button>
            </div>
          )}

          {step === "failed" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: 999, background: C.dangerBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={40} color={C.dangerText} strokeWidth={2.5} />
              </div>
              <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.dangerText, textAlign: "center", marginTop: 12 }}>Hindi na-submit</p>
              <p style={{ fontSize: 13, color: C.textSecondary, textAlign: "center", marginTop: 6, lineHeight: "19px" }}>{submitError}</p>
              <button onClick={() => setStep("form")} style={{ width: "100%", height: 48, borderRadius: 12, background: C.primary, color: "#fff", fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 24 }}>
                Subukan Muli
              </button>
              <button onClick={onClose} style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: C.textSecondary, background: "none", border: "none", cursor: "pointer", minHeight: 44 }}>
                Isara
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── eReport: Track a Report modal (email + OTP gated) ─────────────────────

type TrackStep = "email" | "otp" | "list" | "detail";

function TrackReportModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<TrackStep>("email");
  const [email, setEmail] = useState("juan.delacruz@email.com");
  const [otp, setOtp] = useState("");
  const [viewToken, setViewToken] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestOtp() {
    setBusy(true); setError(null);
    const res = await requestEreportOtp(email.trim());
    setBusy(false);
    if (res.ok) setStep("otp"); else setError(res.message ?? "Hindi naipadala ang OTP.");
  }

  async function handleVerifyOtp() {
    setBusy(true); setError(null);
    const res = await verifyEreportOtp(email.trim(), otp.trim());
    if (!res.ok || !res.viewToken) { setBusy(false); setError(res.message ?? "Mali ang OTP."); return; }
    const list = await fetchEreportReports(res.viewToken);
    setBusy(false);
    if (!list.ok) { setError(list.message ?? "Hindi ma-load ang mga report."); return; }
    setViewToken(res.viewToken);
    setReports(list.reports);
    setStep("list");
  }

  async function handleOpenReport(caseNumber: string) {
    if (!viewToken) return;
    setBusy(true); setError(null);
    const res = await fetchEreportReportDetail(caseNumber, viewToken);
    setBusy(false);
    if (!res.ok) { setError(res.message ?? "Hindi ma-load ang report."); return; }
    setSelectedReport(res.report);
    setStep("detail");
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Track a Report"
      style={{ position: "absolute", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: 48, overflow: "hidden" }}>
      <div style={{ background: C.surface, borderRadius: "20px 20px 48px 48px", boxShadow: shadow.hero, flex: 1, maxHeight: "88%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0 }}>I-track ang Reklamo</p>
          <button aria-label="Close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: C.canvas, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color={C.textPrimary} strokeWidth={2} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 24px" }}>
          {error && (
            <div style={{ background: C.dangerBg, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={13} color={C.dangerText} strokeWidth={2.5} />
              <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 600, color: C.dangerText, margin: 0 }}>{error}</p>
            </div>
          )}

          {step === "email" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 13, color: C.textSecondary }}>Ilagay ang email na ginamit sa pag-file ng report. Magpapadala kami ng OTP para makumpirma ito ay ikaw.</p>
              <div>
                <FieldLabel>Email</FieldLabel>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <button disabled={!email.trim() || busy} onClick={handleRequestOtp}
                style={{ width: "100%", height: 48, borderRadius: 12, background: email.trim() && !busy ? C.primary : C.border, color: email.trim() && !busy ? "#fff" : C.textTertiary, fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: email.trim() && !busy ? "pointer" : "not-allowed" }}>
                {busy ? "Ipinapadala…" : "Ipadala ang OTP"}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 13, color: C.textSecondary }}>Ilagay ang OTP na ipinadala sa {email}.</p>
              <div>
                <FieldLabel>OTP</FieldLabel>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" placeholder="000000" style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.2em" }} />
              </div>
              <button disabled={!otp.trim() || busy} onClick={handleVerifyOtp}
                style={{ width: "100%", height: 48, borderRadius: 12, background: otp.trim() && !busy ? C.primary : C.border, color: otp.trim() && !busy ? "#fff" : C.textTertiary, fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: otp.trim() && !busy ? "pointer" : "not-allowed" }}>
                {busy ? "Bini-verify…" : "I-verify"}
              </button>
            </div>
          )}

          {step === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reports.length === 0 && <p style={{ fontSize: 13, color: C.textSecondary, textAlign: "center", marginTop: 24 }}>Walang nakitang report para sa email na ito.</p>}
              {reports.map((r, idx) => {
                const caseNum = r.case_number ?? r.caseNumber ?? r.id ?? String(idx);
                return (
                  <button key={caseNum} onClick={() => handleOpenReport(String(caseNum))}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Case #: {caseNum}</p>
                      <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subject ?? r.report_type ?? ""}</p>
                    </div>
                    <span style={{ fontFamily: nunito, fontSize: 11, fontWeight: 700, color: C.accent, background: C.iconTileTint, borderRadius: 999, padding: "4px 10px", flexShrink: 0 }}>{r.status ?? "—"}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === "detail" && selectedReport && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => setStep("list")} style={{ alignSelf: "flex-start", fontSize: 13, color: C.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Bumalik sa listahan</button>
              <pre style={{ fontFamily: "monospace", fontSize: 11, background: C.canvas, borderRadius: 12, padding: 14, whiteSpace: "pre-wrap", wordBreak: "break-word", color: C.textPrimary }}>
                {JSON.stringify(selectedReport, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GovernmentServicesPage() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);

  return (
    <div style={{ paddingBottom: 8, position: "relative" }}>
      {reportModalOpen && <ReportModal onClose={() => setReportModalOpen(false)} />}
      {trackModalOpen && <TrackReportModal onClose={() => setTrackModalOpen(false)} />}

      <p style={{ fontFamily: nunito, fontSize: 20, fontWeight: 800, color: C.textPrimary, margin: "20px 16px 16px" }}>Mga Serbisyo ng Pamahalaan</p>

      {/* eReport — the one fully-wired flow on this tab; everything below is decorative scaffolding per the original spec */}
      <div style={{ margin: "0 16px 24px" }}>
        <EyebrowRow label="Mag-ulat sa Pamahalaan (eReport)" />
        <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, overflow: "hidden" }}>
          <ServiceRow label="Mag-file ng Reklamo" agency="eReport ng eGov" Icon={AlertTriangle} isLast={false} onClick={() => setReportModalOpen(true)} />
          <ServiceRow label="I-track ang Aking Reklamo" agency="eReport ng eGov" Icon={Search} isLast={true} onClick={() => setTrackModalOpen(true)} />
        </div>
      </div>

      <div style={{ margin: "0 16px" }}>
        <EyebrowRow label="Mga Pambansang Serbisyo" />
        <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, overflow: "hidden" }}>
          {NATIONAL_SERVICES.map((svc, idx) => (
            <ServiceRow key={svc.label} {...svc} isLast={idx === NATIONAL_SERVICES.length - 1} />
          ))}
        </div>
      </div>

      <div style={{ margin: "24px 16px 0" }}>
        <EyebrowRow label="Mga Lokal na Serbisyo" />
        <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, overflow: "hidden" }}>
          {LOCAL_SERVICES.map((svc, idx) => (
            <ServiceRow key={svc.label} {...svc} isLast={idx === LOCAL_SERVICES.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Health Page (Screen 11) ──────────────────────────────────────────────────

const HEALTH_FACILITIES = [
  { name: "Malolos District Hospital", distance: "0.8km", type: "Ospital" },
  { name: "Barangay Health Center 1", distance: "1.2km", type: "Health Center" },
  { name: "PhilHealth Accredited Clinic", distance: "2.1km", type: "Klinika" },
];

function HealthPage() {
  return (
    <div style={{ paddingBottom: 8 }}>
      <p style={{ fontFamily: nunito, fontSize: 20, fontWeight: 800, color: C.textPrimary, margin: "20px 16px 12px" }}>Kalusugan</p>

      {/* PhilHealth Coverage Card */}
      <div style={{ margin: "0 16px 24px", background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0 }}>PhilHealth Konsulta</p>
          <span style={{ fontFamily: nunito, fontSize: 11, fontWeight: 600, color: C.successText, background: C.successBg, borderRadius: 8, padding: "4px 10px" }}>AKTIBO</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: 0 }}>Juan dela Cruz</p>
          <p style={{ fontSize: 12, color: C.textSecondary, margin: "2px 0" }}>Miyembro No: 12-345678901-2</p>
          <p style={{ fontSize: 13, color: C.textSecondary, margin: "4px 0", lineHeight: "18px" }}>Saklaw: Outpatient Konsulta, Emergency Care, Maternity</p>
          <p style={{ fontSize: 12, color: C.textTertiary, margin: "4px 0 0" }}>Valid hanggang: Disyembre 2026</p>
        </div>
        <button style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: C.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          Tingnan ang Buong Coverage →
        </button>
      </div>

      {/* Map-style card */}
      <div style={{ margin: "0 16px 24px", background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {/* Map placeholder */}
        <div style={{ height: 140, position: "relative" }}>
          <svg width="100%" height="140" viewBox="0 0 358 140" style={{ position: "absolute", inset: 0 }}>
            <rect width="358" height="140" fill="#E8F0EC" />
            <rect x="0" y="58" width="358" height="22" fill="#D8E8D4" />
            <rect x="158" y="0" width="22" height="140" fill="#D8E8D4" />
            {[78, 270].map((x) => <rect key={x} x={x} y="0" width="10" height="140" fill="#E0ECD8" opacity="0.7" />)}
            {[18, 112].map((y) => <rect key={y} x="0" y={y} width="358" height="8" fill="#E0ECD8" opacity="0.6" />)}
            <rect x="10" y="10" width="58" height="38" rx="3" fill="#CCDDCA" />
            <rect x="198" y="10" width="50" height="38" rx="3" fill="#CCDDCA" />
            <rect x="10" y="90" width="54" height="38" rx="3" fill="#CCDDCA" />
            <circle cx="168" cy="69" r="11" fill="#CE1126" />
            <circle cx="168" cy="69" r="5" fill="#fff" />
            <circle cx="88" cy="108" r="8" fill="#0038A8" />
            <circle cx="88" cy="108" r="4" fill="#fff" />
            <circle cx="258" cy="32" r="8" fill="#0038A8" />
            <circle cx="258" cy="32" r="4" fill="#fff" />
          </svg>
          {/* Overlay pill */}
          <span style={{ position: "absolute", top: 12, left: 12, fontFamily: nunito, fontSize: 11, fontWeight: 600, color: "#fff", background: "rgba(26,36,51,0.80)", borderRadius: 999, padding: "8px 12px" }}>MALAPIT SA IYO</span>
        </div>

        {/* Bottom section */}
        <div style={{ padding: 16 }}>
          <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: "0 0 4px" }}>Mga Pasilidad ng Kalusugan</p>
          <p style={{ fontSize: 12, color: C.textSecondary, margin: "0 0 12px" }}>3 pasilidad ang natagpuan sa loob ng 5km</p>
          {HEALTH_FACILITIES.map((f, idx) => (
            <div key={f.name}>
              {idx > 0 && <div style={{ height: 1, background: C.border, margin: "0 0 8px" }} />}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{f.name}</p>
                  <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>{f.distance} · {f.type}</p>
                </div>
                <button style={{ fontSize: 12, fontWeight: 500, color: C.accent, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                  Kumuha ng Direksyon →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── eCitizenPH Pre-Verification Screen (Screen 12) ───────────────────────────

function ECitizenPreVerification({ onBeginVerification }: { onBeginVerification: () => void }) {
  const PREVIEW_RECS = [
    { name: "DSWD 4Ps", match: "97% Tugma", color: C.successText, bg: C.successBg },
    { name: "PhilHealth Konsulta", match: "89% Tugma", color: C.successText, bg: C.successBg },
    { name: "DTI KMME", match: "74% Tugma", color: C.warningText, bg: C.warningBg },
  ];

  return (
    <div style={{ padding: "16px 16px 0" }}>
      {/* Feature banner */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, padding: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: nunito, fontSize: 18, fontWeight: 800, color: C.primary, margin: 0 }}>eCitizenPH</p>
          <span style={{ fontFamily: nunito, fontSize: 10, fontWeight: 600, color: C.primary, background: C.iconTileTint, borderRadius: 999, padding: "4px 10px" }}>INTELLIGENCE LAYER</span>
        </div>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: "8px 0 0", lineHeight: "20px" }}>
          Proactively recommends government services — hindi ka na maghahanap pa.
        </p>
      </div>

      {/* Verification gate */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.goldAccent}`, padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 16 }}>
          <Lock size={32} color={C.primary} strokeWidth={1.8} />
          <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.textPrimary, textAlign: "center", marginTop: 8, marginBottom: 0 }}>I-unlock ang Iyong Profile</p>
          <p style={{ fontSize: 14, color: C.textSecondary, textAlign: "center", marginTop: 8, lineHeight: "20px", paddingInline: 20 }}>
            Mag-simulate ng National ID verification para ma-access ang personalized na rekomendasyon.
          </p>
        </div>
        <div style={{ marginTop: 24 }}>
          <button onClick={onBeginVerification} style={{ width: "100%", height: 48, borderRadius: 12, background: C.primary, color: "#fff", fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", borderBottom: `3px solid ${C.primaryPressed}`, cursor: "pointer" }}>
            🪪 Simulan ang Verification
          </button>
          <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 500, color: C.textTertiary, textAlign: "center", marginTop: 12 }}>
            ⚠ Simulated lang ito. Hindi ito kumokonekta sa totoong PhilSys database.
          </p>
        </div>
      </div>

      {/* Preview cards (blurred/locked) */}
      <div style={{ marginTop: 24 }}>
        <EyebrowRow label="Makikita Pagkatapos ng Verification" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PREVIEW_RECS.map((rec) => (
            <div key={rec.name} style={{ background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, padding: 16, opacity: 0.4, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontFamily: nunito, fontSize: 14, fontWeight: 700, color: C.textPrimary, margin: 0 }}>{rec.name}</p>
                <span style={{ fontFamily: nunito, fontSize: 13, fontWeight: 800, color: rec.color, background: rec.bg, borderRadius: 12, padding: "4px 10px" }}>{rec.match}</span>
              </div>
              <Lock size={16} color={C.textTertiary} strokeWidth={1.8} style={{ position: "absolute", top: 12, right: 48 }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 32 }} />
    </div>
  );
}

// ─── eVerify Face Liveness SDK integration ────────────────────────────────────

const EVERIFY_SDK_URL = "https://hackathon-everify-face-liveness.e.gov.ph/js/everify-liveness-sdk.min.js";
const EVERIFY_PUBLIC_KEY = import.meta.env.VITE_EVERIFY_PUBLIC_KEY;
const EVERIFY_ENABLED = Boolean(EVERIFY_PUBLIC_KEY);

// Demo citizen used only to exercise the /api/verify → eVerify submission path.
// This prototype never collects real demographics via a form (only a simulated
// PSN entry), so this stands in for what a real intake form would supply.
// mobile_number is used server-side to send the post-verification eMessage
// SMS confirmation (see server/index.mjs + server/emessage.mjs) — it's never
// used to call eMessage directly from the browser.
const DEMO_DEMOGRAPHICS = { first_name: "Juan", middle_name: "Santos", last_name: "Dela Cruz", suffix: "", birth_date: "1989-09-12", mobile_number: CURRENT_USER.mobileNumber };

let everifySdkLoadPromise: Promise<void> | null = null;

function loadEverifySdk(): Promise<void> {
  if (everifySdkLoadPromise) return everifySdkLoadPromise;
  everifySdkLoadPromise = new Promise((resolve, reject) => {
    if (window.eKYC) { resolve(); return; }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EVERIFY_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("sdk_load_failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = EVERIFY_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("sdk_load_failed"));
    document.head.appendChild(script);
  });
  return everifySdkLoadPromise;
}

// Client never talks to eVerify's verification endpoint directly — that call
// needs a private secret key, so it's proxied through our own /api/verify
// backend (see server/index.mjs). The SDK's public key is the only credential
// that's safe to ship to the browser.
async function submitBiometrics(sessionId: string): Promise<{ ok: boolean; message?: string; smsNotified?: boolean }> {
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...DEMO_DEMOGRAPHICS, face_liveness_session_id: sessionId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data?.message || data?.error || `eVerify backend error (${res.status})` };
    return { ok: true, smsNotified: Boolean(data?.sms?.ok) };
  } catch {
    return { ok: false, message: "Hindi ma-reach ang /api/verify backend." };
  }
}

// ─── eReport client helpers ────────────────────────────────────────────────
// All calls go through our own backend (server/ereport.mjs) — the access
// code / bearer token never reach the browser. Dataset item shape isn't
// documented, so extractOption() defensively tries a few common field-name
// patterns rather than assuming one.

interface EreportOption { code: string; label: string }

function extractOption(item: any): EreportOption | null {
  if (item == null) return null;
  if (typeof item === "string") return { code: item, label: item };
  const code = item.code ?? item.value ?? item.id
    ?? item.region_code ?? item.province_code ?? item.municipality_code ?? item.barangay_code ?? item.report_type;
  const label = item.name ?? item.label ?? item.description
    ?? item.region_name ?? item.province_name ?? item.municipality_name ?? item.barangay_name ?? item.report_type_name;
  if (code == null) return null;
  return { code: String(code), label: String(label ?? code) };
}

async function fetchEreportDataset(name: string, params?: Record<string, string>): Promise<{ ok: boolean; options: EreportOption[]; message?: string }> {
  try {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`/api/ereport/datasets/${name}${qs}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, options: [], message: data?.message || data?.error || `eReport dataset error (${res.status})` };
    const list = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
    const options = (Array.isArray(list) ? list : []).map(extractOption).filter((o): o is EreportOption => o !== null);
    return { ok: true, options };
  } catch {
    return { ok: false, options: [], message: "Hindi ma-reach ang /api/ereport backend." };
  }
}

interface ComplaintPayload {
  mobile: string; first_name: string; last_name: string; gender: string; complainant_email: string;
  report_type: string; subject: string; message: string; evidences: string[];
  region_code: string; province_code: string; municipality_code: string; barangay_code: string;
}

async function submitEreportComplaint(payload: ComplaintPayload): Promise<{ ok: boolean; caseNumber?: string; smsNotified?: boolean; message?: string }> {
  try {
    const res = await fetch("/api/ereport/complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data?.message || data?.error || `eReport backend error (${res.status})` };
    return { ok: true, caseNumber: data?.case_number ?? data?.data?.case_number, smsNotified: Boolean(data?.sms?.ok) };
  } catch {
    return { ok: false, message: "Hindi ma-reach ang /api/ereport backend." };
  }
}

async function requestEreportOtp(email: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch("/api/ereport/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data?.message || data?.error || `eReport OTP request error (${res.status})` };
    return { ok: true };
  } catch {
    return { ok: false, message: "Hindi ma-reach ang /api/ereport backend." };
  }
}

async function verifyEreportOtp(email: string, otp: string): Promise<{ ok: boolean; viewToken?: string; message?: string }> {
  try {
    const res = await fetch("/api/ereport/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.view_token) return { ok: false, message: data?.message || data?.error || "Hindi na-verify ang OTP." };
    return { ok: true, viewToken: data.view_token };
  } catch {
    return { ok: false, message: "Hindi ma-reach ang /api/ereport backend." };
  }
}

async function fetchEreportReports(viewToken: string): Promise<{ ok: boolean; reports: any[]; message?: string }> {
  try {
    const res = await fetch("/api/ereport/reports", { headers: { "X-EReport-View-Token": viewToken } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reports: [], message: data?.message || data?.error || `eReport list error (${res.status})` };
    const list = Array.isArray(data) ? data : (data?.data ?? data?.reports ?? []);
    return { ok: true, reports: Array.isArray(list) ? list : [] };
  } catch {
    return { ok: false, reports: [], message: "Hindi ma-reach ang /api/ereport backend." };
  }
}

async function fetchEreportReportDetail(caseNumber: string, viewToken: string): Promise<{ ok: boolean; report?: any; message?: string }> {
  try {
    const res = await fetch(`/api/ereport/reports/${encodeURIComponent(caseNumber)}`, { headers: { "X-EReport-View-Token": viewToken } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data?.message || data?.error || `eReport detail error (${res.status})` };
    return { ok: true, report: data?.data ?? data };
  } catch {
    return { ok: false, message: "Hindi ma-reach ang /api/ereport backend." };
  }
}

// ─── Verification Modal (Screen 13) ──────────────────────────────────────────

type VerifStep = "psn" | "liveness" | "success" | "failed";

function VerificationModal({ onVerified, onClose }: { onVerified: () => void; onClose: () => void }) {
  const [step, setStep] = useState<VerifStep>("psn");
  const [psn, setPsn] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [smsNotified, setSmsNotified] = useState(false);
  const [livenessItems, setLivenessItems] = useState([
    { label: "Mukha na naka-detect", done: false },
    { label: "Blink detected", done: false },
    { label: "Pag-verify ng liveness...", done: false },
  ]);

  const psnRaw = psn.replace(/\D/g, "");
  const isValidPsn = psnRaw.length === 12;

  function handlePsnInput(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 12);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    if (digits.length > 8) formatted = `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    setPsn(formatted);
  }

  const cancelledRef = useRef(false);

  function handleLivenessCancel() {
    cancelledRef.current = true;
    setCancelled(true);
    setStep("failed");
  }

  // Dev fallback: no VITE_EVERIFY_PUBLIC_KEY configured, so simulate the scan
  // locally instead of calling the real SDK. Lets the prototype still demo
  // end-to-end without a hackathon sandbox key.
  useEffect(() => {
    if (step !== "liveness" || EVERIFY_ENABLED) return;
    cancelledRef.current = false;
    setCancelled(false);
    setScanProgress(0);
    setLivenessItems([{ label: "Mukha na naka-detect", done: false }, { label: "Blink detected", done: false }, { label: "Pag-verify ng liveness...", done: false }]);
    let i = 0;
    const tick = setInterval(() => {
      if (cancelledRef.current) { clearInterval(tick); return; }
      i++;
      setScanProgress(i / 3);
      setLivenessItems((prev) => prev.map((item, idx) => idx === i - 1 ? { ...item, done: true } : item));
      if (i >= 3) {
        clearInterval(tick);
        if (!cancelledRef.current) setTimeout(() => { if (!cancelledRef.current) setStep("success"); }, 700);
      }
    }, 900);
    return () => clearInterval(tick);
  }, [step]);

  // Real integration: load the eVerify Face Liveness Web SDK, hand off to its
  // own camera overlay via window.eKYC().start(), then forward the resulting
  // session_id to our backend to complete verification against demographics.
  useEffect(() => {
    if (step !== "liveness" || !EVERIFY_ENABLED) return;
    cancelledRef.current = false;
    setCancelled(false);
    setLiveError(null);
    let aborted = false;

    loadEverifySdk()
      .then(() => window.eKYC!().start({ pubKey: EVERIFY_PUBLIC_KEY! }))
      .then(async (response) => {
        if (aborted || cancelledRef.current) return;
        const sessionId = response?.result?.session_id;
        if (!sessionId) {
          setLiveError("Walang session_id na natanggap mula sa eVerify SDK.");
          setStep("failed");
          return;
        }
        const { ok, message, smsNotified: notified } = await submitBiometrics(sessionId);
        if (aborted || cancelledRef.current) return;
        if (ok) { setSmsNotified(Boolean(notified)); setStep("success"); }
        else { setLiveError(message ?? "Hindi na-verify sa eVerify backend."); setStep("failed"); }
      })
      .catch((err: Error) => {
        if (aborted || cancelledRef.current) return;
        setLiveError(err?.message === "sdk_load_failed" ? "Hindi ma-load ang eVerify SDK script." : "Kinansela o nabigo ang liveness check.");
        setStep("failed");
      });

    return () => { aborted = true; };
  }, [step]);

  const displaySteps: { key: VerifStep; label: string }[] = [
    { key: "psn", label: "PSN Entry" },
    { key: "liveness", label: "Liveness Check" },
    { key: "success", label: "Tapos na!" },
  ];
  const activeStepIdx = step === "failed" ? 1 : displaySteps.findIndex((s) => s.key === step);

  return (
    <div role="dialog" aria-modal="true" aria-label="Identity Verification"
      style={{ position: "absolute", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: 48, overflow: "hidden" }}>
      <div style={{ background: C.surface, borderRadius: "20px 20px 48px 48px", boxShadow: shadow.hero, flex: 1, maxHeight: "90%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Step indicator */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
          {displaySteps.map((s, idx) => {
            const isActive = idx === activeStepIdx;
            const isDone = idx < activeStepIdx && step !== "failed";
            const isFailed = step === "failed" && idx === 1;
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ fontFamily: nunito, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", borderRadius: 999, padding: "5px 14px",
                  color: isFailed ? "#fff" : isActive ? "#fff" : C.textTertiary,
                  background: isFailed ? C.dangerText : isActive ? C.primary : isDone ? C.successText : C.border }}>
                  {isFailed ? "✕ " : isDone ? "✓ " : `${idx + 1}. `}{s.label}
                </div>
                {idx < displaySteps.length - 1 && <div style={{ width: 16, height: 1, background: C.border }} />}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 0" }}>
          {/* Simulation warning — always visible per spec, wording reflects live vs. dev-fallback mode */}
          <div style={{ background: C.warningBg, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={13} color={C.warningText} strokeWidth={2.5} />
            <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 600, color: C.warningText, margin: 0 }}>
              {EVERIFY_ENABLED
                ? "Gumagamit ng tunay na eVerify Face Liveness SDK (hackathon sandbox)."
                : "Simulated lang ito — Walang totoong biometric data ang nakolekta. (Walang VITE_EVERIFY_PUBLIC_KEY na naka-configure.)"}
            </p>
          </div>

          {step === "psn" && (
            <div>
              <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.textPrimary, textAlign: "center", marginBottom: 8 }}>Ilagay ang iyong PhilSys Number (PSN)</p>
              <p style={{ fontSize: 14, color: C.textSecondary, textAlign: "center", marginBottom: 24 }}>Ito ay para sa simulation purposes lamang.</p>
              <label style={{ fontFamily: nunito, fontSize: 13, fontWeight: 600, color: C.textPrimary, display: "block", marginBottom: 6 }}>PhilSys Number (PSN)</label>
              <input type="text" inputMode="numeric" placeholder="1234-5678901-2" value={psn} onChange={(e) => handlePsnInput(e.target.value)}
                style={{ width: "100%", height: 56, borderRadius: 12, border: `1px solid ${isValidPsn ? C.accent : C.border}`, background: C.surface, fontFamily: nunito, fontSize: 16, fontWeight: 400, letterSpacing: "0.08em", textAlign: "center", color: C.textPrimary, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }} />
              <p style={{ fontFamily: nunito, fontSize: 12, color: C.textTertiary, textAlign: "center", marginTop: 8 }}>Format: XXXX-XXXXXXX-X</p>
              {/* onClick → window.eKYC().start({ pubKey: "ENV_PUBLIC_KEY" }) */}
              <button disabled={!isValidPsn} onClick={() => setStep("liveness")}
                style={{ width: "100%", height: 48, borderRadius: 12, background: isValidPsn ? C.primary : C.border, color: isValidPsn ? "#fff" : C.textTertiary, fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: isValidPsn ? "pointer" : "not-allowed", marginTop: 24, transition: "background 0.15s" }}>
                Ituloy →
              </button>
            </div>
          )}

          {step === "liveness" && EVERIFY_ENABLED && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.textPrimary, textAlign: "center", marginBottom: 4 }}>Patunayan ang Iyong Pagkakakilanlan</p>
              <div style={{ background: C.iconTileTint, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 8, alignSelf: "stretch" }}>
                <AlertTriangle size={12} color={C.accent} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontFamily: nunito, fontSize: 10, fontWeight: 600, color: C.accent, margin: 0, lineHeight: "14px" }}>Ang camera overlay ay pag-aari ng eVerify SDK — lalabas ito sa itaas ng screen na ito.</p>
              </div>
              {/* eVerify SDK renders its own camera UI/overlay here — this is just a waiting state */}
              <div style={{ width: 200, height: 200, position: "relative", margin: "12px auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 999, border: `4px solid ${C.border}`, borderTopColor: C.primary, animation: "spin 0.9s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
              <p style={{ fontFamily: nunito, fontSize: 13, color: C.textSecondary, textAlign: "center" }}>Sinisimulan ang eVerify Face Liveness SDK…</p>
              <p style={{ fontFamily: nunito, fontSize: 11, color: C.textTertiary, textAlign: "center", marginTop: 8 }}>Sundin ang mga prompt sa loob ng lalabas na overlay. I-cancel doon para itigil.</p>
            </div>
          )}

          {step === "liveness" && !EVERIFY_ENABLED && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.textPrimary, textAlign: "center", marginBottom: 4 }}>Patunayan ang Iyong Pagkakakilanlan</p>
              {/* Reference note per spec 14.3 */}
              <div style={{ background: C.iconTileTint, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 8, alignSelf: "stretch" }}>
                <AlertTriangle size={12} color={C.accent} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontFamily: nunito, fontSize: 10, fontWeight: 600, color: C.accent, margin: 0, lineHeight: "14px" }}>Dev fallback — reference only. Sa live mode, ang UI na ito ay ang eVerify SDK.</p>
              </div>
              {/* Liveness circle */}
              <div style={{ width: 200, height: 200, position: "relative", margin: "12px auto" }}>
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" style={{ position: "absolute", inset: 0 }}>
                  <circle cx="100" cy="100" r="90" stroke={scanProgress >= 1 ? C.successText : C.primary} strokeWidth="3" strokeDasharray={scanProgress < 1 ? "12 6" : "0"} />
                  {scanProgress > 0 && scanProgress < 1 && (
                    <line x1="18" y1={20 + scanProgress * 160} x2="182" y2={20 + scanProgress * 160} stroke={C.accent} strokeWidth="2" opacity="0.7" />
                  )}
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <Camera size={48} color={`${C.textTertiary}80`} strokeWidth={1} />
                  <p style={{ fontFamily: nunito, fontSize: 12, color: C.textSecondary, marginTop: 8 }}>Tumingin sa camera...</p>
                </div>
              </div>
              {/* Status items */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
                {livenessItems.map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {item.done
                      ? <CheckCircle2 size={18} color={C.successText} strokeWidth={2} />
                      : <Clock size={18} color={C.warningText} strokeWidth={2} />}
                    <p style={{ fontSize: 14, color: item.done ? C.successText : C.warningText, fontWeight: item.done ? 600 : 500, margin: 0 }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: nunito, fontSize: 11, color: C.textTertiary, textAlign: "center", marginTop: 12 }}>Walang aktwal na data ang nakolekta. Simulation lamang.</p>
              {/* Cancel trigger → .catch() path */}
              <button onClick={handleLivenessCancel}
                style={{ marginTop: 12, fontSize: 13, fontWeight: 500, color: C.textSecondary, background: "none", border: "none", cursor: "pointer", minHeight: 36 }}>
                Kanselahin ang Pag-scan
              </button>
            </div>
          )}

          {step === "success" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: 999, background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={40} color={C.successText} strokeWidth={2.5} />
              </div>
              <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.successText, textAlign: "center", marginTop: 12 }}>Na-verify na!</p>
              <p style={{ fontSize: 14, color: C.textPrimary, textAlign: "center", marginTop: 8 }}>Juan dela Cruz — PSN: ••••••••1234</p>
              {smsNotified && (
                <p style={{ fontFamily: nunito, fontSize: 12, color: C.textSecondary, textAlign: "center", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <MessageCircle size={12} color={C.textSecondary} strokeWidth={2} /> SMS confirmation ipinadala sa {CURRENT_USER.mobileNumber}
                </p>
              )}
              {/* Security note: session_id/photo_url must not be persisted client-side beyond this flow */}
              <div style={{ background: C.warningBg, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "flex-start", gap: 6, marginTop: 16, alignSelf: "stretch" }}>
                <Lock size={11} color={C.warningText} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontFamily: nunito, fontSize: 10, fontWeight: 600, color: C.warningText, margin: 0, lineHeight: "14px" }}>session_id &amp; photo_url — huwag i-log o i-persist ang client-side nito. Backend lang ang mag-POPOSTs sa eVerify.</p>
              </div>
              <button onClick={onVerified} style={{ width: "100%", height: 48, borderRadius: 12, background: C.successText, color: "#fff", fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 24 }}>
                Buksan ang Aking Profile →
              </button>
            </div>
          )}

          {/* Step 2b — Liveness failed / cancelled (.catch() route) */}
          {step === "failed" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: 999, background: C.dangerBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={40} color={C.dangerText} strokeWidth={2.5} />
              </div>
              <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.dangerText, textAlign: "center", marginTop: 12 }}>Hindi na-verify</p>
              <p style={{ fontSize: 14, color: C.textSecondary, textAlign: "center", marginTop: 6, lineHeight: "20px" }}>
                {liveError ?? (cancelled ? "Kinansela ang verification." : "Hindi na-detect ang liveness.")} Subukan muli o kanselahin.
              </p>
              {!EVERIFY_ENABLED && (
                <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 500, color: C.textTertiary, textAlign: "center", marginTop: 12, lineHeight: "16px" }}>
                  Simulated lang ito — ang tunay na error ay galing sa <code style={{ fontFamily: "monospace", fontSize: 10, background: C.canvas, padding: "1px 4px", borderRadius: 4 }}>eKYC().start().catch(err)</code>
                </p>
              )}
              <button onClick={() => { cancelledRef.current = false; setCancelled(false); setLiveError(null); setSmsNotified(false); setStep("psn"); setPsn(""); setScanProgress(0); }}
                style={{ width: "100%", height: 48, borderRadius: 12, background: C.primary, color: "#fff", fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer", marginTop: 28 }}>
                Subukan Muli
              </button>
              <button onClick={onClose}
                style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: C.textSecondary, background: "none", border: "none", cursor: "pointer", minHeight: 44 }}>
                Kanselahin
              </button>
            </div>
          )}
        </div>

        {step !== "failed" && (
          <button onClick={onClose} style={{ margin: "16px 24px 32px", height: 44, borderRadius: 12, background: C.canvas, color: C.textSecondary, fontSize: 14, fontWeight: 500, border: `1px solid ${C.border}`, cursor: "pointer" }}>
            Isara
          </button>
        )}
        {step === "failed" && <div style={{ height: 32 }} />}
      </div>
    </div>
  );
}

// ─── Dev Handoff Panel (Step 14) ─────────────────────────────────────────────

function DevHandoffPanel({ onClose }: { onClose: () => void }) {
  const TRIGGER_MAP = [
    {
      layer: 'Screen 13, Step 1 → "Ituloy →" button',
      interaction: "On Click",
      fires: "window.eKYC().start({ pubKey })",
    },
    {
      layer: "Screen 13, Step 2 → liveness circle",
      interaction: "(not a real interaction — SDK takes over)",
      fires: "SDK renders its own camera UI / overlay",
    },
    {
      layer: "Screen 13, Step 3 → success state",
      interaction: "Promise .then()",
      fires: "Receives { status, result: { photo, session_id, photo_url } }",
    },
    {
      layer: "Screen 13, Step 2b → failure/cancel state",
      interaction: "Promise .catch()",
      fires: "User cancelled or liveness check failed",
    },
  ];

  const FLOW_NODES = [
    { id: "step1", label: 'Step 1\nIlagay PSN\n+ tap "Ituloy →"', color: C.primary, textColor: "#fff" },
    { id: "sdk", label: "eVerify SDK\nOverlay (Step 2)\nExternal UI", color: C.accent, textColor: "#fff" },
    { id: "backend", label: "App Backend\nreceives\nsession_id + photo_url", color: C.warningText, textColor: "#fff" },
    { id: "verify", label: "eVerify\nVerify Endpoint\nPOST demographics", color: "#6941C6", textColor: "#fff" },
    { id: "success", label: "Step 3\nSuccess ✓", color: C.successText, textColor: "#fff" },
    { id: "fail", label: "Step 2b\nFailure ✕", color: C.dangerText, textColor: "#fff" },
  ];

  const CODE_BLOCK = `SCRIPT (load once in app shell, not per-modal-open):
<script src="https://hackathon-everify-face-liveness.e.gov.ph/
  js/everify-liveness-sdk.min.js"></script>

INIT (fires on Step 1 "Ituloy →" tap):
window.eKYC().start({ pubKey: "<stored server-side / env, never hardcoded>" })
  .then(response => route to Step 3)
  .catch(error => route to Step 2b)

RESPONSE SHAPE:
{ status: "COMPLETED",
  result: { photo, session_id, photo_url } }

BACKEND SUBMISSION (server-side call, not client-side):
POST → eVerify biometrics endpoint
{ first_name, middle_name, last_name, suffix,
  birth_date, face_liveness_session_id }`;

  const SECURITY_NOTES = [
    { icon: Lock, title: "pubKey — huwag i-hardcode", body: "Gamitin ang ENV_PUBLIC_KEY placeholder. Huwag ipakita ang literal na key sa kahit anong visible frame o shared prototype." },
    { icon: ShieldCheck, title: "session_id / photo_url / photo — huwag i-log", body: "Huwag i-persist client-side ang biometric data nang lagpas sa immediate na flow. Backend lang ang mag-POSTs sa eVerify verify endpoint." },
    { icon: AlertTriangle, title: 'Panatilihin ang "Simulated lang ito" disclaimer', body: "Ang disclaimer sa Step 1 ay nagpapaliwanag na demo data (Juan dela Cruz) ang ginagamit — hindi kung ang API call mismo ay totoong gumagana." },
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label="Dev Handoff — eVerify Integration"
      style={{ position: "absolute", inset: 0, zIndex: 90, background: C.canvas, display: "flex", flexDirection: "column", borderRadius: 48, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: C.primary, padding: "48px 20px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 4px" }}>⚙️ Dev Handoff</p>
            <p style={{ fontFamily: nunito, fontSize: 17, fontWeight: 800, color: "#fff", margin: 0, lineHeight: "22px" }}>eVerify Integration</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>Screen 13 — SDK Trigger Map · Step 14</p>
          </div>
          <button aria-label="Close Dev Handoff" onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={18} color="#fff" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>

        {/* Section: Step 2 reference note */}
        <div style={{ margin: "16px 16px 0", background: C.iconTileTint, borderRadius: 16, padding: 14, border: `1px solid ${C.accent}30` }}>
          <p style={{ fontFamily: nunito, fontSize: 12, fontWeight: 700, color: C.accent, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.6px" }}>Step 2 — Reference Only</p>
          <p style={{ fontSize: 13, color: C.textPrimary, margin: 0, lineHeight: "18px" }}>
            Ang liveness camera UI na ipinapakita sa Step 2 (dashed ring, "Tumingin sa camera...") ay <strong>iyong disenyo bilang reference</strong>. Sa totoong implementasyon, ang screen na ito ay i-re-render ng eVerify SDK bilang sariling overlay/iframe — hindi ito dapat pixel-match ng developer.
          </p>
        </div>

        {/* Section: SDK Trigger Map */}
        <div style={{ margin: "16px 16px 0" }}>
          <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 700, color: C.textTertiary, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 10px" }}>SDK Trigger Map</p>
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {TRIGGER_MAP.map((row, idx) => (
              <div key={idx}>
                {idx > 0 && <div style={{ height: 1, background: C.border }} />}
                <div style={{ padding: "12px 14px" }}>
                  <p style={{ fontFamily: nunito, fontSize: 12, fontWeight: 700, color: C.textPrimary, margin: "0 0 2px", lineHeight: "16px" }}>{row.layer}</p>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 4 }}>
                    <span style={{ flexShrink: 0, fontFamily: nunito, fontSize: 10, fontWeight: 600, color: C.accent, background: C.iconTileTint, borderRadius: 6, padding: "2px 7px", marginTop: 1 }}>{row.interaction}</span>
                    <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: "16px", fontFamily: "monospace" }}>{row.fires}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Annotation block */}
        <div style={{ margin: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 700, color: C.textTertiary, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>Annotation Block (Screen 13)</p>
            <span style={{ fontFamily: nunito, fontSize: 10, fontWeight: 600, color: C.warningText, background: C.warningBg, borderRadius: 6, padding: "2px 8px" }}>Dev Mode</span>
          </div>
          <div style={{ background: "#0F172A", borderRadius: 16, padding: 14, overflow: "hidden" }}>
            <pre style={{ fontFamily: "'SF Mono', 'Fira Code', Consolas, monospace", fontSize: 10, color: "#94A3B8", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: "16px" }}>
              <span style={{ color: "#64748B" }}>{`// onClick → window.eKYC().start({ pubKey: "ENV_PUBLIC_KEY" })\n//   .then(res) → route to Step 3, pass res.result.session_id downstream\n//   .catch(err) → route to Step 2b\n\n`}</span>
              <span style={{ color: "#7DD3FC" }}>{"SCRIPT"}</span>
              <span style={{ color: "#94A3B8" }}>{" (load once in app shell):\n"}</span>
              <span style={{ color: "#86EFAC" }}>{"<script src=\"https://hackathon-everify-face-liveness.e.gov.ph/\n  js/everify-liveness-sdk.min.js\"></script>\n\n"}</span>
              <span style={{ color: "#7DD3FC" }}>{"RESPONSE SHAPE:\n"}</span>
              <span style={{ color: "#FDE68A" }}>{"{ status: \"COMPLETED\",\n  result: { photo, session_id, photo_url } }\n\n"}</span>
              <span style={{ color: "#7DD3FC" }}>{"BACKEND (server-side, not client):\n"}</span>
              <span style={{ color: "#94A3B8" }}>{"POST → eVerify biometrics endpoint\n{ first_name, last_name, birth_date,\n  face_liveness_session_id }"}</span>
            </pre>
          </div>
        </div>

        {/* Data Flow Diagram */}
        <div style={{ margin: "16px 16px 0" }}>
          <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 700, color: C.textTertiary, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 10px" }}>Data Flow Diagram</p>
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 14 }}>
            {/* Main vertical flow */}
            {[
              { label: 'Step 1 — Ilagay PSN + tap "Ituloy →"', bg: C.primary, color: "#fff", arrow: "→ eKYC().start({ pubKey })" },
              { label: "eVerify SDK Overlay — Step 2 (external UI)", bg: C.accent, color: "#fff", arrow: "Promise resolves .then()" },
              { label: "App Backend — receives session_id + photo_url", bg: "#6941C6", color: "#fff", arrow: "POST demographics + session_id" },
              { label: "eVerify Verify Endpoint — match/no-match", bg: "#374151", color: "#fff", arrow: null },
            ].map((node, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "100%", borderRadius: 10, background: node.bg, padding: "8px 12px", textAlign: "center" }}>
                  <p style={{ fontFamily: nunito, fontSize: 12, fontWeight: 700, color: node.color, margin: 0, lineHeight: "16px" }}>{node.label}</p>
                </div>
                {node.arrow && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "4px 0" }}>
                    <div style={{ width: 1, height: 8, background: C.border }} />
                    <p style={{ fontFamily: nunito, fontSize: 10, fontWeight: 600, color: C.textTertiary, margin: "2px 0", textAlign: "center" }}>{node.arrow}</p>
                    <div style={{ width: 1, height: 8, background: C.border }} />
                    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${C.border}` }} />
                  </div>
                )}
              </div>
            ))}
            {/* Fork: success / failure */}
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <div style={{ flex: 1, borderRadius: 10, background: C.successText, padding: "8px 10px", textAlign: "center" }}>
                <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 700, color: "#fff", margin: 0 }}>Step 3 ✓{"\n"}Success</p>
              </div>
              <div style={{ flex: 1, borderRadius: 10, background: C.dangerText, padding: "8px 10px", textAlign: "center" }}>
                <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 700, color: "#fff", margin: 0 }}>Step 2b ✕{"\n"}Failure / Cancel</p>
              </div>
            </div>
            <p style={{ fontFamily: nunito, fontSize: 10, fontWeight: 500, color: C.textTertiary, textAlign: "center", marginTop: 8 }}>
              .then() → Step 3 &nbsp;|&nbsp; .catch() → Step 2b
            </p>
          </div>
        </div>

        {/* Security & Privacy Notes */}
        <div style={{ margin: "16px 16px 0" }}>
          <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 700, color: C.textTertiary, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 10px" }}>Security &amp; Privacy Notes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SECURITY_NOTES.map((note, idx) => (
              <div key={idx} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, borderLeft: `4px solid ${idx === 2 ? C.warningText : C.dangerText}`, padding: "12px 14px", display: "flex", gap: 10 }}>
                <note.icon size={16} color={idx === 2 ? C.warningText : C.dangerText} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontFamily: nunito, fontSize: 12, fontWeight: 700, color: C.textPrimary, margin: "0 0 3px" }}>{note.title}</p>
                  <p style={{ fontSize: 12, color: C.textSecondary, margin: 0, lineHeight: "17px" }}>{note.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer spacer */}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ─── Recommendation Card ───────────────────────────────────────────────────────

function RecommendationCard({ rec, isExpanded, onToggle, onApply, applied }: { rec: ProgramRec; isExpanded: boolean; onToggle: () => void; onApply: () => void; applied: boolean }) {
  const matchColor = rec.matchPercent >= 75 ? C.successText : rec.matchPercent >= 50 ? C.warningText : C.textSecondary;
  const matchBg   = rec.matchPercent >= 75 ? C.successBg   : rec.matchPercent >= 50 ? C.warningBg   : C.canvas;
  const borderL   = rec.matchPercent >= 75 ? C.successText : rec.matchPercent >= 50 ? C.warningText : "#667085";

  return (
    <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, borderLeft: `4px solid ${borderL}`, boxShadow: shadow.card, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.textPrimary, margin: 0, flex: 1 }}>{rec.name}</p>
          <span style={{ fontFamily: nunito, fontSize: 18, fontWeight: 800, color: matchColor, background: matchBg, borderRadius: 12, padding: "8px 12px", flexShrink: 0, lineHeight: "22px" }}>
            {rec.matchPercent}% Tugma
          </span>
        </div>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: "8px 0 8px" }}>{rec.description}</p>
        <span style={{ display: "inline-flex", alignItems: "center", background: C.iconTileTint, borderRadius: 8, padding: "4px 8px", fontFamily: nunito, fontSize: 11, fontWeight: 600, color: C.primary }}>
          {rec.agency}
        </span>
      </div>

      {isExpanded && (
        <div style={{ margin: "12px 16px 0", padding: "12px 0 0", borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontFamily: nunito, fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 12 }}>Bakit inirerekumenda ito?</p>
          {rec.matchedRules.map((rule, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 8 }}>
              {rule.matched
                ? <Check size={16} color={C.successText} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                : <X size={16} color={C.textTertiary} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />}
              <p style={{ fontSize: 13, color: rule.matched ? C.textPrimary : C.textTertiary, margin: 0, lineHeight: "19px" }}>{rule.description}</p>
            </div>
          ))}

          {/* Required documents — the explicit national ID + government papers gate */}
          <p style={{ fontFamily: nunito, fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "14px 0 10px" }}>Kailangang Dokumento</p>
          {rec.requiredDocuments.map((doc, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 8 }}>
              <FileText size={14} color={C.accent} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: C.textPrimary, margin: 0, lineHeight: "19px" }}>{doc}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "12px 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onApply} disabled={applied}
          style={{ height: 38, paddingInline: 16, borderRadius: 12, background: applied ? C.successBg : C.primary, color: applied ? C.successText : "#fff", fontFamily: nunito, fontSize: 13, fontWeight: 600, border: "none", cursor: applied ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          {applied ? <><CheckCircle2 size={14} /> Naka-apply na</> : <>{rec.ctaLabel} →</>}
        </button>
        <button onClick={onToggle} style={{ fontSize: 12, fontWeight: 500, color: C.accent, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, minHeight: 44 }}>
          {isExpanded ? <><ChevronUp size={14} color={C.accent} /> Isara</> : <><ChevronDown size={14} color={C.accent} /> Palawakin</>}
        </button>
      </div>
    </div>
  );
}

// ─── Apply Modal — the explicit "national ID + government papers" gate ───────
//
// Design intent: applying for a benefit is gated on two things, shown
// explicitly rather than assumed —
//   1. the citizen's PhilSys National ID, already verified earlier via
//      VerificationModal/eKYC (shown here as a read-only confirmation, not
//      re-collected), and
//   2. the specific supporting government papers each agency actually asks
//      for (rec.requiredDocuments), which the citizen self-attests to having
//      ready before the (simulated) submission proceeds.
// No file upload exists here by design — see the "Documents" quick-access
// note elsewhere in this file about hosting files externally. This keeps the
// prototype from collecting or transmitting real citizen documents at all.

interface SubmittedApplication {
  id: string;
  programId: string;
  programName: string;
  agency: string;
  caseNumber: string;
  submittedAt: string;
}

function generateCaseNumber(agency: string): string {
  const prefix = agency.split(/[\s/]+/)[0].toUpperCase().slice(0, 6);
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${rand}`;
}

function ApplyModal({ rec, user, onClose, onSubmitted }: { rec: ProgramRec; user: UserEntity; onClose: () => void; onSubmitted: (app: SubmittedApplication) => void }) {
  const [checked, setChecked] = useState<boolean[]>(() => rec.requiredDocuments.map(() => false));
  const [submitted, setSubmitted] = useState<SubmittedApplication | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { btnRef.current?.focus(); }, []);

  const allChecked = checked.every(Boolean);

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  function handleSubmit() {
    const app: SubmittedApplication = {
      id: `app-${Date.now()}`,
      programId: rec.id,
      programName: rec.name,
      agency: rec.agency,
      caseNumber: generateCaseNumber(rec.agency),
      submittedAt: new Date().toISOString(),
    };
    setSubmitted(app);
    onSubmitted(app);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Mag-apply sa ${rec.name}`} style={{ position: "absolute", inset: 0, zIndex: 90, background: C.surface, display: "flex", flexDirection: "column", borderRadius: 48, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 16px 16px", flexShrink: 0 }}>
        <p style={{ fontFamily: nunito, fontSize: 17, fontWeight: 700, color: C.textPrimary }}>{submitted ? "Naipasa na" : "Mag-apply"}</p>
        <button ref={btnRef} aria-label="Close" onClick={onClose} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: C.iconTileTint, borderRadius: 999, border: "none", cursor: "pointer" }}>
          <X size={20} color={C.textPrimary} strokeWidth={2} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px", scrollbarWidth: "none" }}>
        {!submitted ? (
          <>
            <p style={{ fontFamily: nunito, fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: "0 0 4px" }}>{rec.name}</p>
            <span style={{ display: "inline-flex", alignItems: "center", background: C.iconTileTint, borderRadius: 8, padding: "4px 8px", fontFamily: nunito, fontSize: 11, fontWeight: 600, color: C.primary, marginBottom: 20 }}>
              {rec.agency}
            </span>

            {/* Verified identity confirmation — reuses the already-completed PhilSys verification */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.goldAccent}`, borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: nunito, fontSize: 12, fontWeight: 700, color: "#fff" }}>JD</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: nunito, fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{user.fullName}</p>
                <p style={{ fontSize: 11, color: C.successText, margin: "2px 0 0" }}>PSN: {user.idNumber.replace("PSN-", "")} &nbsp;✓ National ID Verified</p>
              </div>
            </div>

            <p style={{ fontFamily: nunito, fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 4px" }}>Kailangang Dokumento</p>
            <p style={{ fontSize: 12, color: C.textSecondary, margin: "0 0 14px", lineHeight: "17px" }}>
              Tiyakin na kompleto ang mga sumusunod na dokumento bago magpatuloy. I-check ang bawat isa kapag handa na.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {rec.requiredDocuments.map((doc, i) => (
                <button key={i} onClick={() => toggle(i)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, background: C.canvas, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1, background: checked[i] ? C.primary : C.surface, border: `1.5px solid ${checked[i] ? C.primary : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {checked[i] && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <p style={{ fontSize: 13, color: C.textPrimary, margin: 0, lineHeight: "18px" }}>{doc}</p>
                </button>
              ))}
            </div>

            <div style={{ background: C.warningBg, borderRadius: 14, padding: 12, display: "flex", gap: 8, marginBottom: 24 }}>
              <AlertTriangle size={15} color={C.warningText} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: C.warningText, margin: 0, lineHeight: "16px" }}>
                Concept Prototype: hindi ito totoong pagpapasa sa {rec.agency}. Walang dokumento ang na-upload o na-store — self-check lang ito. Sa totoong bersyon, dito ikokonekta ang opisyal na e-submission ng ahensya.
              </p>
            </div>

            <button onClick={handleSubmit} disabled={!allChecked}
              style={{ width: "100%", height: 48, borderRadius: 12, background: allChecked ? C.primary : C.border, color: allChecked ? "#fff" : C.textTertiary, fontFamily: nunito, fontSize: 15, fontWeight: 600, border: "none", cursor: allChecked ? "pointer" : "not-allowed" }}>
              Ipasa ang Aplikasyon
            </button>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 40 }}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <CheckCircle2 size={40} color={C.successText} strokeWidth={2} />
            </div>
            <p style={{ fontFamily: nunito, fontSize: 16, fontWeight: 700, color: C.successText, margin: "0 0 8px" }}>Naipasa na ang aplikasyon!</p>
            <p style={{ fontSize: 14, color: C.textSecondary, margin: "0 0 4px" }}>{submitted.programName} · {submitted.agency}</p>
            <p style={{ fontFamily: "monospace", fontSize: 13, color: C.textPrimary, background: C.canvas, borderRadius: 8, padding: "6px 12px", margin: "8px 0 20px" }}>
              Case #: {submitted.caseNumber}
            </p>
            <p style={{ fontSize: 11, color: C.textTertiary, lineHeight: "16px", marginBottom: 24, padding: "0 16px" }}>
              Simulated lang ito — walang tunay na aplikasyon ang naipasa sa {submitted.agency}. Makikita ito sa "Aking mga Aplikasyon" habang bukas ang app na ito.
            </p>
            <button onClick={onClose} style={{ height: 44, paddingInline: 24, borderRadius: 12, background: C.primary, color: "#fff", fontFamily: nunito, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
              Sarado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── eCitizenPH Post-Verification Screen (Screen 14) ─────────────────────────

const PH_REGIONS = [
  "NCR — Metro Manila", "Region I — Ilocos", "Region II — Cagayan Valley",
  "Region III — Gitnang Luzon", "Region IV-A — CALABARZON", "Region V — Bicol",
  "Region VI — Western Visayas", "Region VII — Central Visayas", "Region VIII — Eastern Visayas",
  "Region IX — Zamboanga Peninsula", "Region X — Northern Mindanao", "Region XI — Davao",
  "Region XII — SOCCSKSARGEN", "Region XIII — Caraga", "BARMM", "CAR — Cordillera",
];

function ECitizenPostVerification({ profile, onProfileChange, user }: { profile: CitizenProfile; onProfileChange: (p: CitizenProfile) => void; user: UserEntity }) {
  const [expandedCard, setExpandedCard] = useState<string | null>("4ps");
  const [applyModalRec, setApplyModalRec] = useState<ProgramRec | null>(null);
  const [applications, setApplications] = useState<SubmittedApplication[]>([]);
  const recommendations = computeRecommendations(profile);
  const appliedIds = new Set(applications.map((a) => a.programId));

  function update<K extends keyof CitizenProfile>(key: K, value: CitizenProfile[K]) {
    onProfileChange({ ...profile, [key]: value });
  }

  const empOptions: { value: EmploymentStatus; label: string }[] = [
    { value: "employed", label: "Employed" },
    { value: "self-employed", label: "Self-employed" },
    { value: "student", label: "Estudyante" },
    { value: "unemployed", label: "Walang Trabaho" },
    { value: "retired", label: "Retirado" },
    { value: "ofw", label: "OFW" },
  ];

  const incomeOptions: { value: IncomeBracket; label: string }[] = [
    { value: "under10k", label: "Wala pang ₱10,000" },
    { value: "10k-24k", label: "₱10,000 – ₱24,999" },
    { value: "24k-60k", label: "₱25,000 – ₱59,999" },
    { value: "over60k", label: "₱60,000 pataas" },
  ];

  return (
    <div style={{ padding: "16px 16px 0" }}>
      {applyModalRec && (
        <ApplyModal
          rec={applyModalRec}
          user={user}
          onClose={() => setApplyModalRec(null)}
          onSubmitted={(app) => setApplications((prev) => [...prev, app])}
        />
      )}

      {/* Feature banner */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, padding: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: nunito, fontSize: 18, fontWeight: 800, color: C.primary, margin: 0 }}>eCitizenPH</p>
            <p style={{ fontSize: 14, color: C.textSecondary, margin: "4px 0 0", lineHeight: "19px" }}>
              Kumusta, Juan! Nahanap namin ang {recommendations.length} programa para sa iyo.
            </p>
          </div>
          <RefreshCw size={20} color={C.textTertiary} strokeWidth={1.8} />
        </div>
      </div>

      {/* Citizen Profile Form */}
      <div style={{ marginBottom: 24 }}>
        <EyebrowRow label="Citizen Profile" />
        <div style={{ background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, padding: 16 }}>

          {/* Age stepper */}
          <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 8px" }}>Edad</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button aria-label="Bawasan ang edad" onClick={() => update("age", Math.max(1, profile.age - 1))} style={{ width: 32, height: 32, borderRadius: 999, background: C.iconTileTint, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 44 }}>
              <span style={{ fontFamily: nunito, fontSize: 20, color: C.primary, lineHeight: 1 }}>−</span>
            </button>
            <span style={{ fontFamily: nunito, fontSize: 20, fontWeight: 800, color: C.textPrimary }}>{profile.age}</span>
            <button aria-label="Dagdagan ang edad" onClick={() => update("age", Math.min(120, profile.age + 1))} style={{ width: 32, height: 32, borderRadius: 999, background: C.iconTileTint, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 44 }}>
              <span style={{ fontFamily: nunito, fontSize: 20, color: C.primary, lineHeight: 1 }}>+</span>
            </button>
          </div>
          <div style={{ height: 1, background: C.border, margin: "0 0 12px" }} />

          {/* Region */}
          <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 6px" }}>Rehiyon</p>
          <select value={profile.region} onChange={(e) => update("region", e.target.value)}
            style={{ width: "100%", height: 44, borderRadius: 12, border: `1px solid ${C.border}`, background: C.canvas, fontSize: 14, paddingInline: 12, color: profile.region ? C.textPrimary : C.textTertiary, outline: "none", boxSizing: "border-box", marginBottom: 8 }}>
            <option value="">Pumili ng rehiyon...</option>
            {PH_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div style={{ height: 1, background: C.border, margin: "0 0 12px" }} />

          {/* Employment */}
          <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 8px" }}>Katayuan sa Trabaho</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            {empOptions.map((opt) => {
              const active = profile.employmentStatus === opt.value;
              return (
                <button key={opt.value} onClick={() => update("employmentStatus", opt.value)}
                  style={{ height: 38, borderRadius: 12, fontFamily: nunito, fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "#fff" : C.textSecondary, background: active ? C.primary : C.canvas, border: active ? "none" : `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.12s" }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div style={{ height: 1, background: C.border, margin: "0 0 12px" }} />

          {/* Income */}
          <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 6px" }}>Buwanang Kita ng Pamilya</p>
          <select value={profile.incomeBracket} onChange={(e) => update("incomeBracket", e.target.value as IncomeBracket)}
            style={{ width: "100%", height: 44, borderRadius: 12, border: `1px solid ${C.border}`, background: C.canvas, fontSize: 14, paddingInline: 12, color: profile.incomeBracket ? C.textPrimary : C.textTertiary, outline: "none", boxSizing: "border-box", marginBottom: 8 }}>
            <option value="">Pumili...</option>
            {incomeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ height: 1, background: C.border, margin: "0 0 12px" }} />

          {/* Checkboxes */}
          <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: "0 0 10px" }}>Karagdagang Impormasyon</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {([
              { key: "hasSchoolAgeDependents" as keyof CitizenProfile, label: "May anak sa paaralan" },
              { key: "isSoloParent" as keyof CitizenProfile, label: "Solo Parent (RA 11861)" },
              { key: "isPWD" as keyof CitizenProfile, label: "PWD sa pamilya" },
              { key: "isMicroEntrepreneur" as keyof CitizenProfile, label: "Micro-entrepreneur" },
            ] as const).map(({ key, label }) => {
              const checked = profile[key] as boolean;
              return (
                <button key={String(key)} onClick={() => update(key, !checked as CitizenProfile[typeof key])}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, minHeight: 28 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, background: checked ? C.primary : C.surface, border: `1.5px solid ${checked ? C.primary : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                    {checked && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <p style={{ fontSize: 13, color: C.textPrimary, margin: 0, lineHeight: "18px" }}>{label}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* My Applications — appears once at least one program has been applied to */}
      {applications.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <EyebrowRow label="Aking mga Aplikasyon" />
          <div style={{ background: C.surface, borderRadius: 20, boxShadow: shadow.card, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {applications.map((app, idx) => (
              <div key={app.id}>
                {idx > 0 && <div style={{ height: 1, background: C.border, margin: "0 16px" }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: C.warningBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Clock size={16} color={C.warningText} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{app.programName}</p>
                    <p style={{ fontSize: 12, color: C.warningText, margin: "2px 0 0" }}>Isinasaalang-alang · {app.caseNumber}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div style={{ marginBottom: 0 }}>
        <EyebrowRow label="Para Sa Iyo" actionLabel="Na-update ngayon" />
        {recommendations.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: "24px 20px", textAlign: "center" }}>
            <Sparkles size={32} color={C.textTertiary} strokeWidth={1.5} style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>I-update ang iyong profile para makita ang mga rekomendasyon.</p>
          </div>
        ) : (
          <>
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                isExpanded={expandedCard === rec.id}
                onToggle={() => setExpandedCard(expandedCard === rec.id ? null : rec.id)}
                onApply={() => setApplyModalRec(rec)}
                applied={appliedIds.has(rec.id)}
              />
            ))}
            <button style={{ display: "block", width: "100%", marginTop: 4, fontFamily: nunito, fontSize: 14, fontWeight: 600, color: C.accent, background: "none", border: "none", cursor: "pointer", textAlign: "center", minHeight: 44 }}>
              Tingnan ang lahat ng rekomendasyon ({recommendations.length})
            </button>
          </>
        )}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({ profile, recommendations, onClose }: { profile: CitizenProfile; recommendations: ProgramRec[]; onClose: () => void }) {
  const topRec = recommendations[0];
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>(() => {
    const intro = topRec
      ? `Kumusta po! Base sa inyong profile, ang **${topRec.name}** mula sa ${topRec.agency} ay may ${topRec.matchPercent}% na match. Maaari po akong tulungan na mag-apply o magpaliwanag ng requirements. Mayroon ba kayong tanong?`
      : "Kumusta! Ako ang inyong eCitizen AI Assistant. I-fill up na lang po ang inyong profile para makita ang mga programang angkop para sa inyo.";
    return [{ role: "bot", text: intro }];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickQuestions = topRec
    ? [`Paano mag-apply sa ${topRec.name}?`, "Ano ang mga requirements?"]
    : ["Ano ang PhilHealth Konsulta?", "Paano makakuha ng Barangay Clearance?"];

  function getTaglishResponse(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes("apply") || lower.includes("paano") || lower.includes("mag-apply")) {
      if (topRec) return `Para po mag-apply sa ${topRec.name}, pumunta sa pinakamalapit na ${topRec.agency} office. Karaniwan pong kailangan ang valid ID at proof of residence. Libre po ang application!`;
      return "Pumunta sa inyong barangay hall una para sa guidance. Dalhin ang valid ID at PhilSys ID.";
    }
    if (lower.includes("requirements") || lower.includes("kailangan")) {
      if (topRec) return `Ang mga karaniwang requirements para sa ${topRec.name} ay: (1) Valid Government ID, (2) PhilSys ID, (3) Proof of Residence. Makipag-ugnayan sa ${topRec.agency} para sa kumpletong listahan.`;
      return "Ang mga pangkalahatang requirements ay: valid ID, proof of residence, at PhilSys ID.";
    }
    if (lower.includes("philhealth") || lower.includes("konsulta")) {
      return "Ang PhilHealth Konsulta Package po ay nagbibigay ng libreng outpatient consultation at basic diagnostics sa mga accredited health centers. Dalhin ang PhilHealth ID o e-card.";
    }
    if (lower.includes("4ps") || lower.includes("pantawid") || lower.includes("dswd")) {
      return `Ang 4Ps po ay nagbibigay ng monthly cash grants para sa kalusugan at edukasyon. Pumunta sa pinakamalapit na DSWD office para sa needs assessment at registration.`;
    }
    if (lower.includes("salamat") || lower.includes("thank")) {
      return "Walang anuman po! Kung mayroon pa kayong ibang tanong, nandito po ako. Maaasahan ninyo ang eCitizenPH!";
    }
    return `Salamat po sa inyong tanong! Para sa pinaka-tumpak na impormasyon, makipag-ugnayan sa inyong barangay hall. May ibang katanungan pa po ba?`;
  }

  function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;
    setMessages((prev) => [...prev, { role: "user", text: text.trim() }]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "bot", text: getTaglishResponse(text) }]);
      setIsTyping(false);
    }, 800 + Math.random() * 500);
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: 48, overflow: "hidden" }}>
      <div style={{ flex: 1, cursor: "pointer" }} onClick={onClose} />
      <div style={{ background: C.surface, borderRadius: "24px 24px 48px 48px", height: "74%", display: "flex", flexDirection: "column", boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: "#CE1126", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SunburstEmblem size={22} active={true} />
            </div>
            <div>
              <p style={{ fontFamily: nunito, fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: 0 }}>eCitizen Assistant</p>
              <p style={{ fontSize: 10, color: C.textSecondary, margin: 0 }}>Sumasagot sa Taglish · grounded sa inyong profile</p>
            </div>
          </div>
          <button aria-label="Close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: C.canvas, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color={C.textPrimary} strokeWidth={2} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", scrollbarWidth: "none" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{ maxWidth: "86%", padding: "10px 14px", borderRadius: 16, background: msg.role === "user" ? C.primary : C.canvas, color: msg.role === "user" ? "#fff" : C.textPrimary, fontSize: 13, lineHeight: "19px", borderBottomRightRadius: msg.role === "user" ? 4 : 16, borderBottomLeftRadius: msg.role === "user" ? 16 : 4 }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: C.canvas, display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => <div key={i} style={{ width: 6, height: 6, borderRadius: 999, background: C.textTertiary, animation: `chat-bounce 1s ${i * 0.15}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
          <style>{`@keyframes chat-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }`}</style>
        </div>
        {messages.filter((m) => m.role === "user").length === 0 && (
          <div style={{ padding: "4px 16px 8px", display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
            {quickQuestions.map((q) => (
              <button key={q} onClick={() => sendMessage(q)} style={{ flexShrink: 0, height: 34, paddingInline: 14, borderRadius: 999, fontFamily: nunito, fontSize: 12, fontWeight: 600, color: C.accent, background: C.iconTileTint, border: `1px solid ${C.accent}30`, cursor: "pointer", whiteSpace: "nowrap" }}>
                {q}
              </button>
            ))}
          </div>
        )}
        <div style={{ padding: "8px 16px 20px", display: "flex", gap: 8, alignItems: "center", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
            placeholder="Magtanong sa Taglish…"
            style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.canvas, fontSize: 13, paddingInline: 12, color: C.textPrimary, outline: "none" }} />
          <button aria-label="Ipadala" onClick={() => sendMessage(input)} disabled={!input.trim() || isTyping}
            style={{ width: 40, height: 40, borderRadius: 10, background: input.trim() && !isTyping ? C.primary : C.border, border: "none", cursor: input.trim() && !isTyping ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={16} color={input.trim() && !isTyping ? "#fff" : C.textTertiary} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

function ProfilePage({ user }: { user: UserEntity }) {
  const LINKED = [
    { id: "sss",  label: "SSS",        desc: "Social Security System", linked: true,  icon: ShieldCheck, color: "#123C69" },
    { id: "ph",   label: "PhilHealth", desc: "Health Insurance",       linked: true,  icon: HeartPulse,  color: "#C13333" },
    { id: "pi",   label: "Pag-IBIG",   desc: "Housing & Fund",         linked: false, icon: Landmark,    color: "#6941C6" },
    { id: "umid", label: "UMID",       desc: "Unified Multi-Purpose ID", linked: true, icon: CreditCard, color: "#B77A12" },
  ];

  return (
    <div style={{ paddingTop: 16, paddingBottom: 8 }}>
      <div style={{ margin: "0 16px 20px", background: "linear-gradient(135deg, #123C69 0%, #1B4C82 100%)", borderRadius: 20, padding: "20px", position: "relative", overflow: "hidden", boxShadow: shadow.hero }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 999, background: "rgba(255,255,255,0.04)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 999, flexShrink: 0, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: nunito, fontSize: 22, fontWeight: 700, color: "#fff", outline: "2px solid rgba(255,255,255,0.25)", outlineOffset: 2 }}>
            JD
          </div>
          <div>
            <p style={{ fontFamily: nunito, fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: "24px", margin: 0 }}>{user.fullName}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: "16px", margin: "2px 0 0" }}>{user.registeredBarangay}, {user.registeredCity}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.13)", borderRadius: 999, padding: "4px 12px" }}>
            <BadgeCheck size={12} color="#fff" strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Verified</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.10)", borderRadius: 999, padding: "4px 12px" }}>
            <CreditCard size={12} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>₱{user.ewalletBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
          </span>
        </div>
      </div>

      <div style={{ margin: "0 16px 20px" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, marginBottom: 10 }}>Linked Accounts</p>
        <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, overflow: "hidden" }}>
          {LINKED.map((acc, idx) => (
            <div key={acc.id}>
              {idx > 0 && <div style={{ height: 1, background: C.border, margin: "0 16px" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `${acc.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <acc.icon size={20} color={acc.color} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{acc.label}</p>
                  <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>{acc.desc}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: acc.linked ? C.successText : C.textTertiary, background: acc.linked ? C.successBg : C.canvas, padding: "3px 10px", borderRadius: 999 }}>
                  {acc.linked ? "Linked" : "Link"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: "0 16px 8px" }}>
        <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, overflow: "hidden" }}>
          {[{ label: "Help & Support", icon: Phone, color: "#2E6FCC" }, { label: "App Settings", icon: Settings, color: "#667085" }].map((item, idx) => (
            <div key={item.label}>
              {idx > 0 && <div style={{ height: 1, background: C.border, margin: "0 16px" }} />}
              <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <item.icon size={20} color={item.color} strokeWidth={1.8} />
                <p style={{ flex: 1, fontSize: 14, fontWeight: 500, color: C.textPrimary, margin: 0 }}>{item.label}</p>
                <ChevronRight size={16} color={C.textTertiary} strokeWidth={2} />
              </button>
            </div>
          ))}
          <div style={{ height: 1, background: C.border, margin: "0 16px" }} />
          <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            <LogOut size={20} color={C.dangerText} strokeWidth={1.8} />
            <p style={{ flex: 1, fontSize: 14, fontWeight: 500, color: C.dangerText, margin: 0 }}>Log Out</p>
          </button>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: C.textTertiary, padding: "12px 0 4px", fontFamily: nunito }}>eGovPH · Version 1.0.0-demo</p>
    </div>
  );
}

// ─── Digital ID QR Modal ───────────────────────────────────────────────────────

function IdQrModal({ onClose }: { onClose: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { btnRef.current?.focus(); }, []);
  return (
    <div role="dialog" aria-modal="true" aria-label="Digital ID QR code" style={{ position: "absolute", inset: 0, zIndex: 100, background: C.surface, display: "flex", flexDirection: "column", borderRadius: 48, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 16px 0" }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Digital ID</p>
        <button ref={btnRef} aria-label="Close" onClick={onClose} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: C.iconTileTint, borderRadius: 999, border: "none", cursor: "pointer" }}>
          <X size={20} color={C.textPrimary} strokeWidth={2} />
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
        <div style={{ width: 264, height: 264, background: C.canvas, borderRadius: 20, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg aria-hidden="true" width="240" height="240" viewBox="0 0 240 240" fill="none">
            <rect x="20" y="20" width="60" height="60" rx="6" fill={C.primary} />
            <rect x="28" y="28" width="44" height="44" rx="3" fill={C.surface} />
            <rect x="34" y="34" width="32" height="32" rx="2" fill={C.primary} />
            <rect x="160" y="20" width="60" height="60" rx="6" fill={C.primary} />
            <rect x="168" y="28" width="44" height="44" rx="3" fill={C.surface} />
            <rect x="174" y="34" width="32" height="32" rx="2" fill={C.primary} />
            <rect x="20" y="160" width="60" height="60" rx="6" fill={C.primary} />
            <rect x="28" y="168" width="44" height="44" rx="3" fill={C.surface} />
            <rect x="34" y="174" width="32" height="32" rx="2" fill={C.primary} />
            {Array.from({ length: 12 }, (_, row) => Array.from({ length: 12 }, (_, col) => {
              const x = 100 + col * 8; const y = 100 + row * 8;
              const seed = (row * 12 + col + 99) * 2654435761;
              if ((seed >>> 0) % 2 !== 0) return null;
              return <rect key={`${row}-${col}`} x={x} y={y} width={6} height={6} rx={1} fill={C.primary} />;
            }))}
          </svg>
        </div>
        <p style={{ fontFamily: nunito, fontSize: 20, fontWeight: 700, color: C.textPrimary, textAlign: "center", marginBottom: 6 }}>Juan dela Cruz</p>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.textSecondary, letterSpacing: "0.06em", textAlign: "center", marginBottom: 8 }}>PSN: •••• •••• 1234</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={12} color={C.textTertiary} strokeWidth={2} />
          <p style={{ fontSize: 12, color: C.textTertiary }}>Brgy. San Pablo Norte, Malolos</p>
        </div>
      </div>
      <div style={{ padding: "16px 32px 48px", textAlign: "center", borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 11, color: C.textTertiary, lineHeight: "16px" }}>Present this code to any authorized LGU personnel for identity verification.</p>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

// ─── Demo Login Gate ──────────────────────────────────────────────────────────
//
// Cosmetic only — a client-side string comparison, not real authentication.
// No account system, no server-side session, no real citizen data behind it.
// Exists purely so a judge opening the public demo link sees a recognizable
// "login" step before the prototype, consistent with how every other
// identity-adjacent screen in this app (PSN entry, liveness check) is
// explicitly labeled simulated rather than presented as if it were real.

const DEMO_USERNAME = "judge@ecitizenph.demo";
const DEMO_PASSWORD = "ecitizenph2026";

function DemoLoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().toLowerCase() === DEMO_USERNAME && password === DEMO_PASSWORD) {
      onLogin();
    } else {
      setError(true);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#D1D9E6", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ width: 390, height: 844, background: "linear-gradient(160deg, #123C69 0%, #0D2C4E 100%)", borderRadius: 48, boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 0 0 12px #1A2433", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: 999, background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: 999, background: "rgba(255,255,255,0.04)" }} />

        <div style={{ padding: "64px 28px 0", position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: nunito, fontSize: 11, fontWeight: 600, color: "#B77A12", background: "#FDF3DF", borderRadius: 8, padding: "6px 10px" }}>
            ⚙️ Concept Prototype
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28 }}>
            <SunburstEmblem size={40} active={true} />
            <span style={{ fontFamily: nunito, fontSize: 22, fontWeight: 800, color: "#fff" }}>eGovPH</span>
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 8, lineHeight: "20px" }}>
            eCitizenPH — hackathon demo login
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", padding: "28px 28px 0", position: "relative", zIndex: 1 }}>
          <label style={{ fontFamily: nunito, fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 6 }}>Username / Email</label>
          <input
            type="text"
            autoCapitalize="none"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(false); }}
            placeholder="judge@ecitizenph.demo"
            style={{ height: 48, borderRadius: 12, border: `1px solid ${error ? C.dangerText : "rgba(255,255,255,0.25)"}`, background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, paddingInline: 14, outline: "none", marginBottom: 16, boxSizing: "border-box" }}
          />

          <label style={{ fontFamily: nunito, fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="••••••••"
            style={{ height: 48, borderRadius: 12, border: `1px solid ${error ? C.dangerText : "rgba(255,255,255,0.25)"}`, background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, paddingInline: 14, outline: "none", marginBottom: error ? 8 : 20, boxSizing: "border-box" }}
          />

          {error && (
            <p style={{ fontSize: 12, color: "#FFB4B4", margin: "0 0 16px" }}>
              Maling username o password. Gamitin ang demo credentials sa ibaba.
            </p>
          )}

          <button type="submit" style={{ height: 48, borderRadius: 12, background: "#fff", color: C.primary, fontFamily: nunito, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", marginBottom: 20 }}>
            Mag-log In
          </button>

          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: 14 }}>
            <p style={{ fontFamily: nunito, fontSize: 11, fontWeight: 700, color: C.goldAccent, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Demo Credentials
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "0 0 4px", fontFamily: "monospace" }}>{DEMO_USERNAME}</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: 0, fontFamily: "monospace" }}>{DEMO_PASSWORD}</p>
          </div>
        </form>

        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", textAlign: "center", padding: "16px 28px 32px", lineHeight: "14px", position: "relative", zIndex: 1 }}>
          Cosmetic demo login lang ito — walang totoong account system. Hindi ito kumokonekta sa anumang tunay na PhilSys o gobyerno na database.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [qrOpen, setQrOpen] = useState(false);
  const [idQrOpen, setIdQrOpen] = useState(false);
  const [devHandoffOpen, setDevHandoffOpen] = useState(false);

  const [ecitizenVerified, setEcitizenVerified] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [ecitizenChatOpen, setEcitizenChatOpen] = useState(false);
  const [ecitizenProfile, setEcitizenProfile] = useState<CitizenProfile>(DEFAULT_CITIZEN_PROFILE);

  const [lguState, setLguState] = useState<SectionState>("ready");
  const [feedState, setFeedState] = useState<SectionState>("ready");
  const [carouselState, setCarouselState] = useState<SectionState>("ready");
  const [activityState, setActivityState] = useState<SectionState>("ready");

  const handleRefresh = useCallback(async () => {
    setLguState("loading"); setFeedState("loading"); setCarouselState("loading"); setActivityState("loading");
    await new Promise<void>((r) => setTimeout(r, 900));
    setLguState("ready"); setFeedState("ready"); setCarouselState("ready"); setActivityState("ready");
  }, []);

  const user = CURRENT_USER;
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;
  const sortedAnnouncements = [...ANNOUNCEMENTS].sort((a, b) => a.displayOrder - b.displayOrder);
  const sortedFeedCards = [...FEED_CARDS].sort((a, b) => b.priorityScore - a.priorityScore);

  const stripH = ecitizenVerified ? DIGITAL_ID_STRIP_H : 0;
  const contentTop = STATUS_BAR_H + TOP_BAR_H + stripH;
  const bottomPad = 24 + BOTTOM_NAV_H + SAFE_BOTTOM;

  const NAV_ITEMS: { label: string; icon?: LucideIcon; tab: string }[] = [
    { label: "Home",       icon: Home,       tab: "home" },
    { label: "Services",   icon: Grid3X3,    tab: "services" },
    { label: "eCitizenPH",                  tab: "ecitizen" },
    { label: "Health",     icon: HeartPulse, tab: "health" },
    { label: "Profile",    icon: User,       tab: "profile" },
  ];

  if (!loggedIn) {
    return <DemoLoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#D1D9E6", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Phone shell */}
      <div style={{ width: 390, height: 844, background: C.canvas, borderRadius: 48, boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 0 0 12px #1A2433", position: "relative", overflow: "hidden" }}>

        {/* Modals */}
        {devHandoffOpen && <DevHandoffPanel onClose={() => setDevHandoffOpen(false)} />}
        {qrOpen && <QrScannerModal onClose={() => setQrOpen(false)} />}
        {idQrOpen && <IdQrModal onClose={() => setIdQrOpen(false)} />}
        {verificationModalOpen && (
          <VerificationModal
            onVerified={() => { setEcitizenVerified(true); setVerificationModalOpen(false); }}
            onClose={() => setVerificationModalOpen(false)}
          />
        )}

        {/* Status bar */}
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: STATUS_BAR_H, display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: 24, paddingTop: 12, zIndex: 20, background: C.surface }}>
          <span style={{ fontFamily: nunito, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>9:41</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="3" width="3" height="9" rx="1" fill={C.textPrimary} />
              <rect x="4.5" y="2" width="3" height="10" rx="1" fill={C.textPrimary} />
              <rect x="9" y="0" width="3" height="12" rx="1" fill={C.textPrimary} />
              <rect x="13.5" y="0" width="3" height="12" rx="1" fill={C.textPrimary} opacity="0.3" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke={C.textPrimary} strokeOpacity="0.35" />
              <rect x="2" y="2" width="16" height="8" rx="2" fill={C.textPrimary} />
              <path d="M23 4.5V7.5C23.8 7.2 24.5 6.4 24.5 6C24.5 5.6 23.8 4.8 23 4.5Z" fill={C.textPrimary} fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* eGovPH shared header */}
        <ECitizenAppBar unreadCount={unreadCount} onQrScan={() => setQrOpen(true)} onDevHandoff={() => setDevHandoffOpen(true)} />

        {/* Digital ID strip (post-verification) */}
        {ecitizenVerified && <DigitalIDStrip />}

        {/* Scrollable content */}
        <ScrollContent top={contentTop} bottomPad={bottomPad} onRefresh={activeTab === "home" ? handleRefresh : async () => {}}>

          {/* HOME TAB */}
          {activeTab === "home" && (
            <>
              {/* Search bar */}
              <div style={{ margin: "16px 16px 0" }}>
                <div style={{ height: 48, background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, display: "flex", alignItems: "center", gap: 12, paddingInline: 16 }}>
                  <Search size={20} color={C.textTertiary} strokeWidth={1.8} />
                  <span style={{ fontSize: 14, color: C.textTertiary }}>Hanapin ang serbisyo...</span>
                </div>
              </div>

              {/* Hero Card */}
              <div style={{ marginTop: 16 }}>
                <HeroCard onOpenIdQr={() => setIdQrOpen(true)} />
              </div>

              {/* NGA Tiles */}
              <NGATilesSection />

              {/* LGU Wedge */}
              <LguWedge updates={LGU_UPDATES} sectionState={lguState} onRetry={() => { setLguState("loading"); setTimeout(() => setLguState("ready"), 800); }} />

              {/* For You Feed */}
              <ForYouFeed cards={sortedFeedCards} sectionState={feedState} onRetry={() => { setFeedState("loading"); setTimeout(() => setFeedState("ready"), 900); }} />

              {/* National Announcement Carousel */}
              <AnnouncementCarousel announcements={sortedAnnouncements} sectionState={carouselState} onRetry={() => { setCarouselState("loading"); setTimeout(() => setCarouselState("ready"), 700); }} />

              {/* Quick Tracker */}
              <QuickTracker items={ACTIVITY_ITEMS} onViewAll={() => setActiveTab("profile")} sectionState={activityState} onRetry={() => { setActivityState("loading"); setTimeout(() => setActivityState("ready"), 600); }} />

              <div style={{ height: 8 }} />
            </>
          )}

          {/* GOVERNMENT SERVICES TAB */}
          {activeTab === "services" && <GovernmentServicesPage />}

          {/* ECITIZEN TAB */}
          {activeTab === "ecitizen" && (
            ecitizenVerified
              ? <ECitizenPostVerification profile={ecitizenProfile} onProfileChange={setEcitizenProfile} user={user} />
              : <ECitizenPreVerification onBeginVerification={() => setVerificationModalOpen(true)} />
          )}

          {/* HEALTH TAB */}
          {activeTab === "health" && <HealthPage />}

          {/* PROFILE TAB */}
          {activeTab === "profile" && <ProfilePage user={user} />}

        </ScrollContent>

        {/* eCitizenPH Floating Chat FAB */}
        {activeTab === "ecitizen" && ecitizenVerified && !ecitizenChatOpen && (
          <button aria-label="Open AI Assistant" onClick={() => setEcitizenChatOpen(true)}
            style={{ position: "absolute", bottom: BOTTOM_NAV_H + SAFE_BOTTOM + 16, right: 24, width: 56, height: 56, borderRadius: 999, background: "#CE1126", border: "2px solid #fff", boxShadow: "0 4px 16px rgba(0,0,0,0.20)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 25, flexDirection: "column" }}>
            <SunburstEmblem size={24} active={true} />
            {/* Pulsing gold dot */}
            <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 999, background: C.goldAccent, border: "2px solid #CE1126", animation: "fab-pulse 2s ease-in-out infinite" }} />
            <style>{`@keyframes fab-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }`}</style>
          </button>
        )}

        {/* Chat panel overlay */}
        {activeTab === "ecitizen" && ecitizenVerified && ecitizenChatOpen && (
          <ChatPanel profile={ecitizenProfile} recommendations={computeRecommendations(ecitizenProfile)} onClose={() => setEcitizenChatOpen(false)} />
        )}

        {/* Bottom Navigation */}
        <nav aria-label="Tab bar" role="tablist" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: BOTTOM_NAV_H + SAFE_BOTTOM, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", zIndex: 20 }}>
          {NAV_ITEMS.map(({ label, icon: Icon, tab }) => {
            const isActive = activeTab === tab;
            const isEcitizen = tab === "ecitizen";
            return (
              <button key={tab} role="tab" aria-selected={isActive} aria-label={label} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, height: BOTTOM_NAV_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 0, position: "relative", background: "none", border: "none", cursor: "pointer" }}>
                <div style={{ width: isEcitizen ? 20 : 28, height: 3, borderRadius: 999, background: isActive ? (isEcitizen ? "#CE1126" : C.primary) : "transparent", marginBottom: isEcitizen ? 6 : 8, transition: "background 0.15s", flexShrink: 0 }} />
                <div style={{ position: "relative", marginBottom: 4 }}>
                  {isEcitizen ? <SunburstEmblem size={24} active={isActive} /> : Icon ? <Icon size={24} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? C.primary : C.textTertiary} style={{ transition: "color 0.15s" }} /> : null}
                </div>
                <p style={{ fontFamily: nunito, fontSize: 10, fontWeight: isActive ? 600 : 500, lineHeight: "13px", color: isActive ? (isEcitizen ? "#0038A8" : C.primary) : C.textTertiary, transition: "color 0.15s", margin: 0, letterSpacing: isEcitizen ? "-0.02em" : 0 }}>
                  {label}
                </p>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
