import HomeContent from "@/components/site/HomeContent";
import SiteFooter from "@/components/site/SiteFooter";

// Addresses that don't exist show the home page (with a 404 status)
export default function NotFound() {
  return (
    <>
      <HomeContent />
      <SiteFooter />
    </>
  );
}
