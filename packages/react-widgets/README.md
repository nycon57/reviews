# @repwell/react-widgets

React component library for embedding RepWell review widgets in React applications. Provides all 9 widget types as typed React components with SSR support and tree-shaking.

## Installation

```bash
npm install @repwell/react-widgets
```

**Peer dependencies:** `react >=18` and `react-dom >=18`.

## Quick Start

```tsx
import { LOReviewWidget } from "@repwell/react-widgets";
import "@repwell/react-widgets/styles.css";

function App() {
  return <LOReviewWidget widgetId="your-widget-id" />;
}
```

## Components

| Component | Description |
|---|---|
| `<LOReviewWidget />` | Loan officer profile and reviews |
| `<BranchReviewWidget />` | Branch location reviews with team |
| `<CompanyReviewWidget />` | Organization reviews with rating distribution |
| `<ReviewCarousel />` | Rotating review carousel |
| `<StarRatingBadge />` | Compact star rating badge |
| `<VideoTestimonialWidget />` | Video testimonials with transcripts |
| `<ReviewWall />` | Grid layout of reviews |
| `<NPSScoreBadge />` | Net Promoter Score gauge or numeric |
| `<SocialProofBanner />` | Social proof notifications and banners |

## Props

All components share these base props:

```tsx
interface BaseWidgetProps {
  /** Widget ID — fetches config from the RepWell API. */
  widgetId?: string;
  /** Inline config — use instead of widgetId for custom configuration. */
  config?: PublicWidgetConfig;
  /** Inline reviews data — skips API fetch for reviews. */
  reviews?: PublicReview[];
  /** API base URL. Defaults to "https://app.repwell.com". */
  apiBaseUrl?: string;
  /** Additional CSS class names. */
  className?: string;
  /** Inline styles on root element. */
  style?: CSSProperties;
  /** Event callback for analytics integration. */
  onEvent?: (event: WidgetEvent) => void;
  /** Custom loading fallback. */
  fallback?: ReactNode;
}
```

### Using `widgetId` (API-driven)

The component fetches its configuration and reviews from the RepWell API:

```tsx
<LOReviewWidget widgetId="my-lo-widget" />
```

### Using inline `config` (custom configuration)

Pass configuration directly for full control:

```tsx
<StarRatingBadge
  config={{
    widget_id: "custom",
    widget_type: "star_rating_badge",
    entity_type: "user",
    entity_id: null,
    name: "Custom Badge",
    config: {
      badge: { placement: "inline", showName: true },
      theme: { colors: { starFilled: "#f59e0b" } },
    },
    enable_structured_data: false,
    structured_data_type: null,
    status: "active",
    version: 1,
    entity_profile: {
      full_name: "Jane Smith",
      average_rating: 4.9,
      total_reviews: 230,
      avatar_url: null,
      photo_url: null,
      nmls_id: "123456",
      title: "Senior LO",
      licensing_states: null,
    },
  }}
/>
```

## Event Tracking

All components emit events via the `onEvent` callback:

```tsx
<ReviewCarousel
  widgetId="my-carousel"
  onEvent={(event) => {
    // event.type: "impression" | "click" | "click_cta" | "click_review" | ...
    // event.widgetId: "my-carousel"
    // event.timestamp: 1706824000000
    // event.metadata: { direction: "next" }
    analytics.track(event.type, event);
  }}
/>
```

## Styles

Import the included stylesheet for default widget styling:

```tsx
import "@repwell/react-widgets/styles.css";
```

Or apply your own styles using the CSS class names (all prefixed with `rw-`).

## Next.js Usage

Components are client-side by default (they use `useState` and `useEffect`). In Next.js App Router, import them in Client Components:

```tsx
"use client";

import { LOReviewWidget } from "@repwell/react-widgets";
import "@repwell/react-widgets/styles.css";

export function ReviewSection() {
  return <LOReviewWidget widgetId="my-widget" />;
}
```

For SSR with inline data, pass `config` and `reviews` props directly — no client-side fetch needed:

```tsx
// Server Component fetches data
async function ReviewPage() {
  const config = await fetch("https://app.repwell.com/api/v1/widgets/my-widget/config").then(r => r.json());
  const { reviews } = await fetch("https://app.repwell.com/api/v1/widgets/my-widget/reviews").then(r => r.json());
  return <ReviewSection config={config} reviews={reviews} />;
}
```

## Vite / Create React App

```tsx
import { ReviewWall } from "@repwell/react-widgets";
import "@repwell/react-widgets/styles.css";

function App() {
  return <ReviewWall widgetId="my-wall" />;
}
```

## TypeScript

All types are exported:

```tsx
import type {
  PublicWidgetConfig,
  PublicReview,
  WidgetEvent,
  BaseWidgetProps,
  WidgetConfigJson,
} from "@repwell/react-widgets";
```

## Tree-Shaking

The package uses ESM with `sideEffects: false`. Importing a single component does not bundle the others:

```tsx
// Only LOReviewWidget code is included in your bundle
import { LOReviewWidget } from "@repwell/react-widgets";
```

## License

MIT
