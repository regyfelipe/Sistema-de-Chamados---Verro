"use client";

import { useState, useEffect } from "react";
import { getBrandingConfig } from "@/lib/branding";
import { BrandingConfig } from "@/types/branding";
import Image from "next/image";
import { useI18n } from "@/components/providers/i18n-provider";

export function BrandedLogo() {
  const { t } = useI18n();
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const branding = await getBrandingConfig();
      setConfig(branding);
    } catch (error) {
      console.error("Erro ao carregar branding:", error);
    } finally {
      setLoading(false);
    }
  };

 
 
 

  if (loading) {
    return (
      <h2 className="text-xs sm:text-sm font-semibold truncate max-w-[30px] sm:max-w-[35px] xl:max-w-none">
        <span className="hidden xl:inline">Sistema de Chamados</span>
        <span className="xl:hidden">SC</span>
      </h2>
    );
  }

  if (config?.logo_url) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative h-4 sm:h-5 md:h-6 lg:h-7 xl:h-8 w-auto">
          <Image
            src={config.logo_url}
            alt={config.company_name || t("common.appName")}
            width={120}
            height={32}
            className="h-4 sm:h-5 md:h-6 lg:h-7 xl:h-8 w-auto object-contain max-w-[35px] sm:max-w-[40px] md:max-w-[50px] lg:max-w-[60px] xl:max-w-[80px]"
            priority
          />
        </div>
        {/* Nome da empresa aparece em telas grandes (xl: 1280px+) - usando CSS puro */}
        {config.company_name && (
          <span className="hidden xl:inline text-xs sm:text-sm font-medium truncate max-w-[100px]">
            {config.company_name}
          </span>
        )}
      </div>
    );
  }

 
 
 
  const fullText = config?.company_name || t("common.appName");
  const shortText = config?.company_name?.substring(0, 2).toUpperCase() || "SC";

  return (
    <h2 className="text-xs sm:text-sm font-semibold truncate max-w-[30px] sm:max-w-[35px] xl:max-w-none">
      {/* Texto completo - visível em telas >= 1280px (xl) usando CSS puro */}
      <span className="hidden xl:inline">{fullText}</span>
      {/* Texto curto - visível em todas as telas < 1280px */}
      <span className="xl:hidden">{shortText}</span>
    </h2>
  );
}
