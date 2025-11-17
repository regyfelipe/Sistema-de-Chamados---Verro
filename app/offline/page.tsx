import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiOff className="h-6 w-6" />
              Você está offline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Parece que você perdeu a conexão com a internet. Verifique sua
              conexão e tente novamente.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Tentar novamente
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Ir para Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

