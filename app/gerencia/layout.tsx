"use client";

import { useEffect } from "react";

export default function GerenciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Forçar tema light na página de gerência
    const forceLightTheme = () => {
      const html = document.documentElement;
      const body = document.body;
      
      // Remover classe dark se existir
      html.classList.remove("dark");
      body.classList.remove("dark");
      
      // Garantir que está em light
      html.classList.add("light");
      html.setAttribute("data-theme", "light");
      
      // Remover atributo data-theme do ThemeProvider se existir
      const themeProvider = document.querySelector('[data-theme]');
      if (themeProvider && themeProvider !== html) {
        (themeProvider as HTMLElement).removeAttribute("data-theme");
      }
    };

    // Aplicar imediatamente
    forceLightTheme();

    // Prevenir mudanças de tema - observar mudanças no HTML
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

    // Observar mudanças no HTML e body
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Também observar mudanças periódicas (caso o ThemeProvider force mudanças)
    // Verificar a cada 500ms para não sobrecarregar
    const interval = setInterval(forceLightTheme, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return <div className="light">{children}</div>;
}

