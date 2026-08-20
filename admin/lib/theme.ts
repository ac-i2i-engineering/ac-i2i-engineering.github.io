import { createSystem, defaultConfig } from "@chakra-ui/react";

// Mirrors the public site's actual palette (css/style.css :root), not an
// invented "admin dashboard" theme -- --primary-color/#E94917 and
// --secondary-color/#FF7C36 land exactly on brand.500/brand.400 below, and
// --accent-color/#F8E0C9 lands on brand.100, so both surfaces read as the
// same product instead of two unrelated apps.
const brand = {
  50: { value: "#FEF6F0" },
  100: { value: "#F8E0C9" },
  200: { value: "#F5C89E" },
  300: { value: "#FCA36B" },
  400: { value: "#FF7C36" },
  500: { value: "#E94917" },
  600: { value: "#D24114" },
  700: { value: "#B23610" },
  800: { value: "#8F2B0D" },
  900: { value: "#6E210A" },
  950: { value: "#4A160A" },
};

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: { brand },
      fonts: {
        heading: { value: "var(--font-inter), sans-serif" },
        body: { value: "var(--font-inter), sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "white" },
          fg: { value: "{colors.brand.600}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.50}" },
          emphasized: { value: "{colors.brand.400}" },
          focusRing: { value: "{colors.brand.500}" },
        },
        // Used via colorPalette="danger" for every destructive action
        // (Delete buttons, Remove Image, etc.) instead of Chakra's built-in
        // "red" palette, which is far more saturated than anything else in
        // this palette and reads as jarring next to the warm, muted tones
        // used everywhere else.
        danger: {
          solid: { value: "#C0341A" },
          contrast: { value: "white" },
          fg: { value: "#B42318" },
          muted: { value: "#F8D9D6" },
          subtle: { value: "#FCEEEE" },
          emphasized: { value: "#A32B15" },
          focusRing: { value: "#C0341A" },
        },
        // Used for neutral/informational badges (role = admin, department,
        // tags, etc.) that previously reused the brand orange for lack of
        // any alternative -- with role, status, department, and CTA buttons
        // all landing on the same hue, tables read as "too much red." This
        // is the one genuinely cool color in the palette, reserved for
        // exactly that: information that isn't the brand, a status, or a
        // warning.
        info: {
          solid: { value: "#3B5A8A" },
          contrast: { value: "white" },
          fg: { value: "#2C4A73" },
          muted: { value: "#D7E3F5" },
          subtle: { value: "#EEF2FA" },
          emphasized: { value: "#5578AD" },
          focusRing: { value: "#3B5A8A" },
        },
        // Neutral surfaces used throughout the admin panel instead of
        // hardcoded hex per-component -- change the look in one place.
        "admin.bg": { value: { base: "#FAF7F3", _dark: "#FAF7F3" } },
        "admin.surface": { value: { base: "#FFFFFF", _dark: "#FFFFFF" } },
        "admin.border": { value: { base: "#EDE4DA", _dark: "#EDE4DA" } },
        "admin.text": { value: { base: "#1A1410", _dark: "#1A1410" } },
        // #5C4E42 (not the lighter #8A7B6E first used here) -- that lighter
        // tone only hit ~3.85:1 against admin.bg, below the 4.5:1 WCAG AA
        // minimum for normal text, and this token is used for most of the
        // admin panel's body copy (labels, descriptions, timestamps).
        "admin.textMuted": { value: { base: "#5C4E42", _dark: "#5C4E42" } },
      },
    },
  },
});
