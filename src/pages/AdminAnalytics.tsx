import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAdminAnalytics, type AnalyticsPeriod } from '@/hooks/useAdminAnalytics';
import { PeriodSelector } from '@/components/admin/analytics/PeriodSelector';
import { KPICards } from '@/components/admin/analytics/KPICards';
import { SignupsChart } from '@/components/admin/analytics/SignupsChart';
import { BotUsageChart } from '@/components/admin/analytics/BotUsageChart';
import { LookerEmbed } from '@/components/admin/analytics/LookerEmbed';
import { MentorConversationsSection } from '@/components/admin/analytics/MentorConversationsSection';
import { DiagnosisFunnelCard } from '@/components/mentor/DiagnosisFunnelCard';
import { DiagnosisStatsCard } from '@/components/mentor/DiagnosisStatsCard';
import { DiagnosisAIInsightsCard } from '@/components/mentor/DiagnosisAIInsightsCard';
import { RefreshCw } from 'lucide-react';

export default function AdminAnalytics() {
  const { loading: authLoading, user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data, loading, error, refresh } = useAdminAnalytics(period);

  if (authLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">טוען…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Header />
      <main className="flex-1 pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground">אנליטיקה</h1>
              <p className="text-sm text-muted-foreground mt-1">נתוני שימוש, המרות ותנועה לאתר.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <PeriodSelector value={period} onChange={setPeriod} />
              <Button onClick={refresh} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
                רענן
              </Button>
            </div>
          </div>

          {error && (
            <Card><CardContent className="p-4 text-sm text-destructive">שגיאה: {error}</CardContent></Card>
          )}

          {!data && loading && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">טוען נתונים…</CardContent></Card>
          )}

          {data && (
            <>
              <KPICards data={data} />

              <MentorConversationsSection period={period} />

              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-3">האבחון (ClinicScan)</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DiagnosisFunnelCard period={period} />
                  <DiagnosisStatsCard period={period} />
                </div>
                <div className="mt-4">
                  <DiagnosisAIInsightsCard />
                  <p className="text-xs text-muted-foreground mt-2">הניתוח המעמיק למעלה מבוסס תמיד על כל האבחונים מכל הזמנים, ולא על טווח התאריכים שנבחר.</p>
                </div>
              </div>



              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">משפך המרה</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>בתקופת ניסיון פעילה</span><span className="font-semibold">{data.funnel.trialActive}</span></div>
                    <div className="flex justify-between"><span>ניסיון פג</span><span className="font-semibold">{data.funnel.trialExpired}</span></div>
                    <div className="flex justify-between"><span>שילמו</span><span className="font-semibold">{data.funnel.paid}</span></div>
                    <div className="flex justify-between border-t pt-2"><span>אחוז המרה</span><span className="font-semibold text-primary">{data.funnel.conversionRate}%</span></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">שימוש ב-AI</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>שיחות שנפתחו</span><span className="font-semibold">{data.ai.conversationsStarted}</span></div>
                    <div className="flex justify-between"><span>הודעות</span><span className="font-semibold">{data.ai.messagesCount}</span></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">קורסים</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>צפיות בשיעורים</span><span className="font-semibold">{data.course.lessonsWatched}</span></div>
                    <div className="flex justify-between"><span>שאלות שנשאלו</span><span className="font-semibold">{data.course.qaQuestions}</span></div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SignupsChart data={data.signups} />
                <BotUsageChart data={data.ai.topBots} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">שיעורים מובילים</CardTitle></CardHeader>
                  <CardContent>
                    {data.course.topLessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">אין נתונים בתקופה זו</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">שיעור</TableHead>
                            <TableHead className="text-right">צפיות</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.course.topLessons.map((l) => (
                            <TableRow key={l.id}>
                              <TableCell>{l.title}</TableCell>
                              <TableCell className="font-medium">{l.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">המרות אחרונות</CardTitle></CardHeader>
                  <CardContent>
                    {data.payments.recent.length === 0 ? (
                      <p className="text-sm text-muted-foreground">אין המרות בתקופה זו</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">משתמש</TableHead>
                            <TableHead className="text-right">תאריך</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.payments.recent.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-sm">{p.display_name || p.email || '—'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {p.plan_updated_at ? new Date(p.plan_updated_at).toLocaleDateString('he-IL') : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>

              <LookerEmbed />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
