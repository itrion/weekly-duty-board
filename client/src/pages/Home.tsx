import { useEffect, useMemo, useState } from "react";
import {
  useCreateBoardItem,
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
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from "date-fns";
import { es } from "date-fns/locale";
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

  // Date calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const startDateStr = format(weekStart, "yyyy-MM-dd");
  const endDateStr = format(weekEnd, "yyyy-MM-dd");

  // Queries
  const { data: kids, isLoading: kidsLoading } = useKids();
  const { data: items, isLoading: itemsLoading } = useTasks(selectedKidId);
  const { data: completions } = useCompletions(startDateStr, endDateStr);
  const { mutate: toggleTask, isPending: isToggling } = useToggleCompletion();
  const { mutateAsync: createBoardItem, isPending: isCreatingItem } = useCreateBoardItem();
  const { mutateAsync: updateBoardItem, isPending: isUpdatingItem } = useUpdateBoardItem();
  const { mutateAsync: replaceAssignments } = useReplaceBoardItemAssignments();
  const { mutateAsync: createKid, isPending: isCreatingKid } = useCreateKid();
  const { mutateAsync: updateKid, isPending: isUpdatingKid } = useUpdateKid();

  useEffect(() => {
    if (!selectedKidId && kids && kids.length > 0) {
      setSelectedKidId(kids[0].id);
    }
  }, [kids, selectedKidId]);

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

  if (itemsLoading || kidsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium">Cargando responsabilidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 print:pb-0">
      <div className="print-container max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 print:max-w-none print:pt-0">
        {/* Header Section */}
        <header className="mb-2">
          <h1 className="text-xl md:text-2xl font-display font-bold text-primary uppercase tracking-wider">
            Tabla de tareas y rutinas
          </h1>
        </header>

        {/* Main Content */}
        <main className="space-y-6 print:space-y-4">
          <section className="print-avoid-break">
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
              onEditItem={handleEditItem}
              isPending={isToggling}
            />
          </section>
        </main>

        <footer className="mt-12 text-center text-sm text-muted-foreground print:hidden">
          <p>© {new Date().getFullYear()} Sistema de Responsabilidades</p>
        </footer>
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
