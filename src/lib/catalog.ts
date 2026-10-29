// Plans and the template catalog as visitors see them (sign-up, pricing). Mirrors Dash.PLANS() and
// Dash.TEMPLATES() in public/assets/dash.js, which the dashboards use, and the Worker's rules in plans.ts.
export type PlanId = "free" | "starter" | "business" | "pro";
export type Billing = "monthly" | "yearly";

export type Plan = { id: PlanId; name: string; price: number; blurb: string; features: string[] };

// Prices per month in Taka
export const PLANS: Plan[] = [
  { id: "free", name: "Free", price: 0, blurb: "Try Shopilier, free forever", features: ["5 page website", "3 products", "Free sub-domain"] },
  { id: "starter", name: "Starter", price: 249, blurb: "For getting started online", features: ["10 page website", "20 products", "Custom domain + support"] },
  { id: "business", name: "Business", price: 549, blurb: "For growing businesses", features: ["Unlimited pages", "100+ products", "Custom domain + support"] },
  { id: "pro", name: "Pro", price: 2499, blurb: "Everything unlimited", features: ["Unlimited pages", "Unlimited products", "Unlimited staff"] },
];
export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id);
export const taka = (n: number) => "৳" + Number(n).toLocaleString("en-US");

export type Template = {
  id: string; name: string; category: string; desc: string; layout: "split" | "center" | "bleed";
  bg: string; text: string; accent: string; headline: string; sub: string; cta: string; status: "published" | "draft";
};

export const TEMPLATES: Template[] = [
  { id: "luxe-store", name: "Luxe Store", category: "Online Store", desc: "A modern and elegant online store template for fashion, beauty and lifestyle brands.", layout: "split", bg: "#f7f4f0", text: "#111111", accent: "#111111", headline: "Modern Fashion For Everyone", sub: "Premium quality. Timeless style.", cta: "Shop Now", status: "published" },
  { id: "saas-landing", name: "SaaS Landing", category: "Landing Page", desc: "A clean and modern template for SaaS, startup and tech businesses.", layout: "center", bg: "#efedfd", text: "#121735", accent: "#4b5cf0", headline: "Build Better Products Faster", sub: "All the tools you need to launch, grow and manage your business.", cta: "Get Started", status: "published" },
  { id: "bistro-restaurant", name: "Bistro Restaurant", category: "Food & Drink", desc: "A stylish template for restaurants, cafes and food businesses.", layout: "bleed", bg: "#16110d", text: "#ffffff", accent: "#e8743b", headline: "Good Food Brings People Together", sub: "Fresh ingredients. Amazing taste. Unforgettable experience.", cta: "View Menu", status: "published" },
  { id: "nova-portfolio", name: "Nova Portfolio", category: "Portfolio", desc: "A minimalist portfolio template for creatives, designers and professionals.", layout: "split", bg: "#fafafa", text: "#111111", accent: "#111111", headline: "Product Designer & Creative Thinker", sub: "I design digital experiences that make a difference.", cta: "View My Work", status: "published" },
  { id: "growify-agency", name: "Growify Agency", category: "Agency", desc: "A modern template for agencies, consultancies and service-based businesses.", layout: "split", bg: "#fbfbfa", text: "#111111", accent: "#2f6b2a", headline: "We Help Brands Grow Online", sub: "Strategy, design, and development to take your business further.", cta: "Get Started", status: "published" },
  { id: "writely-blog", name: "Writely Blog", category: "Blog", desc: "A clean blog template for writers, creators and thought leaders.", layout: "split", bg: "#ffffff", text: "#111111", accent: "#3d6b8f", headline: "Stories, Ideas and Insights", sub: "A blog about design, business, productivity and life.", cta: "Read the Latest", status: "published" },
  { id: "fixly-services", name: "Fixly Services", category: "Services", desc: "A trustworthy template for repair, cleaning and local service businesses.", layout: "split", bg: "#eef4ff", text: "#0b1b46", accent: "#1d4ed8", headline: "Fast, Reliable Home Services", sub: "Book trusted local pros in under 60 seconds.", cta: "Book a Service", status: "published" },
  { id: "launchly-landing", name: "Launchly", category: "Landing Page", desc: "A bold one-page template to launch a product and collect sign-ups.", layout: "center", bg: "#0b0b1a", text: "#ffffff", accent: "#ff3d8b", headline: "Launch Your Idea This Weekend", sub: "Everything you need to go from idea to paying customers.", cta: "Get Early Access", status: "published" },
  { id: "mia-personal", name: "Mia Personal", category: "Personal", desc: "A warm personal site for your bio, links and contact details.", layout: "center", bg: "#fdf6ef", text: "#3b2418", accent: "#e0794f", headline: "Hi, I'm Mia", sub: "Writer, speaker & coffee lover.", cta: "Say Hello", status: "published" },
];
export const templateById = (id: string | null | undefined) => TEMPLATES.find((t) => t.id === id);

// Messages shown after "Continue with Google" fails (?error= on the sign-in and sign-up pages)
export const GOOGLE_ERRORS: Record<string, string> = {
  google: "Google sign-in didn't finish. Please try again.",
  google_email: "Your Google email isn't verified yet.",
  google_off: "Google sign-in isn't set up yet. Please use your email and password.",
};
