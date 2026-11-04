# Business web app design research (Pinterest, 2026-11-05)

134 references from 17 Pinterest searches, each viewed at 736px and zoomed where the layout was dense. Numbers in brackets point to rows of the References table at the end. Hex values were sampled by eye from screenshots, so they are approximate. Treat them as starting tokens, not brand specs.

**Before reading on:** Pinterest results converge. The same 10 to 15 Dribbble shots (Fintrinity [3], Saasfaco invoices [31], Taskplus [7], Leadwave [9], Findexa [11], Financia [44]) came back under 4 or 5 different queries. They are concept art: fake data, dark plus one neon, "Welcome back, Name", and an upgrade card in the sidebar. That is the template look to avoid. The references that look like shipped products are the most useful:

- Attio-style record [16]
- Acme finances pivot [43]
- Midday transactions [66]
- Beamline empty states [79]
- workflow runs with an error popover [112]
- Arto billing table [68]
- Roman Kamushken orders [72]

Take structure from those and color from a direction below.

---

## Directions

Each rebuilt app picks exactly one direction from its domain and the density its users need. Two apps in the same portfolio do not share a direction unless they are the same product family. Write the choice at the top of the app's DESIGN.md and do not mix tokens across directions.

Quick pick:

| Domain | Direction |
|---|---|
| Data-heavy daily tool | D1 or D4 |
| Relationship or reading tool | D2 |
| Money and paperwork for small business | D3 |
| Friendly SMB or education tool | D5 |
| Ambient or premium display | D6 |

### D1 Ledger: dense dark analytical
- **Fits:** ops consoles, monitoring, logistics, treasury, support SLA, internal data tools. Used all day.
- **Refs:** Elford [91][93], funnel overview [92], Midday [66], server table [69], Programa [95], Kravio [2].
- **Palette:**
  - Base: bg `#0B0B0C`, surface `#141416`, raised `#1C1C1F`, border `#26262A` (1px, never lighter than `#2E2E33`).
  - Text: `#EDEDED` / `#9A9AA0` / `#62626A`.
  - Charts in greyscale (`#3A3A40` to `#D8D8DC`). One "current/selected" signal: white, or one accent such as `#4C8DFF`.
  - Semantic colors only as dots or text: green `#3FB950`, red `#F85149`, amber `#D29922`.
- **Type:** Inter or Geist 13px base, labels 11px. Numbers in Geist Mono or JetBrains Mono. KPI 24 to 28px weight 500. Page title 18px weight 600.
- **Radius:** 6px controls, 8px panels.
- **Density:** 32px rows, 12px cell x-padding, 16px panel padding, 12px gaps.
- **Signature:** KPIs as bare numbers without card chrome [91]. Hatched fills for remaining or forecast [93]. Weekday-by-hour heat grid in grey intensity [92].

### D2 Paper: airy light editorial
- **Fits:** CRM, agency or consulting tools, HR, docs and knowledge bases, client portals. Low data volume, lots of reading.
- **Refs:** Attio-style record [16], Lunor [82], Docs [84], Teams [109], Pluuto profile [19], Collision Risk [100].
- **Palette:**
  - bg `#FFFFFF`, canvas `#F7F7F5`, border `#EAEAEA`.
  - Text: `#111111` / `#6B6B6B` / `#A3A3A3`.
  - Primary action near-black `#111`. One accent for links and focus, cobalt `#2747F5` or violet. No gradients.
- **Type:**
  - Page title 40 to 48px, weight 500, letter-spacing -0.02em [84][109].
  - Section 15px weight 600, body 14px, meta 12px.
  - Optional serif display (Instrument Serif, Newsreader) for page titles and record names only [94].
- **Radius:** 8px controls, 12px cards.
- **Density:** 44px rows, 24px card padding, 32px section gaps.
- **Signature:** a large title with plenty of air. "This period vs last" drawn as a solid vs a dashed black line [82]. Record pages that read like documents.

### D3 Counting house: warm neutral finance
- **Fits:** invoicing, accounting, bookkeeping, legal, food and hospitality inventory, family-business ERP.
- **Refs:** Bakker's Inn [130], lawyers platform [132], Autumn [4], InvestIQ [134], Oculis [133], construction studio [131].
- **Palette:**
  - Canvas sand `#F4F1EA`, surface `#FBFAF7`, border `#E4DED2`.
  - Text espresso `#2A2520` / `#7A7166` / `#A89F92`.
  - Accent rust `#C2410C` or burnt orange `#E2620B`.
  - One inverse card per screen in espresso `#2B211B` with cream text [132][134].
  - Positive values in olive `#4D7C0F`, not neon green.
- **Type:** grotesk 14px base. Tabular figures with locale formatting (`12.135,00` in fr/de [134]). Totals 32px weight 500.
- **Radius:** 10px controls, 16 to 20px cards.
- **Density:** 40px rows, 20px padding.
- **Signature:** waffle or dot-matrix charts in rust and beige [4][131]. Invoices shown as real paper previews.

### D4 Signal: monochrome plus one saturated accent
- **Fits:** developer tools, B2B SaaS admin, product analytics, AI or automation platforms, startup back offices.
- **Refs:** Pulse [101], Collision Risk [100], Beamline [26], Synetica [89], Financia [44].
- **Palette:**
  - Pure `#000` or `#FFF` base, greys only for structure.
  - ONE loud accent at full saturation: acid lime `#C6F432`, cobalt `#1F3BD6` or signal orange `#FF5A1F`. It covers at most 5% of the pixels.
  - Text on the accent: black on lime or orange, white on cobalt.
- **Type:** Geist or Inter Display. Hero metric 56 to 72px weight 300 to 400 [100]. Mono for IDs (`ENG-231`) [26].
- **Radius:** 4px controls and 8px cards, or 0 for a Swiss feel.
- **Density:** 36px rows.
- **Signature:** the accent marks only the single most important thing in a view: the selected bar, the AI insight card [101], or the active filter [44].

### D5 Atelier: soft tinted SaaS with a colored sidebar
- **Fits:** SMB tools, booking, education, field services, marketplaces. Non-technical users.
- **Refs:** Untitled UI sidebars [125][126], Zaga [107], Boltshift [90], Circlow [12], PixelStore [51], QuickSuite [30].
- **Palette:**
  - Saturated brand sidebar (`#2E5BFF` blue or `#4B2BD6` violet) with white text.
  - White content on a `#F5F6FA` canvas.
  - Status chips: tinted bg at 12% alpha with darker text.
  - One gradient allowed, on one hero element only (the project header [107] or the first KPI tile [90]).
- **Type:** 14px base, title 24px weight 600, KPI 28px.
- **Radius:** 10px controls, 14px cards, pill chips.
- **Density:** 44 to 48px rows.
- **Signature:** active nav items as lighter fills on the brand sidebar [125]. KPI icon squares tinted per metric [12][51].

### D6 Night shift: warm dark
- **Fits:** media, energy, smart buildings, premium finance, hospitality displays.
- **Refs:** smart home [127], brown finance [46], Finlo Flash [104], Fintrinity [3].
- **Palette:**
  - bg `#14110F`, surface `#1E1A17`, border `#2E2824`.
  - Text `#F2ECE6` / `#A39A91`.
  - Accent copper `#F26A1B` with a soft glow, on one chart series and one hero tile.
- **Type:** large light numerals (64px weight 300) with 12px units [127].
- **Radius:** 16px cards.
- **Density:** low, bento tiles.
- **Signature:** one metric per tile, each with its own D/W/M segmented control [127].

---

## Rules by category

### 1. Layout archetypes per screen type

**Record detail (contact, company, deal, ticket)** [16][17][20][105][106][107]
1. **Three zones.** A header band holds the avatar or logo (40 to 56px), the name (24 to 28px), one meta line with icons, and 3 to 5 icon quick actions. Below it sit a left properties column (280 to 340px) and a main column with tabs. An optional 280px right rail lists associated companies, deals and tickets [20].
2. **Properties in read mode** are label/value rows: label 12px tertiary in a fixed 120px column, value 14px, 32 to 36px per row, editable inline on hover. Never show stacked full-width inputs in read mode [16][61].
3. **Facts strip.** 3 or 4 numbers sit directly under the header, for example `Tickets 16 / Overdue 4 / Avg response 25:00` plus an "On track" chip [106][107].
4. **Tabs** run Overview, Activity, then domain tabs, each with a count ("Emails 217") [16].
5. **Pipeline position** is a chevron or segmented stage path at the top: current stage filled, done stages tinted, future stages outlined [17][24].
6. **Opened from a list**, the record is a side sheet of 45 to 70% width with "n of N", prev/next arrows and "Open full page" [16][17][105].

**List / table** [1][43][53][66][68][72]
1. **Header stack.** Title and primary action on one row. Below it a toolbar: search on the left; filters, view switch and columns on the right. Below that, status tabs with counts (`All 125 / Draft 2 / Past due 15`) [68][72].
2. **Applied filters** show as removable chips under the toolbar, followed by "Clear filters" [43].
3. **Selecting rows** shows a floating bulk-action bar centered at the bottom: a dark 40px pill with icon actions. It never pushes the layout down [1][43][53].
4. **Identifier column** comes first, in weight 500. Amounts are right-aligned with tabular numerals, and the currency code follows in tertiary color [66][68].
5. **People and products** use a two-line cell (14px primary, 12px secondary) with a 24 to 32px avatar or thumbnail [48][64].
6. **Paging.** Pages sit bottom-right, "1-10 of 350" bottom-left, plus a rows-per-page select. "Load more" is fine for feeds [67][68].
7. **Whole-row tint** marks exceptions only (out of stock, failed, paused), at 6 to 8% alpha of the semantic color [1][51][69].
8. **Expandable rows** for parent/child data (an order and its lines, a person and salary components) [43][52].

**Document with lines (invoice, quote, estimate, PO)** [29][31]-[39]
1. **Split editor.** Form on the left (55 to 60%), sticky live paper preview on the right (40 to 45%), with a "Show preview" toggle [33][34][38].
2. **Line items grid:** description (optional 2nd line), qty, unit price, tax %, right-aligned amount, row menu. "+ Add item" is a text button under the last line [32][38].
3. **Totals block** is right-aligned and 280 to 320px wide. Subtotal, discount and tax are 14px. The total is 18 to 20px weight 600 above a 1px rule [32][35].
4. **Long estimates** collapse into sections (Demolition, Plumbing...), each with a subtotal [29].
5. **Detail view:**
   - status chip with an age ("Overdue 58 days") next to the document number;
   - a money-facts row;
   - Payments and Credit notes sub-lists with "+ Add";
   - the PDF preview on the right [37].
6. **Actions.** "Save as draft" (secondary) and "Send" (primary) top-right. Preview, Download and Duplicate go in a menu [33][34].

**Dashboard** [2][4][12][82][91][101]
1. **KPI row:** at most 4 KPIs. Each has a 12px label, a 24 to 32px value and a delta chip (arrow + % + "vs last month") [12][82].
2. **Hero chart** spans 2/3 of the width. The remaining 1/3 holds a feed (activity, latest updates) or a breakdown [2][12].
3. **First screen:** 7 widgets at most. The rest go behind tabs or "View all".
4. **Insight card:** at most one widget is a sentence in 18 to 20px ("Unused budget runway improved by 3.5% this month") [91][101].
5. **Greetings** ("Welcome back, Name") only when the line also says something actionable ("4 tasks due today, 2 overdue") [7]. Otherwise use the page name.

**Settings** [55]-[62]
1. **Row layout.** Label and helper text on the left (30 to 35%, max 280px), controls on the right (max 480px). Rows are separated by 1px rules, not one card per row [55][61].
2. **Navigation:** a secondary text nav (180 to 220px) grouped by Workspace / Account / Team, or underline tabs when there are 8 sections or fewer [55][56][58].
3. **Company data** is in read mode: value plus "Edit", and inputs only on demand [61].
4. **Plans** are 3 cards, the current one outlined 2px in the text color. Payment methods show masked numbers, plus a dashed "Add" tile [57].
5. **Notifications** are a matrix: one row per event, channel toggles (Push / Email / SMS) on the right [59].
6. **Saving** happens in a sticky bottom bar (Cancel + Save) that appears only when something changed. Not a lone centered button [56].

**Forms and wizards** [96][114][116][119]
1. **Wizards:**
   - left vertical stepper: done = check, current = filled dot, pending = outline;
   - one question per step as a 24px heading;
   - Back + Continue bottom-right, "Save and close" bottom-left [116][119].
2. **2 to 6 options** are selectable cards (icon + title + one line). The selected card gets a 1.5 to 2px border in the text color and a check [96][116].
3. **Two-column grids** only for short related fields (first/last name, city/zip). Long fields span the full width [119].
4. **Builder forms** get a sticky right summary card (name, template, counts, status) with Publish and Cancel [114].
5. **Sign-up** pairs the form with real product UI or a customer quote, never abstract gradient art alone [115].

### 2. Navigation
1. **Sidebar:** 232 to 256px expanded, 56 to 64px collapsed, collapse control on the sidebar edge [122][123].
2. **Top of sidebar:** workspace/account switcher (24px logo + name + chevron), then search with a visible `Cmd K` hint [121][125][133].
3. **Groups:**
   - 11px uppercase or small-caps labels, at most 7 items per group;
   - items 32px tall (dense) to 36px;
   - 16px line icons with a 1.5px stroke [121].
4. **Active item:** a filled pill in the canvas-contrast color (white on warm grey [133], `#1C1C1F` on dark) and weight 500. No left accent bar. Colored fills only in D5.
5. **Sidebar footer:** user or org card plus usage meters ("80% credits used" ring [59]), not "Upgrade to Pro" promo art.
6. **Five sections or fewer:** a top nav with a pill active state works [34][40][89].
7. **Breadcrumbs** on record and settings pages only [49][106].

### 3. Color systems

**Light**
1. **Three neutral layers:** canvas (`#F5F6FA` to `#F7F7F5`), surface `#FFFFFF`, inset `#FAFAFA`. Separate with a 1px border OR a faint shadow (`0 1px 2px rgba(0,0,0,.04)`), never both at full strength.
2. **Primary button** is near-black in D2, D3 and D4, and brand-colored only in D5.
3. **Status chips:**
   - bg at 10 to 14% of the hue, text at 60 to 70% darkness;
   - 12px weight 500, 20 to 22px tall;
   - fully rounded or 6px radius.

**Dark**
1. **No pure `#000`** under content. bg `#0B0B0C` to `#111113`. Surfaces are 4 to 6% lighter, borders about 10% lighter. Warm dark (D6) shifts the hue to 25 to 30 degrees.
2. **Charts** are greyscale with ONE highlighted element in white or the accent [2][3][86][101].
3. **Saturation:** one saturated hero element per screen at most. A second filled colored card is a defect [3][44].

**Both**
- One brand accent, 3 semantic hues (success, warning, danger) and 1 info hue.
- Chart category colors come from a defined, ordered list. A direction may make that list shades of one hue.

### 4. Typography scales
1. **Base size:** 14px in D2, D3 and D5; 13px in D1 and D4. Line-height 1.45 for body text, 1.2 for numbers.
2. **Scale:** 6 steps at most (11 / 12 / 14 / 16 / 20 / 28). Display sizes (40 to 72px) only for D2 page titles and D4/D6 hero metrics.
3. **Numerals:** every number in tables, KPIs and totals uses `font-variant-numeric: tabular-nums`. IDs and code use mono [26][66].
4. **Currency:** the symbol at 60 to 70% size or superscript. The code follows in tertiary color [9][31][68].
5. **Weights:** 400 body, 500 values and active nav, 600 titles. 700 and above only for a D4 hero.
6. **Case:** sentence case everywhere. Uppercase only for 10 to 11px group labels, tracked +0.04em [49].

### 5. Data visualization
1. **One hero chart per dashboard.** Pick the type by question:
   - trend: line or area;
   - comparison: bars;
   - composition: stacked bar, 4 segments at most;
   - time pattern: heat grid [4][92][99].
2. **Highlight one:** neutral bars, with the current or selected bar in the accent and a dark tooltip pill showing value and date [2][3][86][90].
3. **Period comparison:** solid vs dashed lines in the same color, not two hues [82].
4. **Forecast or remainder:** hatched or striped fill, not a lighter tint [88][93][131].
5. **Funnels:** stepped bands, or a line along a stage axis, with conversion % pills between steps [12][92].
6. **Gridlines:**
   - horizontal only, 1px at 6 to 8% contrast;
   - 4 to 5 ticks;
   - 11px tertiary axis labels;
   - no chart borders, no 3D.
7. **KPI sparklines:** 64 to 80px wide, 24px tall, no axes [2].
8. **4 categories or fewer:** an 8px stacked bar with legend dots instead of a donut [4][44][110].

### 6. Status and badges
1. **Closed status lists.** Each entity type has a fixed list with a fixed hue per state (Invoice: Draft, Sent, Partially paid, Paid, Overdue, Void). The list is written in DESIGN.md [68][72].
2. **Shapes by meaning:** tinted pill for workflow state, dot + text for live health (Active, Paused), outlined chip for categories and tags [26][67].
3. **Statuses that depend on time show the age**: "Overdue 58 days", "Last activity 2 Jan" [17][37].
4. **Count badges** are 18px tall, 11px weight 500, neutral by default, and colored only for alerts [122][125].
5. **Priority** uses icon plus text, never color alone [2][106].
6. **Delta chips:** arrow + % + period ("+12% vs last week"). Green or red applies to the arrow and the % only [5][12].

### 7. Empty, loading and error states
1. **Four states per collection:**
   - no data yet: Create + "Use a sample" or "Import";
   - no results: quote the query, show the active filter chips and Clear;
   - failed to load: Retry + Contact support + a copyable error ID;
   - no access: name the person who can grant it [75][79].
2. **Real chrome stays.** The empty state sits inside the real page: toolbar, tabs and disabled filters remain visible [73][77].
3. **Visuals:**
   - a 32 to 40px icon in a bordered square, or ghost skeleton rows at 20 to 30% opacity;
   - illustrations 160px tall at most;
   - one illustration style per app [74][78][79][81].
4. **Copy:**
   - title 16px weight 600, naming what is missing;
   - one 14px line on why it matters or what to do;
   - 2 buttons at most.
5. **Loading:** skeletons that match the final row heights and column widths. No full-page spinner after the first paint.
6. **Failed rows:** red status plus a monospaced error. Hover shows a popover with a stack excerpt and "Re-run" [112].

### 8. Micro-interactions
1. **Row hover:** background +3% contrast. When a row has 3 or more actions, they stay hidden and fade in on the right [71].
2. **Kanban drag:** the card lifts with a shadow and rotates 2 to 3 degrees. The target column shows a dashed drop zone [10][22].
3. **WIP limits:** the column header shows "3/5" and turns red when exceeded [26].
4. **Chart tooltip:** a dark pill with value and date, following a vertical hairline [5][9].
5. **Focus:**
   - 2px ring in the accent with a 2px offset;
   - inputs change border color on focus, with no glow [118][119].
6. **Toasts:** bottom-right, with Undo after destructive actions. Confirmation modals only for irreversible deletes.
7. **Timing:**
   - 120 to 160ms for hover and press;
   - 200 to 240ms for sheets and drawers;
   - ease-out, no bounce.

---

## Avoid (marks of generic or AI-made screens)

1. **Fake hello headers.** "Welcome back, John" plus a waving-hand emoji, with nothing actionable under it. Very common in the concept shots [7][11][31].
2. **Upgrade-to-Pro cards** with 3D art at the bottom of the sidebar in an internal business app [3][7][11]. Show real usage or quota instead.
3. **Uniform KPI cards.** Four identical cards (icon top-left, number, green "+12%") as the only top-of-page idea. Vary them: bare numbers [91], one inverse card [132], a facts strip on records [106].
4. **Two saturated filled cards** on one screen, or gradient fills on more than one element [3][90].
5. **Neon on black** (lime or green) applied to every chart series. The accent goes on one element.
6. **Rainbow statuses.** More than 5 status hues in one table. Six hues in [72] is already the ceiling.
7. **Purple-to-blue gradients**, glassmorphism and glow on data surfaces. Reserve glow for D6 hero tiles only.
8. **Donuts with 6+ slices**, 3D bars, and charts with both gridlines and borders.
9. **Centered lone green "Save changes"** at the bottom of a long settings page [56].
10. **Text-link actions** ("View Edit Delete") repeated on every row. Use an icon menu or hover actions [71].
11. **Mixed radii** (4px buttons with 24px cards) and drop shadows on every card. Pick one radius pair per direction.
12. **Emoji in UI copy**, and placeholder names (John Doe, Acme) leaking into empty states.
13. **Display or bold type** (700+) for body numbers, and uppercase on buttons.
14. **Mock data at pixel-perfect round numbers** ($19,270.56 repeated across 3 KPIs [44]). Seed realistic, varied data so layouts are tested against real lengths.
15. **Same shell for every app.** Every rebuild must change at least the sidebar treatment (white / brand-color / dark / warm grey [126][133]), the base radius and the type scale to its direction.

---

## References

Pin URLs are the canonical Pinterest pin pages. Titles are the pin title when Pinterest showed one, otherwise a short description of the image.

| # | Title / description | Pin URL | Search | What to take |
|---|---|---|---|---|
| 1 | Userflow product inventory table | https://www.pinterest.com/pin/551761391868715750/ | crm dashboard ui | Light: 4-stat strip above table with green delta pills; status pills (In stock/Out of stock/Restock) soft tints; floating bulk-action bar at bottom on row select; black primary button; rows-per-page + numbered pagination |
| 2 | Kravio support dashboard (dark) | https://www.pinterest.com/pin/350577152263606612/ | crm dashboard ui | Near-black; 3 KPI cards with inline sparklines; bar chart with one highlighted white bar, rest grey; right rail activity feed; SLA table with priority icons |
| 3 | Fintrinity finance dashboard (dark/orange) | https://www.pinterest.com/pin/1113515076646800317/ | crm dashboard ui | Only ONE card filled with orange gradient (hero balance), others dark; single highlighted orange bar in cash-flow chart; upgrade card pinned at sidebar bottom |
| 4 | Autumn - CRM (Barly) | https://www.pinterest.com/pin/832954893628949255/ | crm dashboard ui | Warm light: dot/waffle bar chart orange+grey; KPI row doubles as chart tabs under the chart; 3-color stacked progress bar for breakdown; monospace numerals |
| 5 | Dark CRM dashboard (leads/conversion) | https://www.pinterest.com/pin/350577152266452519/ | crm dashboard ui | KPI cards with colored dot delta pills; monochrome grey area chart with date pill on x-axis; 'What's new' changelog block in sidebar |
| 6 | Mervo dashboard mockup | https://www.pinterest.com/pin/996491855072857367/ | crm dashboard ui | Light: dot-matrix heatmap orange-red; small purple bar sparkline in KPI; recent transactions table |
| 7 | Taskplus project dashboard (dark) | https://www.pinterest.com/pin/1111404014318352227/ | crm dashboard ui | Dark grey (not black) cards; KPI tiles with tiny file icons; task table with colored project tag chips; bar chart with % labels under bars |
| 8 | Sales analysis (dark + neon green) | https://www.pinterest.com/pin/4607886180725444480/ | crm dashboard ui | Single neon-green accent on black; funnel chart with glowing crosshair point; big $ figures 32px+ |
| 9 | Leadwave Reports (dark CRM) | https://www.pinterest.com/pin/583568064247126262/ | crm dashboard ui | Big total revenue $1,856,231,212 with superscript $; teal line chart with tooltip; sidebar 'Favorites' with star icons and colored list dots |
| 10 | SaaS CRM Dashboard - Deals (kanban) | https://www.pinterest.com/pin/1128714725395529231/ | crm dashboard ui | Dark kanban: column headers with stage icon + total value; compact cards (name, date, amount); dragged card tilted with shadow |
| 11 | Findexa finance (dark) | https://www.pinterest.com/pin/350577152265320580/ | crm dashboard ui | Blue accent single color; currency flag cards; one highlighted bar with tooltip; status 'Success' green pills in transaction table |
| 12 | Circlow CRM dashboard (light/orange) | https://www.pinterest.com/pin/1138425612104235423/ | crm dashboard ui | White on light grey; 4 KPI cards with tinted icon squares and deltas; sales pipeline line chart along stage axis (Lead>Qualified>Proposal>Negotiation>Closed); right recent activity with avatars; contacts table below |
| 13 | Syncra - CRM Profile Dashboard UI | https://www.pinterest.com/pin/1144266217849561525/ | crm customer profile ui | Gradient cover banner + overlapping 80px avatar; 4 stat counters in a row under header; projects table left, notification/security toggles right |
| 14 | Team member profile (Figura-like) | https://www.pinterest.com/pin/350577152264083501/ | crm customer profile ui | Tabs as browser-style chips at top (record tabs); breadcrumb Team > Leadership > name; 28px name + domain/email meta with icons; underline tabs Profile/Activity/Projects |
| 15 | SETO AI workspace (Welcome, Allison) | https://www.pinterest.com/pin/1070027192745835902/ | crm customer profile ui | Centered greeting with 3 action cards; right rail chat history list with thumbnails; soft peach gradient only at bottom edge |
| 16 | Profile page (Attio-style record) | https://www.pinterest.com/pin/890235051354016158/ | crm customer profile ui | Record as side sheet: '1,538 of 59,273' prev/next pager; left column key-value details with 16px icons + AI badge on field; right tabs Overview/Activity/Emails 217; Highlights cards (summary, upcoming event with date tile) |
| 17 | Kirrivan CRM Design - Lead Preview | https://www.pinterest.com/pin/1136384918506097635/ | crm customer profile ui | Kanban of leads behind a right-side drawer (~45% width) 'Lead preview' with 'View full details'; 4-col key facts row; segmented stage stepper (New>Open>In progress>Open deal>Closed) with current step filled green; activity + notes |
| 18 | Constructor UI Kit (dark user grid) | https://www.pinterest.com/pin/518054763410738737/ | crm customer profile ui | Dark people grid cards with avatar, name, role; quiet card borders; pagination dots |
| 19 | Pluuto product - contact profile (Are.na) | https://www.pinterest.com/pin/574983077448303071/ | crm customer profile ui | Ultra-minimal: tiny 13px type, black pill 'Review' button, 4 meta tiles (Latest deal, Anniversary, Manager, Last reply) with icons; lots of whitespace |
| 20 | Contact record with notes (3-column) | https://www.pinterest.com/pin/583638433003729585/ | crm customer profile ui | 3 columns: left contact facts (label above value), center tabs Activity/Notes/Emails/Calls/Tasks/Meetings with rich-text note composer, right rail associated Companies/Deals/Tickets collapsible |
| 21 | CRM panel UX/UI design (dark) | https://www.pinterest.com/pin/1015280309747190715/ | crm customer profile ui | Pastel-colored stat cards (blue/orange/yellow/green) on dark for order statuses; blue bar chart; donut by category |
| 22 | Compliance Task Board (Kanban UI) - Prakash Ghodke | https://www.pinterest.com/pin/1104718983623249777/ | sales pipeline kanban ui | Light kanban, column header = colored top border 2px + count; cards white 1px border, meta row of tiny icons (date, comments, attachments) + avatar; dragged card rotated ~3deg with shadow |
| 23 | CRM Deals Pipeline Kanban Board (CloseCRM) | https://www.pinterest.com/pin/1151443829803238877/ | sales pipeline kanban ui | Left filter panel (collapsible facet groups: Ownership, Time, Financial, Location) next to kanban; column header pill tinted per stage; card = label/value stacks (Company, Creator, Pipeline, Amount, Est. close date) |
| 24 | Deals pipeline + deal drawer (Ahmad Fawaid) | https://www.pinterest.com/pin/203858320627527593/ | sales pipeline kanban ui | Deal opens as wide right panel over dimmed pipeline; chevron stage path (New lead>Request>In draft>Proposal sent>Approved>Rejected) with current stage teal; left summary column (amount card, contact details, salesperson), right tabs Activity/Appointments/Proposals/Invoices; 'Hot lead' 'Repeat' tags |
| 25 | Zylker pipeline (dark) | https://www.pinterest.com/pin/572379433900634522/ | sales pipeline kanban ui | Top-nav app (no sidebar); stage headers as colored capsules; cards with status chip + progress bar + avatar stack |
| 26 | Beamline kanban with WIP limits | https://www.pinterest.com/pin/1140958886884787346/ | sales pipeline kanban ui | Dark mono: column header 'Todo 3/5' WIP counter, over-limit column turns red border; ticket IDs in monospace (ENG-231); labels as outlined chips |
| 27 | Leads pipeline with stage timeline | https://www.pinterest.com/pin/865254147162447595/ | sales pipeline kanban ui | Stage headers connected by a horizontal progress line with dots showing totals per stage ($ and count); colored corner triangle on card for temperature |
| 28 | Turbo customer stories roadmap (dark) | https://www.pinterest.com/pin/907264287474024714/ | sales pipeline kanban ui | Timeline/gantt with dependency curves between bars; bar colors by team (purple/blue/red); month grid lines very faint |
| 29 | Lead Pipeline > Estimate (Halal construction) | https://www.pinterest.com/pin/321163017196097634/ | sales pipeline kanban ui | Document-style estimate: company/customer info 2 columns, collapsible line-item groups (Demolition, Plumbing, Electrical) with labor/material counts, right-aligned totals, footer totals row (subtotal, tax, gross profit, margin) |
| 30 | SaaS CRM Lead Pipeline (QuickSuite / Pills Design) | https://www.pinterest.com/pin/1151584567295927521/ | sales pipeline kanban ui | Light kanban on soft blue gradient backdrop; column header with colored dot + count; contact cards (avatar, name, time ago, email, phone); view toggle list/board top right |
| 31 | Saasfaco Invoices (dark + lime) | https://www.pinterest.com/pin/1096485840541234713/ | invoice web app ui | Dark rounded shell, lime #C6F432-like accent used only for active filter + 'Unpaid' highlight; big 32px money figures with small currency; avatar groups per bucket; selected invoice expands into inline detail card |
| 32 | Invoice UI Design (Maglo) | https://www.pinterest.com/pin/1072419730022744651/ | invoice web app ui | 3-pane: sidebar / invoice document center with black header band / right client details + 'Send invoice' lime CTA + Preview/Download secondary; line items with Add item link; subtotal/discount/tax right-aligned |
| 33 | Invoice Maker Dashboard (Createrif) | https://www.pinterest.com/pin/1090715603519092066/ | invoice web app ui | Split: form left (Standard/Split/Recurring segmented), live A4 preview right with 'Show preview' toggle; Save as draft + Send invoice in top right; line item mini-forms (qty/tax/amount) |
| 34 | Create Invoice Experience - Minimal Finance SaaS | https://www.pinterest.com/pin/967288826234635927/ | invoice web app ui | Top-nav app with pill active tab (black); 'Create New Invoice' 32px title with back link; left form, right sticky preview card at ~40% width; Save as draft ghost + Send invoice black |
| 35 | Invoice document (editorial) | https://www.pinterest.com/pin/350577152265320596/ | invoice web app ui | Invoice as editorial page: landscape photo header, giant 64px 'INVOICE' wordmark, 3-col From/Bill to/Dates block, thin rules; floating bottom dock toolbar; 'Pending' status chip in top bar |
| 36 | Invoice generator app interface | https://www.pinterest.com/pin/1089026753667457283/ | invoice web app ui | Modal-like card: compact form left, receipt-style thermal preview right; single blue CTA |
| 37 | Invoice Detail UI - Muhammad Salim | https://www.pinterest.com/pin/159948224260274296/ | invoice web app ui | Detail page: tabs Invoice/History/Notes; 'Overdue 58 days' red chip; 4 money facts row (Total, Open amount, VAT, ...); Payments + Credit note sections with '+ Add' outlined orange buttons; PDF preview on right; 'Mark as paid' + 'Send' orange |
| 38 | Invoice Maker Dashboard (Cansaas) | https://www.pinterest.com/pin/1087408272565438075/ | invoice web app ui | Form left with line items table (icon per item), preview right with black table header band and orange total; 'Save and Send to Customer' split button; scenic photo backdrop only on the mock, not the UI |
| 39 | Feinmond invoice management (uinspo) | https://www.pinterest.com/pin/123989795985377005/ | invoice web app ui | Two KPI tiles (Total invoice $17,892 / Paid $13,451) with % chips; underline-only inputs in create form; table of invoice numbers in blue link color |
| 40 | Finosy finance dashboard (light + orange) | https://www.pinterest.com/pin/48695239716042903/ | accounting dashboard ui | Top-nav tabs with black pill active state; one orange-filled stat card among white ones; stacked bar chart black+orange; spending limit progress bar; payment cards as visual tiles |
| 41 | Finnhub - Fintech Dashboard (nijaworks) | https://www.pinterest.com/pin/606086062398731265/ | accounting dashboard ui | Dark with violet glow: 40px 'Welcome Back' heading, 32px balance, card rows with masked numbers; cash flow bars in violet gradient with up/down % inline colored |
| 42 | Financial analytics (dark, data viz) | https://www.pinterest.com/pin/1092052609672603471/ | accounting dashboard ui | Dark: candlestick-like bars grey with one pink/blue highlighted range; right column 3 totals with colored % chips; donut gauge 130 in pink; small multiples bottom row |
| 43 | Acme Corp Finances (budget spreadsheet) | https://www.pinterest.com/pin/300685712639902573/ | accounting dashboard ui | Light pivot table: month column groups (Actual/Budget/Delta) with group header row; grouped expandable rows (person > Base salary/Variable/Bonuses); applied filter chips row with 'Clear filters'; view switch People view/Financial view; floating black action dock (Download PDF / Apply tag / Start workflow) |
| 44 | Financia dashboard (dark + lime) | https://www.pinterest.com/pin/604045368811556648/ | accounting dashboard ui | Lime pill for active filter chip; barcode-like micro bar strips per category (Rent, Groceries, Debt) in distinct hues; segmented budget bar 50/30/20 with legend dots |
| 45 | Taskplus Finance Dashboard kanban (dark) | https://www.pinterest.com/pin/350577152262724212/ | accounting dashboard ui | Project page with view switch Kanban/List/Timeline; tiny priority + type tags on cards; footer meta row icons |
| 46 | Dark brown/orange finance dashboard | https://www.pinterest.com/pin/338755203244751485/ | accounting dashboard ui | Warm dark (brown-black) instead of blue-black; orange area chart with glow; promo card with photo; one green highlighted bar in investments chart |
| 47 | Inventory Management Software Design - Case Study | https://www.pinterest.com/pin/1036953882953460237/ | inventory management dashboard ui | Deep green brand: dark table with SKU, image thumb, category, QTY, warehouse, 'multiple 2' link for multi-location; action row (Actions / List on Marketplace / Add New) as outlined buttons with chevrons |
| 48 | Inventar - Inventory Management - Add Product | https://www.pinterest.com/pin/1107322627164514854/ | inventory management dashboard ui | Dark list rows with 40px product thumbs, 2-line cell (name bold + variant meta with 'In stock' red/green inline), price ranges; left facet panel with segmented status counts (All 1704 / Active / Inactive / Draft); Retail/Wholesale toggle; green 'Add product' CTA |
| 49 | Acme Corporation client details (dark HRM/CRM) | https://www.pinterest.com/pin/350577152264699969/ | inventory management dashboard ui | Record header with logo + industry subtitle; key facts as 6-col label/value row (uppercase 10px labels); document cards grid with metadata pairs and View/Download; sidebar sections with colored project dots |
| 50 | Store Inventory Dashboard (Quickli) | https://www.pinterest.com/pin/971933163327849293/ | inventory management dashboard ui | Product list as rich rows: thumb, name + rating, performance word (Excellent/Good) + mini gauge arc, stock, price; summary stats strip with icons above; sidebar categories with nested colored dots + count badges |
| 51 | PixelStore Product Management | https://www.pinterest.com/pin/935130310151553979/ | inventory management dashboard ui | Light orange accent: 4 KPI cards with colored icon squares; filter tabs with counts (All 250 / In stock / Out of stock / Low stock); Show statistics toggle; out-of-stock row tinted light red; rating stars column |
| 52 | Orders table with expandable line items | https://www.pinterest.com/pin/396598310955978466/ | inventory management dashboard ui | Order rows expand inline to show product thumbnails, SKU, bin location, on-hand qty; channel logo (Amazon/Shopify) column; status dots Pending/Fulfilled/Unfulfilled; navy rail sidebar icon-only |
| 53 | CRM Sales Dashboard - Inventory Page (Pickolab) | https://www.pinterest.com/pin/1087408272566461729/ | inventory management dashboard ui | Very dense light table: 25+ rows visible, thumbnails 24px, category gray chips; floating selection toolbar with 'Suggest with AI' violet action; 'AI Assistant NEW' in sidebar; trial progress card bottom |
| 54 | Inventory dashboard (dark bento, orange/blue) | https://www.pinterest.com/pin/1087408272565822350/ | inventory management dashboard ui | Bento: two saturated tiles (blue Orders, orange Stock) with 3D bars; world map logistics tile; product list with demand chips (High blue / Low orange) |
| 55 | Settings Page (SaaS Product) - Ofspace | https://www.pinterest.com/pin/133982157658090425/ | saas settings page ui | Settings as horizontal underline tabs (My details/Profile/Password/Team/Billing/Plan/Email/Notifications); each section = 2-col row: label+helper (left ~30%) / controls (right); billing history table with status pills Pending/Cancelled/Refund |
| 56 | S8 Figma System - Settings UI | https://www.pinterest.com/pin/1083326885401399364/ | saas settings page ui | Secondary text nav column inside settings (grouped anchors); notification toggles as 2-col grid of rows with icon + label + description + switch; green 'Save changes' centered at bottom |
| 57 | SaaS Settings Page (Dental Practice) | https://www.pinterest.com/pin/90775748734605407/ | saas settings page ui | 3-level nav: app sidebar > settings tree (expandable groups) > page tabs (Plan management/Plans and payment/Payment history); plan picker 3 cards with selected one outlined 2px dark; payment method card with masked number + 'Add payment method' dashed tile |
| 58 | Workspace settings (Linear-style dark) | https://www.pinterest.com/pin/569494315394155039/ | saas settings page ui | Dark settings: left grouped text nav (Workspace/Account/Teams) at 13px; 'Explore features' cards + integrations grid 4-col with logo, one-line description, 'Open' button; very low-contrast borders |
| 59 | Notifications settings - Untitled UI (Jordan Hughes) | https://www.pinterest.com/pin/1025694883863231948/ | saas settings page ui | Back to dashboard link; tabs; each row: title + description left column, Push/Email/SMS toggles stacked right; credit usage ring (80%) in sidebar footer |
| 60 | General settings (dark) | https://www.pinterest.com/pin/527836018843858711/ | saas settings page ui | Dark card-on-dark; right help column ('Need something else?' links); App appearance radio: Light/Dark/System |
| 61 | Company Settings - Finance & Banking product | https://www.pinterest.com/pin/245798092156150526/ | saas settings page ui | Read-mode settings: each field row label + helper left, value + 'Edit >' link right, separated by 1px rules; no inputs until editing; secondary settings nav with icons |
| 62 | Integrations settings - Untitled UI | https://www.pinterest.com/pin/1094796990704664416/ | saas settings page ui | Top-nav app; integrations category filter list left (View all/Developer tools/Communication...); 3-col integration cards with logo, toggle, description, 'View integration' footer link |
| 63 | Integration settings page UI (MadeinFigma) | https://www.pinterest.com/pin/1136314549765790530/ | saas settings page ui | Compact 4-col integration grid, enabled card gets blue 1px border + toggle on; logos at 16px; descriptions 3 lines max |
| 64 | Brightly attendance table (HR) | https://www.pinterest.com/pin/350577152264034118/ | data table ui design | 4 KPI cards row above table; clock-in/out cells with arrow and colored late times (orange); status pills On time/Late; 'Show 10 / per page' + pagination; avatar+name+email 2-line cell |
| 65 | Data Table UI Design Guide - Design Hires (Airtable-like dark) | https://www.pinterest.com/pin/873909502697422643/ | data table ui design | Database grid: column type icons in headers, colored select tags, checkbox column, star rating, inline date picker filter popover with operators (is before/is after/is empty); collections sidebar with emoji |
| 66 | Midday transactions (monospace) | https://www.pinterest.com/pin/338966309472719069/ | data table ui design | 'Ask Midday a question... Cmd K' command bar on top; table in monospace font, amounts right-aligned with sign (-$5.99 / +$10000), no row borders, generous 56px rows; icon rail sidebar |
| 67 | User Management Table (dark) | https://www.pinterest.com/pin/888898045208484686/ | data table ui design | View switch Table/Board/List; filter chips 'Role', '2FA Auth'; inline Edit/Delete ghost buttons per row; 'Enabled' olive tag; Rows per page + 1-10 of 350 rows |
| 68 | Arto+ Billing invoices table | https://www.pinterest.com/pin/660269995408994042/ | data table ui design | Status tabs with counts (All 125 / Draft 2 / Outstanding 13 / Past due 15 / Paid 100) as segmented control; amount column first with grey currency code suffix; Unpaid/Past due/Paid/Draft pills; 'Load more' centered instead of pagination |
| 69 | Server Management Table (Isaiah, dark) | https://www.pinterest.com/pin/1040190845210294998/ | data table ui design | Row index in large 01-05 numerals; flag + location; CPU as segmented bar meter + %; status rows tinted (paused amber, inactive red) on whole row background |
| 70 | Dark dashboard orange/green bars (Instagram) | https://www.pinterest.com/pin/860257966363014841/ | data table ui design | Paired bar chart orange vs green per day; KPI strip with colored deltas; 'top performers' row cards |
| 71 | 10 Design Tips for a Better Data Table (bad vs good) | https://www.pinterest.com/pin/632615078943151885/ | data table ui design | Good table: bold primary column, status as tinted pills not text, icon actions (view/edit/delete) instead of text links, bulk actions shown as chips above, count badges on tabs, lighter grid lines |
| 72 | Data Table - Roman Kamushken (Orders) | https://www.pinterest.com/pin/310748443050993879/ | data table ui design | Breadcrumb + 'Orders' title, toolbar search + 6 filter dropdowns + 'Saved filters (3)'; tabs All orders 24 / Pickups / Returns; status pills in 6 hues; 'Manage' + 'Actions v' per row; pagination top and bottom |
| 73 | Empty State & Navigation (kvnkld, built with Claude Code) | https://www.pinterest.com/pin/569494315407534819/ | empty state ui saas | Empty page keeps full chrome (toolbar, search, New Agent button); ghost skeleton cards at 20% opacity behind centered 'Build your AI workforce' title + 1 line + single dark CTA |
| 74 | Immobilis - empty state | https://www.pinterest.com/pin/788763322274366446/ | empty state ui saas | Stack of 3 placeholder list rows (icon + 2 grey bars), middle one elevated with shadow; faint grid background; title + one line + single orange CTA |
| 75 | Empty state - Untitled UI (No files found) | https://www.pinterest.com/pin/365706432260000650/ | empty state ui saas | Search-empty: quotes the query in copy ("FY2025-26" did not match); two actions Clear search (secondary) + New document (primary); faint grid pattern fading behind folder icon |
| 76 | ActiveCollab projects templates empty | https://www.pinterest.com/pin/4611052814931710272/ | empty state ui saas | Empty inside tab (Templates) with small 3D illustration, 2-line grey copy explaining why templates matter; floating action button |
| 77 | Ecommerce Dashboard Empty State (Rayno UI) | https://www.pinterest.com/pin/1131388737664443850/ | empty state ui saas | Empty inside a real toolbar (search, filter, view toggle still visible); Learn more (ghost) + New project (orange); onboarding 'Welcome' card in sidebar |
| 78 | No data yet (line illustration) | https://www.pinterest.com/pin/866380047090243445/ | empty state ui saas | Monochrome line illustration of filing cabinet; title 20px + 2 lines; black pill '+ Add Data' |
| 79 | 4 empty states every app needs (Beamline) | https://www.pinterest.com/pin/1140958886884707352/ | empty state ui saas | Taxonomy: No data yet (Create + 'Use a sample'), No results (active filter chips + Clear filters), Did not load (Retry + Contact support + copyable Error ID), No access (who to ask: names the admin); 16px icon in 32px bordered square |
| 80 | Empty state 01 (Upload doc) | https://www.pinterest.com/pin/1027454102503100021/ | empty state ui saas | Grey 3D-ish document illustration with smiley; coral rounded CTA with upload icon - friendly consumer tone |
| 81 | SaaS Empty State Illustrations - Minimal 3D (Zakoum) | https://www.pinterest.com/pin/1105774514794418192/ | empty state ui saas | Consistent 3D icon set dark grey + single green accent; one illustration language across all empty states |
| 82 | Lunor contracts dashboard | https://www.pinterest.com/pin/757589968609447601/ | light saas dashboard clean | Near-monochrome light: KPI tiles with grey mini illustrations, dashed vs solid black line chart (this vs last period, no color), recent contracts table, document cards with black 'Share' button; sidebar folders with black icons |
| 83 | Customer Success Dashboard (chapter24) | https://www.pinterest.com/pin/1145181011531893451/ | light saas dashboard clean | Customer overview: contact header + 3 big facts ($1,240 / 17 / '3 days ago'), activity timeline with colored dots per event type, order breakdown table; '+78% retention' plain-text KPI |
| 84 | Docs workspace (Courtney Henry) | https://www.pinterest.com/pin/350577152263499334/ | light saas dashboard clean | Notion-like: 48px 'Docs' title, 3-col doc cards with black glyph icons and 'Connect' ghost button, grey folder icons shortcut row, red dotted line chart; colored square project markers in sidebar |
| 85 | Student dashboard with AI assistant panel | https://www.pinterest.com/pin/350577152264873645/ | light saas dashboard clean | Persistent right AI assistant column ('How can I help you?') with chips + input; KPI progress bars with colored fill; calendar schedule cards with colored left labels |
| 86 | Modulix logistics dashboard | https://www.pinterest.com/pin/333829391151643569/ | light saas dashboard clean | Light grey canvas, white cards 12px radius; bar chart grey bars with one black highlighted + dark tooltip; KPI cards with green sparkline; nested sidebar subitems (Track deliveries > On progress/Delivered/Canceled/Pending) |
| 87 | Kravio support dashboard (light variant) | https://www.pinterest.com/pin/48695239716205842/ | light saas dashboard clean | Same layout as dark Kravio: proves a layout should ship both themes; highlighted single dark bar; SLA table with priority + status icons |
| 88 | Orvia web app overview (Juice Lab) | https://www.pinterest.com/pin/945052303078753289/ | light saas dashboard clean | 4 KPI cards each with semicircle gauge arc above value; revenue chart with hatched forecast area; bar-range chart with black floating markers; black active nav item |
| 89 | Synetica SaaS CRM - AI Finance Dashboard (RonDes) | https://www.pinterest.com/pin/394487248634943721/ | light saas dashboard clean | Top-nav pill tabs; 'Overview Panel' 40px light-weight title; mint-green glass AI insight cards floating ('automation boosted time savings to 48.3 hours'); gauge 71,74; numbers with comma decimals; right AI chat column |
| 90 | Boltshift Sales Overview | https://www.pinterest.com/pin/530932243594045345/ | light saas dashboard clean | One blue gradient-filled KPI tile, rest white; grey bars with blue highlighted month + tooltip; segmented radial gauge 70.8% in blue gradient steps |
| 91 | Elford LLC dashboard 'Good morning' (dark mono) | https://www.pinterest.com/pin/350577152266505780/ | dark admin dashboard minimal | Pure greyscale dark; 3 headline metrics as plain text (no cards) with colored dot deltas; radial tick-gauge for total revenue; 'AI insights' block with 20px sentence-style insight ('Unused budget runway improved by 3.5%'); date pill on chart x-axis |
| 92 | Overview funnel (dark mono) | https://www.pinterest.com/pin/350577152266452526/ | dark admin dashboard minimal | Funnel as stepped grey bands with % pills (100% > 53% > 23% > 8%); striped/hatched pie; heatmap 'Sales by hour' in grey intensity; empty team card with avatar cluster + 'Invite members' |
| 93 | Elford campaigns dashboard (dark mono) | https://www.pinterest.com/pin/350577152266452530/ | dark admin dashboard minimal | Stacked grey bars (today vs yesterday) with white top segments; 'Today's budget' card with '47% used' hatched progress; 'Customize' button per section; dense 11px labels |
| 94 | Students record (dark editorial) | https://www.pinterest.com/pin/449445237836433581/ | dark admin dashboard minimal | Serif display name on dark record page; goals cards with sliders; radar chart; skills table with colored small deltas |
| 95 | Programa reports (AI + spreadsheet, dark) | https://www.pinterest.com/pin/350577152266430540/ | dark admin dashboard minimal | Left: chat-style nav with 'Recent chats' list; main: spreadsheet grid with A/B/C columns, formula bar; mono numbers right-aligned |
| 96 | Onboarding steps UI design (Untitled UI) | https://www.pinterest.com/pin/449163762858764502/ | b2b app onboarding ui | Split card: left contact/support info column, right 'What do you need help with?' 2x3 selectable option cards (icon + title + sub), selected = 1.5px dark border + check; Go back ghost + Continue black |
| 97 | Polymet welcome onboarding | https://www.pinterest.com/pin/40743571624243738/ | b2b app onboarding ui | Welcome modal with left feature list (icon + title + 1 line), hovered item highlighted, right preview panel animates the selected feature; single orange 'Start designing' CTA; 'Academy' + 'Pricing' footer links |
| 98 | Greekflow onboarding (dark) | https://www.pinterest.com/pin/623396773458167221/ | b2b app onboarding ui | Left vertical stepper (Personal info > Organization details) with green checks on done; right form with selectable image cards for org type; Back + Continue blue bottom-right |
| 99 | Usage/billing overview (dark, blue) | https://www.pinterest.com/pin/350577152266601791/ | erp dashboard modern | 3 quota cards with thin progress bar + 'x / y used' text; GitHub-style contribution heatmap in blue for activity; usage by model bar chart with tiny icons on bars |
| 100 | Collision Risk analytics (editorial blue) | https://www.pinterest.com/pin/711076228714014951/ | erp dashboard modern | Swiss/editorial: huge 72px '48.2%' light weight, cobalt blue #1F3BD6 full-bleed panel on right, dot-scatter strip chart, top text nav with underline active; white + one saturated blue only |
| 101 | Pulse - Dark Analytics Dashboard (Attractive UI) | https://www.pinterest.com/pin/1083749098186802772/ | erp dashboard modern | Black + acid lime: lime used for one highlighted bar, AI insight card filled lime with black text ('Improve 32% in morning engagement'), heat grid by weekday/hour, 'Ask about this data' input panel |
| 102 | Decko - CRM Dashboard | https://www.pinterest.com/pin/1111404014327354956/ | erp dashboard modern | Light with lime green bars; mini calendar with selected day lime circle; upcoming schedule checklist; KPI cards with corner icons |
| 103 | Apex dashboard (navy glass) | https://www.pinterest.com/pin/461337555599683604/ | erp dashboard modern | Deep navy with subtle glow; time range segmented (12 months/30 days/7 days/24 hours); credit score barcode meter; 'Verify this device' QR card in sidebar |
| 104 | Finlo Flash (warm dark) | https://www.pinterest.com/pin/644507396717712123/ | erp dashboard modern | Orange line chart with pill tooltip on warm dark; Income/Expense/Savings pill toggle; Starter plan upsell card in sidebar |
| 105 | Ecomiq - Return Details Slide Out | https://www.pinterest.com/pin/319614904829918939/ | saas record detail page ui web | Large modal/slide-out (~70% width): header 'Return 1 of 10' with prev/next arrows; 2-col body (main: product, reason, proof videos, timeline with comment box; right: order details key-value + customer card + notes); footer Reject ghost + Approve orange |
| 106 | Customer ticket record (Bagus Fikri / Ferideesk) | https://www.pinterest.com/pin/755619643757961167/ | saas record detail page ui web | Record header with avatar, company, quick action icon row (call/email/chat); left properties column with section '+' add buttons, right: 4 stat facts (Tickets 16, Overdue 4, Avg response 25:00 'On track' pill, Total resolved 1:32:08) + tickets table with priority pills; green split CTA 'Add New Ticket v' |
| 107 | Zaga - Project Details (Ananto Nugroho) | https://www.pinterest.com/pin/770326711307078211/ | saas record detail page ui web | Project hero card with soft lavender gradient, progress bar 60% under description; tabs Overview/Tasks 24/Files 14/Brief/Timeline/Activity; 'About this project' with checklist of goals; 4 big numbers row; right rail Team list + Project info key-values with status chip |
| 108 | Enrolliq - Edtech alerts (list + detail) | https://www.pinterest.com/pin/27443878977263506/ | saas record detail page ui web | Master-detail: alert list left with severity labels (CRITICAL red, warning amber) and risk score; detail right with tabs, 'AI insight summary' tinted card; severity filter tabs with counts |
| 109 | Teams directory (Courtney Henry workspace) | https://www.pinterest.com/pin/333829391151837168/ | saas record detail page ui web | 48px page title 'Teams'; member cards grid 4-col (avatar, name, role, dept, joined date, email) with tiny colored status tags; schedule gantt below; 3 header actions (New member black, New project, New task) |
| 110 | Cloud Storage Dashboard | https://www.pinterest.com/pin/1090715603514297333/ | saas record detail page ui web | Storage overview segmented bar (Videos/Documents/Images/Others colors) with legend; big folder icons grid; recent files cards; all files table |
| 111 | Orbital - spreadsheet collaboration (dark) | https://www.pinterest.com/pin/606578643599354933/ | saas record detail page ui web | View tabs Grid/Kanban/Form/Calendar/Gallery + 'Add view'; magenta accent for active workspace; status tags blue/orange in grid |
| 112 | Workflow runs table with error popover | https://www.pinterest.com/pin/350577152263018081/ | saas record detail page ui web | Status 'Failed' red icon + monospaced error message; hover popover with stack trace excerpt + 'Re-run' and 'Full log' buttons; KPI line (Workflow success, Avg lag, Avg latency) as plain text above |
| 113 | Minto Studio lists (ClickUp-like) | https://www.pinterest.com/pin/48695239716003670/ | saas record detail page ui web | Quick actions 3 tinted cards ('Set up your first Workflow') above list; task table with progress mini-bar + text ('2/8 - Structure in early sta...'), priority pills High/Medium/Low; views Overview/List/Board/+ Add view |
| 114 | Booking Form Builder - Be Confidency (Muzli) | https://www.pinterest.com/pin/35254809579062579/ | web app form design ui saas | Create form page: main column of grouped cards (Form information / Start with a template 2x2 selectable / Add form fields palette); right sticky summary card (Name, Template, Total fields, Required, Status chip) + publish settings checkboxes + tip card + Publish/Cancel stacked at bottom |
| 115 | SaaS Sign-Up Page - AI CRM (chapter24, Clio) | https://www.pinterest.com/pin/1145181011531603712/ | web app form design ui saas | Split 50/50: compact form left, dark product screenshot + testimonial quote right (sell with real UI, not abstract art) |
| 116 | Adxeers account setup (individual or business) | https://www.pinterest.com/pin/702209766945063528/ | web app form design ui saas | Left vertical stepper with check/active/pending states (Personal info > Account type > Advertising info > Choose a plan); one question per step as 24px heading; 2 radio cards; black Continue |
| 117 | OnlyPipe sign up (dark/purple) | https://www.pinterest.com/pin/449445237831532763/ | web app form design ui saas | Left gradient panel lists the 3 setup steps as pills (current white); right form with Google/GitHub buttons side by side, helper text 'Must be at least 8 characters' |
| 118 | HextaStudio Get Started | https://www.pinterest.com/pin/333829391149454390/ | web app form design ui saas | Dark brown frame + orange gradient art panel; focused input gets orange 1px border; single full-width orange CTA |
| 119 | Multi Step Form - Setup your Business Workspace | https://www.pinterest.com/pin/748371663124385881/ | web app form design ui saas | Modal wizard: left step list (Admin profile done / Company details current with spinner / Billing setup / Review); 2-col fields grid (Employee count stepper, Country select with flag); textarea with char counter 127/500; 'Save and close' left, Back + Next right |
| 120 | JOVO Card - Payment Details | https://www.pinterest.com/pin/591378994865729356/ | web app form design ui saas | 3-column: left step cards with progress '57% Progressing', center long form with section icons + headings, right promo card; yellow inline notice above submit |
| 121 | Project Sidebar Navigation (Neon-like console) | https://www.pinterest.com/pin/1090715603529502427/ | linear style app ui sidebar navigation | Scope switcher breadcrumb at top (account / project), branch selector as a select inside sidebar, grouped nav labels (Project / Branch / Platform services) 11px grey; 15px items with 16px line icons |
| 122 | Dark sidebar expanded + collapsed | https://www.pinterest.com/pin/9570217953450413/ | linear style app ui sidebar navigation | Expanded 240px vs collapsed 64px icon rail with collapse chevron on edge; nested items indented without icons; count badges tinted (green 8, orange 3) |
| 123 | Side Bar Navigation (Vast Biz) | https://www.pinterest.com/pin/892064638708705100/ | linear style app ui sidebar navigation | Three states: icon rail with tooltip / single sidebar / sidebar + secondary panel (Design system 2.0 lists); Light/Dark toggle in sidebar footer |
| 124 | Green glass sidebar (Measure/Analyze/Reduce) | https://www.pinterest.com/pin/678143656456446010/ | linear style app ui sidebar navigation | Active item as white pill that breaks out of the rail into the content area (tab-merge shape); brand green rail |
| 125 | Sidebar navigation - Untitled UI (blue) | https://www.pinterest.com/pin/569494315397433279/ | linear style app ui sidebar navigation | Saturated brand-blue sidebar variant: white text, active item lighter blue fill, nested submenu with left guide line, workspace switcher at top, user card at bottom |
| 126 | Sidebar navigation - Untitled UI (3 themes) | https://www.pinterest.com/pin/629378116694025315/ | linear style app ui sidebar navigation | Same nav in white / brand violet / near-black: theming the sidebar alone is enough to differentiate products |
| 127 | Smart home dashboard (warm dark bento) | https://www.pinterest.com/pin/616219161559245547/ | warm neutral dashboard ui beige | Warm charcoal tiles, copper/orange glow image tile, huge 64px light-weight numerals (64deg / 840 kWh) with tiny units; D/W/M segmented control per tile; vertical tick bar charts |
| 128 | AI chat + notes workspace (warm cream) | https://www.pinterest.com/pin/11118330334008997/ | warm neutral dashboard ui beige | Cream #F7F3EE paper panels on photo; numbered outline list as structured doc; chat bubbles in warm grey |
| 129 | CRM Dashboard Design (Homies Lab HR) | https://www.pinterest.com/pin/1101693127633059587/ | warm neutral dashboard ui beige | Butter-yellow gradient accents on warm grey: gauge 80%, yellow highlighted bar among black bars; icon tile grid nav (2-col square nav buttons) in sidebar |
| 130 | Bakker's Inn - Dashboard UI (Dnyanesh Maid) | https://www.pinterest.com/pin/4592827273170064256/ | warm neutral dashboard ui beige | Beige/sand palette (#EFE6D2 bg, #E2D3B0 panels), brown-black text, bubble chart; raw material inventory table with product glyphs; recipe side panel with photo and ingredient key-values |
| 131 | Construction project studio dashboard (orange dot bars) | https://www.pinterest.com/pin/211317407513599842/ | warm neutral dashboard ui beige | Off-white canvas, orange as only accent: progress bar 'Time estimate' striped remainder, dot-column chart, project history list with avatars |
| 132 | Platform for lawyers - Dashboard | https://www.pinterest.com/pin/1130685050232624214/ | warm neutral dashboard ui beige | Taupe/stone palette (#D9D2C5), espresso brown selected card (inverse), case cards with pill tags, dot matrix for case types; serif-free but soft rounded 20px radius |
| 133 | Oculis sidebar (warm grey) | https://www.pinterest.com/pin/11610911541992793/ | warm neutral dashboard ui beige | Warm grey #EDEBE8 sidebar with white active item pill and soft shadow; rust-brown count badge; Cmd K hint in search |
| 134 | InvestIQ (Fikri Ruslandi) light + orange/brown | https://www.pinterest.com/pin/1121959326096675931/ | warm neutral dashboard ui beige | Off-white with orange + chocolate brown accent; one inverse brown card among white; bars orange vs beige for comparison; comma decimals 12.135,00; floating AI prompt bubble bottom-left |
