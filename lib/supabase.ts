import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Log de configuração
if (typeof window === "undefined") {
  // Server-side logging
  console.log("🔌 [Supabase] Inicializando cliente...");
  console.log(
    "📋 [Supabase] URL:",
    supabaseUrl ? "✅ Configurada" : "❌ Não configurada"
  );
  console.log(
    "🔑 [Supabase] Key:",
    supabaseAnonKey ? "✅ Configurada" : "❌ Não configurada"
  );
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ [Supabase] ERRO: Variáveis de ambiente faltando!");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌");
  console.error(
    "   NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "✅" : "❌"
  );
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  global: {
    headers: {
      "x-client-info": "sistema-chamados@1.0.0",
    },
  },
});

// Função para testar conexão
export async function testSupabaseConnection() {
  try {
    console.log("🧪 [Supabase] Testando conexão...");

    const startTime = Date.now();
    const result = await supabase.from("users").select("count").limit(1);

    const { data, error, status } = result;

    const duration = Date.now() - startTime;

    if (error) {
      // Erro 42501 = permission denied (RLS)
      // Erro 42P01 = relation does not exist
      if (error.code === "42501") {
        console.error("❌ [Supabase] ERRO: Permissão negada (RLS habilitado)");
        console.error(
          "   💡 Solução: Execute 'supabase/disable-rls.sql' no SQL Editor"
        );
        console.error("   Código:", error.code);
        console.error("   Mensagem:", error.message);
      } else if (error.code === "42P01") {
        console.error("❌ [Supabase] ERRO: Tabela não existe");
        console.error(
          "   💡 Solução: Execute 'supabase/schema.sql' no SQL Editor"
        );
        console.error("   Código:", error.code);
        console.error("   Mensagem:", error.message);
      } else {
        console.error("❌ [Supabase] ERRO na conexão:");
        console.error("   Código:", error.code);
        console.error("   Mensagem:", error.message);
        console.error("   Detalhes:", error.details);
      }
      return { success: false, error, duration };
    }

    console.log("✅ [Supabase] Conexão estabelecida com sucesso!");
    console.log("   ⏱️  Tempo de resposta:", duration + "ms");
    console.log("   📊 Status HTTP:", status || "N/A");
    return { success: true, duration, status };
  } catch (error: any) {
    console.error("❌ [Supabase] ERRO ao testar conexão:");
    console.error("   Tipo:", error?.constructor?.name);
    console.error("   Mensagem:", error?.message);
    return { success: false, error, duration: 0 };
  }
}

// Testar conexão na inicialização (apenas server-side)
if (typeof window === "undefined" && process.env.NODE_ENV === "development") {
  // Testar conexão após um pequeno delay para não bloquear a inicialização
  setTimeout(() => {
    testSupabaseConnection().then((result) => {
      if (result.success) {
        console.log("🎉 [Supabase] Sistema pronto para uso!");
      } else {
        console.warn(
          "⚠️  [Supabase] Verifique a configuração do banco de dados"
        );
      }
    });
  }, 1000);
}
