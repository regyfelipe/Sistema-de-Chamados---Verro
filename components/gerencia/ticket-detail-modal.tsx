"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Ticket, Comment, TicketHistory, Attachment } from "@/types";
import { TicketRating } from "@/types/ratings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  User,
  MessageSquare,
  FileText,
  Star,
  History,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getRatingsByTicket } from "@/lib/ratings";
import { TicketRatingDisplay } from "@/components/tickets/ticket-rating-display";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface TicketDetailModalProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDetailModal({
  ticketId,
  open,
  onOpenChange,
}: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [rating, setRating] = useState<TicketRating | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ticketId) {
      fetchTicketDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticketId]);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      // Buscar ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select(
          `
          *,
          sector:sectors(id, name),
          created_by_user:users!tickets_created_by_fkey(id, name, email),
          assigned_to_user:users!tickets_assigned_to_fkey(id, name, email)
        `
        )
        .eq("id", ticketId)
        .single();

      if (ticketError || !ticketData) {
        console.error("Erro ao buscar ticket:", ticketError);
        setLoading(false);
        return;
      }

      // Buscar comentários
      const { data: commentsData } = await supabase
        .from("comments")
        .select(
          `
          *,
          user:users(id, name, email)
        `
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      // Buscar histórico
      const { data: historyData } = await supabase
        .from("ticket_history")
        .select(
          `
          *,
          user:users(id, name, email)
        `
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      // Buscar anexos
      const { data: attachmentsData } = await supabase
        .from("attachments")
        .select(
          `
          *,
          user:users(id, name, email)
        `
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      // Buscar avaliação (todas as avaliações do ticket)
      const ratingsData = await getRatingsByTicket(ticketId);

      setTicket(ticketData as any);
      setComments(commentsData || []);
      setHistory(historyData || []);
      setAttachments(attachmentsData || []);
      setRating(ratingsData.length > 0 ? ratingsData[0] : null);
    } catch (error) {
      console.error("Erro ao buscar detalhes do ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critica":
        return "bg-red-500 text-white";
      case "alta":
        return "bg-orange-500 text-white";
      case "media":
        return "bg-yellow-500 text-white";
      case "baixa":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "critica":
        return "Crítica";
      case "alta":
        return "Alta";
      case "media":
        return "Média";
      case "baixa":
        return "Baixa";
      default:
        return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "bg-blue-100 text-blue-800";
      case "em_atendimento":
        return "bg-yellow-100 text-yellow-800";
      case "aguardando":
        return "bg-orange-100 text-orange-800";
      case "fechado":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberto":
        return "Aberto";
      case "em_atendimento":
        return "Em Atendimento";
      case "aguardando":
        return "Aguardando";
      case "fechado":
        return "Fechado";
      default:
        return status;
    }
  };

  if (!open || !ticketId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {loading ? "Carregando..." : ticket?.title || "Detalhes do Chamado"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Carregando detalhes...</p>
            </div>
          </div>
        ) : ticket ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Informações Principais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações do Chamado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Status
                      </p>
                      <Badge className={cn("mt-1", getStatusColor(ticket.status))}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Prioridade
                      </p>
                      <Badge
                        className={cn("mt-1", getPriorityColor(ticket.priority))}
                      >
                        {getPriorityLabel(ticket.priority)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Setor
                      </p>
                      <p className="mt-1">
                        {ticket.sector?.name || "Sem setor"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Criado em
                      </p>
                      <p className="mt-1">
                        {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Criado por
                      </p>
                      <p className="mt-1">
                        {(ticket as any).created_by_user?.name || "Desconhecido"}
                      </p>
                    </div>
                    {(ticket as any).assigned_to_user && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Atendido por
                        </p>
                        <p className="mt-1">
                          {(ticket as any).assigned_to_user.name}
                        </p>
                      </div>
                    )}
                    {ticket.sla_due_date && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          SLA Vencimento
                        </p>
                        <p className="mt-1">
                          {format(
                            new Date(ticket.sla_due_date),
                            "dd/MM/yyyy HH:mm",
                            {
                              locale: ptBR,
                            }
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Descrição
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Avaliação do Atendimento */}
              {rating && (
                <div>
                  <TicketRatingDisplay rating={rating} />
                </div>
              )}

              {/* Histórico de Alterações */}
              {history.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Histórico de Alterações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="rounded-full p-2 bg-muted">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">
                                {item.user?.name || "Sistema"}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {format(
                                  new Date(item.created_at),
                                  "dd/MM/yyyy HH:mm",
                                  {
                                    locale: ptBR,
                                  }
                                )}
                              </span>
                            </div>
                            <p className="text-sm">{item.action}</p>
                            {item.old_value && item.new_value && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <span className="line-through">
                                  {item.old_value}
                                </span>
                                {" → "}
                                <span className="font-medium">
                                  {item.new_value}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comentários */}
              {comments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comentários ({comments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            comment.is_internal
                              ? "bg-yellow-50 border-yellow-200"
                              : "bg-card"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">
                              {comment.user?.name || "Desconhecido"}
                            </p>
                            {comment.is_internal && (
                              <Badge variant="outline" className="text-xs">
                                Interno
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(
                                new Date(comment.created_at),
                                "dd/MM/yyyy HH:mm",
                                {
                                  locale: ptBR,
                                }
                              )}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Anexos */}
              {attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Anexos ({attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Anexos ({attachments.length})</h4>
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 rounded border bg-muted/30"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachment.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(attachment.file_size / 1024).toFixed(1)} KB •{" "}
                                  {format(new Date(attachment.created_at), "dd MMM yyyy", {
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attachment.file_path, "_blank")}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {history.length === 0 &&
                comments.length === 0 &&
                attachments.length === 0 &&
                !rating && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma informação adicional disponível</p>
                  </div>
                )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Chamado não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

