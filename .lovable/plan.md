

# Plan: Hide DonationCounter From All Pages

## What

Comment out every `<DonationCounter />` usage across 6 pages so the counter section is hidden, but the component file and all logic remain intact for future re-enablement.

## Changes (6 files)

Each file gets the same treatment: comment out the import line and the `<DonationCounter />` JSX usage.

| File | Lines to comment out |
|------|---------------------|
| `src/pages/Inventory.tsx` | Import line + `<DonationCounter />` |
| `src/pages/Counter.tsx` | Import line + `<DonationCounter />` |
| `src/pages/Signup.tsx` | Import line + `<DonationCounter />` |
| `src/pages/EmbedCounter.tsx` | Import line + `<DonationCounter />` |
| `src/pages/EmbedInventory.tsx` | Import line + `<DonationCounter />` |
| `src/pages/EmbedSignup.tsx` | Import line + `<DonationCounter />` |

## What is NOT touched

- `src/components/DonationCounter.tsx` — left completely intact
- No database, backend, or other component changes

