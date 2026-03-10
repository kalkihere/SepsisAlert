'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ScanResult } from '@/types';

interface TrendChartProps {
  scans: ScanResult[];
  vitalType: 'heartRate' | 'spo2' | 'temperature';
  className?: string;
}

const vitalConfig = {
  heartRate: {
    label: 'Heart Rate',
    unit: 'BPM',
    color: '#ef4444',
    normalMin: 60,
    normalMax: 100,
    dataKey: 'heartRate',
  },
  spo2: {
    label: 'SpO2',
    unit: '%',
    color: '#3b82f6',
    normalMin: 95,
    normalMax: 100,
    dataKey: 'spo2',
  },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    color: '#f59e0b',
    normalMin: 36.1,
    normalMax: 37.2,
    dataKey: 'temperature',
  },
};

export function TrendChart({ scans, vitalType, className }: TrendChartProps) {
  const config = vitalConfig[vitalType];

  const chartData = useMemo(() => {
    return scans
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(scan => ({
        timestamp: scan.timestamp,
        date: format(new Date(scan.timestamp), 'MMM d'),
        time: format(new Date(scan.timestamp), 'HH:mm'),
        [config.dataKey]: scan.vitals[vitalType],
        riskLevel: scan.riskLevel,
      }));
  }, [scans, vitalType, config.dataKey]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'stable';
    const recent = chartData.slice(-3);
    const values = recent.map(d => d[config.dataKey] as number);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const first = values[0];
    
    if (avg > first * 1.05) return 'increasing';
    if (avg < first * 0.95) return 'decreasing';
    return 'stable';
  }, [chartData, config.dataKey]);

  const latestValue = chartData.length > 0 
    ? chartData[chartData.length - 1][config.dataKey] 
    : null;

  const TrendIcon = trend === 'increasing' ? TrendingUp : trend === 'decreasing' ? TrendingDown : Minus;

  if (scans.length === 0) {
    return (
      <Card className={cn('border-2', className)}>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-2', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{config.label}</CardTitle>
          <div className="flex items-center gap-2">
            <TrendIcon className={cn(
              'h-4 w-4',
              trend === 'increasing' && 'text-red-500',
              trend === 'decreasing' && 'text-blue-500',
              trend === 'stable' && 'text-green-500'
            )} />
            <span className="text-lg font-bold" style={{ color: config.color }}>
              {latestValue !== null ? (
                vitalType === 'temperature' ? (latestValue as number).toFixed(1) : latestValue
              ) : '--'} {config.unit}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [
                  vitalType === 'temperature' ? value.toFixed(1) : value,
                  config.label
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `${payload[0].payload.date} at ${payload[0].payload.time}`;
                  }
                  return label;
                }}
              />
              <ReferenceLine 
                y={config.normalMin} 
                stroke="#22c55e" 
                strokeDasharray="5 5" 
                strokeOpacity={0.5}
              />
              <ReferenceLine 
                y={config.normalMax} 
                stroke="#22c55e" 
                strokeDasharray="5 5" 
                strokeOpacity={0.5}
              />
              <Line
                type="monotone"
                dataKey={config.dataKey}
                stroke={config.color}
                strokeWidth={2}
                dot={{ fill: config.color, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Normal range indicator */}
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="h-px w-4 bg-green-500" style={{ borderTop: '2px dashed #22c55e' }} />
          <span>Normal range: {config.normalMin}-{config.normalMax} {config.unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}
