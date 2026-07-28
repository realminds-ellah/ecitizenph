Build a mobile-first web app that recreates the structure and navigation
pattern of the Philippine eGov PH Super App, with a new feature called
"eCitizenPH" integrated as a native section — not a separate app or plugin.
This is a hackathon demo prototype. Use an original sunburst emblem in navy
(#0038A8), red (#CE1126), and gold (#FCD116) as the app mark — inspired by
the Philippine flag, not a reproduction of any official government logo.
APP STRUCTURE (mirror the real app's actual navigation pattern):
Top header: app name, a virtual ID card strip showing a mock verified
Digital ID (name placeholder, photo circle, "Verified" badge) — this only
appears after the user completes the simulated verification step
Bottom tab bar with sections modeled on the real app's structure: Home,
Government Services, eCitizenPH, Health, Profile
Home tab: search bar at top, then a grid of NGA (National Government
Agency) tiles and LGU (Local Government Unit) tiles, generic icons,
card-based layout, navy/white/gold color scheme
Government Services tab: list layout for things like NBI clearance
appointment, National ID reissuance request, civil registry document
requests (birth certificate, cert of no marriage) — simple list rows
with chevron arrows, no need for full functionality, just realistic
structure
Health tab: list of nearby facilities placeholder with a map-style
card, "get directions" button (non-functional is fine)
eCitizenPH TAB (this is the feature to build in full depth — everything
else above is just enough scaffolding to make it feel native):
Header banner: "eCitizenPH — Your Intelligence Layer" with one line:
proactively recommends services instead of waiting for you to search.
"Your Citizen Profile" form: age, region, employment status (employed /
self-employed / student / unemployed / retired / OFW), monthly household
income bracket, checkboxes for school-age dependents / solo parent / PWD
A LIVE "Recommended For You" feed below the form that recalculates
instantly on every field change — ranked by match %, 5-8 realistic
programs across agencies (DTI, DSWD, PhilHealth, CHED, DOLE, OSCA).
Each card expands to show "Why is this recommended?" — a checklist of
exactly which profile fields matched which rule. Make this expand
interaction the most polished part of the whole app.
Floating chat assistant button opening a panel with 2 dynamic quick-
question buttons based on the user's top recommendation, plus free text,
responding in Taglish and explicitly grounded in the user's profile and
matched programs — not generic answers.
A "Simulate National ID Verification" step (PSN entry + fake liveness
check animation) before the profile unlocks — clearly labeled simulated,
never implying it's a real identity check.
Design should feel confident and trustworthy like a real national government
app — clean cards, generous whitespace, no startup-y gradients or playful
illustrations. Add a small, permanent "Concept Prototype" label in the
header so it's never mistaken for the live app, even in a screenshot taken
out of context.
Gemini 3.6 FlashRan for 363s
summarize_autoAction historychevron_right
Here are key actions taken for the app:
editEdited 17 files
metadata.json
check_circle
package.json
check_circle
src/types.ts
check_circle
src/data/mockData.ts
check_circle
src/utils/recommendationEngine.ts
check_circle
src/components/SunburstLogo.tsx
check_circle
src/components/Header.tsx
check_circle
src/components/BottomNav.tsx
check_circle
src/components/tabs/HomeTab.tsx
check_circle
src/components/tabs/GovServicesTab.tsx
check_circle
src/components/tabs/HealthTab.tsx
check_circle
src/components/tabs/ProfileTab.tsx
check_circle
src/components/VerificationModal.tsx
check_circle
src/components/tabs/ECitizenPHTab.tsx
check_circle
src/components/FloatingChatAssistant.tsx
check_circle
server.ts
check_circle
src/App.tsx
check_circle
buildBuilt
I have built the mobile-first eGov PH Super App prototype featuring the native eCitizenPH proactive AI intelligence layer.
Key Implementation Highlights
Visual Identity & Brand Emblem: Designed a custom vector sunburst emblem in Navy (#0038A8), Crimson Red (#CE1126), and Gold (#FCD116) inspired by the Philippine flag. Included a permanent Concept Prototype label in the top header.
Header & Virtual Digital ID Strip: Displays the citizen's verified Digital PhilID badge (name, photo avatar, PSN snippet, and verified status) when simulated verification is active.
Navigation Structure:
Home: Top search bar, 10 National Government Agency (NGA) tiles, Local Government Unit (LGU) portals, and eCitizenPH feature callout.
Gov Services: Directory listing for NBI clearance appointments, PSA birth certificate requests, CENOMAR, and DFA passport renewals with chevrons and interactive application modals.
eCitizenPH (Deep Feature):
Header Banner: "eCitizenPH — Your Intelligence Layer".
Citizen Profile Form: Interactive controls for age, region, employment status, income bracket, and checkboxes for Solo Parent (RA 11861), PWD, school-age dependents, and micro-entrepreneurs.
LIVE "Recommended For You" Feed: Instantly recalculates match scores across DSWD 4Ps, Solo Parent benefits, PhilHealth Konsulta, DTI KMME, DOLE TUPAD, CHED TES, and OSCA pensions.
Polished Expand Interaction: "Why is this recommended?" checklist showing exact rule breakdowns (e.g. ✓ Monthly Household Income < ₱24,000, ✓ Solo Parent status checked).


Health: PhilHealth Konsulta coverage card, map-style card with nearby facilities, and route directions modal.
Profile: Digital PhilID details, privacy controls, and profile parameter resets.


Simulated PhilSys ID Verification: Step-by-step verification modal featuring PSN entry and an animated facial liveness scan.
Floating Taglish AI Assistant: Grounded in the citizen's specific profile and top recommended programs, offering dynamic quick-question pills and free-text support.
flagCheckpoint
Apply the "Bold Typography" design theme to the app.
Gemini 3.6 FlashRan for 99s
summarize_autoAction historychevron_right
Here are key actions taken for the app:
editEdited 5 files
src/components/Header.tsx
check_circle
src/components/BottomNav.tsx
check_circle
src/components/tabs/ECitizenPHTab.tsx
check_circle
src/components/FloatingChatAssistant.tsx
check_circle
src/components/tabs/HomeTab.tsx
check_circle
buildBuilt
I have applied the Bold Typography design theme to the eGov PH Super App:
Bold Typographic Hierarchy: Upgraded headers and navigation with high-contrast, black tracking font styles (eGovPH SUPER APP header, uppercase section eyebrow labels, and high-impact match scores).
Refined Header & Digital ID Strip: Applied a high-contrast white Digital ID card strip featuring a gold accent border (border-l-4 border-[#FCD116]), verified citizen indicator badge, and crisp profile details.
Punchy Recommendation Cards: Applied green left-accent borders (border-l-4 border-green-500) to high-match recommendation cards, bold badge tags, and styled action controls.
Cohesive Floating Assistant: Styled the floating eCitizen AI assistant trigger with a prominent red emblem button with a crisp white border ring and animated match indicator.
flagCheckpoint
