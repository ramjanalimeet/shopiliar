// Plans and the template catalog as visitors see them (sign-up, pricing). Mirrors Dash.PLANS() and
// Dash.TEMPLATES() in public/assets/dash.js, which the dashboards use, and the Worker's rules in plans.ts.
export type PlanId = "starter" | "business" | "pro";
export type Billing = "monthly" | "yearly";

export type Plan = { id: PlanId; name: string; price: number; blurb: string; features: string[] };

// Prices per month in Taka. Every plan comes with a free sub-domain, a custom domain and support.
export const PLANS: Plan[] = [
  { id: "starter", name: "Starter", price: 149, blurb: "For getting started online", features: ["10 page website", "10 products", "2 staff accounts", "Free sub-domain"] },
  { id: "business", name: "Business", price: 549, blurb: "For growing businesses", features: ["Unlimited pages", "100+ products", "10+ staff accounts", "Free sub-domain"] },
  { id: "pro", name: "Pro", price: 2499, blurb: "Everything unlimited", features: ["Unlimited pages", "Unlimited products", "Unlimited staff", "Free sub-domain"] },
];
export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id);
export const taka = (n: number) => "৳" + Number(n).toLocaleString("en-US");

export type Template = {
  id: string; name: string; category: string; brand: string; desc: string; layout: "split" | "center" | "bleed";
  bg: string; text: string; accent: string; headline: string; sub: string; cta: string; status: "published" | "draft";
};

// The nine store templates, in the order the Templates page shows them. "brand" is the sample shop in the preview.
export const TEMPLATES: Template[] = [
  { id: "luxe-store", name: "Fashion & Clothing", category: "Fashion & Clothing", brand: "LUXE", desc: "An elegant store for clothing, sarees, shoes and accessories.", layout: "split", bg: "#f7f4f0", text: "#111111", accent: "#111111", headline: "Modern Fashion For Everyone", sub: "Premium quality. Timeless style.", cta: "Shop Now", status: "published" },
  { id: "saas-landing", name: "Electronics & Gadgets", category: "Electronics & Gadgets", brand: "GadgetBari", desc: "A clean, modern store for phones, gadgets and accessories, with warranty details.", layout: "center", bg: "#efedfd", text: "#121735", accent: "#4b5cf0", headline: "Gadgets For Everyday Life", sub: "Phones, earbuds and smart home devices — with warranty and fast delivery.", cta: "Shop Now", status: "published" },
  { id: "mia-personal", name: "Beauty & Cosmetics", category: "Beauty & Cosmetics", brand: "Glow", desc: "A warm, friendly store for skincare, cosmetics and beauty products.", layout: "center", bg: "#fdf6ef", text: "#3b2418", accent: "#e0794f", headline: "Skincare That Loves You Back", sub: "Natural beauty, made for Bangladeshi skin.", cta: "Shop Skincare", status: "published" },
  { id: "bistro-restaurant", name: "Grocery & Food", category: "Grocery & Food", brand: "Fresh Bazar", desc: "A bold store for groceries, fresh food and daily essentials with same-day delivery.", layout: "bleed", bg: "#16110d", text: "#ffffff", accent: "#e8743b", headline: "Fresh Food At Your Door", sub: "Vegetables, fish and pantry staples, delivered the same day.", cta: "Shop Now", status: "published" },
  { id: "growify-agency", name: "Home & Furniture", category: "Home & Furniture", brand: "Lume Home", desc: "A calm, spacious store for furniture, lighting and home decor.", layout: "split", bg: "#fbfbfa", text: "#111111", accent: "#2f6b2a", headline: "Furniture For Modern Living", sub: "Sofas, tables and decor, delivered across Bangladesh.", cta: "Shop Furniture", status: "published" },
  { id: "nova-portfolio", name: "Jewelry & Accessories", category: "Jewelry & Accessories", brand: "Rupkotha", desc: "A minimal, premium store for jewelry, watches and accessories.", layout: "split", bg: "#fafafa", text: "#111111", accent: "#111111", headline: "Jewelry Made To Be Remembered", sub: "Gold, silver and pearl pieces for every occasion.", cta: "Shop Jewelry", status: "published" },
  { id: "writely-blog", name: "Single Product", category: "Single Product", brand: "Trailo", desc: "A story-led one-page shop for a single hero product, with features and reviews.", layout: "split", bg: "#ffffff", text: "#111111", accent: "#3d6b8f", headline: "One Bag For Every Trail", sub: "A 40-litre backpack built for Bandarban to Sajek.", cta: "Pre-order Now", status: "published" },
  { id: "fixly-services", name: "Single Product", category: "Single Product", brand: "FixKit", desc: "A one-page shop that sells one product, with what's inside, a warranty and FAQ.", layout: "split", bg: "#eef4ff", text: "#0b1b46", accent: "#1d4ed8", headline: "The Only Tool Kit You'll Ever Need", sub: "Everything for home repairs, in one box.", cta: "Order Now", status: "published" },
  { id: "launchly-landing", name: "Single Product", category: "Single Product", brand: "Nova Buds", desc: "A bold launch page for one product, with pre-orders and early-bird pricing.", layout: "center", bg: "#0b0b1a", text: "#ffffff", accent: "#ff3d8b", headline: "One Product. Done Right.", sub: "Wireless earbuds with a 30-hour battery and a 2-year warranty.", cta: "Pre-order Now", status: "published" }
];
export const templateById = (id: string | null | undefined) => TEMPLATES.find((t) => t.id === id);

// Messages shown after "Continue with Google" fails (?error= on the sign-in and sign-up pages)
export const GOOGLE_ERRORS: Record<string, string> = {
  google: "Google sign-in didn't finish. Please try again.",
  google_email: "Your Google email isn't verified yet.",
  google_off: "Google sign-in isn't set up yet. Please use your email and password.",
};
