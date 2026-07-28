Design Screens 9–16 of the Ageli super-app. All frames: 390x844px.
These screens replace everything in the previous Step 10 and Step 12.

This is the eCitizenPH section of the Ageli super-app — a native civic
intelligence hub, not a separate app. It uses its own visual theme
(eCitizenPH tokens) that is strictly separate from the Ageli language
learning theme. NO Hari mascot appears on any eCitizenPH screen.
The tone is confident and government-trustworthy: clean cards, generous
whitespace, bold typography, no startup-y gradients or playful
illustrations.

A permanent "Concept Prototype" pill badge (8px radius, #FDF3DF fill,
#B77A12 text, Nunito SemiBold 11px, 6px/10px padding) appears in the
top header of EVERY eCitizenPH screen. It must be visible in any
screenshot — never hidden or scrolled away.

════════════════════════════════════════════════
DESIGN TOKENS — eCitizenPH SECTION ONLY
(These do NOT bleed into Ageli language screens)
════════════════════════════════════════════════

Colors:
- Primary Navy:        #123C69  — buttons, active nav, hero card
- Navy Pressed:        #0D2C4E  — tap/pressed state
- Secondary Blue:      #2E6FCC  — links, "see all", info status
- Background Canvas:   #F5F7FA  — all eCitizen screen backgrounds
- Surface:             #FFFFFF  — every card background (except LGU)
- Border/Divider:      #E3E8EF  — hairlines, card outlines, dividers
- Text Primary:        #1A2433  — headlines, names, body copy
- Text Secondary:      #667085  — captions, timestamps, subtext
- Text Tertiary:       #98A2B3  — inactive labels, placeholders
- Icon Tile Tint:      #EAF1FA  — service grid icon backgrounds
- LGU Wedge Tint:      #F3EFEA  — LGU card background only
- Success text/bg:     #17864D / #E7F7EF
- Warning text/bg:     #B77A12 / #FDF3DF
- Danger text/bg:      #C13333 / #FBEAEA

Sunburst Emblem colors (shared with Ageli branding):
- Navy:  #0038A8
- Red:   #CE1126
- Gold:  #FCD116

Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40px only.
No arbitrary values.

Corner radius:
- Chips/badges:        8px
- Buttons/icon tiles:  12px
- Major cards:         20px (Hero, Wedge, Feed, Carousel)
- Avatars/pills:       999px

Shadows:
- Standard cards:   0px 2px 8px rgba(16,24,40,0.06)
- Hero + modals:    0px 4px 16px rgba(16,24,40,0.10)

Typography (system font — SF Pro on iOS, Roboto on Android):
- Display:  20px / 700 / 26px  — user name in Hero card
- Title:    16px / 700 / 22px  — section headers, feed headlines
- Subtitle: 15px / 600 / 20px  — top bar greeting, card titles
- Body:     14px / 400 / 20px  — descriptions, supporting text
- Caption:  12px / 500 / 16px  — icon labels, chip text
- Micro:    11px / 500 / 14px  — timestamps, fine print

BOLD TYPOGRAPHY OVERRIDES (applied on top of base styles):
- All section eyebrow labels: UPPERCASE, 11px/600, #98A2B3,
  0.8px letter-spacing
- All main headers/app bar titles: high-contrast black or
  near-black #1A2433, never gray
- Match score badges: ExtraBold weight, large 18-22px,
  color-coded by match tier
- Recommendation card headlines: 700 weight, 16px
- Bottom nav labels when active: 600 weight, #123C69

Touch targets: minimum 44x44pt on every tappable element,
even if the visible icon is smaller.

════════════════════════════════════════════════
SHARED HEADER COMPONENT (all eCitizenPH screens)
════════════════════════════════════════════════

Top App Bar: 56px height + safe area inset. White #FFFFFF.
1px bottom border #E3E8EF. 16px horizontal padding. Fixed/sticky.

Left cluster:
- Sunburst emblem 28px flat vector:
  8 rays alternating Gold #FCD116 and Red #CE1126,
  Navy #0038A8 center circle, 2px white ring outline.
- 8px gap right of emblem.
- "eGovPH" Nunito ExtraBold 16px #1A2433 — bold, high contrast.

Right cluster:
- "Concept Prototype" pill badge (#FDF3DF fill, #B77A12 text,
  Nunito SemiBold 11px, 8px radius, 6px/10px padding)
- 12px gap left of badge:
- Bell icon 24px #1A2433, 44px tap zone,
  8px red dot badge #CE1126 top-right when unread > 0
- 16px gap:
- QR scan icon 24px #1A2433, 44px tap zone

DIGITAL ID STRIP (appears BELOW the top bar, full width,
white fill, 12px vertical padding, 1px bottom border #E3E8EF,
4px left accent border #FCD116 — GOLD — full height of strip):
This strip ONLY appears after verification is complete.
Show in verified/unlocked state for all mockups.

Strip content (16px horizontal padding, flex row):
Left: 36px avatar circle (#123C69 fill, white initials "JD",
  1px border #E3E8EF)
Right of avatar (8px gap, vertical stack):
  "Juan dela Cruz" Nunito SemiBold 14px #1A2433
  "PSN: •••• •••• 1234  ✓ Verified"
  Nunito Regular 12px #17864D

════════════════════════════════════════════════
SCREEN 9 — HOME TAB
════════════════════════════════════════════════

Background: #F5F7FA. Shared header + Digital ID strip at top.

SEARCH BAR (16px margin, 16px top):
White fill, 20px radius, 1px border #E3E8EF,
shadow 0 2px 8px rgba(16,24,40,0.06), 48px tall, 16px padding.
Left: 🔍 search icon 20px #98A2B3.
Placeholder: "Hanapin ang serbisyo..." Nunito Regular 14px #98A2B3.

HERO / DIGITAL ID CARD (16px margin, 16px top):
20px radius, 20px padding,
135° gradient #123C69 → #1B4C82 (ONLY card allowed gradient).
Shadow 0 4px 16px rgba(16,24,40,0.10).

Inside card top row:
Left: "Digital ID" Caption white 70% opacity
Right: Verified chip — white 15% overlay fill, 8px radius,
  ✓ icon + "Verified" Caption white, 4px/10px padding

24px gap:
"Juan dela Cruz" Display style white (20px/700)

16px gap:
Left: "View QR Code" button — white fill, #123C69 text,
  Nunito Subtitle 15px/600, 999px radius, 12px/20px padding
Right: 3 quick-access circles (36px, white 15% opacity):
  wallet icon | document icon | transfer icon

NGA TILES SECTION (24px top, 16px margin):
Section header row:
"MGA SERBISYO" eyebrow — uppercase 11px/600 #98A2B3, left
"Lahat →" #2E6FCC 14px, right

4-column grid, 12px column gutter, 20px row gap:
Each tile: 56x56px icon tile (12px radius, #EAF1FA fill,
28px #123C69 icon centered) + 8px gap + Caption label
(12px/500, centered, max 2 lines, #1A2433).

Row 1: 🪪 E-ID | 📄 Permits | 🏥 PhilHealth | 💰 SSS
Row 2: 🎓 Scholarships | 🚔 PNP | 🏛️ LGU Pay | 📋 Civil Reg
Row 3: 🛂 DFA | 💼 DOLE | 🌾 DA | 📡 DICT

"Lahat ng Serbisyo (24)" #2E6FCC 14px centered, 12px top

LGU UPDATES WEDGE (24px top, 16px margin):
20px radius, #F3EFEA fill, 16px padding.
Faint concentric-circle pattern bottom-right corner at 4% opacity
in #123C69 — purely decorative, does not compete with content.

Header row:
Left: 📍 16px + "Malolos Updates" Title/Primary Blue #123C69 700
Right: "Na-update 5 min ago" Micro #667085

Content row (12px below header):
88x88px thumbnail placeholder (12px radius, #E3E8EF fill) left
+ 12px gap + text block:
Category chip "Advisory" — #B77A12 text / #FDF3DF bg,
  8px radius, 4px/10px padding, 11px/600
8px gap:
"Pasuspindihin ang klase bukas sa lahat ng antas"
  Title 16px/700 #1A2433, max 2 lines
4px gap:
"Dahil sa malakas na ulan at posibleng pagbaha sa ilang..."
  13px #667085, 2 lines, ellipsis

Swipe dots: 3 × 6px circles centered below, active = 16px
pill #123C69.

Category chip color reference (build all 4 variants):
Advisory:  #B77A12 / #FDF3DF
Health:    #0F7C7C / #E3F5F5
Deadline:  #123C69 / #EAF1FA
Event:     #6E4AA6 / #F3EEFB

PERSONALIZED FEED (24px top, 16px margin):
Section header: "PARA SA IYO" eyebrow left +
"Higit pa →" #2E6FCC right

3 stacked cards (16px gap between), 20px radius,
shadow 0 2px 8px rgba(16,24,40,0.06):

Each card: 16:9 placeholder image top (rounded top corners) →
16px padding below:
Headline Title 16px/700 #1A2433
4px gap:
Supporting line 13px #667085, 1 line
12px gap:
CTA button: #123C69 fill, 12px radius, 10px/16px padding,
"Alamin →" Nunito SemiBold 13px white, intrinsic width.

Card 1: "I-renew ang iyong National ID bago mag-expire"
  "Mag-e-expire na sa 30 araw — i-renew na ngayon."
Card 2: "Qualify ka ba sa DSWD 4Ps?"
  "Batay sa iyong profile, posibleng eligible ka."
Card 3: "Libreng konsultasyon sa PhilHealth Konsulta"
  "Available sa mga miyembro ng PhilHealth."

"Tingnan lahat" centered #2E6FCC 14px, 16px top

NATIONAL ANNOUNCEMENT CAROUSEL (24px top):
Section header: "MGA PAMBANSANG ABISO" eyebrow

Horizontal scroll, first card at 16px inset, next card peeks
12px at right edge.
Each banner: 85% screen width (~330px), 140px tall, 20px radius,
12px gap between.
Dark navy gradient placeholder bg (#123C69 → #1B4C82).
Bottom gradient overlay transparent → rgba(0,0,0,0.55).
Text bottom-left, 16px padding:
  Eyebrow 11px/600 white 85%
  Headline 15px/700 white, max 2 lines

Banner 1: "KALUSUGAN" / "Libreng konsultasyon sa lahat
  ng barangay ngayong Hulyo"
Banner 2: "EDUKASYON" / "CHED TES applications bukas na
  para sa AY 2026-2027"
Banner 3: "NEGOSYO" / "DTI KMME registration extended
  hanggang Agosto 31"

Dot indicators: 6px circles, active = 16px pill #123C69,
12px top margin, centered.

QUICK TRACKER (24px top, 16px margin):
Section header row:
"KAMAKAILANG AKTIBIDAD" eyebrow left +
"Lahat →" (routes to Health tab inbox) #2E6FCC right

ONE white card (20px radius, standard shadow) containing all
rows with 1px #E3E8EF dividers between them.

Row 1 — APPROVED (64px, 16px padding):
Left: 32px circle #E7F7EF, ✓ icon #17864D
Text: "E-ID Renewal" 14px/600 #1A2433 /
  "Naaprubahan" Caption #17864D below
Right: "Jul 20" Micro #98A2B3 + › chevron 16px #98A2B3

Row 2 — PENDING:
32px circle #FDF3DF, ⏱ icon #B77A12
"Business Permit" / "Isinasaalang-alang" #B77A12
"Jul 18" + ›

Row 3 — PROCESSING:
32px circle #EAF1FA, ↻ icon #2E6FCC
"PhilHealth ID" / "Pinoproseso" #2E6FCC
"Jul 15" + ›

Row 4 — REJECTED:
32px circle #FBEAEA, ✕ icon #C13333
"Scholarship Form" / "Tinanggihan" #C13333
"Jul 10" + ›

Bottom padding: 24px + nav bar height so last card never
sits flush against the bottom nav.

LOADING STATE REFERENCE (show as small inset frame):
Gray #E3E8EF rounded rectangles matching each section's exact
dimensions. Static (no shimmer animation shown in mockup —
note: "disable shimmer when reduced-motion is on").

ERROR STATE REFERENCE (show as small inset frame):
Single card per section: "Hindi ma-load ang [section].
I-tap para subukan muli." #1A2433 body, retry icon centered.

════════════════════════════════════════════════
SCREEN 10 — GOVERNMENT SERVICES TAB
════════════════════════════════════════════════

Background #F5F7FA. Shared header + Digital ID strip.

Section header: "MGA SERBISYO NG PAMAHALAAN"
Nunito ExtraBold 20px #1A2433, 16px margin, 20px top.

One white card (20px radius, standard shadow, 16px margin)
containing all service rows with 1px #E3E8EF dividers.

Each row: 64px height, 16px padding, flex row.
Left: 40x40px icon tile (12px radius, #EAF1FA fill,
  24px #123C69 icon)
12px gap:
Text block: service name 14px/600 #1A2433 /
  agency name Caption #667085 below
Right: › chevron 16px #98A2B3, 44px tap zone

Rows:
1. 📋 NBI Clearance Appointment — "NBI"
2. 🪪 National ID Reissuance — "PhilSys / PSA"
3. 📜 Birth Certificate Request — "PSA"
4. 💍 Certificate of No Marriage (CENOMAR) — "PSA"
5. 🛂 Passport Renewal — "DFA"
6. 🏥 PhilHealth ID Request — "PhilHealth"
7. 💰 SSS E-Services — "SSS"
8. 🏦 Pag-IBIG Fund Services — "HDMF"

Section subheader below list (24px top):
"MGA LOKAL NA SERBISYO" eyebrow

Second white card (same style), 3 rows:
1. 🏛️ Barangay Clearance — "LGU"
2. 📄 Business Permit — "LGU"
3. 🏠 Real Property Tax — "LGU"

════════════════════════════════════════════════
SCREEN 11 — HEALTH TAB
════════════════════════════════════════════════

Background #F5F7FA. Shared header + Digital ID strip.

Section header: "KALUSUGAN" Nunito ExtraBold 20px #1A2433,
16px margin, 20px top.

PHILHEALTH COVERAGE CARD (16px margin, 12px top):
White card, 20px radius, standard shadow, 16px padding.
Top row: "PhilHealth Konsulta" Title 16px/700 #1A2433 +
  "AKTIBO" chip (#E7F7EF fill, #17864D text, 8px radius) right

Body (12px top):
"Juan dela Cruz" 14px/600 #1A2433
"Miyembro No: 12-345678901-2" Caption #667085
"Saklaw: Outpatient Konsulta, Emergency Care, Maternity"
  13px #667085, 2 lines
"Valid hanggang: Disyembre 2026" Caption #98A2B3

CTA (12px top): "Tingnan ang Buong Coverage →"
#2E6FCC 14px, left-aligned.

MAP-STYLE CARD (24px top, 16px margin):
White card, 20px radius, standard shadow.
Top: 140px tall dark placeholder (#E3E8EF fill with
  faint grid lines suggesting a map), 20px top radius.
Overlay top-left: "MALAPIT SA IYO" pill
  (#1A2433 fill 80% opacity, white text, 999px radius,
  8px/12px padding, 12px margin)

Bottom section (16px padding):
"Mga Pasilidad ng Kalusugan" Title 16px/700 #1A2433
"3 pasilidad ang natagpuan sa loob ng 5km" Caption #667085

Facility list (3 rows, 1px #E3E8EF dividers, 8px padding each):
Each row: facility name 13px/600 #1A2433 /
  distance + type Caption #667085 below /
  "Kumuha ng Direksyon →" #2E6FCC 12px far right

Row 1: "Malolos District Hospital" / "0.8km · Ospital"
Row 2: "Barangay Health Center 1" / "1.2km · Health Center"
Row 3: "PhilHealth Accredited Clinic" / "2.1km · Klinika"

════════════════════════════════════════════════
SCREEN 12 — eCitizenPH TAB (PRE-VERIFICATION STATE)
════════════════════════════════════════════════

This screen shows what the user sees BEFORE completing
verification. Background #F5F7FA. Shared header (NO Digital
ID strip yet — it only appears post-verification).

FEATURE BANNER (16px margin, 16px top):
White card, 20px radius, standard shadow, 16px padding.
NO gradient on this card.

Top row:
Left: "eCitizenPH" Nunito ExtraBold 18px #123C69
Right: "INTELLIGENCE LAYER" pill —
  #EAF1FA fill, #123C69 text, Nunito SemiBold 10px,
  999px radius, 4px/10px padding

8px gap:
"Proactively recommends government services —
hindi ka na maghahanap pa."
Body 14px #667085, 2 lines.

VERIFICATION GATE CARD (24px top, 16px margin):
White card, 20px radius, standard shadow, 16px padding.
4px left border accent #FCD116 (gold) full height of card.

Top: 🔒 lock icon 32px #123C69 centered, 16px top margin
"I-unlock ang Iyong Profile" Title 16px/700 #1A2433 centered,
8px top
"Mag-simulate ng National ID verification para ma-access
ang personalized na rekomendasyon."
Body 14px #667085 centered, 8px top, 20px horizontal padding.

24px gap:
Full-width button: #123C69 fill, 12px radius, 48px tall,
3px bottom border #0D2C4E.
"🪪 Simulan ang Verification" Nunito SemiBold 15px white.

12px gap:
"⚠ Simulated lang ito. Hindi ito kumokonekta sa totoong
PhilSys database."
Micro 11px #98A2B3 centered.

PREVIEW CARDS (24px top, 16px margin) — blurred/locked state:
Section label: "MAKIKITA PAGKATAPOS NG VERIFICATION"
Eyebrow 11px/600 #98A2B3 uppercase

3 preview cards stacked (12px gap), each 20px radius,
standard shadow, 16px padding, 40% opacity (to look locked):
Card 1: "DSWD 4Ps" / "97% Tugma" match badge (green)
Card 2: "PhilHealth Konsulta" / "89% Tugma"
Card 3: "DTI KMME" / "74% Tugma"

Each card overlaid with a subtle lock icon 16px #98A2B3
top-right corner.

════════════════════════════════════════════════
SCREEN 13 — VERIFICATION MODAL
════════════════════════════════════════════════

Full-screen modal overlay (390x844px). White #FFFFFF fill.
20px top radius. Shadow 0 4px 16px rgba(16,24,40,0.10).
Position: slides up from bottom.

STEP INDICATOR (top, centered, 20px top):
3-step pill row: ① PSN Entry → ② Liveness Check → ③ Tapos na!
Active step: #123C69 pill, white text, Nunito SemiBold 12px.
Inactive: #E3E8EF pill, #98A2B3 text.
Steps connected by 1px #E3E8EF line.

STEP 1 — PSN ENTRY (show this step in the main frame):
"Ilagay ang iyong PhilSys Number (PSN)"
Title 16px/700 #1A2433, centered, 24px top

"Ito ay para sa simulation purposes lamang."
Body 14px #667085 centered, 8px top

PSN Input (24px top):
White fill, 1px border #E3E8EF, 12px radius, 56px tall,
16px padding. Placeholder: "1234-5678901-2"
Nunito Regular 16px #98A2B3. Letter-spaced.
Below input: "Format: XXXX-XXXXXXX-X" Caption #98A2B3 8px top.

Full-width button (24px top): "Ituloy →"
#123C69 fill, 12px radius, 48px tall, white label.

STEP 2 — LIVENESS CHECK (show as second inset frame beside
the main frame, labeled "Step 2"):
"Patunayan ang Iyong Pagkakakilanlan"
Title 16px/700 #1A2433, centered

Liveness animation circle (centered, 200x200px):
Outer ring: dashed #123C69 circle, 3px stroke, animating
  (show as partially complete, ~75% arc)
Inner: camera icon 48px #123C69 centered, below it:
"Tumingin sa camera..." Caption #667085

Below circle (24px gap):
3 status rows (12px gap each):
✓ "Mukha na naka-detect" #17864D checkmark + text
✓ "Blink detected" #17864D checkmark + text
⏳ "Pag-verify ng liveness..." #B77A12 clock + text

Note at bottom:
"Walang aktwal na data ang nakolekta. Simulation lamang."
Micro 11px #98A2B3 centered.

STEP 3 — SUCCESS (show as third inset frame, labeled "Step 3"):
Centered: ✓ checkmark in 80x80px circle #E7F7EF, icon #17864D.
"Na-verify na!" Title 16px/700 #17864D centered, 12px top.
"Juan dela Cruz — PSN: ••••••••1234"
Body 14px #1A2433 centered, 8px top.
Full-width button: "Buksan ang Aking Profile →"
#17864D fill, 12px radius, 48px tall, white label.

════════════════════════════════════════════════
SCREEN 14 — eCitizenPH TAB (POST-VERIFICATION / MAIN VIEW)
════════════════════════════════════════════════

Background #F5F7FA. Shared header + Digital ID strip (now visible).

FEATURE BANNER (same as Screen 12 but updated):
Same white card, 20px radius. No lock. Instead of gate copy,
show: "Kumusta, Juan! Nahanap namin ang 8 programa para sa iyo."
Body 14px #667085. Right side: refresh icon 20px #98A2B3.

CITIZEN PROFILE FORM (24px top, 16px margin):
Section eyebrow: "CITIZEN PROFILE" uppercase 11px/600 #98A2B3

White card, 20px radius, standard shadow, 16px padding.

FIELD 1 — Age:
Label: "Edad" 13px/600 #1A2433
Number stepper row (flex, space-between):
  − button: 32px circle #EAF1FA fill, #123C69 icon, 44px tap zone
  "34" Nunito ExtraBold 20px #1A2433 centered
  + button: same style
8px below field: 1px divider #E3E8EF

FIELD 2 — Region:
Label: "Rehiyon" 13px/600 #1A2433
Dropdown selector: white fill, 1px border #E3E8EF, 12px radius,
  44px tall, 16px padding.
  "Region III — Gitnang Luzon" 14px #1A2433 + › right #98A2B3
8px below: divider

FIELD 3 — Employment Status:
Label: "Katayuan sa Trabaho" 13px/600 #1A2433
Pill toggle grid (2 per row, 8px gap, auto-wrap):
"Employed" | "Self-employed"
"Estudyante" | "Walang Trabaho"
"Retirado" | "OFW"
Active pill: #123C69 fill, white Nunito SemiBold 13px, 12px radius.
Inactive pill: #F5F7FA fill, #667085 text, 1px border #E3E8EF.
"Employed" shown active.
8px below: divider

FIELD 4 — Monthly Income:
Label: "Buwanang Kita ng Pamilya" 13px/600 #1A2433
Dropdown: "₱15,000 – ₱24,999" 14px #1A2433
8px below: divider

FIELD 5 — Additional Checkboxes:
Label: "Karagdagang Impormasyon" 13px/600 #1A2433
2-column checkbox grid (8px gap):
☑ May anak sa paaralan    ☐ Solo Parent (RA 11861)
☑ PWD sa pamilya          ☐ Micro-entrepreneur
Checkbox: 20px square, 4px radius, #123C69 fill when checked,
  white checkmark, #E3E8EF border when unchecked.
Label text: 13px #1A2433, 8px left of label.

LIVE RECOMMENDATIONS FEED (24px top, 16px margin):
Section eyebrow row:
Left: "PARA SA IYO" uppercase 11px/600 #98A2B3
Right: "Na-update ngayon" Micro #98A2B3

CARD A — TOP MATCH — EXPANDED STATE:
White card, 20px radius, standard shadow.
4px left border #17864D (green — high match).
16px padding.

Top row:
Left: "DSWD 4Ps" Nunito ExtraBold 16px/700 #1A2433
Right: match badge — #E7F7EF fill, 12px radius,
  "97% Tugma" Nunito ExtraBold 18px #17864D,
  8px/12px padding — BOLD TYPOGRAPHY highlight

8px gap:
"Pantawid Pamilyang Pilipino Program"
Body 14px #667085

8px gap:
Agency pill: #EAF1FA fill, "DSWD" Nunito SemiBold 11px #123C69,
8px radius, 4px/8px padding.

12px gap — 1px divider #E3E8EF — 12px gap:

"Bakit inirerekumenda ito?" Nunito SemiBold 13px #1A2433

12px gap: (THE MOST POLISHED INTERACTION)
Checklist (8px gap between rows, each row flex):
✓ icon 16px #17864D + "Buwanang kita: ₱15k–₱24,999
  (nasa hangganan ng programa)" 13px #1A2433
✓ icon 16px #17864D + "May anak sa paaralan (kwalipikado)"
✓ icon 16px #17864D + "Rehiyon III (saklaw ng 4Ps)"
✗ icon 16px #98A2B3 + "Solo Parent (hindi na-check —
  hindi disqualifier)" 13px #98A2B3

12px gap:
"Alamin Pa →" button: #123C69 fill, 12px radius,
10px/16px padding, Nunito SemiBold 13px white.
Intrinsic width. Left-aligned. NOT full width.

"▲ Isara" Nunito Regular 12px #2E6FCC, right-aligned, 8px top.

CARD B — COLLAPSED STATE (12px top):
White card, 20px radius, standard shadow.
4px left border #17864D.
16px padding. Single row:
Left column: "PhilHealth Konsulta" 14px/600 #1A2433 /
  "PhilHealth" agency pill below (same style)
Right column: "89%" Nunito ExtraBold 20px #17864D /
  "Tugma" Caption #17864D / "▼ Palawakin" #2E6FCC 12px

CARD C — COLLAPSED (12px top):
4px left border #B77A12 (amber — medium match).
"DTI KMME" / "DTI" pill.
Right: "74%" Nunito ExtraBold 20px #B77A12 /
  "Tugma" Caption #B77A12 / "▼ Palawakin" #2E6FCC 12px

CARD D — COLLAPSED (12px top):
4px left border #B77A12.
"CHED Tulong Dunong" / "CHED" pill.
Right: "71%" #B77A12 / "Tugma" / "▼ Palawakin"

CARD E — COLLAPSED (12px top):
4px left border #667085 (lower match, gray).
"DOLE TUPAD" / "DOLE" pill.
Right: "58%" Nunito ExtraBold 20px #667085 /
  "Tugma" Caption / "▼ Palawakin" #2E6FCC 12px

"Tingnan ang lahat ng rekomendasyon (8)"
Nunito SemiBold 14px #2E6FCC centered, 16px top.

════════════════════════════════════════════════
SCREEN 15 — FLOATING CHAT ASSISTANT
(Show as overlay panel on top of Screen 14)
════════════════════════════════════════════════

FLOATING TRIGGER BUTTON (fixed, 24px from content bottom,
24px from right edge, above bottom nav):
56x56px circle. #CE1126 fill. 2px white border ring.
Shadow 0 4px 16px rgba(0,0,0,0.20).
Icon: chat bubble with tiny sunburst emblem inside, white 24px.
Animated gold dot 8px #FCD116 top-right: pulses to signal
context-aware suggestions are ready.

CHAT PANEL (bottom sheet, slides up):
390px wide, 480px tall, white #FFFFFF fill.
24px radius top-left and top-right corners only.
Shadow 0 -4px 24px rgba(0,0,0,0.12).

Panel header (16px padding, flex