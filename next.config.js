import { withBotId } from "botid/next/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Externalize Remotion renderer for server-side rendering
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/compositor-darwin-arm64",
    "@remotion/compositor-darwin-x64",
    "@remotion/compositor-linux-arm64-gnu",
    "@remotion/compositor-linux-arm64-musl",
    "@remotion/compositor-linux-x64-gnu",
    "@remotion/compositor-linux-x64-musl",
    "@remotion/compositor-win32-x64-msvc",
  ],
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    // Optimize barrel imports for better tree-shaking
    optimizePackageImports: [
      "@phosphor-icons/react",
      "date-fns",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-toggle",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-tooltip",
      "framer-motion",
      "recharts",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Tighter image sizes for competitor pages (logos 120px, avatars 40px, cards ~400px)
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [40, 64, 96, 120, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Cache headers for static assets (fonts, images, JS/CSS, embed)
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Embed: content-hashed files get long-lived immutable cache
      {
        source: "/embed/v1/embed.:hash.min.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, OPTIONS",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      // Embed: stable URL gets shorter cache (24h) for cache-busting via redirect
      {
        source: "/embed/v1/embed.min.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, HEAD, OPTIONS",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      // Embed: unminified debug build
      {
        source: "/embed/v1/embed.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      // Embed: manifest.json
      {
        source: "/embed/v1/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=60",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      // Embed: versioned rollback files
      {
        source: "/embed/v1/:version/embed.min.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      // Embed: block public access to source maps
      {
        source: "/embed/:path*.map",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex",
          },
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
      // Embed: CORS for all embed assets
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
  // Rewrite source map requests to 404 to prevent public access
  async rewrites() {
    return [
      {
        source: "/embed/:path*.map",
        destination: "/404",
      },
    ];
  },
  // Redirect root to dashboard for authenticated users
  async redirects() {
    return [
      // Redirect old /lo/ routes to new /pro/ routes
      {
        source: "/lo",
        destination: "/pro",
        permanent: true,
      },
      {
        source: "/lo/:id",
        destination: "/pro/:id",
        permanent: true,
      },
      // /vs/[competitor] aliases → /compare/[competitor]-alternative
      {
        source: "/vs/experience-com",
        destination: "/compare/experience-com-alternative",
        permanent: true,
      },
      {
        source: "/vs/birdeye",
        destination: "/compare/birdeye-alternative",
        permanent: true,
      },
      {
        source: "/vs/trustpilot",
        destination: "/compare/trustpilot-alternative",
        permanent: true,
      },
      // Consolidated manager dashboard into /dashboard/team
      {
        source: "/dashboard/manager",
        destination: "/dashboard/team",
        permanent: true,
      },
    ];
  },
};

export default withBotId(nextConfig);
