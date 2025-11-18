"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { createNotificationsForUsers } from "@/lib/notifications";
import { useI18n } from "@/components/providers/i18n-provider";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
}: CreateTicketDialogProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sector_id: "",
    priority: "media" as "baixa" | "media" | "alta" | "critica",
  });
  const [sectors, setSectors] = useState<Array<{ id: string; name: string }>>(
    []
  );

  // Carregar setores quando o dialog abrir
  useEffect(() => {
    if (open) {
      loadSectors();
    }
  }, [open]);

  const loadSectors = async () => {
    const { data } = await supabase
      .from("sectors")
      .select("id, name")
      .order("name");

    if (data) {
      setSectors(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um chamado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Usar o sistema de SLA avançado
      const { calculateSLADueDate } = await import("@/lib/advanced-sla");

      // Criar ticket temporário para calcular SLA
      const tempTicket = {
        id: "",
        title: formData.title,
        description: formData.description,
        sector_id: formData.sector_id,
        priority: formData.priority,
        status: "aberto" as const,
        created_by: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const slaDueDate = await calculateSLADueDate(tempTicket as any);

      const { error } = await supabase.from("tickets").insert({
        title: formData.title,
        description: formData.description,
        sector_id: formData.sector_id,
        priority: formData.priority,
        created_by: session.user.id,
        status: "aberto",
        sla_due_date: slaDueDate.toISOString(),
      });

      if (error) throw error;

      // Buscar o ticket recém-criado
      const { data: tickets } = await supabase
        .from("tickets")
        .select("id")
        .eq("created_by", session.user.id)
        .eq("title", formData.title)
        .order("created_at", { ascending: false })
        .limit(1);

      if (tickets && tickets.length > 0) {
        const ticketId = tickets[0].id;

        await supabase.from("ticket_history").insert({
          ticket_id: ticketId,
          user_id: session.user.id,
          action: "Chamado criado",
        });

        // Buscar ticket completo para automações
        const { data: fullTicket } = await supabase
          .from("tickets")
          .select(`
            *,
            sector:sectors(*),
            created_by_user:users!tickets_created_by_fkey(*),
            assigned_to_user:users!tickets_assigned_to_fkey(*)
          `)
          .eq("id", ticketId)
          .single();

        // Disparar automações para ticket criado
        if (fullTicket) {
          const { triggerAutomations } = await import("@/lib/automation-engine");
          await triggerAutomations("ticket_created", fullTicket as any);
        }

        // Notificar atendentes do setor
        const { data: attendants } = await supabase
          .from("users")
          .select("id")
          .eq("sector_id", formData.sector_id)
          .in("role", ["atendente", "admin", "super_admin"]);

        if (attendants && attendants.length > 0) {
          const attendantIds = attendants.map((a) => a.id);
          await createNotificationsForUsers(attendantIds, {
            type: "ticket_created",
            title: "Novo chamado criado",
            message: `Um novo chamado foi criado: "${formData.title}"`,
            ticket_id: ticketId,
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Chamado criado com sucesso!",
      });

      setFormData({
        title: "",
        description: "",
        sector_id: "",
        priority: "media",
      });
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar chamado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[600px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl">{t("tickets.create")}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t("tickets.create")} - {t("common.loading")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="title" className="text-xs sm:text-sm font-medium">
              {t("tickets.titleLabel")} *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Problema com impressora"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              autoFocus
              className="h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="sector" className="text-xs sm:text-sm font-medium">
              {t("tickets.sector")} *
            </Label>
            <Select
              value={formData.sector_id}
              onValueChange={(value) =>
                setFormData({ ...formData, sector_id: value })
              }
              required
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id} className="text-sm sm:text-base">
                    {sector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="priority" className="text-xs sm:text-sm font-medium">
              {t("tickets.priority")}
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value: any) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa" className="text-sm sm:text-base">
                  {t("tickets.priorities.baixa")}
                </SelectItem>
                <SelectItem value="media" className="text-sm sm:text-base">
                  {t("tickets.priorities.media")}
                </SelectItem>
                <SelectItem value="alta" className="text-sm sm:text-base">
                  {t("tickets.priorities.alta")}
                </SelectItem>
                <SelectItem value="critica" className="text-sm sm:text-base">
                  {t("tickets.priorities.critica")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm font-medium">
              {t("tickets.description")} *
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva o problema ou solicitação..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={4}
              className="text-sm sm:text-base resize-none min-h-[100px] sm:min-h-[120px]"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
            >
              {t("common.cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
            >
              {loading ? t("tickets.creating") : t("tickets.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
