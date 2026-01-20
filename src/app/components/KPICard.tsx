import { Card, CardContent } from './ui/card';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  iconColor?: string;
  onClick?: () => void;
}

export function KPICard({ title, value, icon: Icon, description, trend, iconColor = 'text-blue-600', onClick }: KPICardProps) {
  return (
    <Card className={`overflow-hidden ${onClick ? 'cursor-pointer transition hover:shadow-md' : ''} dark:bg-[#111827] dark:border-slate-700`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1 dark:text-slate-300">{title}</p>
            <p className="text-3xl font-semibold mb-1 dark:text-white">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
            )}
            {trend && (
              <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gray-50 dark:bg-slate-800/80 dark:border dark:border-slate-700`}>
            <Icon className={`w-6 h-6 ${iconColor} dark:text-blue-200`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
