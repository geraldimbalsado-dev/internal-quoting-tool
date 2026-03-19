/**
 * Browser-safe mockup constants — no Node.js dependencies.
 * Import from here in client components instead of mockup.ts.
 */

export const TEMPLATE_W = 800
export const TEMPLATE_H = 800

export const PRINT_AREA = {
  x: 200,
  y: 220,
  width: 400,
  height: 280,
}

export const DEFAULT_MOCKUP_SETTINGS = {
  x: PRINT_AREA.x + PRINT_AREA.width / 2,
  y: PRINT_AREA.y + PRINT_AREA.height / 2,
  scale: 1.0,
  printAreaX: PRINT_AREA.x,
  printAreaY: PRINT_AREA.y,
  printAreaWidth: PRINT_AREA.width,
  printAreaHeight: PRINT_AREA.height,
}
