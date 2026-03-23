import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BoardItemWithAssignments, BoardItemKind, Completion, Kid } from "@shared/schema";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight, GripVertical, Plus, Printer } from "lucide-react";
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
  onReorderItems: (
    type: "daily" | "weekly",
    orderedItems: Array<{ itemKind: BoardItemKind; itemId: number }>,
  ) => Promise<void>;
  onEditItem: (item: BoardItemWithAssignments) => void;
  isPending: boolean;
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function itemKey(item: Pick<BoardItemWithAssignments, "itemKind" | "id">) {
  return `${item.itemKind}-${item.id}`;
}

function moveItem(
  items: BoardItemWithAssignments[],
  sourceKey: string,
  targetKey: string,
) {
  const nextItems = [...items];
  const sourceIndex = nextItems.findIndex((item) => itemKey(item) === sourceKey);
  const targetIndex = nextItems.findIndex((item) => itemKey(item) === targetKey);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return nextItems;
  }

  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedItem);
  return nextItems;
}

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
  onReorderItems,
  onEditItem,
  isPending,
}: WeeklyTableProps) {
  const [editingKidId, setEditingKidId] = useState<number | null>(null);
  const [editedKidName, setEditedKidName] = useState("");
  const [draggedItemKey, setDraggedItemKey] = useState<string | null>(null);
  const [draggedItemType, setDraggedItemType] = useState<"daily" | "weekly" | null>(null);
  const [dragOverItemKey, setDragOverItemKey] = useState<string | null>(null);
  const [boardPrintScale, setBoardPrintScale] = useState(1);
  const boardShellRef = useRef<HTMLDivElement | null>(null);
  const boardFrameRef = useRef<HTMLDivElement | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const isCompleted = (itemKind: BoardItemKind, itemId: number, dateStr: string) => {
    return completions.some((completion) => {
      if (!completion.completed || completion.date !== dateStr) return false;
      if (itemKind === "task") return completion.taskId === itemId;
      return completion.routineId === itemId;
    });
  };

  const isRequiredDay = (item: BoardItemWithAssignments, date: Date) => {
    return item.requiredDays.includes(date.getDay());
  };

  const dailyItems = items.filter((item) => item.type === "daily");
  const weeklyItems = items.filter((item) => item.type === "weekly");

  useEffect(() => {
    const shell = boardShellRef.current;
    const frame = boardFrameRef.current;
    if (!shell || !frame) return;

    const measurePrintScale = () => {
      const shellHeight = shell.getBoundingClientRect().height;
      const boardHeight = frame.getBoundingClientRect().height;

      if (shellHeight <= 0 || boardHeight <= 0) {
        setBoardPrintScale(1);
        return;
      }

      const nextScale = Math.min(1, shellHeight / boardHeight);

      setBoardPrintScale(nextScale);
    };

    measurePrintScale();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      measurePrintScale();
    });

    resizeObserver.observe(shell);
    resizeObserver.observe(frame);

    return () => {
      resizeObserver.disconnect();
    };
  }, [dailyItems.length, weeklyItems.length, selectedKidId, weekLabel]);

  const boardPrintStyle = {
    "--board-print-scale": String(boardPrintScale),
  } as CSSProperties;

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
      // Keep editing mode if the update fails.
    }
  };

  const resetDragState = () => {
    setDraggedItemKey(null);
    setDraggedItemType(null);
    setDragOverItemKey(null);
  };

  const handleDrop = async (targetItem: BoardItemWithAssignments) => {
    if (!draggedItemKey || !draggedItemType || draggedItemType !== targetItem.type) {
      resetDragState();
      return;
    }

    const targetKey = itemKey(targetItem);
    const sourceItems = draggedItemType === "daily" ? dailyItems : weeklyItems;
    const reorderedItems = moveItem(sourceItems, draggedItemKey, targetKey);
    const orderChanged =
      reorderedItems.map((item) => itemKey(item)).join("|") !==
      sourceItems.map((item) => itemKey(item)).join("|");

    resetDragState();

    if (!orderChanged) return;

    await onReorderItems(
      draggedItemType,
      reorderedItems.map((item) => ({
        itemKind: item.itemKind,
        itemId: item.id,
      })),
    );
  };

  const renderRow = (item: BoardItemWithAssignments, isLast: boolean) => {
    const Icon = getTaskIcon(item.icon);
    const isRoutine = item.itemKind === "routine";
    const key = itemKey(item);
    const showDropIndicator = dragOverItemKey === key && draggedItemKey !== key;

    return (
      <div
        key={key}
        data-board-row="true"
        onDragOver={(event) => {
          if (!draggedItemKey || draggedItemType !== item.type || draggedItemKey === key) return;
          event.preventDefault();
          setDragOverItemKey(key);
        }}
        onDragLeave={() => {
          if (dragOverItemKey === key) {
            setDragOverItemKey(null);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          void handleDrop(item);
        }}
        className={cn(
          "grid grid-cols-[300px_repeat(7,1fr)] border-b border-border/60 text-sm transition-colors print:text-[13px]",
          item.type === "daily" && isLast && "border-b-2 border-primary/20",
          item.type === "weekly" && isLast && "border-b-0",
          showDropIndicator && "bg-primary/5",
        )}
      >
        <div className="flex border-r border-border/60">
          <button
            type="button"
            draggable={!isPending}
            onDragStart={(event) => {
              setDraggedItemKey(key);
              setDraggedItemType(item.type);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", key);
            }}
            onDragEnd={resetDragState}
            onClick={(event) => event.preventDefault()}
            disabled={isPending}
            className={cn(
              "no-print flex w-10 shrink-0 items-center justify-center border-r border-border/60 text-muted-foreground transition-colors",
              "hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label={`Arrastrar para ordenar ${item.title}`}
            title="Arrastrar para ordenar"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onEditItem(item)}
            className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left transition-colors hover:bg-primary/5 print:gap-2 print:p-3"
          >
            <div
              className={cn(
                "rounded-full p-2 print:p-1.5",
                item.type === "weekly" && !isRoutine && "bg-orange-100 text-orange-600",
                item.type === "weekly" && isRoutine && "bg-emerald-100 text-emerald-700",
                item.type === "daily" && !isRoutine && "bg-primary/10 text-primary",
                item.type === "daily" && isRoutine && "bg-emerald-100 text-emerald-700",
              )}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-foreground print:text-sm">{item.title}</div>
              {item.timeInfo && (
                <div className="mt-0.5 text-xs font-medium text-muted-foreground print:text-[11px]">
                  {item.timeInfo}
                </div>
              )}
            </div>
          </button>
        </div>

        {weekDates.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const checked = isCompleted(item.itemKind, item.id, dateStr);
          const required = isRequiredDay(item, date);

          return (
            <div
              key={dateStr}
              className={cn(
                "flex items-center justify-center border-r border-border/40 last:border-r-0",
                item.type === "weekly" && "bg-slate-50/50",
              )}
            >
              <button
                disabled={!required || isPending}
                onClick={() => required && onToggle(item.itemKind, item.id, dateStr, checked)}
                className={cn(
                  "h-8 w-8 rounded-lg border-2 transition-all duration-200 md:h-10 md:w-10 print:h-8 print:w-8",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                  !required &&
                    item.type === "daily" &&
                    "bg-slate-100 border-slate-200 cursor-not-allowed opacity-50",
                  !required && item.type === "weekly" && "bg-slate-100 border-slate-200 opacity-30 cursor-default",
                  required &&
                    !checked &&
                    "bg-white border-slate-300 hover:border-primary hover:bg-primary/5 cursor-pointer",
                  required &&
                    checked &&
                    "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-100 checkbox-checked",
                )}
              >
                {checked && <Check strokeWidth={3} className="w-5 h-5 md:w-6 md:h-6" />}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={boardShellRef} className="board-print-shell w-full" style={boardPrintStyle}>
      <div
        ref={boardFrameRef}
        className="board-print-frame w-full overflow-hidden rounded-xl border border-border/50 bg-white shadow-xl"
      >
        <div className="flex flex-col gap-2 border-b border-border bg-slate-50/70 px-3 py-2 print:gap-1 print:bg-white print:px-2 print:py-1">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <Tabs
                value={selectedKidId ? String(selectedKidId) : undefined}
                onValueChange={(value) => onSelectKid(Number(value))}
              >
                <TabsList className="h-auto w-max gap-1 rounded-none border-b border-border bg-transparent p-0 pr-2">
                  {kids.map((kid) => {
                    const isEditing = editingKidId === kid.id;

                    if (isEditing) {
                      return (
                        <div key={kid.id} className="mb-[-1px] min-w-[100px] max-w-[160px]">
                          <Input
                            value={editedKidName}
                            onChange={(event) => setEditedKidName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void saveRename();
                              }

                              if (event.key === "Escape") {
                                event.preventDefault();
                                cancelRename();
                              }
                            }}
                            onBlur={cancelRename}
                            autoFocus
                            disabled={isKidMutationPending}
                            className="h-7 rounded-none border-0 bg-transparent px-2 text-xs"
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
                          "h-7 min-w-[100px] max-w-[160px] px-2 justify-start rounded-none border-b-2 border-transparent bg-transparent text-left text-xs text-muted-foreground shadow-none",
                          "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
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
                    className="mb-[-1px] h-7 w-7 shrink-0 rounded-none border-b-2 border-dashed border-primary bg-transparent text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 print:hidden"
                    aria-label="Añadir niño"
                  >
                    <Plus className="mx-auto h-3.5 w-3.5" />
                  </button>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="flex items-center rounded-md border border-border bg-white shadow-sm">
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
                  className="whitespace-nowrap border-x border-border px-2 py-1 text-xs font-medium md:text-sm"
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

              <div className="whitespace-nowrap rounded-md border border-border bg-white px-2 py-1">
                <span className="mr-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Puntos:
                </span>
                <span className="font-mono text-sm font-bold text-primary">______/{totalPointsPossible}</span>
              </div>

              <Button size="sm" variant="outline" onClick={onCreateItem} className="no-print print:hidden">
                <Plus className="mr-1.5 h-4 w-4" />
                Nuevo
              </Button>

              <Button
                size="sm"
                onClick={onPrint}
                className="no-print bg-primary text-primary-foreground print:hidden"
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[300px_repeat(7,1fr)] bg-primary text-primary-foreground">
          <div className="flex items-center p-4 font-display text-lg font-bold tracking-wider print:p-3 print:text-base">
            TAREA
          </div>
          {DAYS.map((day, index) => (
            <div
              key={day}
              className="flex flex-col items-center justify-center border-l border-primary-foreground/20 p-3 text-center print:p-2"
            >
              <span className="text-sm font-bold uppercase tracking-widest">{day.substring(0, 3)}</span>
              <span className="text-xs opacity-80">{format(weekDates[index], "d MMM", { locale: es })}</span>
            </div>
          ))}
        </div>

        <div className="bg-secondary/30">
          <div className="border-b border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary print:px-3 print:py-1.5">
            Tareas y Rutinas Diarias
          </div>
        </div>

        {dailyItems.length === 0 && weeklyItems.length === 0 && (
          <div className="border-b border-border/60 p-6 text-sm text-muted-foreground">
            Este niño no tiene tareas ni rutinas asignadas todavía.
          </div>
        )}

        {dailyItems.map((item, index) => renderRow(item, index === dailyItems.length - 1))}

        <div className="bg-secondary/30">
          <div className="border-b border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary print:px-3 print:py-1.5">
            Tareas y Rutinas Semanales
          </div>
        </div>

        {weeklyItems.map((item, index) => renderRow(item, index === weeklyItems.length - 1))}
      </div>
    </div>
  );
}
