// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { t, tp, setLocale, getLocale, registerLocale, isBundledLocale } from "../i18n";
import en from "../i18n/en.json";
import es from "../i18n/es.json";

describe("i18n module", () => {
  beforeEach(() => {
    setLocale("en");
  });

  // ── Locale management ──────────────────────────────────────────────

  describe("setLocale / getLocale", () => {
    it("defaults to en", () => {
      expect(getLocale()).toBe("en");
    });

    it("sets and retrieves locale", () => {
      setLocale("es");
      expect(getLocale()).toBe("es");
    });
  });

  describe("isBundledLocale", () => {
    it("returns true for en and es", () => {
      expect(isBundledLocale("en")).toBe(true);
      expect(isBundledLocale("es")).toBe(true);
    });

    it("returns false for unknown locales", () => {
      expect(isBundledLocale("fr")).toBe(false);
      expect(isBundledLocale("de")).toBe(false);
    });
  });

  // ── t() basic translation ──────────────────────────────────────────

  describe("t()", () => {
    it("returns English string for known key", () => {
      expect(t("reviews")).toBe("reviews");
      expect(t("noReviewsYet")).toBe("No reviews yet.");
      expect(t("poweredBy")).toBe("Powered by");
    });

    it("returns Spanish string when locale is es", () => {
      setLocale("es");
      expect(t("reviews")).toBe("reseñas");
      expect(t("noReviewsYet")).toBe("Aún no hay reseñas.");
      expect(t("poweredBy")).toBe("Desarrollado por");
    });

    it("falls back to English for unknown locale", () => {
      setLocale("fr");
      expect(t("reviews")).toBe("reviews");
    });

    it("returns key when key is not found", () => {
      expect(t("nonExistentKey")).toBe("nonExistentKey");
    });

    it("interpolates {placeholder} tokens", () => {
      expect(t("starsAriaLabel", { rating: "4.5" })).toBe("4.5 out of 5 stars");
      expect(t("daysAgo", { count: 3 })).toBe("3 days ago");
    });

    it("interpolates in Spanish", () => {
      setLocale("es");
      expect(t("starsAriaLabel", { rating: "4.5" })).toBe("Calificado 4.5 de 5");
      expect(t("daysAgo", { count: 3 })).toBe("hace 3 días");
    });
  });

  // ── tp() plural-aware translation ──────────────────────────────────

  describe("tp()", () => {
    it("uses singular form for count === 1", () => {
      expect(tp("basedOnResponses", 1, { count: 1 })).toBe("Based on 1 response");
    });

    it("uses plural form for count !== 1", () => {
      expect(tp("basedOnResponses", 5, { count: 5 })).toBe("Based on 5 responses");
    });

    it("uses plural form for count === 0", () => {
      expect(tp("basedOnResponses", 0, { count: 0 })).toBe("Based on 0 responses");
    });

    it("uses singular in Spanish", () => {
      setLocale("es");
      expect(tp("basedOnResponses", 1, { count: 1 })).toBe("Basado en 1 respuesta");
    });

    it("uses plural in Spanish", () => {
      setLocale("es");
      expect(tp("basedOnResponses", 5, { count: 5 })).toBe("Basado en 5 respuestas");
    });

    it("falls back to singular when plural key missing", () => {
      // "customerReviews" has no plural form — tp should still return the singular
      expect(tp("customerReviews", 5)).toBe("Customer Reviews");
    });
  });

  // ── registerLocale() dynamic locale ────────────────────────────────

  describe("registerLocale()", () => {
    it("allows registering and using a dynamic locale", () => {
      registerLocale("fr", {
        reviews: "avis",
        noReviewsYet: "Pas encore d'avis.",
      });
      setLocale("fr");
      expect(t("reviews")).toBe("avis");
      expect(t("noReviewsYet")).toBe("Pas encore d'avis.");
    });

    it("falls back to English for missing keys in dynamic locale", () => {
      registerLocale("de", { reviews: "Bewertungen" });
      setLocale("de");
      expect(t("reviews")).toBe("Bewertungen");
      expect(t("noReviewsYet")).toBe("No reviews yet."); // fallback
    });
  });

  // ── Key completeness ──────────────────────────────────────────────

  describe("translation completeness", () => {
    it("es.json has all keys from en.json", () => {
      const enKeys = Object.keys(en);
      const esKeys = Object.keys(es);
      const missing = enKeys.filter((k) => !esKeys.includes(k));
      expect(missing).toEqual([]);
    });

    it("es.json has no extra keys not in en.json", () => {
      const enKeys = Object.keys(en);
      const esKeys = Object.keys(es);
      const extra = esKeys.filter((k) => !enKeys.includes(k));
      expect(extra).toEqual([]);
    });
  });
});
