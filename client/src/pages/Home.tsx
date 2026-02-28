import { useState } from "react";
import { useTasks, useCompletions, useToggleCompletion, useUpdateTask } from "@/hooks/use-tasks";
import { WeeklyTable } from "@/components/WeeklyTable";
import { PointsDisplay } from "@/components/PointsDisplay";
import { TaskEditorSheet } from "@/components/TaskEditorSheet";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { Printer, ChevronLeft, ChevronRight } from "lucide-react";
import type { Task, UpdateTaskRequest } from "@shared/schema";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Date calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const startDateStr = format(weekStart, 'yyyy-MM-dd');
  const endDateStr = format(weekEnd, 'yyyy-MM-dd');

  // Queries
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: completions, isLoading: completionsLoading } = useCompletions(startDateStr, endDateStr);
  const { mutate: toggleTask, isPending: isToggling } = useToggleCompletion();
  const { mutateAsync: updateTask, isPending: isUpdatingTask } = useUpdateTask();

  const handlePrint = () => {
    window.print();
  };

  const handlePreviousWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  const handleToggle = (taskId: number, date: string, completed: boolean) => {
    toggleTask({ taskId, date, completed: !completed });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditorOpen(true);
  };

  const handleSaveTask = async (taskId: number, data: UpdateTaskRequest) => {
    await updateTask({ taskId, data });
    setIsEditorOpen(false);
  };

  if (tasksLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium">Cargando responsabilidades...</p>
        </div>
      </div>
    );
  }

  // Error state or empty tasks
  if (!tasks || tasks.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-foreground mb-4">No hay tareas configuradas</h2>
        <p className="text-muted-foreground">La base de datos no tiene tareas cargadas.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white text-slate-900 pb-12 print:pb-0">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 print:p-0 print:max-w-none">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:mb-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-2 print:text-black print:text-2xl uppercase tracking-wider">
              Tabla Semanal de Responsabilidades
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-12 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <span className="font-bold text-muted-foreground uppercase tracking-widest print:text-black">Semana:</span>
                <span className="border-b-2 border-slate-300 px-4 py-1 min-w-[150px] font-medium print:border-black">
                  {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-muted-foreground uppercase tracking-widest print:text-black">Nombre:</span>
                <span className="border-b-2 border-slate-300 px-4 py-1 min-w-[200px] print:border-black"></span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Hidden on Print) */}
          <div className="flex items-center gap-2 print:hidden no-print">
            <div className="flex items-center bg-white rounded-lg border border-border mr-4 shadow-sm">
              <Button variant="ghost" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 font-medium text-sm border-x border-border">
                {format(weekStart, "yyyy")}
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handlePrint} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Tabla
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-6 print:space-y-4">
          <WeeklyTable 
            tasks={tasks} 
            completions={completions || []} 
            currentDate={currentDate} 
            onToggle={handleToggle}
            onEditTask={handleEditTask}
            isPending={isToggling}
          />
          
          <PointsDisplay 
            tasks={tasks} 
            completions={completions || []} 
            currentDate={currentDate} 
          />
        </main>
        
        <footer className="mt-12 text-center text-sm text-muted-foreground print:hidden">
          <p>© {new Date().getFullYear()} Sistema de Responsabilidades</p>
        </footer>
      </div>

      <TaskEditorSheet
        open={isEditorOpen}
        task={editingTask}
        isSaving={isUpdatingTask}
        onOpenChange={(open) => {
          setIsEditorOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />
    </div>
  );
}
