import { Task, Completion } from "@shared/schema";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface PointsDisplayProps {
  tasks: Task[];
  completions: Completion[];
  currentDate: Date;
}

export function PointsDisplay({ tasks, completions, currentDate }: PointsDisplayProps) {
  // Calculate total points for the week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  
  // Filter completions strictly within this week
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  
  // In a real app we might do more rigorous date checking, but here we assume the completions passed in 
  // are already filtered by the API or query for the relevant range.
  
  const totalPoints = completions.reduce((total, completion) => {
    // Find the task to get its points value
    const task = tasks.find(t => t.id === completion.taskId);
    return total + (task?.points || 1);
  }, 0);

  // Gamification Levels
  const LEVEL_1 = 20;
  const LEVEL_2 = 30;
  const LEVEL_3 = 40;
  
  const getProgress = (target: number) => {
    return Math.min(100, Math.max(0, (totalPoints / target) * 100));
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg border border-border/50 p-6 print:border-2 print:border-black print:shadow-none print:mt-4">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 rounded-full text-yellow-600 print:hidden">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-foreground uppercase tracking-wider">Puntos de la Semana</h3>
            <p className="text-sm text-muted-foreground print:hidden">Completa tareas para desbloquear recompensas</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-border print:border-black">
          <span className="text-3xl font-bold text-primary print:text-black">{totalPoints}</span>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider print:text-black">Puntos Totales</span>
        </div>
      </div>

      {/* Progress Staircase Visual */}
      <div className="relative pt-6 pb-2 px-2">
        <div className="absolute top-1/2 left-0 w-full h-3 bg-slate-100 rounded-full -z-10 print:bg-gray-200"></div>
        
        {/* Progress Fill */}
        <div 
          className="absolute top-1/2 left-0 h-3 bg-gradient-to-r from-primary/60 to-primary rounded-full -z-10 transition-all duration-1000 ease-out print:bg-black print:[color-adjust:exact] print:[-webkit-print-color-adjust:exact]"
          style={{ width: `${getProgress(LEVEL_3)}%` }}
        ></div>

        <div className="flex justify-between relative">
          {/* Start */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-slate-300 print:bg-black"></div>
            <span className="text-xs font-medium text-slate-400">0</span>
          </div>

          {/* Level 1 */}
          <div className="flex flex-col items-center gap-2 relative">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 bg-white",
              totalPoints >= LEVEL_1 ? "border-primary text-primary scale-110 shadow-lg shadow-primary/20 print:border-black print:text-black print:[color-adjust:exact] print:[-webkit-print-color-adjust:exact]" : "border-slate-200 text-slate-300"
            )}>
              <Star size={16} fill={totalPoints >= LEVEL_1 ? "currentColor" : "none"} />
            </div>
            <div className="text-center">
              <span className="block text-xs font-bold">NIVEL 1</span>
              <span className="text-xs text-muted-foreground">{LEVEL_1} pts</span>
            </div>
          </div>

          {/* Level 2 */}
          <div className="flex flex-col items-center gap-2 relative">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 bg-white",
              totalPoints >= LEVEL_2 ? "border-primary text-primary scale-110 shadow-lg shadow-primary/20 print:border-black print:text-black print:[color-adjust:exact] print:[-webkit-print-color-adjust:exact]" : "border-slate-200 text-slate-300"
            )}>
              <TrendingUp size={20} />
            </div>
            <div className="text-center">
              <span className="block text-xs font-bold">NIVEL 2</span>
              <span className="text-xs text-muted-foreground">{LEVEL_2} pts</span>
            </div>
          </div>

          {/* Level 3 */}
          <div className="flex flex-col items-center gap-2 relative">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 bg-white",
              totalPoints >= LEVEL_3 ? "border-yellow-500 text-yellow-500 scale-110 shadow-xl shadow-yellow-500/20 print:border-black print:text-black print:[color-adjust:exact] print:[-webkit-print-color-adjust:exact]" : "border-slate-200 text-slate-300"
            )}>
              <Trophy size={24} fill={totalPoints >= LEVEL_3 ? "currentColor" : "none"} />
            </div>
            <div className="text-center">
              <span className="block text-xs font-bold text-yellow-600 print:text-black">MAXIMO!</span>
              <span className="text-xs text-muted-foreground">{LEVEL_3} pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
