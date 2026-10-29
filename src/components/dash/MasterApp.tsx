"use client";
import { useEffect } from "react";
import { start } from "@/dashboard/master.entry";

// Starts the master dashboard once React has drawn the shell. Its code ships with the page, so it starts
// as soon as the page has hydrated instead of after another download.
export default function MasterApp() {
  useEffect(() => { start(); }, []);
  return null;
}
