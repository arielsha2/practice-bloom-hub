import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface LessonStat {
  lessonId: string;
  lessonTitle: string;
  watchedCount: number;
  totalUsers: number;
}

interface LessonProgressChartProps {
  lessonStats: LessonStat[];
}

export function LessonProgressChart({ lessonStats }: LessonProgressChartProps) {
  const { t, isRTL } = useLanguage();

  const data = lessonStats.map((stat, index) => ({
    name: `${index + 1}`,
    fullName: stat.lessonTitle,
    watched: stat.watchedCount,
    total: stat.totalUsers,
    percent: stat.totalUsers > 0 ? Math.round((stat.watchedCount / stat.totalUsers) * 100) : 0,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{item.fullName}</p>
          <p className="text-muted-foreground text-sm">
            {item.watched} / {item.total} ({item.percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{t('dashboard.admin.progressByLesson')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" domain={[0, 'dataMax']} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={40}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="watched" 
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(var(--primary) / ${0.4 + (entry.percent / 100) * 0.6})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
