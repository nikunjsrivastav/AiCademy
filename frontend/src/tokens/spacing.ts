/**
 * AiCademy Spacing System Tokens
 * 
 * Baseline Scale: 4px default scale (Tailwind CSS standard)
 * 1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, 5 = 20px, 6 = 24px, 8 = 32px, 10 = 40px, 12 = 48px, 16 = 64px
 *
 * System Rules:
 * 1. Page Padding & Max Width:
 *    - PageContainer: max-w-7xl (1280px), px-4 sm:px-6 lg:px-8, py-6 sm:py-8
 * 2. Section Spacing:
 *    - Inter-section gap: gap-6 sm:gap-8 (24px mobile / 32px desktop)
 * 3. Card Padding:
 *    - Standard Card: p-6 (24px)
 *    - Compact Card: p-4 (16px)
 *    - StatCard: p-5 (20px)
 *    - Banner/Hero: p-6 sm:p-8 (24px mobile / 32px desktop)
 * 4. Card Grids & Lists:
 *    - Grid gap: gap-4 sm:gap-6 (16px mobile / 24px desktop)
 *    - List gap: space-y-3 (12px)
 * 5. Form Field Spacing:
 *    - Label to input: mb-1.5 (6px)
 *    - Input to helper/error: mt-1.5 (6px)
 *    - Field gap: space-y-4 (16px)
 *    - Form submit row offset: pt-4 (16px) with border-t
 * 6. Button Padding & Touch Targets:
 *    - sm: px-3 py-1.5 text-xs min-h-[36px] sm:min-h-[32px]
 *    - md: px-4 py-2 text-sm min-h-[44px] sm:min-h-[40px] (44px touch target on mobile)
 *    - lg: px-5 py-2.5 text-base min-h-[48px]
 *    - Button group gap: gap-2 (8px) or gap-3 (12px)
 * 7. Table Spacing:
 *    - Cell padding: px-4 sm:px-5 py-3.5 sm:py-4
 *    - Row height: h-12 (48px)
 * 8. Icon-to-Text Gap:
 *    - Standard: gap-2 (8px)
 *    - Compact: gap-1.5 (6px)
 *    - Navigation: gap-2.5 (10px)
 * 9. Heading Margins:
 *    - H1: text-2xl sm:text-3xl font-bold tracking-tight mb-1
 *    - H2: text-lg font-bold tracking-tight mb-1
 *    - H3: text-base font-bold tracking-tight mb-1
 * 10. Navigation & Shell:
 *     - Topbar: h-16 (64px), px-4 sm:px-6 lg:px-8
 *     - Sidebar item: px-3 py-2, gap-2.5
 *     - Modal: p-6 (24px)
 *     - Toast: p-4 (16px)
 */

export const SPACING_TOKENS = {
  scale: {
    xs: '4px',   // 1
    sm: '8px',   // 2
    md: '12px',  // 3
    base: '16px', // 4
    lg: '20px',  // 5
    xl: '24px',  // 6
    '2xl': '32px', // 8
    '3xl': '40px', // 10
    '4xl': '48px', // 12
    '5xl': '64px', // 16
  },
  page: {
    maxWidth: 'max-w-7xl',
    padding: 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
    sectionGap: 'space-y-6 sm:space-y-8',
  },
  card: {
    standard: 'p-6',
    compact: 'p-4',
    stat: 'p-5',
    hero: 'p-6 sm:p-8',
    gridGap: 'gap-4 sm:gap-6',
  },
  form: {
    labelMargin: 'mb-1.5',
    helperMargin: 'mt-1.5',
    fieldGap: 'space-y-4',
    submitOffset: 'pt-4',
  },
  touchTarget: {
    mobileMin: 'min-h-[44px]',
  },
} as const
