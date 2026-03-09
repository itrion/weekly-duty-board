import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  BoardItemKind,
  BoardItemWithAssignments,
  Kid,
  UpdateBoardItemRequest,
} from "@shared/schema";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getTaskIcon, TASK_ICON_OPTIONS } from "@/lib/task-icons";

const DAY_OPTIONS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

type TaskEditorSheetProps = {
  open: boolean;
  item: BoardItemWithAssignments | null;
  kids: Kid[];
  assignedKidIds: number[];
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (itemKind: BoardItemKind, itemId: number, data: UpdateBoardItemRequest) => Promise<void>;
  onReplaceAssignments: (itemKind: BoardItemKind, itemId: number, kidIds: number[]) => Promise<void>;
  onCreateKid: (name: string) => Promise<void>;
  onDeleteKid: (kidId: number) => Promise<void>;
};

type TaskFormState = {
  title: string;
  timeInfo: string;
  type: "daily" | "weekly";
  requiredDays: number[];
  points: number;
  icon: string;
};

function itemToForm(item: BoardItemWithAssignments): TaskFormState {
  return {
    title: item.title,
    timeInfo: item.timeInfo ?? "",
    type: item.type === "weekly" ? "weekly" : "daily",
    requiredDays: [...item.requiredDays].sort((a, b) => a - b),
    points: item.points,
    icon: item.icon ?? "sparkles",
  };
}

export function TaskEditorSheet({
  open,
  item,
  kids,
  assignedKidIds,
  isSaving,
  onOpenChange,
  onSave,
  onReplaceAssignments,
  onCreateKid,
  onDeleteKid,
}: TaskEditorSheetProps) {
  const [form, setForm] = useState<TaskFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iconQuery, setIconQuery] = useState("");
  const [recentIcons, setRecentIcons] = useState<string[]>([]);
  const [newKidName, setNewKidName] = useState("");
  const [selectedKidIds, setSelectedKidIds] = useState<number[]>([]);

  useEffect(() => {
    if (!item) {
      setForm(null);
      setError(null);
      setIconQuery("");
      return;
    }
    setForm(itemToForm(item));
    setError(null);
    setIconQuery("");
    setSelectedKidIds(assignedKidIds);
  }, [item, assignedKidIds]);

  useEffect(() => {
    setSelectedKidIds(assignedKidIds);
  }, [assignedKidIds]);

  const selectedIconOption = useMemo(
    () => TASK_ICON_OPTIONS.find((option) => option.value === form?.icon) ?? null,
    [form?.icon],
  );

  const SelectedIcon = getTaskIcon(form?.icon);
  const normalizedIconQuery = iconQuery.trim().toLowerCase();

  const filteredIconOptions = useMemo(() => {
    if (!normalizedIconQuery) return TASK_ICON_OPTIONS;
    return TASK_ICON_OPTIONS.filter((option) => {
      const searchable = [option.label, option.value, ...option.keywords].join(" ").toLowerCase();
      return searchable.includes(normalizedIconQuery);
    });
  }, [normalizedIconQuery]);

  const recentIconOptions = useMemo(() => {
    const recents = recentIcons
      .map((value) => TASK_ICON_OPTIONS.find((option) => option.value === value))
      .filter((option): option is (typeof TASK_ICON_OPTIONS)[number] => Boolean(option));

    if (!normalizedIconQuery) return recents.slice(0, 8);
    return recents.filter((option) => {
      const searchable = [option.label, option.value, ...option.keywords].join(" ").toLowerCase();
      return searchable.includes(normalizedIconQuery);
    });
  }, [recentIcons, normalizedIconQuery]);

  const toggleRequiredDay = (dayValue: number, enabled: boolean) => {
    setForm((prev) => {
      if (!prev) return prev;
      const nextSet = new Set(prev.requiredDays);
      if (enabled) nextSet.add(dayValue);
      else nextSet.delete(dayValue);
      return {
        ...prev,
        requiredDays: Array.from(nextSet).sort((a, b) => a - b),
      };
    });
  };

  const handleSelectIcon = (iconValue: string) => {
    setForm((prev) => (prev ? { ...prev, icon: iconValue } : prev));
    setRecentIcons((prev) => [iconValue, ...prev.filter((value) => value !== iconValue)].slice(0, 8));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item || !form) return;

    const title = form.title.trim();
    if (!title) {
      setError("El titulo es obligatorio.");
      return;
    }

    if (form.requiredDays.length === 0) {
      setError("Selecciona al menos un dia requerido.");
      return;
    }
    if (selectedKidIds.length === 0) {
      setError("Selecciona al menos un niño asignado.");
      return;
    }

    const payload: UpdateBoardItemRequest = {
      title,
      timeInfo: form.timeInfo.trim() ? form.timeInfo.trim() : null,
      type: form.type,
      requiredDays: form.requiredDays,
      points: Math.max(1, Math.round(form.points || 1)),
      icon: form.icon.trim() ? form.icon.trim() : null,
    };

    try {
      await onSave(item.itemKind, item.id, payload);
      await onReplaceAssignments(item.itemKind, item.id, selectedKidIds);
      setError(null);
    } catch (_err) {
      setError("No se pudo guardar.");
    }
  };

  const toggleAssignedKid = (kidId: number, enabled: boolean) => {
    setSelectedKidIds((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(kidId);
      else next.delete(kidId);
      return Array.from(next);
    });
  };

  const handleCreateKid = async () => {
    const name = newKidName.trim();
    if (!name) {
      setError("El nombre del niño es obligatorio.");
      return;
    }
    try {
      await onCreateKid(name);
      setNewKidName("");
      setError(null);
    } catch (_err) {
      setError("No se pudo crear el niño.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(92vw,430px)] sm:max-w-none p-0">
        <form className="h-full flex flex-col" onSubmit={handleSubmit}>
          <SheetHeader className="p-5 border-b">
            <SheetTitle className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SelectedIcon className="h-4 w-4" />
              </span>
              {item?.itemKind === "routine" ? "Editar Rutina" : "Editar Tarea"}
            </SheetTitle>
            <SheetDescription>
              Cambia los campos y guarda para actualizar este elemento del tablero.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-5 p-5">
              <div className="space-y-2">
                <Label htmlFor="task-title">Titulo</Label>
                <Input
                  id="task-title"
                  value={form?.title ?? ""}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                  }
                  maxLength={120}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Niños asignados</Label>
                <div className="space-y-2 rounded-md border border-border p-3">
                  {kids.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay niños creados todavía.</p>
                  ) : (
                    kids.map((kid) => (
                      <div key={kid.id} className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedKidIds.includes(kid.id)}
                            onCheckedChange={(checked) => toggleAssignedKid(kid.id, checked === true)}
                          />
                          <span>{kid.name}</span>
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteKid(kid.id)}
                        >
                          Quitar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newKidName}
                    onChange={(event) => setNewKidName(event.target.value)}
                    placeholder="Añadir niño"
                    maxLength={60}
                  />
                  <Button type="button" variant="outline" onClick={handleCreateKid}>
                    Añadir
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-time-info">timeInfo</Label>
                <Input
                  id="task-time-info"
                  value={form?.timeInfo ?? ""}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, timeInfo: event.target.value } : prev))
                  }
                  maxLength={120}
                  placeholder="Ej: Antes de las 20:00"
                />
              </div>

              <div className="space-y-2">
                <Label>type</Label>
                <Select
                  value={form?.type ?? "daily"}
                  onValueChange={(value: "daily" | "weekly") =>
                    setForm((prev) => (prev ? { ...prev, type: value } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">daily</SelectItem>
                    <SelectItem value="weekly">weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>required days</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DAY_OPTIONS.map((day) => (
                    <label
                      key={day.value}
                      className="flex items-center gap-2 rounded-md border border-border px-2 py-2 text-sm"
                    >
                      <Checkbox
                        checked={form?.requiredDays.includes(day.value) ?? false}
                        onCheckedChange={(checked) => toggleRequiredDay(day.value, checked === true)}
                      />
                      <span>{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-points">points</Label>
                <Input
                  id="task-points"
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={form?.points ?? 1}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, points: Number.parseInt(event.target.value || "1", 10) || 1 }
                        : prev,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>icon</Label>
                <div className="rounded-md border border-border overflow-hidden">
                  <div className="flex items-center gap-4 border-b px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">Iconos</span>
                    <span className="text-muted-foreground">Tareas del hogar</span>
                  </div>

                  <div className="border-b p-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={iconQuery}
                        onChange={(event) => setIconQuery(event.target.value)}
                        placeholder="Filtrar iconos..."
                        className="h-8 pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 p-3">
                    {recentIconOptions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recientes</p>
                        <div className="grid grid-cols-8 gap-2">
                          {recentIconOptions.map((option) => (
                            <button
                              key={`recent-${option.value}`}
                              type="button"
                              title={option.label}
                              onClick={() => handleSelectIcon(option.value)}
                              className={cn(
                                "h-9 w-9 rounded-md border flex items-center justify-center transition-colors",
                                form?.icon === option.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50 hover:bg-accent",
                              )}
                            >
                              <option.Icon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Iconos</p>
                      {filteredIconOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay iconos para ese filtro.</p>
                      ) : (
                        <div className="grid grid-cols-8 gap-2 max-h-44 overflow-y-auto pr-1">
                          {filteredIconOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              title={option.label}
                              onClick={() => handleSelectIcon(option.value)}
                              className={cn(
                                "h-9 w-9 rounded-md border flex items-center justify-center transition-colors",
                                form?.icon === option.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50 hover:bg-accent",
                              )}
                            >
                              <option.Icon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Seleccionado:{" "}
                  <span className="font-medium text-foreground">
                    {selectedIconOption?.label ?? form?.icon ?? "Sin icono"}
                  </span>
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </ScrollArea>

          <SheetFooter className="border-t p-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!form || isSaving}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
