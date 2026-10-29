"use client";
import { useEffect } from "react";
import { start } from "@/dashboard/admin.entry";

// Starts the store owner dashboard once React has drawn the shell. Its code ships with the page, so it starts
// as soon as the page has hydrated instead of after another download.
export default function AdminApp() {
  useEffect(() => { start(); }, []);
  return null;
}
