import { TaskWithAssignments, Completion, Kid } from "@shared/schema";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTaskIcon } from "@/lib/task-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WeeklyTableProps {
  tasks: TaskWithAssignments[];
  completions: Completion[];
  kids: Kid[];
  selectedKidId?: number;
  onSelectKid: (kidId: number) => void;
  currentDate: Date;
  onToggle: (taskId: number, date: string, currentStatus: boolean) => void;
  onEditTask: (task: TaskWithAssignments) => void;
  isPending: boolean;
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_KEYS = [1, 2, 3, 4, 5, 6, 0]; // Monday=1... Sunday=0 for date-fns

export function WeeklyTable({
  tasks,
  completions,
  kids,
  selectedKidId,
  onSelectKid,
  currentDate,
  onToggle,
  onEditTask,
  isPending,
}: WeeklyTableProps) {
  // Calculate week dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Helper to check if a task is completed on a specific date
  const isCompleted = (taskId: number, dateStr: string) => {
    return completions.some((c) => c.taskId === taskId && c.date === dateStr && c.completed);
  };

  // Helper to check if a task is required on a specific day index (0-6, Sunday is 0)
  const isRequiredDay = (task: TaskWithAssignments, date: Date) => {
    const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon...
    return task.requiredDays.includes(dayIndex);
  };

  const dailyTasks = tasks.filter(t => t.type === 'daily');
  const weeklyTasks = tasks.filter(t => t.type === 'weekly');

  return (
    <div className="w-full bg-white rounded-xl shadow-xl overflow-hidden border border-border/50">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border print:hidden">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Niño</span>
        <div className="w-full max-w-xs">
          <Select
            value={selectedKidId ? String(selectedKidId) : undefined}
            onValueChange={(value) => onSelectKid(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona niño" />
            </SelectTrigger>
            <SelectContent>
              {kids.map((kid) => (
                <SelectItem key={kid.id} value={String(kid.id)}>
                  {kid.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[300px_repeat(7,1fr)] bg-primary text-primary-foreground">
        <div className="p-4 font-display font-bold text-lg tracking-wider flex items-center">
          TAREA
        </div>
        {DAYS.map((day, i) => (
          <div key={day} className="p-3 text-center border-l border-primary-foreground/20 flex flex-col justify-center items-center">
            <span className="font-bold text-sm uppercase tracking-widest">{day.substring(0, 3)}</span>
            <span className="text-xs opacity-80">{format(weekDates[i], 'd MMM', { locale: es })}</span>
          </div>
        ))}
      </div>

      {/* Daily Tasks Section */}
      <div className="bg-secondary/30">
        <div className="px-4 py-2 text-xs font-bold text-primary uppercase tracking-widest border-b border-border">
          Tareas Diarias
        </div>
      </div>

      {dailyTasks.map((task, idx) => {
        const Icon = getTaskIcon(task.icon);
        return (
          <div 
            key={task.id} 
            className={cn(
              "grid grid-cols-[300px_repeat(7,1fr)] border-b border-border/60 hover:bg-slate-50 transition-colors",
              idx === dailyTasks.length - 1 && "border-b-2 border-primary/20"
            )}
          >
            <button
              type="button"
              onClick={() => onEditTask(task)}
              className="p-4 flex w-full items-center gap-3 border-r border-border/60 text-left transition-colors hover:bg-primary/5"
            >
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Icon size={18} />
              </div>
              <div>
                <div className="font-medium text-foreground">{task.title}</div>
                {task.timeInfo && (
                  <div className="text-xs text-muted-foreground mt-0.5 font-medium">{task.timeInfo}</div>
                )}
              </div>
            </button>
            
            {weekDates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const checked = isCompleted(task.id, dateStr);
              const required = isRequiredDay(task, date);
              
              return (
                <div key={dateStr} className="flex items-center justify-center border-r border-border/40 last:border-r-0">
                  <button
                    disabled={!required || isPending}
                    onClick={() => required && onToggle(task.id, dateStr, checked)}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                      !required && "bg-slate-100 border-slate-200 cursor-not-allowed opacity-50",
                      required && !checked && "bg-white border-slate-300 hover:border-primary hover:bg-primary/5 cursor-pointer",
                      required && checked && "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-100 checkbox-checked"
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
        <div className="px-4 py-2 text-xs font-bold text-primary uppercase tracking-widest border-b border-border">
          Tareas Semanales
        </div>
      </div>

      {weeklyTasks.map((task, idx) => {
        const Icon = getTaskIcon(task.icon);
        return (
          <div 
            key={task.id} 
            className={cn(
              "grid grid-cols-[300px_repeat(7,1fr)] border-b border-border/60 hover:bg-slate-50 transition-colors",
              idx === weeklyTasks.length - 1 && "border-b-0"
            )}
          >
            <button
              type="button"
              onClick={() => onEditTask(task)}
              className="p-4 flex w-full items-center gap-3 border-r border-border/60 text-left transition-colors hover:bg-primary/5"
            >
              <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                <Icon size={18} />
              </div>
              <div>
                <div className="font-medium text-foreground">{task.title}</div>
                {task.timeInfo && (
                  <div className="text-xs text-muted-foreground mt-0.5 font-medium">{task.timeInfo}</div>
                )}
              </div>
            </button>
            
            {weekDates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const checked = isCompleted(task.id, dateStr);
              const required = isRequiredDay(task, date);
              
              return (
                <div key={dateStr} className="flex items-center justify-center border-r border-border/40 last:border-r-0 bg-slate-50/50">
                  <button
                    disabled={!required || isPending}
                    onClick={() => required && onToggle(task.id, dateStr, checked)}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                      !required && "bg-slate-100 border-slate-200 opacity-30 cursor-default",
                      required && !checked && "bg-white border-slate-300 hover:border-primary hover:bg-primary/5 cursor-pointer",
                      required && checked && "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-100 checkbox-checked"
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
