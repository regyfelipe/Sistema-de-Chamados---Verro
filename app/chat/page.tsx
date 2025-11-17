import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ChatPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Chat Geral</h1>
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle>Chat Geral</CardTitle>
            <p className="text-sm text-muted-foreground">
              Converse com todos os usuários do sistema
            </p>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-80px)]">
            <ChatInterface />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

