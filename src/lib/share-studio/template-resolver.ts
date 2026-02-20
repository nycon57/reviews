import {
  DEFAULT_BRAND_TOKENS,
  type BrandTokens,
  type ShareStudioTemplateDsl,
  type TemplateBinding,
  type TemplateLayer,
} from "@/lib/share-studio/template-types";

interface OrganizationBrandSource {
  primary_color?: string | null;
  logo_url?: string | null;
  settings?: Record<string, unknown> | null;
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((token) => token.slice(0, 1).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function formatDateShort(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function resolveBrandTokens(source?: OrganizationBrandSource | null): BrandTokens {
  const settings = (source?.settings ?? {}) as Record<string, unknown>;

  return {
    primaryColor:
      (settings.primary_color as string | undefined) ??
      source?.primary_color ??
      DEFAULT_BRAND_TOKENS.primaryColor,
    secondaryColor:
      (settings.secondary_color as string | undefined) ??
      DEFAULT_BRAND_TOKENS.secondaryColor,
    textColor:
      (settings.text_color as string | undefined) ?? DEFAULT_BRAND_TOKENS.textColor,
    accentColor:
      (settings.accent_color as string | undefined) ??
      DEFAULT_BRAND_TOKENS.accentColor,
    fontFamily:
      (settings.font_family as string | undefined) ?? DEFAULT_BRAND_TOKENS.fontFamily,
    logoUrl: source?.logo_url ?? DEFAULT_BRAND_TOKENS.logoUrl,
  };
}

function getPathValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let current: unknown = obj;

  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function applyBindingTransform(
  value: unknown,
  binding?: TemplateBinding
): unknown {
  if (!binding) return value;
  if (value === undefined || value === null) return binding.fallback;

  if (typeof value !== "string") {
    if (binding.transform === "stars" && typeof value === "number") {
      const stars = Math.max(0, Math.min(5, Math.round(value)));
      return "*".repeat(stars);
    }
    return value;
  }

  switch (binding.transform) {
    case "uppercase":
      return value.toUpperCase();
    case "lowercase":
      return value.toLowerCase();
    case "title_case":
      return titleCase(value);
    case "stars": {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        const stars = Math.max(0, Math.min(5, Math.round(numeric)));
        return "*".repeat(stars);
      }
      return value;
    }
    case "date_short":
      return formatDateShort(value);
    default:
      return value;
  }
}

function resolveLayerBindings(
  layer: TemplateLayer,
  proofSnapshot: Record<string, unknown>
): TemplateLayer {
  if (!layer.binding?.path) return layer;

  const boundValue = getPathValue(proofSnapshot, layer.binding.path);
  const transformed = applyBindingTransform(boundValue, layer.binding);

  if (layer.type === "text") {
    return {
      ...layer,
      text: typeof transformed === "string" ? transformed : String(transformed ?? ""),
    };
  }

  if (layer.type === "image") {
    return {
      ...layer,
      imageUrl: typeof transformed === "string" ? transformed : undefined,
    };
  }

  if (layer.type === "rating") {
    const ratingValue =
      typeof transformed === "number"
        ? transformed
        : Number(transformed ?? layer.rating ?? 5);

    return {
      ...layer,
      rating: Number.isFinite(ratingValue) ? ratingValue : 5,
    };
  }

  if (layer.type === "stats") {
    return {
      ...layer,
      statValue: typeof transformed === "string" ? transformed : String(transformed ?? ""),
    };
  }

  return layer;
}

export function resolveTemplateDsl(
  dsl: ShareStudioTemplateDsl,
  proofSnapshot: Record<string, unknown>,
  brandTokens: BrandTokens
): ShareStudioTemplateDsl {
  const layers = dsl.layers.map((layer) => {
    const bound = resolveLayerBindings(layer, proofSnapshot);

    if (bound.type === "text") {
      return {
        ...bound,
        color:
          bound.color === "{brand.textColor}"
            ? brandTokens.textColor
            : bound.color,
        fontFamily:
          bound.fontFamily === "{brand.fontFamily}"
            ? brandTokens.fontFamily
            : bound.fontFamily,
      };
    }

    if (bound.type === "shape") {
      return {
        ...bound,
        backgroundColor:
          bound.backgroundColor === "{brand.primaryColor}"
            ? brandTokens.primaryColor
            : bound.backgroundColor === "{brand.secondaryColor}"
            ? brandTokens.secondaryColor
            : bound.backgroundColor,
      };
    }

    return bound;
  });

  const background = dsl.background
    ? {
        ...dsl.background,
        color:
          dsl.background.color === "{brand.primaryColor}"
            ? brandTokens.primaryColor
            : dsl.background.color,
        gradientColors: dsl.background.gradientColors
          ? ([
              dsl.background.gradientColors[0] === "{brand.primaryColor}"
                ? brandTokens.primaryColor
                : dsl.background.gradientColors[0],
              dsl.background.gradientColors[1] === "{brand.secondaryColor}"
                ? brandTokens.secondaryColor
                : dsl.background.gradientColors[1],
            ] as [string, string])
          : undefined,
      }
    : undefined;

  return {
    ...dsl,
    background,
    layers,
  };
}
