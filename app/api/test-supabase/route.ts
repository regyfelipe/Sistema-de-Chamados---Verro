import { supabase, testSupabaseConnection } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  console.log("📡 [API] Teste do Supabase solicitado");
  
  try {
    // Primeiro, testar conexão
    const connectionTest = await testSupabaseConnection();
    
    // Testar conexão básica
    console.log("📊 [API] Buscando dados de usuários...");
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(5)

    // Testar setores
    console.log("📊 [API] Buscando dados de setores...");
    const { data: sectors, error: sectorsError } = await supabase
      .from('sectors')
      .select('id, name')
      .limit(5)

    const response = {
      success: connectionTest.success,
      connection: connectionTest,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      },
      users: {
        data: users,
        error: usersError,
        count: users?.length || 0,
      },
      sectors: {
        data: sectors,
        error: sectorsError,
        count: sectors?.length || 0,
      },
    };

    console.log("✅ [API] Resposta preparada:", {
      connection: connectionTest.success ? "✅" : "❌",
      users: users?.length || 0,
      sectors: sectors?.length || 0,
    });

    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

