/**
 * Design Tokens for "Seal Your Capsule" flow
 * Unified warm off-white archival color system
 * 
 * Color Hierarchy:
 * - Page Background: Deepest warm off-white (#F5F3F1) - base layer
 * - Content Surface: Slightly lighter (#F7F5F0) - cards, panels, elevated content
 * - Input Surface: Subtle differentiation (#F8F7F3) - form inputs, interactive surfaces
 * - Overlay Surface: Softest (#F9F8F4) - modals, dropdowns, overlays
 * 
 * All surfaces belong to the same warm palette family.
 * No harsh whites (#FFFFFF) or cool grays.
 */

export const designTokens = {
  // BACKGROUND LAYERS (darkest to lightest in the warm palette)
  background: {
    page: '#F5F3F1',        // Base page background - warmest off-white
    content: '#F7F5F0',     // Content surfaces - cards, panels (slightly lighter than page)
    input: '#F8F7F3',       // Input fields, interactive surfaces (lightest in palette)
    overlay: '#F9F8F4',     // Overlays, dropdowns, modals (softest, highest layer)
    ambientLight: 'rgba(212, 165, 116, 0.04)', // subtle radial light overlay
    grainOpacity: 0.02,     // grain/noise opacity
  },

  // SURFACES (for cards, borders, shadows)
  surface: {
    background: '#F7F5F0',  // Same as content background
    border: '#D4C9BC',      // Warm taupe border (harmonizes with warm palette)
    borderHover: '#B8A895', // Warmer on hover
    borderFocus: '#1E293B', // Dark slate for focus (maintains contrast)
    shadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)', // very soft shadow
  },

  // TEXT (unchanged - good contrast hierarchy)
  text: {
    primary: '#1E293B',     // headings, primary labels
    secondary: '#475569',   // helper text, descriptions
    muted: '#64748B',       // metadata, counters
    disabled: '#94A3B8',    // disabled states
  },

  // STEPPER / TABS
  stepper: {
    inactive: {
      text: '#94A3B8',
      indicator: '#D4C9BC',  // Warm taupe (matches border)
    },
    active: {
      text: '#1E293B',
      indicator: '#1E293B',
    },
    completed: {
      text: '#475569',
      indicator: '#B8A895',  // Warmer completed state
    },
  },

  // FORM FIELDS
  form: {
    input: {
      background: '#F8F7F3',      // Input surface (lightest in palette)
      borderDefault: '#D4C9BC',   // Warm taupe border
      borderHover: '#B8A895',     // Warmer on hover
      borderFocus: '#1E293B',     // Dark for focus
      focusRing: 'rgba(30, 41, 59, 0.08)', // subtle focus glow
      placeholder: '#94A3B8',     // Muted placeholder text
    },
    error: {
      text: '#B45309',            // warm amber (not aggressive red)
      border: 'rgba(180, 83, 9, 0.4)', // warm amber border at 40% opacity
    },
  },

  // BUTTONS
  button: {
    primary: {
      background: '#1E293B',
      text: '#FFFFFF',
      hoverOpacity: 0.92,
      activeScale: 0.98,
    },
    secondary: {
      background: 'transparent',
      text: '#475569',
      hoverText: '#1E293B',
      hoverBorder: '#B8A895',  // Warm border on hover
    },
    disabled: {
      background: '#E8E0D6',   // Warm disabled background (not cool gray)
      text: '#94A3B8',
      cursor: 'not-allowed',
    },
  },

  // SEALING CEREMONY ACCENT (ONLY in sealing overlay)
  ceremony: {
    accentGlow: 'rgba(212, 165, 116, 0.08)', // warm ceremonial accent
  },

  // TYPOGRAPHY
  typography: {
    heading: {
      letterSpacing: '-0.02em',
    },
    label: {
      letterSpacing: '0.30em',
      letterSpacingWide: '0.40em',
    },
    body: {
      lineHeight: 1.5,
      lineHeightRelaxed: 1.65,
    },
  },
} as const;

// Tailwind class mappings for easy use
export const tokenClasses = {
  background: {
    page: 'bg-[#F5F3F1]',
    content: 'bg-[#F7F5F0]',
    input: 'bg-[#F8F7F3]',
    overlay: 'bg-[#F9F8F4]',
  },
  border: {
    surface: 'border-[#D4C9BC]',
    hover: 'border-[#B8A895]',
    focus: 'border-[#1E293B]',
    error: 'border-[#B45309]/40',
  },
  text: {
    primary: 'text-[#1E293B]',
    secondary: 'text-[#475569]',
    muted: 'text-[#64748B]',
    disabled: 'text-[#94A3B8]',
    error: 'text-[#B45309]',
  },
  button: {
    primary: 'bg-[#1E293B] text-white',
    secondary: 'bg-transparent text-[#475569]',
    disabled: 'bg-[#E8E0D6] text-[#94A3B8]',
  },
} as const;
