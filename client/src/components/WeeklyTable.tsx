import { useState } from "react";
import { BoardItemWithAssignments, Completion, Kid, BoardItemKind } from "@shared/schema";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight, Plus, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTaskIcon } from "@/lib/task-icons";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface WeeklyTableProps {
  items: BoardItemWithAssignments[];
  completions: Completion[];
  kids: Kid[];
  selectedKidId?: number;
  onSelectKid: (kidId: number) => void;
  onCreateKid: () => Promise<void>;
  onCreateItem: () => void;
  onRenameKid: (kidId: number, name: string) => Promise<void>;
  isKidMutationPending: boolean;
  currentDate: Date;
  weekLabel: string;
  totalPointsPossible: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onOpenWeekPicker: () => void;
  onPrint: () => void;
  onToggle: (itemKind: BoardItemKind, itemId: number, date: string, currentStatus: boolean) => void;
  onEditItem: (item: BoardItemWithAssignments) => void;
  isPending: boolean;
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function WeeklyTable({
  items,
  completions,
  kids,
  selectedKidId,
  onSelectKid,
  onCreateKid,
  onCreateItem,
  onRenameKid,
  isKidMutationPending,
  currentDate,
  weekLabel,
  totalPointsPossible,
  onPreviousWeek,
  onNextWeek,
  onOpenWeekPicker,
  onPrint,
  onToggle,
  onEditItem,
  isPending,
}: WeeklyTableProps) {
  const [editingKidId, setEditingKidId] = useState<number | null>(null);
  const [editedKidName, setEditedKidName] = useState("");

  // Calculate week dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Helper to check if a task is completed on a specific date
  const isCompleted = (itemKind: BoardItemKind, itemId: number, dateStr: string) => {
    return completions.some((completion) => {
      if (!completion.completed || completion.date !== dateStr) return false;
      if (itemKind === "task") return completion.taskId === itemId;
      return completion.routineId === itemId;
    });
  };

  // Helper to check if a task is required on a specific day index (0-6, Sunday is 0)
  const isRequiredDay = (item: BoardItemWithAssignments, date: Date) => {
    const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon...
    return item.requiredDays.includes(dayIndex);
  };

  const dailyItems = items.filter((item) => item.type === "daily");
  const weeklyItems = items.filter((item) => item.type === "weekly");

  const startRename = (kid: Kid) => {
    setEditingKidId(kid.id);
    setEditedKidName(kid.name);
  };

  const cancelRename = () => {
    setEditingKidId(null);
    setEditedKidName("");
  };

  const saveRename = async () => {
    if (editingKidId === null) return;

    const trimmed = editedKidName.trim();
    if (!trimmed) {
      cancelRename();
      return;
    }

    const current = kids.find((kid) => kid.id === editingKidId);
    if (current?.name === trimmed) {
      cancelRename();
      return;
    }

    try {
      await onRenameKid(editingKidId, trimmed);
      cancelRename();
    } catch {
      // Keep editing mode if the update fails (e.g. duplicated name).
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-xl overflow-hidden border border-border/50">
      <div className="flex flex-col gap-2 px-3 py-2 border-b border-border bg-slate-50/70 print:bg-white print:px-2 print:py-1">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <Tabs
              value={selectedKidId ? String(selectedKidId) : undefined}
              onValueChange={(value) => onSelectKid(Number(value))}
            >
              <TabsList className="h-auto w-max bg-transparent p-0 gap-1 pr-2 rounded-none border-b border-border">
                {kids.map((kid) => {
                  const isEditing = editingKidId === kid.id;

                  if (isEditing) {
                    return (
                      <div key={kid.id} className="min-w-[100px] max-w-[160px] mb-[-1px]">
                        <Input
                          value={editedKidName}
                          onChange={(e) => setEditedKidName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void saveRename();
                            }

                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelRename();
                            }
                          }}
                          onBlur={cancelRename}
                          autoFocus
                          disabled={isKidMutationPending}
                          className="h-7 border-0 rounded-none px-2 text-xs bg-transparent"
                          aria-label="Editar nombre de niño"
                        />
                      </div>
                    );
                  }

                  return (
                    <TabsTrigger
                      key={kid.id}
                      value={String(kid.id)}
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        startRename(kid);
                      }}
                      className={cn(
                        "h-7 min-w-[100px] max-w-[160px] px-2",
                        "justify-start text-left",
                        "rounded-none border-b-2 border-transparent bg-transparent shadow-none text-muted-foreground text-xs",
                        "data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                      )}
                      title={kid.name}
                    >
                      <span className="block w-full truncate">{kid.name}</span>
                    </TabsTrigger>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    void onCreateKid().catch(() => undefined);
                  }}
                  disabled={isKidMutationPending}
                  className="h-7 w-7 mb-[-1px] shrink-0 rounded-none border-b-2 border-dashed border-primary text-primary bg-transparent hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
                  aria-label="Añadir niño"
                >
                  <Plus className="h-3.5 w-3.5 mx-auto" />
                </button>
              </TabsList>
            </Tabs>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="flex items-center bg-white rounded-md border border-border shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 min-h-7 print:hidden"
                onClick={onPreviousWeek}
                aria-label="Semana anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <button
                type="button"
                onClick={onOpenWeekPicker}
                className="px-2 py-1 text-xs md:text-sm font-medium border-x border-border whitespace-nowrap"
                title="Seleccionar semana"
              >
                {weekLabel}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 min-h-7 print:hidden"
                onClick={onNextWeek}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="rounded-md border border-border bg-white px-2 py-1 whitespace-nowrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1.5">Puntos:</span>
              <span className="font-mono text-sm font-bold text-primary">______/{totalPointsPossible}</span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onCreateItem}
              className="no-print print:hidden"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo
            </Button>

            <Button
              size="sm"
              onClick={onPrint}
              className="no-print print:hidden bg-primary text-primary-foreground"
            >
              <Printer className="mr-1.5 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[300px_repeat(7,1fr)] bg-primary text-primary-foreground">
        <div className="p-4 font-display font-bold text-lg tracking-wider flex items-center">TAREA</div>
        {DAYS.map((day, i) => (
          <div key={day} className="p-3 text-center border-l border-primary-foreground/20 flex flex-col justify-center items-center">
            <span className="font-bold text-sm uppercase tracking-widest">{day.substring(0, 3)}</span>
            <span className="text-xs opacity-80">{format(weekDates[i], "d MMM", { locale: es })}</span>
          </div>
        ))}
      </div>

      {/* Daily Tasks Section */}
      <div className="bg-secondary/30">
        <div className="px-4 py-2 text-xs font-bold text-primary uppercase tracking-widest border-b border-border">Tareas y Rutinas Diarias</div>
      </div>

      {dailyItems.length === 0 && weeklyItems.length === 0 && (
        <div className="p-6 text-sm text-muted-foreground border-b border-border/60">
          Este niño no tiene tareas ni rutinas asignadas todavía.
        </div>
      )}

      {dailyItems.map((item, idx) => {
        const Icon = getTaskIcon(item.icon);
        const isRoutine = item.itemKind === "routine";
        return (
          <div
            key={`${item.itemKind}-${item.id}`}
            className={cn(
              "grid grid-cols-[300px_repeat(7,1fr)] border-b border-border/60 hover:bg-slate-50 transition-colors",
              idx === dailyItems.length - 1 && "border-b-2 border-primary/20",
            )}
          >
            <button
              type="button"
              onClick={() => onEditItem(item)}
              className="p-4 flex w-full items-center gap-3 border-r border-border/60 text-left transition-colors hover:bg-primary/5"
            >
              <div
                className={cn(
                  "p-2 rounded-full",
                  isRoutine ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary",
                )}
              >
                <Icon size={18} />
              </div>
              <div>
                <div className="font-medium text-foreground">{item.title}</div>
                {item.timeInfo && <div className="text-xs text-muted-foreground mt-0.5 font-medium">{item.timeInfo}</div>}
              </div>
            </button>

            {weekDates.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const checked = isCompleted(item.itemKind, item.id, dateStr);
              const required = isRequiredDay(item, date);

              return (
                <div key={dateStr} className="flex items-center justify-center border-r border-border/40 last:border-r-0">
                  <button
                    disabled={!required || isPending}
                    onClick={() => required && onToggle(item.itemKind, item.id, dateStr, checked)}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                      !required && "bg-slate-100 border-slate-200 cursor-not-allowed opacity-50",
                      required && !checked && "bg-white border-slate-300 hover:border-primary hover:bg-primary/5 cursor-pointer",
                      required && checked && "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-100 checkbox-checked",
                    )}
                  >
                    {checked && <Check strokeWidth={3} className="w-5 h-5 md:w-6 md:h-6" />}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Weekly Tasks Section */}
      <div className="bg-secondary/30">
        <div className="px-4 py-2 text-xs font-bold text-primary uppercase tracking-widest border-b border-border">Tareas y Rutinas Semanales</div>
      </div>

      {weeklyItems.map((item, idx) => {
        const Icon = getTaskIcon(item.icon);
        const isRoutine = item.itemKind === "routine";
        return (
          <div
            key={`${item.itemKind}-${item.id}`}
            className={cn(
              "grid grid-cols-[300px_repeat(7,1fr)] border-b border-border/60 hover:bg-slate-50 transition-colors",
              idx === weeklyItems.length - 1 && "border-b-0",
            )}
          >
            <button
              type="button"
              onClick={() => onEditItem(item)}
              className="p-4 flex w-full items-center gap-3 border-r border-border/60 text-left transition-colors hover:bg-primary/5"
            >
              <div
                className={cn(
                  "p-2 rounded-full",
                  isRoutine ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600",
                )}
              >
                <Icon size={18} />
              </div>
              <div>
                <div className="font-medium text-foreground">{item.title}</div>
                {item.timeInfo && <div className="text-xs text-muted-foreground mt-0.5 font-medium">{item.timeInfo}</div>}
              </div>
            </button>

            {weekDates.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const checked = isCompleted(item.itemKind, item.id, dateStr);
              const required = isRequiredDay(item, date);

              return (
                <div key={dateStr} className="flex items-center justify-center border-r border-border/40 last:border-r-0 bg-slate-50/50">
                  <button
                    disabled={!required || isPending}
                    onClick={() => required && onToggle(item.itemKind, item.id, dateStr, checked)}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                      !required && "bg-slate-100 border-slate-200 opacity-30 cursor-default",
                      required && !checked && "bg-white border-slate-300 hover:border-primary hover:bg-primary/5 cursor-pointer",
                      required && checked && "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-100 checkbox-checked",
                    )}
                  >
                    {checked && <Check strokeWidth={3} className="w-5 h-5 md:w-6 md:h-6" />}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
