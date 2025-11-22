import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import { canAccessTicket } from "@/lib/ticket-access";
import { supabase } from "@/lib/supabase";

async function getTicket(id: string, userId?: string) {
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      sector:sectors(*),
      created_by_user:users!tickets_created_by_fkey(*),
      assigned_to_user:users!tickets_assigned_to_fkey(*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !ticket) {
    return null;
  }

  
  const { data: comments } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:users(*)
    `
    )
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  
  const { data: history } = await supabase
    .from("ticket_history")
    .select(
      `
      *,
      user:users(*)
    `
    )
    .eq("ticket_id", id)
    .order("created_at", { ascending: false });

  
  const { data: attachments } = await supabase
    .from("attachments")
    .select(
      `
      *,
      user:users(*)
    `
    )
    .eq("ticket_id", id)
    .order("created_at", { ascending: false });

  
  let rating = null;
  if (userId && ticket.created_by === userId) {
    const { data: ratingData } = await supabase
      .from("ticket_ratings")
      .select(
        `
        *,
        user:users(id, name, email)
      `
      )
      .eq("ticket_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    rating = ratingData;
  }

  return {
    ...ticket,
    comments: comments || [],
    history: history || [],
    attachments: attachments || [],
    rating: rating || null,
  };
}

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const ticket = await getTicket(params.id, session.user.id);

  if (!ticket) {
    notFound();
  }

  
  const { data: userData } = await supabase
    .from("users")
    .select("sector_id")
    .eq("id", session.user.id)
    .single();

  
  const hasAccess = await canAccessTicket(
    ticket,
    session.user.id,
    session.user.role || "solicitante",
    userData?.sector_id
  );

  if (!hasAccess) {
    redirect("/tickets");
  }

  return (
    <MainLayout>
      <TicketDetail ticket={ticket} currentUser={session.user} />
    </MainLayout>
  );
}
