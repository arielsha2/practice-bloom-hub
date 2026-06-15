import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MessageSquare, CalendarClock, Activity, Layers, Sparkles, BookOpen } from 'lucide-react';
import {
  useMentorConversationsAnalytics,
  type MentorConvRow,
} from '@/hooks/useMentorConversationsAnalytics';
import type { AnalyticsPeriod } from '@/hooks/useAdminAnalytics';

const stageLabels: Record<string, string> = {
  niche: 'נישה',
  pricing: 'תמחור',
  contacts: 'קשרים',
  practice: 'תרגול',
  pitch: 'מצגת',
};

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{typeof value === 'number' ? value.toLocaleString('he-IL') : value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MentorConversationsSection({ period }: { period: AnalyticsPeriod }) {
  const { data, loading, error } = useMentorConversationsAnalytics(period);
  const [selected, setSelected] = useState<MentorConvRow | null>(null);

  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-foreground">שיחות המנטור</h2>
      </div>

      {error && (
        <Card><CardContent className="p-4 text-sm text-destructive">שגיאה: {error}</CardContent></Card>
      )}

      {!data && loading && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">טוען נתונים…</CardContent></Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <SummaryCard icon={MessageSquare} label='שיחות סה"כ' value={data.summary.totalConversations} />
            <SummaryCard icon={CalendarClock} label="שיחות השבוע" value={data.summary.weekConversations} />
            <SummaryCard icon={Activity} label="אורך ממוצע (הודעות)" value={data.summary.avgLength} />
            <SummaryCard icon={Layers} label="שיחות עמוקות 15+" value={data.summary.deepConversations} />
            <SummaryCard icon={Sparkles} label='סה"כ רגעי insight' value={data.summary.totalInsights} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">התפלגות אורך שיחות</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.lengthDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">שיחות לפי שלב</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.stageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">רשימת שיחות</CardTitle></CardHeader>
            <CardContent>
              {data.conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין שיחות בתקופה זו</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">מייל משתמש</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-right">שלב</TableHead>
                        <TableHead className="text-right">הודעות</TableHead>
                        <TableHead className="text-right">insights</TableHead>
                        <TableHead className="text-right">פעולה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.conversations.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm">{c.email || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {c.date ? new Date(c.date).toLocaleString('he-IL') : '—'}
                          </TableCell>
                          <TableCell className="text-sm">{stageLabels[c.stage] ?? c.stage ?? '—'}</TableCell>
                          <TableCell className="text-sm font-medium">{c.message_count}</TableCell>
                          <TableCell className="text-sm font-medium">{c.insight_count}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => setSelected(c)}>
                              <BookOpen className="w-4 h-4 ml-1" />
                              קרא שיחה
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle>שיחת מנטור</SheetTitle>
            <SheetDescription>
              {selected?.email} · {selected?.date ? new Date(selected.date).toLocaleString('he-IL') : ''}
              {selected?.stage ? ` · שלב: ${stageLabels[selected.stage] ?? selected.stage}` : ''}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {(selected?.messages ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">אין הודעות לשיחה זו</p>
            )}
            {(selected?.messages ?? []).map((m, idx) => {
              const isUser = m.role === 'user';
              const content = typeof m.content === 'string'
                ? m.content
                : JSON.stringify(m.content, null, 2);
              return (
                <div
                  key={idx}
                  className={
                    isUser
                      ? 'rounded-lg border bg-muted/40 p-3 mr-8'
                      : 'rounded-lg border bg-primary/5 border-primary/20 p-3 ml-8'
                  }
                >
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {isUser ? 'משתמש' : 'מנטור'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
