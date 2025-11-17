"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Sector, User } from "@/types";
import { SectorSLAConfig, BusinessHours, Holiday } from "@/types/sla";
import { Plus, Trash2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function SLAConfig() {
  const { toast } = useToast();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<SectorSLAConfig[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: sectorsData },
        { data: usersData },
        { data: slaData },
        { data: bhData },
        { data: holidaysData },
      ] = await Promise.all([
        supabase.from("sectors").select("*"),
        supabase
          .from("users")
          .select("*")
          .in("role", ["admin", "super_admin"]),
        supabase.from("sector_sla_config").select("*"),
        supabase.from("business_hours").select("*"),
        supabase.from("holidays").select("*"),
      ]);

      setSectors(sectorsData || []);
      setUsers(usersData || []);
      setSlaConfigs(slaData || []);
      setBusinessHours(bhData || []);
      setHolidays(holidaysData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSLAConfig = async (
    sectorId: string,
    priority: string,
    slaHours: number,
    escalationHours?: number,
    escalationTo?: string
  ) => {
    try {
      const { error } = await supabase.from("sector_sla_config").upsert({
        sector_id: sectorId,
        priority,
        sla_hours: slaHours,
        escalation_hours: escalationHours || null,
        escalation_to: escalationTo || null,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração de SLA salva",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveBusinessHours = async (
    sectorId: string | null,
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => {
    try {
      const { error } = await supabase.from("business_hours").upsert({
        sector_id: sectorId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Horário de funcionamento salvo",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddHoliday = async (
    name: string,
    date: string,
    sectorId: string | null,
    isRecurring: boolean
  ) => {
    try {
      const { error } = await supabase.from("holidays").insert({
        name,
        date,
        sector_id: sectorId,
        is_recurring: isRecurring,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Feriado adicionado",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Configuração de SLA por Prioridade */}
      <Card>
        <CardHeader>
          <CardTitle>SLA por Prioridade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sectors.map((sector) => (
            <div
              key={sector.id}
              className="space-y-2 border-b pb-4 last:border-0"
            >
              <h3 className="font-semibold">{sector.name}</h3>
              {(["baixa", "media", "alta", "critica"] as const).map(
                (priority) => {
                  const config = slaConfigs.find(
                    (c) => c.sector_id === sector.id && c.priority === priority
                  );
                  return (
                    <SLAConfigRow
                      key={priority}
                      sectorId={sector.id}
                      priority={priority}
                      initialConfig={config}
                      users={users}
                      onSave={handleSaveSLAConfig}
                    />
                  );
                }
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Horários de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessHoursConfig
            sectors={sectors}
            businessHours={businessHours}
            onSave={handleSaveBusinessHours}
          />
        </CardContent>
      </Card>

      {/* Feriados */}
      <Card>
        <CardHeader>
          <CardTitle>Feriados</CardTitle>
        </CardHeader>
        <CardContent>
          <HolidaysConfig
            sectors={sectors}
            holidays={holidays}
            onAdd={handleAddHoliday}
            onDelete={async (id) => {
              await supabase.from("holidays").delete().eq("id", id);
              loadData();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SLAConfigRow({
  sectorId,
  priority,
  initialConfig,
  users,
  onSave,
}: {
  sectorId: string;
  priority: string;
  initialConfig?: SectorSLAConfig;
  users: User[];
  onSave: (
    sectorId: string,
    priority: string,
    slaHours: number,
    escalationHours?: number,
    escalationTo?: string
  ) => void;
}) {
  const [slaHours, setSlaHours] = useState(initialConfig?.sla_hours || 24);
  const [escalationHours, setEscalationHours] = useState(
    initialConfig?.escalation_hours || undefined
  );
  const [escalationTo, setEscalationTo] = useState(
    initialConfig?.escalation_to || ""
  );

  return (
    <div className="flex items-center gap-4 p-2 bg-muted/50 rounded">
      <Label className="w-20">{priority}</Label>
      <Input
        type="number"
        value={slaHours}
        onChange={(e) => setSlaHours(parseInt(e.target.value) || 24)}
        className="w-24"
        min="1"
      />
      <span className="text-sm text-muted-foreground">horas</span>
      <Input
        type="number"
        value={escalationHours || ""}
        onChange={(e) =>
          setEscalationHours(
            e.target.value ? parseInt(e.target.value) : undefined
          )
        }
        placeholder="Escalação (horas)"
        className="w-32"
        min="0"
      />
      <Select value={escalationTo || "none"} onValueChange={setEscalationTo}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Escalar para" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhum</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        onClick={() =>
          onSave(
            sectorId,
            priority,
            slaHours,
            escalationHours,
            escalationTo === "none" ? undefined : escalationTo || undefined
          )
        }
      >
        <Save className="h-4 w-4" />
      </Button>
    </div>
  );
}

function BusinessHoursConfig({
  sectors,
  businessHours,
  onSave,
}: {
  sectors: Sector[];
  businessHours: BusinessHours[];
  onSave: (
    sectorId: string | null,
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => void;
}) {
  const days = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda" },
    { value: 2, label: "Terça" },
    { value: 3, label: "Quarta" },
    { value: 4, label: "Quinta" },
    { value: 5, label: "Sexta" },
    { value: 6, label: "Sábado" },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium">Global (todos os setores)</h4>
        {days.map((day) => {
          const config = businessHours.find(
            (bh) => !bh.sector_id && bh.day_of_week === day.value
          );
          return (
            <BusinessHoursRow
              key={day.value}
              day={day.label}
              dayOfWeek={day.value}
              sectorId={null}
              initialConfig={config}
              onSave={onSave}
            />
          );
        })}
      </div>
      {sectors.map((sector) => (
        <div key={sector.id} className="space-y-2">
          <h4 className="font-medium">{sector.name}</h4>
          {days.map((day) => {
            const config = businessHours.find(
              (bh) => bh.sector_id === sector.id && bh.day_of_week === day.value
            );
            return (
              <BusinessHoursRow
                key={day.value}
                day={day.label}
                dayOfWeek={day.value}
                sectorId={sector.id}
                initialConfig={config}
                onSave={onSave}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function BusinessHoursRow({
  day,
  dayOfWeek,
  sectorId,
  initialConfig,
  onSave,
}: {
  day: string;
  dayOfWeek: number;
  sectorId: string | null;
  initialConfig?: BusinessHours;
  onSave: (
    sectorId: string | null,
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => void;
}) {
  const [startTime, setStartTime] = useState(
    initialConfig?.start_time || "09:00"
  );
  const [endTime, setEndTime] = useState(initialConfig?.end_time || "18:00");

  return (
    <div className="flex items-center gap-4 p-2 bg-muted/50 rounded">
      <Label className="w-24">{day}</Label>
      <Input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        className="w-32"
      />
      <span>até</span>
      <Input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        className="w-32"
      />
      <Button
        size="sm"
        onClick={() => onSave(sectorId, dayOfWeek, startTime, endTime)}
      >
        <Save className="h-4 w-4" />
      </Button>
    </div>
  );
}

function HolidaysConfig({
  sectors,
  holidays,
  onAdd,
  onDelete,
}: {
  sectors: Sector[];
  holidays: Holiday[];
  onAdd: (
    name: string,
    date: string,
    sectorId: string | null,
    isRecurring: boolean
  ) => void;
  onDelete: (id: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [sectorId, setSectorId] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = () => {
    if (!name || !date) return;
    onAdd(name, date, sectorId, isRecurring);
    setName("");
    setDate("");
    setSectorId(null);
    setIsRecurring(false);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Feriado
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Feriado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Setor (deixe vazio para global)</Label>
              <Select
                value={sectorId || "global"}
                onValueChange={(value) => setSectorId(value === "global" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Global" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <Label>Recorrente (todos os anos)</Label>
            </div>
            <Button onClick={handleSubmit}>Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {holidays.map((holiday) => (
          <div
            key={holiday.id}
            className="flex items-center justify-between p-2 bg-muted/50 rounded"
          >
            <div>
              <span className="font-medium">{holiday.name}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {new Date(holiday.date).toLocaleDateString("pt-BR")}
              </span>
              {holiday.is_recurring && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Recorrente)
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(holiday.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
