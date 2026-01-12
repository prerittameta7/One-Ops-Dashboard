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
    <Card className={`overflow-hidden ${onClick ? 'cursor-pointer transition hover:shadow-md' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-semibold mb-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gray-50`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
