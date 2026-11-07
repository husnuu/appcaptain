/**
 * Ahoy Boats — Kaptan ve Admin panelleri için tasarım ön ayarı.
 *
 * Müşteri web sitesindeki (apps/web) yeni tasarım dilini panellere taşır:
 * lacivert birincil renk, gök mavisi vurgu, krem tonlu sıcak griler, Manrope,
 * yuvarlak kartlar ve yumuşak gölgeler. Temel ön ayarı (./index.js) genişletir;
 * web uygulaması bu dosyayı kullanmaz.
 *
 * @type {import("tailwindcss").Config}
 */
const base = require("./index.js");

// Sıcak nötr griler — krem zemin (#FAF7F3) ile uyumlu. 900 = mürekkep rengi.
const gray = {
  50: "#FAF8F5",
  100: "#F3F0EC",
  200: "#E8E3DD",
  300: "#D9D2CA",
  400: "#A9A39C",
  500: "#77726C",
  600: "#57534E",
  700: "#3F3C38",
  800: "#2A2926",
  900: "#222830",
};

// Lacivert — birincil aksiyonlar, aktif durum, vurgu (web'deki "Kaptan Paneli" butonu).
const navy = {
  50: "#EEF2F9",
  100: "#DCE5F3",
  200: "#B9CAE6",
  300: "#8AA6D3",
  400: "#4F78C9",
  500: "#183D85",
  600: "#143470",
  700: "#102A5C",
  800: "#0D2149",
  900: "#0A1A39",
  DEFAULT: "#183D85",
};

// Panellerdeki eski sayfalar Tailwind'in varsayılan renklerini (blue-600, green-100 …)
// doğrudan kullanıyor. Bu renkler burada markanın tonlarına yeniden eşlenir; böylece
// her sayfa tek tek elden geçmeden lacivert / deniz yeşili / sıcak amber diline uyar.
const blue = {
  50: "#EEF2F9", 100: "#DCE5F3", 200: "#B9CAE6", 300: "#8AA6D3", 400: "#4F78C9",
  500: "#2A56A8", 600: "#183D85", 700: "#143470", 800: "#102A5C", 900: "#0D2149",
};
const green = {
  50: "#E9F6F3", 100: "#D2EEE7", 200: "#A8DDD0", 300: "#77C7B5", 400: "#4FB29C",
  500: "#2F9E8A", 600: "#26866F", 700: "#1F6F60", 800: "#1A5A4E", 900: "#154A41",
};
const amber = {
  50: "#FDF6E7", 100: "#FBEACB", 200: "#F6D79A", 300: "#EFC067", 400: "#E6A93F",
  500: "#D89422", 600: "#B9781A", 700: "#925C16", 800: "#744915", 900: "#5E3C14",
};
const coral = {
  50: "#FDF1EC", 100: "#FBE0D5", 200: "#F6C0AB", 300: "#F09B7C", 400: "#E87A55",
  500: "#DE6238", 600: "#C24F2A", 700: "#9E4024", 800: "#7E3521", 900: "#662D1E",
};
const red = {
  50: "#FDF0F0", 100: "#FADCDC", 200: "#F4B8B8", 300: "#EB8E8E", 400: "#E06464",
  500: "#D14343", 600: "#B83434", 700: "#982B2B", 800: "#7C2626", 900: "#662222",
};
const violet = {
  50: "#F3F0FB", 100: "#E6E0F7", 200: "#CEC2EF", 300: "#B0A0E3", 400: "#8F7AD4",
  500: "#7560C4", 600: "#5F4BAA", 700: "#4C3C8A", 800: "#3D316F", 900: "#32295A",
};
const sky = {
  50: "#EAF6FB", 100: "#CDEBF6", 200: "#A3DAEE", 300: "#7FCBE6", 400: "#6FC3E2",
  500: "#2E9BC6", 600: "#2586AE", 700: "#1D6E8F", 800: "#185A75", 900: "#144A60",
};

module.exports = {
  presets: [base],
  theme: {
    extend: {
      colors: {
        brand: navy,
        primary: navy,
        // Gök mavisi — logo "boats", bilgi rozetleri, ikincil vurgu.
        accent: {
          50: "#EAF6FB",
          100: "#CDEBF6",
          200: "#A3DAEE",
          400: "#6FC3E2",
          500: "#2E9BC6",
          600: "#2586AE",
          700: "#1D6E8F",
          DEFAULT: "#2E9BC6",
        },
        ink: {
          50: "#EEEEF0",
          100: "#D5D6DA",
          400: "#4A505A",
          500: "#353A43",
          600: "#2A2F37",
          700: "#262B33",
          800: "#222830",
          900: "#181C22",
          DEFAULT: "#222830",
        },
        // Başarı rengi web'deki turkuaz-yeşil (#55A99D) ailesine çekildi.
        success: { 50: "#E9F6F3", 100: "#D2EEE7", 500: "#2F9E8A", 600: "#26866F", 700: "#1F6F60", DEFAULT: "#2F9E8A" },
        info: { 50: "#EAF6FB", 100: "#CDEBF6", 500: "#2E9BC6", 600: "#2586AE", 700: "#1D6E8F", DEFAULT: "#2E9BC6" },
        warning: { 50: amber[50], 100: amber[100], 500: amber[500], 600: amber[600], 700: amber[700], DEFAULT: amber[500] },
        danger: { 50: red[50], 100: red[100], 500: red[500], 600: red[600], 700: red[700], DEFAULT: red[500] },
        cream: { DEFAULT: "#FAF7F3", 100: "#F6F2EC", 200: "#EFE9E2" },
        gray,
        slate: gray,
        zinc: gray,
        neutral: gray,
        stone: gray,
        blue,
        indigo: blue,
        green,
        emerald: green,
        teal: green,
        yellow: amber,
        amber,
        orange: coral,
        red,
        rose: red,
        purple: violet,
        violet,
        sky,
        cyan: sky,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Manrope", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["32px", { lineHeight: "40px", fontWeight: "800", letterSpacing: "-0.03em" }],
        heading: ["24px", { lineHeight: "32px", fontWeight: "700", letterSpacing: "-0.02em" }],
        subheading: ["18px", { lineHeight: "26px", fontWeight: "700", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(34, 40, 48, 0.04), 0 10px 28px -20px rgba(34, 40, 48, 0.22)",
        "card-hover": "0 18px 40px -22px rgba(24, 61, 133, 0.38)",
        modal: "0 30px 80px -20px rgba(14, 32, 53, 0.4)",
      },
    },
  },
};
