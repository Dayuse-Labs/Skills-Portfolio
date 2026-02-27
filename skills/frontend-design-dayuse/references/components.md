# Dayuse Component Patterns

Reference guide for Dayuse-specific UI component patterns. Use these as the baseline when building Dayuse interfaces.

---

## Hotel Card

The core product card. Used in search results carousel and listing views.

```html
<div class="hotel-card">
  <div class="hotel-card__image">
    <img src="..." alt="Hotel name" />
    <div class="hotel-card__badges">
      <span class="badge badge--best-rated">Best Rated</span>
    </div>
    <div class="hotel-card__carousel-dots">
      <span class="dot active"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
  <div class="hotel-card__content">
    <h3 class="hotel-card__name">Hotel Name</h3>
    <span class="hotel-card__location">Neighborhood, City</span>
    <div class="hotel-card__rating">
      <span class="stars">★★★★☆</span>
      <span class="rating-score">4.2</span>
    </div>
    <div class="hotel-card__features">
      <span class="feature"><img src="pool-icon.svg" /> Pool</span>
      <span class="feature"><img src="spa-icon.svg" /> Spa</span>
    </div>
    <div class="hotel-card__pricing">
      <span class="price-current">$89</span>
      <span class="price-original">$120</span>
      <span class="price-discount">-26%</span>
    </div>
    <a href="#" class="hotel-card__cta">Book Now</a>
  </div>
</div>
```

### Card Styles
```css
.hotel-card {
  width: 320px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.10);
  overflow: hidden;
  background: #FFFFFF;
  transition: box-shadow 0.3s ease;
}

.hotel-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

.hotel-card__image {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.hotel-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hotel-card__content {
  padding: 12px 16px;
}

.hotel-card__name {
  font-family: 'Manrope', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #292935;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hotel-card__location {
  font-size: 12px;
  color: #8E8E93;
}

.hotel-card__pricing .price-current {
  font-size: 24px;
  font-weight: 700;
  color: #292935;
}

.hotel-card__pricing .price-original {
  font-size: 14px;
  color: #8E8E93;
  text-decoration: line-through;
}

.hotel-card__cta {
  display: inline-block;
  background: linear-gradient(62deg, #FFAF36 0%, #FFC536 100%);
  color: #292935;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 100px;
  text-decoration: none;
  text-align: center;
  transition: background 0.2s ease;
}

@media (max-width: 768px) {
  .hotel-card {
    width: calc(100vw - 64px);
  }
  .hotel-card__name { font-size: 16px; }
  .hotel-card__pricing .price-current { font-size: 22px; }
}
```

---

## Horizontal Carousel

Used for hotel results, featuring horizontal scroll with optional nav buttons.

```css
.carousel {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 0 40px;
  scrollbar-width: none;
}
.carousel::-webkit-scrollbar { display: none; }

.carousel__nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(4px);
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.carousel__nav-btn:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

@media (max-width: 768px) {
  .carousel { padding: 0 16px; }
  .carousel__nav-btn { display: none; }
}
```

---

## Chat Interface

### Message Bubbles

```css
/* User message */
.message--user {
  background: #EEEEF0;
  border-radius: 18px;
  padding: 12px 16px;
  max-width: 85%;
  align-self: flex-end;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  color: #292935;
  line-height: 1.6;
}

/* Bot/AI message */
.message--bot {
  background: transparent;
  padding: 12px 16px;
  max-width: 85%;
  align-self: flex-start;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  color: #292935;
  line-height: 1.6;
}
```

### Chat Container
```css
.chat-container {
  max-width: 800px;
  margin: 20px auto;
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.10);
  overflow: hidden;
  background: #FFFFFF;
}

.chat-header {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 20px;
}

.chat-messages {
  max-height: 500px;
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: none;
}

.chat-input {
  padding: 20px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #EAEAEB;
}

@media (max-width: 768px) {
  .chat-container {
    border-radius: 0;
    margin: 0;
  }
}
```

---

## Hero Section

Full-width hero with gradient overlay, used on landing/marketing pages.

```css
.hero {
  position: relative;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
  background-size: cover;
  background-position: center;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%);
}

.hero__title {
  font-family: 'MaisonNeueExtended-Bold', 'Manrope', sans-serif;
  font-size: 56px;
  font-weight: 800;
  color: #FFFFFF;
  line-height: 1.2;
  letter-spacing: -1.5px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.3);
  z-index: 1;
}

/* Gradient text effect for emphasis */
.hero__title em {
  font-style: normal;
  background: linear-gradient(90deg, #FEB900 0%, #FD7030 33%, #FDAA9A 67%, #B7D5D5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-family: 'Manrope', sans-serif;
  font-size: 22px;
  font-weight: 500;
  color: #FFFFFF;
  line-height: 1.5;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  z-index: 1;
}

@media (max-width: 768px) {
  .hero__title { font-size: 36px; letter-spacing: -0.5px; }
  .hero__subtitle { font-size: 17px; }
}
```

---

## Badges

### Standard Badge
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 100px;
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.badge--best-rated {
  background: #FFB800;
  color: #292935;
}

.badge--best-value {
  background: #FF5722;
  color: #FFFFFF;
}

.badge--popular {
  background: #FFC107;
  color: #292935;
}

.badge--pool {
  background: #E3F2FD;
  color: #3597C8;
}
```

---

## Timeslot Selector

```css
.timeslot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #E0E0E0;
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  color: #54545D;
  cursor: pointer;
  transition: all 0.2s ease;
}

.timeslot--matched {
  background: #F5FAFF;
  border-color: #D8E8FF;
  color: #18457A;
}

.timeslot--matched .timeslot__label {
  color: #4A6FA1;
  font-weight: 600;
}
```

---

## Info Cards (Support / Special / Policy)

```css
.info-card {
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
}

.info-card--support {
  background: #E3F2FD;
}
.info-card--support .info-card__title { color: #1976D2; }
.info-card--support .info-card__icon { color: #2196F3; }

.info-card--special {
  background: #FFF3E0;
}
.info-card--special .info-card__title { color: #F57C00; }
.info-card--special .info-card__icon { color: #FF9800; }

.info-card--policy {
  background: #E8F5E9;
}
.info-card--policy .info-card__title { color: #2E7D32; }
.info-card--policy .info-card__icon { color: #4CAF50; }
```

---

## Booking Summary Card

Used in the detail/checkout view to summarize a hotel booking.

```css
.booking-card {
  display: flex;
  gap: 16px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  padding: 16px;
}

.booking-card__image {
  width: 140px;
  border-radius: 8px;
  object-fit: cover;
}

.booking-card__details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.booking-card__name {
  font-size: 20px;
  font-weight: 600;
  color: #292935;
}

.booking-card__price {
  font-size: 22px;
  font-weight: 700;
  color: #292935;
}
```

---

## AI Recommendation Box

Highlighted content block for AI-powered suggestions.

```css
.ai-recommendation {
  background: linear-gradient(135deg, #FFF8ED 0%, #FFFBF5 100%);
  border-radius: 8px;
  padding: 16px;
  border-left: 3px solid #FFAF36;
}

.ai-recommendation__icon {
  width: 28px;
  height: 28px;
}

.ai-recommendation__text {
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  color: #292935;
  line-height: 1.6;
}
```

---

## Loading States

### Pulse Dots
```css
.loading-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.loading-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #FFB800;
  animation: pulse 1s infinite;
}

.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
```

### Thinking Text (Gradient Animation)
```css
.thinking-text {
  background: linear-gradient(90deg, #F55F30 0%, #FFAF36 25%, #FFC536 50%, #FFAF36 75%, #F55F30 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 2s linear infinite;
}
```

---

## Search Examples (Hero Pills)

Used on the hero to show example search queries.

```css
.search-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.search-example {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 100px;
  padding: 8px 16px;
  color: #FFFFFF;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-example:hover {
  background: rgba(255, 255, 255, 0.25);
}
```

---

## Bottom Reassurance Bar

Trust signals bar at the bottom of the interface.

```css
.reassurance-bar {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 16px 20px;
  border-top: 1px solid #EAEAEB;
}

.reassurance-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  color: #54545D;
}

.reassurance-item__icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .reassurance-bar {
    overflow-x: auto;
    justify-content: flex-start;
    scrollbar-width: none;
  }
}
```
