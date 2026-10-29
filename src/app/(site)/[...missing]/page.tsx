import { notFound } from "next/navigation";

// Anything no page or file answers is a 404 shown with the home page
export default function Missing() {
  notFound();
}
