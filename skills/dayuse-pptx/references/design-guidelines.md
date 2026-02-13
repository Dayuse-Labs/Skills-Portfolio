# Dayuse Design Guidelines

Ce skill contient toutes les guidelines de design Dayuse. À utiliser pour le design d'interface, les présentations, Google Sheets, et tout travail nécessitant l'identité visuelle Dayuse.

---

## Brand Platform

### Vision
"Life is meant to be lived to the fullest"

### Mission
"Inspire desire to experience endless possibilities of daytime hotels"

### Ambition
"Global leader in daytime hotel experiences"

### Tagline
- **Principal**: "Room to daydream"
- **Court**: "Daydream"

### Les 3 Piliers
1. **Freedom** - Liberté de choix et flexibilité
2. **Wellness** - Bien-être et ressourcement
3. **Experience** - Expériences mémorables

### Personnalité de marque
- **Trendy** - À la pointe, moderne
- **Passionate** - Passionné, engagé
- **Playful** - Ludique, accessible

### Tone of Voice
- **Inspiring** - Inspirant, motivant
- **Visual** - Visuel, évocateur
- **Desirable** - Désirable, attractif

---

## Couleurs

### Couleurs principales

| Nom | Hex | Usage |
|-----|-----|-------|
| Evening Blue | `#292935` | Texte principal, titres |
| Gray | `#54545D` | Texte secondaire |
| Light Gray | `#7F7F86` | Texte tertiaire, placeholders |
| Background | `#F8F8F8` / `#F9F9F9` | Fonds de section |
| White | `#FFFFFF` | Cartes, conteneurs |

### Couleurs d'accent

| Nom | Hex | Usage |
|-----|-----|-------|
| Orange | `#F66236` / `#F55F30` | Accent principal, highlights |
| Purple Dawn | `#6E69AC` | Liens, accents secondaires |
| Teal | `#51B0B0` / `#42A6A6` | Succès, réassurance |
| Blue | `#3597C8` | Tags, labels |
| Yellow/Gold | `#FEB900` / `#FFAF36` / `#FFC536` | CTA, boutons principaux |

### Spectre de couleurs (signification)
Le gradient Dayuse représente un voyage émotionnel :
- **Gauche (chaud)**: Liberté, Soleil, Joie, Bonheur, Intensité, Amour
- **Droite (frais)**: Bien-être, Ciel, Paisibilité, Calme, Temps pour soi, Ressource

---

## Gradients

### Gradient CTA (Boutons principaux)
```css
background: linear-gradient(25deg, #FFAF36 0%, #FFC536 100%);
```

### Gradient Signature (Identité Dayuse)
```css
background: linear-gradient(90deg, #FEB900 0%, #FD7030 33%, #FDAA9A 67%, #B7D5D5 100%);
```

### Gradient Avatar
```css
background: linear-gradient(34deg, #F55F30 0%, #FF9A9A 51%, #FFC93D 100%);
```

### Les 4 Gradients de marque
1. **Generic** - Jaune → Corail → Bleu (spectre complet)
2. **Primary** - Jaune → Orange → Corail (tonalités chaudes)
3. **Complementary 1** - Variations de bleu
4. **Complementary 2** - Corail → Violet

---

## Typographie

### Fonts

| Font | Usage | Poids disponibles |
|------|-------|-------------------|
| **Manrope** | UI principale, corps de texte | 400, 500, 600, 700, 800 |
| **Poppins** | Accents, chiffres, highlights | 400, 500, 600, 700 |
| **Maison Neue** | Titres d'hôtels, noms propres | 400, 500, 700 |

### Hiérarchie typographique

```css
/* Titre H1 */
font-family: 'Manrope';
font-size: 24-32px;
font-weight: 800;
color: #292935;

/* Titre H2 */
font-family: 'Manrope';
font-size: 18-22px;
font-weight: 700;
color: #292935;

/* Corps de texte */
font-family: 'Manrope';
font-size: 14-16px;
font-weight: 400-500;
color: #54545D;

/* Labels/Caption */
font-family: 'Manrope';
font-size: 12-13px;
font-weight: 500;
color: #7F7F86;

/* Prix/Chiffres */
font-family: 'Poppins';
font-weight: 600-700;

/* Nom d'hôtel */
font-family: 'Maison Neue';
font-weight: 500;
```

---

## Composants UI

### Boutons

**CTA Principal**
```css
background: linear-gradient(25deg, #FFAF36 0%, #FFC536 100%);
border-radius: 100px;
padding: 12px 24px;
color: #FFFFFF;
font-family: 'Manrope';
font-weight: 700;
```

**Bouton Secondaire**
```css
background: #FFFFFF;
border: 1px solid #E5E5E5;
border-radius: 100px;
color: #292935;
```

**Bouton Pill/Tag**
```css
background: #F8F8F8;
border-radius: 100px;
padding: 8px 16px;
font-size: 13px;
```

### Cartes

```css
background: #FFFFFF;
border-radius: 10-20px;
box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.10);
```

### Inputs

```css
border: 1px solid #E5E5E5;
border-radius: 10px;
padding: 12px 16px;
font-family: 'Manrope';
```

### Tags/Labels

```css
/* Tag bleu */
background: rgba(53, 151, 200, 0.1);
color: #3597C8;
border-radius: 100px;
padding: 4px 12px;
font-size: 12px;

/* Tag succès */
background: rgba(81, 176, 176, 0.1);
color: #51B0B0;
```

---

## Espacements & Layout

### Border Radius
- **Pills/Boutons**: `100px` (full rounded)
- **Cartes**: `10-20px`
- **Inputs**: `10px`
- **Images**: `8-12px`

### Shadows
```css
/* Légère (cartes) */
box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.10);

/* Moyenne (modales) */
box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.15);
```

### Spacing Scale
- `4px` - micro
- `8px` - small
- `12px` - base
- `16px` - medium
- `24px` - large
- `32px` - xlarge
- `48px` - xxlarge

---

## Logo & Icône App

### Logo
- **Logo principal**: Wordmark "dayuse" en minuscules
- **Version gradient**: Pour usages expressifs (fond clair)
- **Version noir**: Pour usages formels/documents
- Toujours préserver l'espace autour du logo

### Icône App
- Symbole d'horloge stylisé
- Fond: gradient soleil (jaune → orange → corail)
- Représente le concept "temps de jour"

---

## Règles d'application

### Pour les présentations
- Utiliser le gradient signature en accent
- Titres en Manrope Bold
- Fond blanc ou `#F8F8F8`
- CTA en gradient jaune/or

### Pour Google Sheets
- Couleur header: `#292935` (Evening Blue)
- Texte header: blanc
- Accent: `#FEB900` ou `#F66236`
- Lignes alternées: `#F8F8F8`

### Pour les interfaces
- Hiérarchie claire avec les 3 niveaux de gris
- CTA toujours en gradient jaune
- Liens en Purple Dawn `#6E69AC`
- Feedback succès en Teal `#51B0B0`
- Border radius généreux (10-20px cartes, 100px boutons)

---

## Quick Reference - Copier/Coller

```
Couleurs:
- Texte principal: #292935
- Texte secondaire: #54545D
- Texte tertiaire: #7F7F86
- Orange: #F66236
- Purple: #6E69AC
- Teal: #51B0B0
- Yellow CTA: #FEB900
- Background: #F8F8F8

Fonts:
- UI: Manrope
- Chiffres: Poppins
- Hôtels: Maison Neue

Gradient CTA: linear-gradient(25deg, #FFAF36 0%, #FFC536 100%)
Gradient Signature: linear-gradient(90deg, #FEB900 0%, #FD7030 33%, #FDAA9A 67%, #B7D5D5 100%)
```
