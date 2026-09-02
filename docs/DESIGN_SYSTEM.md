# Shared UI Design System & Component Library

## 1. Aesthetic Direction
The product embodies modern, clean, accessible government/cooperative service aesthetics. It avoids generic freelancer themes and high-contrast social media layouts.

- **Primary Accent**: Cooperative Emerald (`hsl(160, 84%, 30%)`)
- **Secondary Slate**: Steel Slate (`hsl(215, 25%, 27%)`)
- **Accent**: Warm Amber (`hsl(38, 92%, 50%)`)
- **Background**: Modern Light (`hsl(210, 40%, 98%)`)

---

## 2. Shared Primitive Components (`components/ui/`)

Developers MUST reuse primitive components located in `components/ui/` instead of writing custom Tailwind buttons or inputs:

1. `Button` (`components/ui/button.tsx`)
2. `Card` (`components/ui/card.tsx`)
3. `Badge` (`components/ui/badge.tsx`)
4. `Input` (`components/ui/input.tsx`)
5. `Textarea` (`components/ui/textarea.tsx`)
6. `Select` (`components/ui/select.tsx`)
7. `Checkbox` (`components/ui/checkbox.tsx`)
8. `RadioGroup` (`components/ui/radio-group.tsx`)
9. `Switch` (`components/ui/switch.tsx`)
10. `Dialog` (`components/ui/dialog.tsx`)
11. `Drawer` (`components/ui/drawer.tsx`)
12. `DropdownMenu` (`components/ui/dropdown-menu.tsx`)
13. `Tabs` (`components/ui/tabs.tsx`)
14. `Tooltip` (`components/ui/tooltip.tsx`)
15. `Avatar` (`components/ui/avatar.tsx`)
16. `Toast` (`components/ui/toast.tsx`)
17. `Alert` (`components/ui/alert.tsx`)
18. `Skeleton` (`components/ui/skeleton.tsx`)
19. `Table` (`components/ui/table.tsx`)
20. `Separator` (`components/ui/separator.tsx`)
21. `Pagination` (`components/ui/pagination.tsx`)

---

## 3. Formatting Utilities

- **Currency**: Import `formatINR` from `@/lib/formatters`. Never format rupees manually (`"Rs."` or `"INR"` strings are strictly forbidden).
- **Showcase Page**: View live interactive design system at `/design-system`.
