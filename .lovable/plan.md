

# Plan: Reorganize Header Navigation with Grouped Dropdowns + Mobile Hamburger

## Current Problem

13 flat links crammed across the top bar. Hard to scan, overflows on smaller screens, no logical grouping.

## Proposed Navigation Structure

Group the 13 links into 5 top-level items with logical dropdown menus:

```text
[Logo]    Inventory    Donations ▾    Volunteers ▾    Sales ▾    Partners ▾    [☰ mobile]

Donations dropdown:        Volunteers dropdown:       Sales dropdown:         Partners dropdown:
  - Donate                   - Volunteer Signup         - Companies             - Partner Locations
  - Incoming Donations       - Volunteer Signups        - Sales Orders          - Training Videos
  - Donor Analytics          - Admin Events             - Invoices
                             - Events                   - Analytics
```

- **Inventory** stays a direct link (primary page)
- **Donations** groups donor-facing and incoming donation pages
- **Volunteers** groups signup form, admin signups list, events
- **Sales** groups companies, orders, invoices, analytics
- **Partners** groups partner locations and training

## Desktop: Dropdown Menus

Use the existing `NavigationMenu` component from shadcn/ui (`src/components/ui/navigation-menu.tsx`) for hover/click dropdowns. Each top-level trigger opens a clean list of links.

## Mobile: Hamburger Menu with Sheet

On screens below `md` (768px):
- Hide the desktop nav
- Show a hamburger icon button
- Opens a `Sheet` (slide-in panel) with all links organized in collapsible sections

## Files to Modify

| File | Change |
|------|--------|
| `src/components/Header.tsx` | Replace flat link list with NavigationMenu dropdowns + mobile Sheet hamburger |

Single file change. No new components needed -- uses existing `NavigationMenu`, `Sheet`, and `Button` UI primitives.

## Technical Approach

1. Import `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink` from `@/components/ui/navigation-menu`
2. Import `Sheet`, `SheetTrigger`, `SheetContent` from `@/components/ui/sheet`
3. Import `Menu` icon from lucide-react
4. Use `useIsMobile()` hook or responsive classes (`hidden md:flex` / `flex md:hidden`) to toggle between desktop dropdowns and mobile hamburger
5. Use `useLocation()` to highlight active section

