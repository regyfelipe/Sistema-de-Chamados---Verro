"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  AutomationRule,
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
} from "@/types/automations";
import { Plus, Trash2, Save, Play, Pause } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export function AutomationsManager() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("priority", { ascending: true });

      if (error) throw error;
      setRules((data || []) as AutomationRule[]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (rule: Partial<AutomationRule>) => {
    try {
      if (editingRule?.id) {
        const { error } = await supabase
          .from("automation_rules")
          .update({
            ...rule,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("automation_rules").insert([
          {
            ...rule,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Regra salva com sucesso",
      });
      setDialogOpen(false);
      setEditingRule(null);
      loadRules();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (rule: AutomationRule) => {
    try {
      const { error } = await supabase
        .from("automation_rules")
        .update({ is_active: !rule.is_active })
        .eq("id", rule.id);

      if (error) throw error;
      loadRules();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) return;

    try {
      const { error } = await supabase
        .from("automation_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadRules();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automações e Workflows</h2>
          <p className="text-muted-foreground">
            Configure regras automáticas para gerenciar chamados
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRule(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <AutomationRuleForm
              rule={editingRule}
              onSave={handleSaveRule}
              onCancel={() => {
                setDialogOpen(false);
                setEditingRule(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma regra de automação configurada
              </p>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>{rule.name}</CardTitle>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    <Badge variant="outline">
                      {rule.trigger_event.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRule(rule);
                        setDialogOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {rule.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {rule.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Condições:</span>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {rule.conditions.length === 0
                        ? "Sem condições (sempre executa)"
                        : rule.conditions
                            .map(
                              (c) =>
                                `${c.field} ${c.operator} ${c.value}`
                            )
                            .join(", ")}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Ações:</span>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {rule.actions
                        .map((a) => `${a.type} (${JSON.stringify(a.params)})`)
                        .join(", ")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function AutomationRuleForm({
  rule,
  onSave,
  onCancel,
}: {
  rule: AutomationRule | null;
  onSave: (rule: Partial<AutomationRule>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(rule?.name || "");
  const [description, setDescription] = useState(rule?.description || "");
  const [triggerEvent, setTriggerEvent] = useState<AutomationTrigger>(
    rule?.trigger_event || "ticket_created"
  );
  const [priority, setPriority] = useState(rule?.priority || 0);
  const [isActive, setIsActive] = useState(rule?.is_active ?? true);
  const [conditions, setConditions] = useState<AutomationCondition[]>(
    rule?.conditions || []
  );
  const [actions, setActions] = useState<AutomationAction[]>(
    rule?.actions || []
  );

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    onSave({
      name,
      description,
      trigger_event: triggerEvent,
      priority,
      is_active: isActive,
      conditions,
      actions,
    });
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>
          {rule ? "Editar Regra" : "Nova Regra de Automação"}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label>Nome *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Atribuir tickets de TI automaticamente"
          />
        </div>

        <div>
          <Label>Descrição</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o que esta regra faz..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Evento Trigger *</Label>
            <Select
              value={triggerEvent}
              onValueChange={(value) => setTriggerEvent(value as AutomationTrigger)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ticket_created">Ticket Criado</SelectItem>
                <SelectItem value="ticket_updated">Ticket Atualizado</SelectItem>
                <SelectItem value="status_changed">Status Alterado</SelectItem>
                <SelectItem value="comment_added">Comentário Adicionado</SelectItem>
                <SelectItem value="sla_warning">SLA Próximo</SelectItem>
                <SelectItem value="sla_expired">SLA Vencido</SelectItem>
                <SelectItem value="no_response_days">Sem Resposta (dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Prioridade</Label>
            <Input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Menor número = executa primeiro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label>Regra Ativa</Label>
        </div>

        <div>
          <Label>Condições</Label>
          <ConditionBuilder
            conditions={conditions}
            onChange={setConditions}
          />
        </div>

        <div>
          <Label>Ações</Label>
          <ActionBuilder actions={actions} onChange={setActions} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </div>
    </div>
  );
}

function ConditionBuilder({
  conditions,
  onChange,
}: {
  conditions: AutomationCondition[];
  onChange: (conditions: AutomationCondition[]) => void;
}) {
  const addCondition = () => {
    onChange([
      ...conditions,
      { field: "title", operator: "contains", value: "" },
    ]);
  };

  const updateCondition = (index: number, condition: AutomationCondition) => {
    const updated = [...conditions];
    updated[index] = condition;
    onChange(updated);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded">
          <Select
            value={condition.field}
            onValueChange={(value) =>
              updateCondition(index, { ...condition, field: value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Título</SelectItem>
              <SelectItem value="description">Descrição</SelectItem>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="sector_id">Setor</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={condition.operator}
            onValueChange={(value) =>
              updateCondition(index, {
                ...condition,
                operator: value as AutomationCondition["operator"],
              })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">Igual a</SelectItem>
              <SelectItem value="not_equals">Diferente de</SelectItem>
              <SelectItem value="contains">Contém</SelectItem>
              <SelectItem value="not_contains">Não contém</SelectItem>
              <SelectItem value="starts_with">Começa com</SelectItem>
              <SelectItem value="ends_with">Termina com</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={condition.value}
            onChange={(e) =>
              updateCondition(index, { ...condition, value: e.target.value })
            }
            placeholder="Valor"
            className="flex-1"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeCondition(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addCondition}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Condição
      </Button>
    </div>
  );
}

function ActionBuilder({
  actions,
  onChange,
}: {
  actions: AutomationAction[];
  onChange: (actions: AutomationAction[]) => void;
}) {
  const addAction = () => {
    onChange([...actions, { type: "assign_ticket", params: {} }]);
  };

  const updateAction = (index: number, action: AutomationAction) => {
    const updated = [...actions];
    updated[index] = action;
    onChange(updated);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {actions.map((action, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded">
          <Select
            value={action.type}
            onValueChange={(value) =>
              updateAction(index, {
                ...action,
                type: value as AutomationAction["type"],
                params: {},
              })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assign_ticket">Atribuir Ticket</SelectItem>
              <SelectItem value="change_priority">Alterar Prioridade</SelectItem>
              <SelectItem value="change_status">Alterar Status</SelectItem>
              <SelectItem value="send_notification">Enviar Notificação</SelectItem>
              <SelectItem value="close_ticket">Fechar Ticket</SelectItem>
              <SelectItem value="add_comment">Adicionar Comentário</SelectItem>
            </SelectContent>
          </Select>

          <ActionParamsEditor
            action={action}
            onChange={(params) =>
              updateAction(index, { ...action, params })
            }
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeAction(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addAction}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Ação
      </Button>
    </div>
  );
}

function ActionParamsEditor({
  action,
  onChange,
}: {
  action: AutomationAction;
  onChange: (params: Record<string, any>) => void;
}) {
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const params = action.params || {};

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, name")
      .in("role", ["atendente", "admin", "super_admin"])
      .order("name");
    setUsers(data || []);
  };

  const updateParam = (key: string, value: any) => {
    onChange({ ...params, [key]: value });
  };

  switch (action.type) {
    case "assign_ticket":
      return (
        <Select
          value={params.user_id || ""}
          onValueChange={(value) => updateParam("user_id", value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione usuário" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "change_priority":
      return (
        <Select
          value={params.priority || ""}
          onValueChange={(value) => updateParam("priority", value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="critica">Crítica</SelectItem>
          </SelectContent>
        </Select>
      );

    case "change_status":
      return (
        <Select
          value={params.status || ""}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="fechado">Fechado</SelectItem>
          </SelectContent>
        </Select>
      );

    case "send_notification":
      return (
        <div className="space-y-2 w-64">
          <Select
            key={`notification-select-${params.user_ids?.length || 0}`}
            value="add-user"
            onValueChange={(value) => {
              if (value === "add-user") return;
              const currentIds = Array.isArray(params.user_ids)
                ? params.user_ids
                : [];
              if (!currentIds.includes(value)) {
                updateParam("user_ids", [...currentIds, value]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Adicionar usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add-user" disabled>Selecione um usuário</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {Array.isArray(params.user_ids) && params.user_ids.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {params.user_ids.map((userId: string) => {
                const user = users.find((u) => u.id === userId);
                return (
                  <Badge
                    key={userId}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      updateParam(
                        "user_ids",
                        params.user_ids.filter((id: string) => id !== userId)
                      );
                    }}
                  >
                    {user?.name || userId}
                    <span className="ml-1">×</span>
                  </Badge>
                );
              })}
            </div>
          )}
          <Input
            placeholder="Título da notificação"
            value={params.title || ""}
            onChange={(e) => updateParam("title", e.target.value)}
          />
          <Textarea
            placeholder="Mensagem"
            value={params.message || ""}
            onChange={(e) => updateParam("message", e.target.value)}
            rows={2}
          />
        </div>
      );

    case "add_comment":
      return (
        <div className="space-y-2 w-64">
          <Select
            value={params.user_id || "creator"}
            onValueChange={(value) => updateParam("user_id", value === "creator" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Usuário (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creator">Criador do ticket</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Conteúdo do comentário"
            value={params.content || ""}
            onChange={(e) => updateParam("content", e.target.value)}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={params.is_internal || false}
              onChange={(e) => updateParam("is_internal", e.target.checked)}
            />
            <Label className="text-sm">Comentário interno</Label>
          </div>
        </div>
      );

    default:
      return <div className="text-sm text-muted-foreground">Sem parâmetros</div>;
  }
}

