import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlatformMetrics } from '../../types/dashboard';

interface PlatformChartProps {
  data: PlatformMetrics[];
}

export function PlatformChart({ data }: PlatformChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Status by Platform</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="platform" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="success" fill="#10b981" name="Success" />
            <Bar dataKey="failed" fill="#ef4444" name="Failed" />
            <Bar dataKey="running" fill="#3b82f6" name="Running" />
            <Bar dataKey="pending" fill="#eab308" name="Pending" />
            <Bar dataKey="queued" fill="#f97316" name="Queued" />
            <Bar dataKey="unknown" fill="#6b7280" name="Unknown" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
