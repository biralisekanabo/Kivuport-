"use client";

import { useEffect } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme";

export function SystemTheme() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => applyTheme(getStoredTheme());

    updateTheme();
    media.addEventListener("change", updateTheme);
    return () => {
      media.removeEventListener("change", updateTheme);
    };
  }, []);

  return null;
}
