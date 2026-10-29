import { ICONS } from "@/dashboard/icons";

/** A dashboard line icon, the same markup Dash.icon() produces at runtime. */
export default function Icon({ name, className = "i" }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }} />
  );
}
