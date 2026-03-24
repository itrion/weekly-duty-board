import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  useCreateBoardItem,
  useDeleteBoardItem,
  useReorderBoardItems,
  useTasks,
  useKids,
  useCompletions,
  useToggleCompletion,
  useUpdateBoardItem,
  useReplaceBoardItemAssignments,
  useCreateKid,
  useUpdateKid,
} from "@/hooks/use-tasks";
import { WeeklyTable } from "@/components/WeeklyTable";
import { TaskEditorSheet } from "@/components/TaskEditorSheet";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTaskIcon } from "@/lib/task-icons";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { ListTodo, Pencil, Trash2 } from "lucide-react";
import type {
  CreateBoardItemRequest,
  BoardItemWithAssignments,
  BoardItemKind,
  UpdateBoardItemRequest,
} from "@shared/schema";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedKidId, setSelectedKidId] = useState<number | undefined>(undefined);
  const [editingItem, setEditingItem] = useState<BoardItemWithAssignments | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
  const tableSectionRef = useRef<HTMLElement | null>(null);
  const [tableHeight, setTableHeight] = useState<number | null>(null);

  // Date calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const startDateStr = format(weekStart, "yyyy-MM-dd");
  const endDateStr = format(weekEnd, "yyyy-MM-dd");

  // Queries
  const { data: kids, isLoading: kidsLoading } = useKids();
  const { data: allItems, isLoading: allItemsLoading } = useTasks();
  const { data: items, isLoading: itemsLoading } = useTasks(selectedKidId);
  const { data: completions } = useCompletions(startDateStr, endDateStr);
  const { mutate: toggleTask, isPending: isToggling } = useToggleCompletion();
  const { mutateAsync: createBoardItem, isPending: isCreatingItem } = useCreateBoardItem();
  const { mutateAsync: reorderBoardItems, isPending: isReorderingItems } = useReorderBoardItems();
  const { mutateAsync: updateBoardItem, isPending: isUpdatingItem } = useUpdateBoardItem();
  const { mutateAsync: replaceAssignments } = useReplaceBoardItemAssignments();
  const { mutateAsync: createKid, isPending: isCreatingKid } = useCreateKid();
  const { mutateAsync: updateKid, isPending: isUpdatingKid } = useUpdateKid();
  const { mutateAsync: deleteBoardItem, isPending: isDeletingItem } = useDeleteBoardItem();

  useEffect(() => {
    if (!selectedKidId && kids && kids.length > 0) {
      setSelectedKidId(kids[0].id);
    }
  }, [kids, selectedKidId]);

  useEffect(() => {
    const tableSection = tableSectionRef.current;
    if (!tableSection || typeof ResizeObserver === "undefined") return;

    const syncTableHeight = () => {
      setTableHeight(Math.round(tableSection.getBoundingClientRect().height));
    };

    syncTableHeight();

    const resizeObserver = new ResizeObserver(() => {
      syncTableHeight();
    });

    resizeObserver.observe(tableSection);
    return () => resizeObserver.disconnect();
  }, [items, completions, kids, selectedKidId, currentDate]);

  const totalPointsPossible = useMemo(() => {
    if (!items || items.length === 0) return 0;

    const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

    return items.reduce((total, item) => {
      const occurrences = weekDates.reduce((count, date) => {
        return count + (item.requiredDays.includes(date.getDay()) ? 1 : 0);
      }, 0);

      return total + occurrences * item.points;
    }, 0);
  }, [items, weekStart]);

  const selectedKid = useMemo(
    () => kids?.find((kid) => kid.id === selectedKidId),
    [kids, selectedKidId],
  );

  const availableItems = useMemo(() => {
    if (!selectedKidId) return [];
    return (allItems ?? []).filter((item) => !item.kidIds.includes(selectedKidId));
  }, [allItems, selectedKidId]);

  const dailyItems = useMemo(
    () => availableItems.filter((item) => item.type === "daily"),
    [availableItems],
  );

  const weeklyItems = useMemo(
    () => availableItems.filter((item) => item.type === "weekly"),
    [availableItems],
  );

  const handlePrint = () => {
    window.print();
  };

  const handlePreviousWeek = () => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  };

  const weekLabel =
    weekStart.getFullYear() === weekEnd.getFullYear()
      ? `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`
      : `${format(weekStart, "d MMM yyyy", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`;

  const handleToggle = (itemKind: BoardItemKind, itemId: number, date: string, completed: boolean) => {
    toggleTask({ itemKind, itemId, date, completed: !completed });
  };

  const handleEditItem = (item: BoardItemWithAssignments) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const handleDeleteItem = async (item: BoardItemWithAssignments) => {
    const confirmed = window.confirm(`¿Eliminar \"${item.title}\"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    await deleteBoardItem({ itemKind: item.itemKind, itemId: item.id });

    if (editingItem && editingItem.id === item.id && editingItem.itemKind === item.itemKind) {
      setEditingItem(null);
      setIsEditorOpen(false);
    }
  };

  const handleStartCreateItem = () => {
    setEditingItem(null);
    setIsEditorOpen(true);
  };

  const handleSaveItem = async (
    itemKind: BoardItemKind,
    itemId: number,
    data: UpdateBoardItemRequest,
  ) => {
    await updateBoardItem({ itemKind, itemId, data });
    setIsEditorOpen(false);
  };

  const handleReplaceAssignments = async (
    itemKind: BoardItemKind,
    itemId: number,
    kidIds: number[],
  ) => {
    await replaceAssignments({ itemKind, itemId, data: { kidIds } });
  };

  const handleCreateItem = async (data: CreateBoardItemRequest) => {
    await createBoardItem(data);
    setIsEditorOpen(false);
  };

  const handleReorderItems = async (
    type: "daily" | "weekly",
    orderedItems: Array<{ itemKind: BoardItemKind; itemId: number }>,
  ) => {
    if (!selectedKidId) return;
    await reorderBoardItems({
      kidId: selectedKidId,
      type,
      orderedItems,
    });
  };

  const handleCreateKid = async () => {
    const existingNames = new Set((kids ?? []).map((kid) => kid.name.toLowerCase()));
    let suffix = (kids?.length ?? 0) + 1;
    let candidate = `Niño ${suffix}`;

    while (existingNames.has(candidate.toLowerCase())) {
      suffix += 1;
      candidate = `Niño ${suffix}`;
    }

    const created = await createKid({ name: candidate });
    setSelectedKidId(created.id);
  };

  const handleRenameKid = async (kidId: number, name: string) => {
    await updateKid({ kidId, data: { name } });
  };

  if (itemsLoading || allItemsLoading || kidsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium">Cargando responsabilidades...</p>
        </div>
      </div>
    );
  }

  const renderManagementSection = (
    title: string,
    sectionItems: BoardItemWithAssignments[],
    emptyMessage: string,
  ) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{title}</h3>
        <Badge variant="secondary">{sectionItems.length}</Badge>
      </div>

      {sectionItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {sectionItems.map((item) => {
            const Icon = getTaskIcon(item.icon);
            const isActive = editingItem?.id === item.id && editingItem.itemKind === item.itemKind;

            return (
              <div
                key={`${item.itemKind}-${item.id}`}
                className={cn(
                  "rounded-xl border bg-background p-3 shadow-sm transition-colors",
                  isActive && "border-primary/50 bg-primary/5",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleEditItem(item)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{item.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.itemKind === "routine" ? "Rutina" : "Tarea"} · {item.points} punto{item.points === 1 ? "" : "s"}
                      {item.timeInfo ? ` · ${item.timeInfo}` : ""}
                    </span>
                  </span>
                </button>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditItem(item)}
                    className="h-6 min-h-6 flex-1 gap-1 rounded-md px-1.5 text-[10px] leading-none"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void handleDeleteItem(item);
                    }}
                    disabled={isDeletingItem}
                    className="h-6 min-h-6 gap-1 rounded-md px-1.5 text-[10px] leading-none text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Borrar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 print:pb-0">
      <div className="mx-auto grid w-full max-w-[1640px] gap-6 px-4 pt-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(400px,460px)_minmax(0,1fr)] xl:items-stretch print:block print:max-w-none print:px-0 print:pt-0">
        <div className="order-1 print-page print-container min-w-0 xl:order-2">
          <header className="mb-2 print:mb-1">
            <h1 className="text-xl md:text-2xl font-display font-bold text-primary uppercase tracking-wider print:text-lg">
              Tabla de tareas y rutinas
            </h1>
          </header>

          <main className="space-y-6 print:space-y-4">
            <section ref={tableSectionRef} className="print-avoid-break">
              <WeeklyTable
                items={items || []}
                completions={completions || []}
                kids={kids || []}
                selectedKidId={selectedKidId}
                onSelectKid={setSelectedKidId}
                onCreateKid={handleCreateKid}
                onCreateItem={handleStartCreateItem}
                onRenameKid={handleRenameKid}
                isKidMutationPending={isCreatingKid || isUpdatingKid}
                currentDate={currentDate}
                weekLabel={weekLabel}
                totalPointsPossible={totalPointsPossible}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
                onOpenWeekPicker={() => setIsWeekPickerOpen(true)}
                onPrint={handlePrint}
                onToggle={handleToggle}
                onReorderItems={handleReorderItems}
                onEditItem={handleEditItem}
                isPending={isToggling || isReorderingItems || isDeletingItem}
              />
            </section>
          </main>

          <footer className="mt-12 text-center text-sm text-muted-foreground print:hidden">
            <p>© {new Date().getFullYear()} Sistema de Responsabilidades</p>
          </footer>
        </div>

        <aside className="order-2 print:hidden xl:order-1 xl:min-h-0 xl:self-stretch">
          <div
            className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm xl:flex xl:h-[var(--sidebar-card-height)] xl:flex-col"
            style={
              tableHeight
                ? ({ ["--sidebar-card-height" as string]: `${tableHeight}px` } as CSSProperties)
                : undefined
            }
          >
            <div className="border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ListTodo className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Lista de tareas</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedKid
                      ? `Tareas disponibles para intercambiar con ${selectedKid.name}.`
                      : "Selecciona un niño para ver tareas disponibles."}
                  </p>
                </div>
              </div>

              <Button onClick={handleStartCreateItem} className="mt-4 w-full">
                Nueva tarea o rutina
              </Button>
            </div>

            <ScrollArea className="max-h-[24rem] px-5 py-4 sm:max-h-[28rem] xl:min-h-0 xl:flex-1 xl:max-h-none">
              <div className="space-y-6 pb-4">
                {renderManagementSection(
                  "Diarias",
                  dailyItems,
                  selectedKid
                    ? "No hay tareas diarias disponibles fuera de las ya asignadas."
                    : "Selecciona un niño para ver tareas diarias disponibles.",
                )}
                {renderManagementSection(
                  "Semanales",
                  weeklyItems,
                  selectedKid
                    ? "No hay tareas semanales disponibles fuera de las ya asignadas."
                    : "Selecciona un niño para ver tareas semanales disponibles.",
                )}
              </div>
            </ScrollArea>
          </div>
        </aside>
      </div>

      <TaskEditorSheet
        open={isEditorOpen}
        item={editingItem}
        isSaving={isUpdatingItem || isCreatingItem}
        kids={kids ?? []}
        assignedKidIds={editingItem?.kidIds ?? (selectedKidId ? [selectedKidId] : [])}
        initialKidIds={selectedKidId ? [selectedKidId] : []}
        onOpenChange={(open) => {
          setIsEditorOpen(open);
          if (!open) setEditingItem(null);
        }}
        onSave={handleSaveItem}
        onCreate={handleCreateItem}
        onReplaceAssignments={handleReplaceAssignments}
        onCreateKid={async (name) => {
          await createKid({ name });
        }}
      />

      <Dialog open={isWeekPickerOpen} onOpenChange={setIsWeekPickerOpen}>
        <DialogContent className="w-auto max-w-[360px] p-4">
          <DialogHeader className="space-y-1">
            <DialogTitle>Seleccionar semana</DialogTitle>
            <DialogDescription>Elige un día y usaremos su semana completa.</DialogDescription>
          </DialogHeader>
          <Calendar
            mode="single"
            selected={currentDate}
            locale={es}
            onSelect={(date) => {
              if (!date) return;
              setCurrentDate(date);
              setIsWeekPickerOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
