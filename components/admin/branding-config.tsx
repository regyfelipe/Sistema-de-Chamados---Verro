"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Image as ImageIcon, Palette, Layout } from "lucide-react"
import { getBrandingConfig, updateBrandingConfig, uploadLogo, uploadFavicon } from "@/lib/branding"
import type { BrandingConfig } from "@/types/branding"
import { applyBrandingColors } from "@/lib/branding"
import Image from "next/image"

export function BrandingConfig() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<BrandingConfig | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)

  useEffect(() => {
    loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const branding = await getBrandingConfig()
      setConfig(branding)
      
      // Aplicar cores se existirem
      if (branding) {
        applyBrandingColors({
          primary: branding.primary_color,
          secondary: branding.secondary_color,
          accent: branding.accent_color,
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar configuração de branding",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      let logoUrl = config.logo_url
      let faviconUrl = config.favicon_url

      // Upload de logo se houver arquivo
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile)
      }

      // Upload de favicon se houver arquivo
      if (faviconFile) {
        faviconUrl = await uploadFavicon(faviconFile)
      }

      // Atualizar configuração
      const updated = await updateBrandingConfig({
        ...config,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
      })

      setConfig(updated)
      setLogoFile(null)
      setFaviconFile(null)

      // Aplicar cores
      if (updated) {
        applyBrandingColors({
          primary: updated.primary_color,
          secondary: updated.secondary_color,
          accent: updated.accent_color,
        })
      }

      // Atualizar favicon no head
      if (faviconUrl) {
        updateFaviconInHead(faviconUrl)
      }

      toast({
        title: "Sucesso",
        description: "Configuração de branding atualizada com sucesso",
      })

      // Recarregar página para aplicar mudanças
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configuração",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateFaviconInHead = (url: string) => {
    // Remover favicons existentes
    const existingFavicons = document.querySelectorAll('link[rel="icon"]')
    existingFavicons.forEach((fav) => fav.remove())

    // Adicionar novo favicon
    const link = document.createElement("link")
    link.rel = "icon"
    link.href = url
    document.head.appendChild(link)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personalização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personalização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Erro ao carregar configuração</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cores Personalizadas
          </CardTitle>
          <CardDescription>
            Personalize as cores principais do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={config.primary_color}
                  onChange={(e) =>
                    setConfig({ ...config, primary_color: e.target.value })
                  }
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={config.primary_color}
                  onChange={(e) =>
                    setConfig({ ...config, primary_color: e.target.value })
                  }
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={config.secondary_color}
                  onChange={(e) =>
                    setConfig({ ...config, secondary_color: e.target.value })
                  }
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={config.secondary_color}
                  onChange={(e) =>
                    setConfig({ ...config, secondary_color: e.target.value })
                  }
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color">Cor de Destaque</Label>
              <div className="flex gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={config.accent_color}
                  onChange={(e) =>
                    setConfig({ ...config, accent_color: e.target.value })
                  }
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={config.accent_color}
                  onChange={(e) =>
                    setConfig({ ...config, accent_color: e.target.value })
                  }
                  placeholder="#10b981"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo e Favicon
          </CardTitle>
          <CardDescription>
            Faça upload do logo e favicon da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {config.logo_url && (
                  <div className="relative h-16 w-48 border rounded p-2">
                    <Image
                      src={config.logo_url}
                      alt="Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setLogoFile(file)
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recomendado: PNG ou SVG, máximo 2MB
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="flex items-center gap-4">
                {config.favicon_url && (
                  <div className="relative h-8 w-8 border rounded">
                    <Image
                      src={config.favicon_url}
                      alt="Favicon"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setFaviconFile(file)
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recomendado: ICO ou PNG 32x32, máximo 100KB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Layout e Informações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input
              id="company-name"
              value={config.company_name}
              onChange={(e) =>
                setConfig({ ...config, company_name: e.target.value })
              }
              placeholder="Nome da Empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="layout-style">Estilo de Layout</Label>
            <Select
              value={config.layout_style}
              onValueChange={(value: any) =>
                setConfig({ ...config, layout_style: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão</SelectItem>
                <SelectItem value="compact">Compacto</SelectItem>
                <SelectItem value="spacious">Espaçoso</SelectItem>
                <SelectItem value="modern">Moderno</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}

