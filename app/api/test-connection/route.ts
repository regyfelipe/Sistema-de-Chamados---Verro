import { testSupabaseConnection } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("📡 [API] Teste de conexão solicitado");

  const result = await testSupabaseConnection();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    ...result,
    environment: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
