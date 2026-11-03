# UI Spacing System Audit & Consistency Pass

This document details the comprehensive UI Spacing Audit for the AiCademy frontend prototype across mobile (~375px), tablet (~768px), and desktop (~1280px+) viewport widths in both light and dark modes.

## Spacing System Rules (4px Tailwind Baseline)

All layout and component spacing is strictly locked to the 4px scale (`0.5`=2px, `1`=4px, `1.5`=6px, `2`=8px, `2.5`=10px, `3`=12px, `4`=16px, `5`=20px, `6`=24px, `8`=32px, `10`=40px, `12`=48px, `16`=64px).

| Category | Standard Tokens / Classes | Responsive Rule |
| :--- | :--- | :--- |
| **Page Padding** | `px-4 sm:px-6 lg:px-8 py-6 sm:py-8` | 16px mobile, 24px tablet, 32px desktop |
| **Max Content Width** | `max-w-7xl` (1280px standard), `max-w-4xl` (forms/settings) | Centered with `mx-auto` |
| **Section Gap** | `space-y-6 sm:space-y-8` or `gap-6 sm:gap-8` | 24px mobile, 32px desktop |
| **Card Padding** | Standard: `p-6` (24px)<br/>Compact: `p-4` (16px)<br/>Hero Banner: `p-6 sm:p-8` (24px/32px) | Standard across all cards and widgets |
| **Card Grids** | `gap-4 sm:gap-6` (16px mobile, 24px desktop) | Responsive multi-column grid |
| **Card Lists** | `space-y-3` or `space-y-4` | 12px to 16px vertical list rhythm |
| **Form Fields** | Label to Input: `mb-1.5` (6px)<br/>Input to Helper/Error: `mt-1.5` (6px)<br/>Field-to-Field Gap: `space-y-4` (16px)<br/>Submit Row Offset: `pt-4` (16px) | Standardized via `<FormField>` |
| **Button Padding** | sm: `px-3 py-1.5` (min 32px height)<br/>md: `px-4 py-2` (min 40px height, 44px mobile)<br/>lg: `px-5 py-2.5` (min 48px height) | Mobile touch target &ge; 44px guaranteed |
| **Button Group Gap** | `gap-2` (8px compact) or `gap-3` (12px standard) | Flex-wrap with no negative margins |
| **Table Spacing** | Cell: `px-4 sm:px-5 py-3.5 sm:py-4`<br/>Header: `px-4 sm:px-5 py-3`<br/>Row Height: `h-12` (48px) | Uniform table rhythm |
| **Icon-to-Text Gap** | Standard: `gap-2` (8px)<br/>Compact: `gap-1.5` (6px)<br/>Nav: `gap-2.5` (10px) | Aligned flex items |
| **Headings Rhythm** | H1: `mb-1` followed by subtitle<br/>H2: `mb-1` followed by subtitle<br/>H3: `mb-1` | Clean hierarchical vertical flow |
| **Shell & Nav** | Topbar: `h-16`, `px-4 sm:px-6 lg:px-8`<br/>Sidebar item: `px-3 py-2, gap-2.5`<br/>Modal: `p-4 sm:p-6`<br/>Toast: `p-4, gap-3` | Standardized shell boundaries |

---

## Audit Findings & Fixes

| Screen / Component | Problem Identified | Fix Applied | Status |
| :--- | :--- | :--- | :--- |
| **AppShell Layout** | Fixed 256px sidebar squished mobile viewport into 119px width, causing horizontal scroll; fixed `p-6 md:p-10` padding was too loose on mobile. | Converted Sidebar to responsive drawer with mobile hamburger toggle and backdrop overlay. Standardized main to `p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8`. | FIXED |
| **Topbar & Header** | Hardcoded `px-6 md:px-8` padding caused header edge squish on 375px screens; DemoRoleSwitcher pills overflowed mobile screen width. | Updated Topbar padding to `px-4 sm:px-6 lg:px-8`; added mobile sidebar trigger button; made role pill switcher `hidden sm:flex` with compact persona button on mobile. | FIXED |
| **Sidebar Navigation** | Sidebar lacked mobile responsive drawer behavior and dismiss actions; close button was missing. | Added `SidebarProps` with `isOpen` and `onClose`, mobile slide-out drawer, mobile close button, and automatic close on NavLink clicks. | FIXED |
| **Login & Register Cards** | Card had fixed `p-8` on all screens, squeezing form content on 375px mobile screens; container had `p-6 md:p-12`. | Updated container to `p-4 sm:p-6 md:p-8` and Card padding to responsive `p-6 sm:p-8`; inputs ensure &ge;44px touch targets. | FIXED |
| **Student Dashboard** | Hero banner had `p-8 md:p-10` (40px non-scale); StatCard grid had `gap-5` (20px mixed with 24px); feature cards had uneven nested padding (`p-4` outer + `p-6` inner). | Standardized Hero banner to `p-6 sm:p-8`; StatCard grid to `gap-4 sm:gap-6`; category cards aligned with standard spacing scale. | FIXED |
| **Student Courses & Roster** | Grid gap was fixed `gap-6` without mobile scale; search input had compact `py-2` without touch target guarantee; join code input had non-standard tracking and borders. | Grid standardized to `gap-4 sm:gap-6`; search input wrapped with touch-friendly bounds; modal inputs standardized to `min-h-[44px]`. | FIXED |
| **Student Course Detail** | Non-standard material card padding `p-4 sm:p-5`; topic tags had arbitrary `text-[10px] px-2 py-0.5` without standard gap; search input had `py-1.5`. | Material cards standardized to `p-4 sm:p-6`; topic tags gap set to `gap-1.5`; search input padded to standard `py-2`. | FIXED |
| **Professor Dashboard** | Hero banner had `p-8 md:p-10`; StatCard grid had `gap-5`; card grid had uneven bottom margins on text blocks. | Hero banner updated to `p-6 sm:p-8`; grid gaps standardized to `gap-4 sm:gap-6`; text margins aligned to `mb-4`. | FIXED |
| **Professor Courses** | Card grid had fixed `gap-6`; form fields inside modal had non-uniform label-to-input margins (`mb-1.5` vs none). | Grid standardized to `gap-4 sm:gap-6`; modal form fields standardized using 4px scale spacing. | FIXED |
| **Professor Course Detail** | Table cell padding was `px-5 py-3` with non-standard row height; dropzone had `p-6` with loose `space-y-2`; search inputs had `py-1.5`. | Table cell padding standardized to `px-4 sm:px-5 py-3.5 sm:py-4`; dropzone and modal fields aligned to standard scale. | FIXED |
| **Admin Overview** | Hero banner had `p-8 md:p-10`; StatCard grid had `gap-5`; action cards grid had fixed `gap-6`. | Hero banner updated to `p-6 sm:p-8`; grids updated to `gap-4 sm:gap-6`; card paddings set to `p-6`. | FIXED |
| **Settings & Appearance** | Swatches grid had fixed `gap-3`; preview card had non-standard `p-5` padding; custom color picker had inconsistent vertical margins. | Swatches grid updated to `gap-3 sm:gap-4`; preview card updated to `p-4 sm:p-6`; form controls aligned to 4px scale. | FIXED |
| **Button Component** | Button heights were unconstrained on mobile, allowing touch targets below the 44px accessibility guideline. | Standardized button heights: `sm` min 32px (sm: 36px mobile), `md` min 44px on mobile (sm: 40px), `lg` min 48px. | FIXED |
| **Card Component** | Card padding was hardcoded to `p-6`, lacking a standardized compact or loose option. | Added `padding?: 'standard' (p-6) | 'compact' (p-4) | 'loose' (p-8) | 'none'` prop to `<Card>`. | FIXED |
| **Modal Component** | Modal header and body had hardcoded `p-5` (20px), causing tight margins on desktop and loose on mobile. | Standardized Modal header and body padding to `p-4 sm:p-6`. | FIXED |
| **Toast Component** | Toast had hardcoded `p-3.5` (14px) and non-scale positioning `bottom-5 right-5`. | Standardized Toast padding to `p-4` (16px) and position to `bottom-4 right-4 sm:bottom-6 sm:right-6`. | FIXED |
| **Milestone Placeholders** | Inner padding was `p-10` with container `py-12`, causing content crowding on 375px mobile screens. | Updated container to `py-8 sm:py-12` and Card padding to `p-6 sm:p-10`. | FIXED |
