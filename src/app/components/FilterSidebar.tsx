import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Calendar } from './ui/calendar';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CalendarClock, Sparkles, Sunrise, Sunset, LucideIcon } from 'lucide-react';
import { format, startOfWeek, subDays } from 'date-fns';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateChange: (date: Date | undefined) => void;
}

export function FilterSidebar({ isOpen, onClose, selectedDate, onDateChange }: FilterSidebarProps) {
  const today = new Date();
  const quickPicks: { label: string; date: Date; icon: LucideIcon; hint: string }[] = [
    { label: 'Today', date: today, icon: Sunrise, hint: 'Stay current' },
    { label: 'Yesterday', date: subDays(today, 1), icon: Sunset, hint: 'Review last run' },
    {
      label: 'This Monday',
      date: startOfWeek(today, { weekStartsOn: 1 }),
      icon: CalendarClock,
      hint: 'Kickoff of the week',
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[420px] gap-6 overflow-y-auto border-l border-border/60 bg-gradient-to-b from-white via-white/90 to-slate-50/70 p-6 pb-8 shadow-2xl backdrop-blur-xl dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-900/60"
      >
        <SheetHeader className="p-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg">
              <Sparkles className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-lg">Data Filters</SheetTitle>
              <p className="text-sm text-muted-foreground">A refined panel for focusing your dashboard.</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 rounded-2xl border border-border/70 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Selected date</p>
              <p className="text-lg font-semibold text-foreground">{format(selectedDate, 'MMM dd, yyyy')}</p>
            </div>
            <Badge className="flex items-center gap-1 rounded-full border border-indigo-200/70 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 text-indigo-700 shadow-sm dark:border-indigo-800/70 dark:text-indigo-200">
              <CalendarClock className="size-4" />
              Live
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-indigo-500" />
              <Label className="!mb-0">Select Date</Label>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              disabled={{ after: new Date() }}
              className="rounded-xl border border-border/70 bg-white/80 p-3 shadow-inner dark:bg-slate-900/70"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-indigo-500" />
            <p className="text-sm font-semibold text-foreground">Quick picks</p>
            <span className="text-xs text-muted-foreground">Jump to common checkpoints</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickPicks.map(({ label, date, icon: Icon, hint }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                className="group h-auto w-full items-start justify-start gap-3 rounded-xl border-dashed border-border/70 bg-white/70 px-3 py-3 text-left text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:bg-slate-900/70"
                onClick={() => onDateChange(date)}
              >
                <div className="mr-1 flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-cyan-500/20 text-indigo-700 transition group-hover:from-indigo-500/25 group-hover:text-indigo-800 dark:text-indigo-200">
                  <Icon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col items-start">
                  <span className="text-sm font-semibold leading-tight break-words whitespace-normal">{label}</span>
                  <span className="text-xs text-muted-foreground leading-tight break-words whitespace-normal">
                    {hint} · {format(date, 'EEE, MMM d')}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
