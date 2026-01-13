# Unified Color System - Seal Your Capsule Flow

## Overview
A warm off-white archival color palette that removes harsh whites and ensures all surfaces belong to the same harmonious family.

## Color Hierarchy

### 1. **Page Background** (`#F5F3F1`)
- **Usage**: Base container background
- **Purpose**: Deepest warm off-white - establishes the foundational layer
- **Applied to**: Main wizard container, sticky headers/footers
- **Why**: Provides a warm, archival base that feels calm and premium

### 2. **Content Surface** (`#F7F5F0`)
- **Usage**: Cards, panels, review sections, photo grids
- **Purpose**: Slightly lighter than page background - creates subtle elevation
- **Applied to**: Review cards, photo grid items, certificate background, error messages
- **Why**: Differentiates content from background while maintaining palette harmony

### 3. **Input Surface** (`#F8F7F3`)
- **Usage**: Form inputs, dropdown buttons, interactive text fields
- **Purpose**: Lightest in palette - subtle differentiation for interactive elements
- **Applied to**: All input fields, dropdown triggers, textareas, date selectors
- **Why**: Provides minimal contrast for input fields while staying within the warm palette

### 4. **Overlay Surface** (`#F9F8F4`)
- **Usage**: Dropdown menus, modals, overlays
- **Purpose**: Softest, highest layer - creates clear separation for floating UI
- **Applied to**: All dropdown menus, search headers within dropdowns
- **Why**: Ensures dropdowns feel elevated and distinct while maintaining warmth

## Borders & Dividers

### **Warm Taupe Border** (`#D4C9BC`)
- **Usage**: Default borders, dividers, card edges
- **Purpose**: Harmonizes with warm palette (not cool gray)
- **Applied to**: All borders, dividers, sticky header/footer edges, card borders

### **Warm Hover Border** (`#B8A895`)
- **Usage**: Hover states, interactive elements
- **Purpose**: Warmer than default - provides clear hover feedback
- **Applied to**: Button hover, input hover, dropdown hover states

### **Focus Border** (`#1E293B`)
- **Usage**: Focus states, active dropdowns
- **Purpose**: Dark slate for maximum contrast and accessibility
- **Applied to**: Focused inputs, open dropdowns, active form fields

## States

### **Focus State**
- **Border**: `#1E293B` (dark slate)
- **Ring**: `rgba(30, 41, 59, 0.08)` (subtle glow)
- **Background**: Same as input surface (`#F8F7F3`)

### **Hover State**
- **Border**: `#B8A895` (warm hover)
- **Background**: Content surface (`#F7F5F0`) for cards, transparent for buttons

### **Error State**
- **Text**: `#B45309` (warm amber - not aggressive red)
- **Border**: `rgba(180, 83, 9, 0.4)` (40% opacity amber)
- **Why**: Maintains warmth while clearly indicating errors

### **Disabled State**
- **Background**: `#E8E0D6` (warm disabled background)
- **Text**: `#94A3B8` (muted gray)
- **Border**: `#D4C9BC` (default warm taupe)

## Removed Colors

### ❌ **Harsh Whites**
- `#FFFFFF` → Replaced with `#F8F7F3` (input surface)
- `#FAFAFA` → Replaced with `#F7F5F0` (content surface) or `#F9F8F4` (overlays)

### ❌ **Cool Grays**
- `#E2E8F0` → Replaced with `#D4C9BC` (warm taupe)
- `#CBD5E1` → Replaced with `#B8A895` (warm hover)

## Exceptions

### **White for Contrast** (Intentional)
- Video recording indicators (`bg-white`) - needed for visibility on dark video background
- Modal overlays (`bg-white/10`, `bg-white/20`) - Photo viewer modal maintains black background with white accents for contrast
- Print styles (`print:bg-white`) - ensures proper printing

## Usage Examples

```tsx
// Page background
<div className="bg-[#F5F3F1]">

// Content card
<div className="bg-[#F7F5F0] border border-[#D4C9BC]">

// Form input
<input className="bg-[#F8F7F3] border-b border-[#D4C9BC] hover:border-[#B8A895] focus:border-[#1E293B]" />

// Dropdown menu
<div className="bg-[#F9F8F4] border border-[#D4C9BC]">

// Error state
<span className="text-[#B45309] border border-[#B45309]/40">
```

## Result

- ✅ All surfaces belong to the same warm palette family
- ✅ Clear visual hierarchy through subtle lightness differences
- ✅ No harsh whites disrupting the archival feel
- ✅ Consistent focus, hover, and error states
- ✅ Harmonious borders that complement warm backgrounds

