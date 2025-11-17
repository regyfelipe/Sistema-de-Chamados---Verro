import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "./supabase";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Missing credentials");
          return null;
        }

        try {
          console.log("🔐 [Auth] Tentando autenticar:", credentials.email);

          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .single();

          if (error) {
            console.error("❌ [Auth] Erro do Supabase:");
            console.error("   Código:", error.code);
            console.error("   Mensagem:", error.message);
            console.error("   Detalhes:", error.details);

            if (error.code === "42501") {
              console.error("   💡 ERRO DE PERMISSÃO: RLS está habilitado!");
              console.error(
                "   💡 Execute 'supabase/disable-rls.sql' no SQL Editor"
              );
            }

            return null;
          }

          if (!data) {
            console.error(
              "❌ [Auth] Usuário não encontrado:",
              credentials.email
            );
            return null;
          }

          console.log("✅ [Auth] Usuário encontrado:", data.email);
          console.log("   Nome:", data.name);
          console.log("   Role:", data.role);

          // Em produção, usar bcrypt para verificar senha
          // Por enquanto, validação simples
          if (data.password !== credentials.password) {
            console.error("❌ [Auth] Senha inválida para:", credentials.email);
            return null;
          }

          console.log("✅ [Auth] Autenticação bem-sucedida!");
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
