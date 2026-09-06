"use client";

import { useEffect } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme";

export function SystemTheme() {
  const themeScript = `
    (() => {
      const preference = localStorage.getItem("kivuport-theme");
      const resolved = preference === "dark" || (preference !== "light" && matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.style.colorScheme = resolved;
    })();
  `;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => applyTheme(getStoredTheme());

    updateTheme();
    media.addEventListener("change", updateTheme);
    return () => {
      media.removeEventListener("change", updateTheme);
    };
  }, []);

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
