"use client";
import { useEffect } from "react";
import { start } from "@/dashboard/demo.entry";

// Starts the live demo once React has drawn the shell. Its code ships with the page, so it starts
// as soon as the page has hydrated instead of after another download.
export default function DemoApp() {
  useEffect(() => { start(); }, []);
  return null;
}
