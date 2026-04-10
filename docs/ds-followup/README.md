# Design System follow-up — deferred migrations on 12 files

Context: during the merge of PR #1 (`claude/gamification-household-activities-GmVmf`)
into local `main`, we decided **per-file** to keep the local structural refactor
(component extraction, file splitting) over the PR's design system migration
because the structural wins were significantly larger.

**That means these 12 files kept their split architecture but LOST the PR's
design system migration hunks.** The individual patches are saved next to this
file (`<FileName>.patch`) for reapplication after the merge.

Tracking priority is based on **how substantial** the migration is:
- 🔴 **High** — imports new primitives (headers, composable components). Real
  architectural reduction of inline boilerplate.
- 🟡 **Medium** — adds a single primitive (like `EmptyState`) plus token swaps.
- 🟢 **Low** — pure cosmetic token swap (`text-base-content/50` →
  `text-subtle`, etc.). Safe to batch into a single pass.

---

## 🔴 High priority (re-apply one by one, carefully)

These files want new primitives that fundamentally change how their UI is
structured. Re-applying them means moving sections of the page to use the
primitives inside the **new** extracted components (not back into the original
page).

### `src/pages/FamilyPage.tsx` — `FamilyPage.patch`
- Imports: `DetailHeader`
- Replaces inline back-button + title + Invite button with `<DetailHeader
  title="..." action={<InviteButton />}>`. The `InviteModal` we extracted
  locally should stay unchanged; only the page's header gets the migration.
- Also swaps `text-faint`, `text-body`, `text-muted` tokens.

### `src/pages/FinancesPage.tsx` — `FinancesPage.patch`
- Imports: `StickyHeader`
- Replaces inline `.navbar` + section toggle with `<StickyHeader
  title="..." action={<ToggleButtons />}>`. Our locally-extracted
  `ExpensesView`, `LoansView`, subscription modals, etc. stay as is; only the
  top shell of the page changes.
- Also swaps `text-subtle`, `text-faint`, `text-muted` tokens.

### `src/pages/SettingsPage.tsx` — `SettingsPage.patch`
- Imports: `DetailHeader`
- Replaces inline back button + "Guardar" action with `<DetailHeader
  title="Ajustes" action={<SaveButton />}>`. Our extracted `EditProfileModal`
  and `NavOrderEditor` stay as is.
- Also swaps `text-body`, `text-muted` tokens.

### `src/pages/TripDetailPage.tsx` — `TripDetailPage.patch`
- Imports: `DetailHeader`, `Timeline`, `TimelineItem`, `IconBadge`
- Removes inline navbar in favor of `<DetailHeader>`.
- Rewrites the itinerary rendering to use `<Timeline>` + `<TimelineItem>` with
  day markers. **This migration must be applied inside our locally-extracted
  `TripItineraryTab.tsx`, not back in `TripDetailPage.tsx`.** That's the key
  reapplication detail.
- Replaces inline day icon containers with `<IconBadge>`.
- Also swaps `surface-muted`, `text-faint`, `text-body` tokens.
- NOTE: the patch also shows a removal of `useAuth` import — **ignore that**,
  our auth security work in main added it legitimately and must stay.

### `src/pages/VehicleDetailPage.tsx` — `VehicleDetailPage.patch`
- Imports: `DetailHeader`, `ContextMenu`
- Replaces inline sticky header with `<DetailHeader action={<ContextMenu
  items={[edit, delete]} />}>`. Our extracted `EditVehicleModal` and
  `AddVehicleEventModal` stay as is.
- Also swaps `text-muted` tokens.

### `src/pages/NutritionPage.tsx` — `NutritionPage.patch` ⚠️ largest (28 KB patch)
- Imports: `SectionTitle`, `EmptyState`, `Avatar`, `IconBadge`
- This page got the most extensive migration in the PR. Since the local
  refactor also split it into 7 components (`DailyTracker`, `LogMealModal`,
  `PlanEditor`, `PlansManager`, `AssignPlanModal`, etc.), reapplying is the
  most work — the migrations land in different files.
- Checklist when reapplying:
  - Participants selector: `<img>` + fallback → `<Avatar src name size="xs" />`
  - Empty states: inline div → `<EmptyState icon title description action />`
  - Tracker icon containers: `<div w-12 h-12 rounded-xl>` → `<IconBadge color size="md">`
  - Section titles: inline `h3 opacity-50 uppercase` → `<SectionTitle className="uppercase tracking-wider">`
  - Card containers: `bg-base-100 border border-base-200 shadow-sm` → `surface-card`
  - Swap `opacity-50/60/30` for `text-muted` / `text-subtle` / `text-faint`
  - Cheat meal label: `text-red-500` → `text-error`
- **The surgical work spans `DailyTracker.tsx`, `PlanEditor.tsx`,
  `LogMealModal.tsx`, `PlansManager.tsx` and `NutritionPage.tsx` itself.**

---

## 🟡 Medium priority

### `src/pages/GiftEventDetailPage.tsx` — `GiftEventDetailPage.patch`
- Imports: `useFamily` (from `FamilyContext`) — **this is functional, not
  design system**. If the page needs family context, bring that part over.
- Adds `<EmptyState />` usage where there was an inline empty state div.
- Swaps `text-subtle` tokens.
- The DetailHeader/ContextMenu migration for this page happens inside
  `GiftEventHeader.tsx` (in PR's `src/components/gifts/GiftEventHeader.tsx`
  which is NOT in the conflict zone — **that edit comes in free via the
  merge**). So the ContextMenu migration for gift events is automatic.

---

## 🟢 Low priority — pure token swaps (batch into one pass)

These 5 files only got `text-base-content/XX` → `text-strong/body/muted/subtle/faint`
swaps. No primitives, no structural changes. Can be re-applied in a single
cleanup PR with a simple find-replace verified by eye.

- `src/pages/CalendarSettingsPage.tsx` — `CalendarSettingsPage.patch`
- `src/pages/ContactsPage.tsx` — `ContactsPage.patch`
- `src/pages/DashboardPage.tsx` — `DashboardPage.patch`
- `src/pages/GiftsPage.tsx` — `GiftsPage.patch`
- `src/components/activities/games/highcard/HighCardGame.tsx` — `HighCardGame.patch`
  - Note: the local refactor also extracts `HighCardBoard`, `HighCardSetup`,
    `useHighCardGame`, `constants.ts`. The token swap (`text-muted` in a few
    places) should be applied to the **extracted components**, not back in
    `HighCardGame.tsx`.

---

## Reapplication order suggested

1. **Low batch (1 session)**: run the 5 🟢 patches with manual review, verify
   lint + build, single commit `refactor(ui): apply semantic text tokens to 5 pages`.
2. **Medium (1 session)**: `GiftEventDetailPage` — add `useFamily` if needed,
   swap empty state to `<EmptyState>`, apply remaining tokens.
3. **High, one per session**:
   - FamilyPage + DetailHeader
   - FinancesPage + StickyHeader
   - SettingsPage + DetailHeader
   - VehicleDetailPage + DetailHeader + ContextMenu
   - TripDetailPage + DetailHeader + Timeline (**remember**: Timeline lives
     inside `TripItineraryTab.tsx`)
   - NutritionPage — biggest, split across 5 component files

Total estimate: ~8-10 small PRs, each touching 1-5 files, each individually
verifiable with lint + build.
