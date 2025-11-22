"use client";

import { useEffect } from "react";

export default function GerenciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const forceLightTheme = () => {
      const html = document.documentElement;
      const body = document.body;
      
      html.classList.remove("dark");
      body.classList.remove("dark");
      
      html.classList.add("light");
      html.setAttribute("data-theme", "light");
      
      const themeProvider = document.querySelector('[data-theme]');
      if (themeProvider && themeProvider !== html) {
        (themeProvider as HTMLElement).removeAttribute("data-theme");
      }
    };

    forceLightTheme();

    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains("dark")) {
            forceLightTheme();
          }
        }
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          const target = mutation.target as HTMLElement;
          if (target.getAttribute("data-theme") !== "light") {
            forceLightTheme();
          }
        }
      });
    });

    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    
    
    const interval = setInterval(forceLightTheme, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return <div className="light">{children}</div>;
}

