# Dayuse Design System — Complete Token Reference

## Color Tokens — Full Inventory

### Primary Accent Gradient
| Token | Value | Usage |
|-------|-------|-------|
| `--du-gradient-primary` | `linear-gradient(62deg, #FFAF36 0%, #FFC536 100%)` | Primary CTA buttons, key interactive elements |
| `--du-gradient-primary-hover` | `linear-gradient(62deg, #FF9F26 0%, #FFB526 100%)` | Hover state for primary CTA |
| `--du-amber` | `#FFB800` | Loading indicators, best-rated badges, solid accent |

### Hero & Marketing Gradients
| Token | Value | Usage |
|-------|-------|-------|
| `--du-gradient-hero-title` | `linear-gradient(90deg, #FEB900 0%, #FD7030 33%, #FDAA9A 67%, #B7D5D5 100%)` | Hero title emphasis text |
| `--du-gradient-thinking` | `linear-gradient(90deg, #F55F30 0%, #FFAF36 25%, #FFC536 50%, #FFAF36 75%, #F55F30 100%)` | Animated loading/thinking state |
| `--du-gradient-ai` | `linear-gradient(135deg, #FFF8ED 0%, #FFFBF5 100%)` | AI recommendation background |
| `--du-gradient-hero-overlay` | `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)` | Hero image overlay |

### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--du-text-primary` | `#292935` | Headings, body text, high-emphasis |
| `--du-text-secondary` | `#54545D` | Descriptions, labels, supporting |
| `--du-text-tertiary` | `#8E8E93` | Placeholders, timestamps |
| `--du-text-muted` | `#999999` | Disabled, ultra-low emphasis |
| `--du-text-disabled` | `#666666` | Disabled form elements |

### Background Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--du-bg-white` | `#FFFFFF` | Cards, inputs, primary surfaces |
| `--du-bg-light` | `#F9F9F9` | Page backgrounds, secondary surfaces |
| `--du-bg-context` | `#F5F5F7` | Context messages, info panels |
| `--du-bg-user` | `#EEEEF0` | User messages, active selections |
| `--du-bg-hover` | `#F9F9FB` | Hover state for interactive elements |

### Semantic Status Colors
| Status | Background | Icon/Accent | Title Text | Usage |
|--------|-----------|-------------|------------|-------|
| Support/Info | `#E3F2FD` | `#2196F3` | `#1976D2` | Help, info cards |
| Special/Warning | `#FFF3E0` | `#FF9800` | `#F57C00` | Offers, warnings |
| Policy/Success | `#E8F5E9` | `#4CAF50` | `#2E7D32` | Confirmations, policy |

### Feature Accent Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--du-teal` | `#51B0B0` | Feature icons, pool badges |
| `--du-pool-blue` | `#3597C8` | Pool-specific badges |
| `--du-best-value` | `#FF5722` | Best value badge (orange-red) |
| `--du-popular` | `#FFC107` | Popular badge (amber) |

### Timeslot Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--du-timeslot-label` | `#4A6FA1` | Matched timeslot label |
| `--du-timeslot-border` | `#D8E8FF` | Matched timeslot border |
| `--du-timeslot-bg` | `#F5FAFF` | Matched timeslot background |
| `--du-timeslot-text` | `#18457A` | Matched timeslot text |
| `--du-timeslot-default-border` | `#E0E0E0` | Default (unmatched) timeslot border |

### Border Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--du-border-primary` | `#EAEAEB` | Input fields, card dividers |
| `--du-border-secondary` | `#D4D4D7` | Chips, secondary dividers |
| `--du-border-subtle` | `rgba(0, 0, 0, 0.06)` | Header bottom borders |
| `--du-border-button` | `rgba(41, 41, 53, 0.14)` | Ghost button borders |
| `--du-border-button-hover` | `rgba(41, 41, 53, 0.26)` | Ghost button hover |

### Transparency / Glass Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--du-glass-header` | `rgba(255, 255, 255, 0.72)` | Frosted glass header |
| `--du-glass-search` | `rgba(255, 255, 255, 0.15)` | Search example pill bg |
| `--du-glass-search-border` | `rgba(255, 255, 255, 0.25)` | Search example pill border |
| `--du-glass-button` | `rgba(255, 255, 255, 0.82)` | Reset/ghost button bg |
| `--du-glass-carousel-dot` | `rgba(255, 255, 255, 0.6)` | Carousel inactive dot |
| `--du-glass-carousel-active` | `rgba(255, 255, 255, 0.95)` | Carousel active dot |

---

## Typography — Full Specification

### Font Imports
```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

@font-face {
  font-family: 'MaisonNeueExtended-Bold';
  src: url('/static/fonts/MaisonNeueExtended-Bold.otf') format('opentype');
  font-weight: 800;
  font-display: swap;
}
```

### Complete Type Scale
| Element | Font | Size (Desktop) | Size (Mobile) | Weight | Line Height | Letter Spacing |
|---------|------|-----------------|---------------|--------|-------------|----------------|
| Hero H1 | MaisonNeue / Manrope | 56px | 36px | 800 | 1.2 | -1.5px / -0.5px |
| Hero Subtitle | Manrope | 22px | 17px | 500 | 1.5 | — |
| Page Heading H2 | Manrope | 24px | 20px | 700 | 1.3 | — |
| Section Heading H3 | Manrope | 20px | 18px | 600 | 1.3 | — |
| Card Title | Manrope | 18px | 16px | 600 | 1.3 | — |
| Body Text | Manrope | 14px | 14px | 400 | 1.6 | — |
| Price (large) | Manrope | 28px | 22px | 700 | 1 | — |
| Price (card) | Manrope | 24px | 22px | 700 | 1 | — |
| Label / Small | Manrope | 12px | 12px | 500-600 | 1.4 | — |
| Caption | Manrope | 11px | 11px | 500 | 1.35 | — |
| Nav Header | Manrope | 14px | 14px | 600 | 1 | 0.02em |
| Location Text | Manrope | 12px | 12px | 400 | 1.4 | — |

### Text Truncation Pattern
```css
/* Multi-line ellipsis (2 lines) */
display: -webkit-box;
-webkit-line-clamp: 2;
-webkit-box-orient: vertical;
overflow: hidden;
text-overflow: ellipsis;
```

---

## Spacing — 4px Grid System

| Scale | Value | Usage Examples |
|-------|-------|----------------|
| xxs | 2px | Inline icon gaps, tight margins |
| xs | 4px | Badge padding, tight gaps |
| sm | 6px | Small chip padding |
| md | 8px | Standard inline spacing |
| base | 10px | Input gap, standard spacing |
| lg | 12px | Card content padding, standard padding |
| xl | 16px | Card padding, section gaps |
| 2xl | 20px | Container padding, message area padding |
| 3xl | 24px | Section margins, large spacing |
| 4xl | 40px | Large section spacing, carousel side padding |

---

## Shadow System

| Level | Value | Usage |
|-------|-------|-------|
| 0 (none) | `none` | Flat elements |
| 1 (subtle) | `0 2px 8px rgba(0, 0, 0, 0.1)` | Simplified cards |
| 2 (default) | `0 2px 12px rgba(0, 0, 0, 0.10)` | Hotel cards, standard elevation |
| 3 (medium) | `0 4px 12px rgba(0, 0, 0, 0.08)` | Booking cards, floating panels |
| 4 (hover) | `0 4px 16px rgba(0, 0, 0, 0.18)` | Hovered cards, carousel nav hover |
| 5 (elevated) | `0 8px 30px rgba(0, 0, 0, 0.25)` | Hero inputs, prominent search bars |
| Container | `0px 0px 10px rgba(0, 0, 0, 0.10)` | Main chat container |
| Colored | `0 4px 12px rgba(33, 150, 243, 0.3)` | Support link hover (blue glow) |

### Text Shadows
| Context | Value |
|---------|-------|
| Hero H1 | `0 2px 20px rgba(0,0,0,0.3)` |
| Hero Subtitle | `0 2px 10px rgba(0,0,0,0.3)` |
| Search Example | `0 1px 3px rgba(0,0,0,0.2)` |

---

## Border Radius System

| Token | Value | Usage |
|-------|-------|-------|
| `--du-radius-pill` | `100px` | Buttons, inputs, badges, tags |
| `--du-radius-circle` | `50%` | Avatars, round buttons, dots |
| `--du-radius-timeslot` | `20px` | Timeslot pills |
| `--du-radius-bubble` | `18px` | Chat message bubbles |
| `--du-radius-card` | `12px` | Cards, info panels |
| `--du-radius-container` | `10px` | Main layout containers |
| `--du-radius-panel` | `8px` | AI recommendation boxes, secondary |
| `--du-radius-none` | `0` | Full-bleed mobile containers |

---

## Animation Tokens

### Keyframes
```css
/* Pulse — loading dots, heartbeat effects */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

/* Gradient Shift — thinking/loading states */
@keyframes gradientShift {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}
```

### Transition Presets
| Preset | Value | Usage |
|--------|-------|-------|
| Quick | `all 0.2s ease` | Hover states, color shifts |
| Smooth | `all 0.3s ease` | Layout changes, reveals |
| Slow | `all 0.5s ease-in-out` | Page transitions, major state changes |
| Thinking | `1.5s ease-in-out infinite` | Thinking icon rotation |

---

## Glass Morphism Presets

### Header Frosted Glass
```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border-bottom: 1px solid rgba(0, 0, 0, 0.06);
```

### Image Overlay Button
```css
background: rgba(255, 255, 255, 0.82);
backdrop-filter: blur(4px);
-webkit-backdrop-filter: blur(4px);
```

### Search Example Pills (on hero)
```css
background: rgba(255, 255, 255, 0.15);
border: 1px solid rgba(255, 255, 255, 0.25);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
color: #FFFFFF;
```

---

## Responsive Breakpoints

| Breakpoint | Value | Notes |
|-----------|-------|-------|
| Mobile | `max-width: 768px` | Stack layouts, reduce font sizes, full-width cards |
| Desktop | `min-width: 769px` | Standard layout, carousel with nav buttons |

### Mobile Adjustments
- Chat container: `border-radius: 0` (full-bleed)
- Hotel cards: `width: calc(100vw - 64px)`
- Carousel nav buttons: hidden
- Hero H1: 36px (from 56px)
- Subtitle: 17px (from 22px)
- Price: 22px (from 24-28px)
- Button padding: `12px 18px` (from `12px 24px`)

---

## Sizing Reference

| Element | Width | Height |
|---------|-------|--------|
| Chat container max-width | 800px | auto |
| Hotel card (carousel) | 320px | auto |
| Hotel image | 100% | 160px |
| Simplified card image | — | 150px |
| Booking card image | 140px | auto |
| Loading dot | 12px | 12px |
| Star icon | 10px | 10px |
| Feature icon | 16px | 16px |
| AI icon | 28px | 28px |
| Reassurance icon | 20px | 20px |
| Carousel nav button (desktop) | 32px | 32px |
