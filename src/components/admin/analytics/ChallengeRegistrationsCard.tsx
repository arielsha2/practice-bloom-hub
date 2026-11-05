import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CollapsibleSection from "./CollapsibleSection";
import { Loader2, Trophy, Download } from "lucide-react";
import { sourceGroup, SOURCE_GROUP_LABELS, type SourceGroup } from "@/lib/challengeSource";

interface RegistrationRow {
  id: string;
  challenge_key: string;
  full_name: string;
  email: string;
  phone: string | null;
  source: string | null;
  marketing_consent: boolean;
  created_at: string;
}

interface ViewRow {
  source: string | null;
  visitor_id: string;
  created_at: string;
  already_registered?: boolean;
}

const GROUP_ORDER: SourceGroup[] = ["site", "lecture", "whatsapp", "fbgroup", "paid", "referral", "direct", "other"];

function toCsv(rows: RegistrationRow[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["תאריך", "שם", "מייל", "טלפון", "מקור", "קבוצת מקור", "הסכמה לדיוור"];
  const lines = rows.map((r) =>
    [
      new Date(r.created_at).toLocaleString("he-IL"),
      r.full_name,
      r.email,
      r.phone ?? "",
      r.source ?? "",
      SOURCE_GROUP_LABELS[sourceGroup(r.source)],
      r.marketing_consent ? "כן" : "לא",
    ].map(esc).join(","),
  );
  // BOM so Excel opens the Hebrew correctly
  return "﻿" + [header.map(esc).join(","), ...lines].join("\r\n");
}

export function ChallengeRegistrationsCard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [views, setViews] = useState<ViewRow[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("challenge_registrations")
      .select("id, challenge_key, full_name, email, phone, source, marketing_consent, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (loadError) setError(loadError.message);
    setRows((data as RegistrationRow[]) ?? []);
    // Page views only exist from the day visit tracking went live; a missing
    // table (migration not applied yet) just hides the visits table.
    const viewQuery = (columns: string) =>
      supabase.from("challenge_page_views").select(columns).order("created_at", { ascending: true }).limit(20000);
    let { data: viewData, error: viewError } = await viewQuery("source, visitor_id, created_at, already_registered");
    // Before migration 20261102120000 there is no already_registered column.
    if (viewError) ({ data: viewData } = await viewQuery("source, visitor_id, created_at"));
    setViews((viewData as unknown as ViewRow[]) ?? []);
    setLoading(false);
  }

  function downloadCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `challenge-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const total = rows.length;
  const byGroup = new Map<SourceGroup, number>();
  const bySource = new Map<string, number>();
  for (const r of rows) {
    const g = sourceGroup(r.source);
    byGroup.set(g, (byGroup.get(g) ?? 0) + 1);
    const key = r.source ?? "(ישיר)";
    bySource.set(key, (bySource.get(key) ?? 0) + 1);
  }
  const detailed = [...bySource.entries()].sort((a, b) => b[1] - a[1]);

  // Visits vs sign-ups per source, counted only from the first recorded
  // visit, so sign-ups from before visit tracking do not inflate conversion.
  // A visitor counts as "already registered" when their first recorded visit
  // came from a browser that had registered before: they cannot sign up
  // again, so they are left out of the conversion rate.
  const since = views[0]?.created_at ?? null;
  type Tally = { visitors: Set<string>; returning: Set<string>; visits: number; signups: number };
  const newTally = (): Tally => ({ visitors: new Set(), returning: new Set(), visits: 0, signups: 0 });
  const funnel = new Map<string, Tally>();
  const byLink = new Map<string, Tally>(); // organic group links only (wa-..., fbg-...)
  const isGroupLink = (src: string | null): src is string =>
    src !== null && (sourceGroup(src) === "whatsapp" || sourceGroup(src) === "fbgroup");
  const slot = (map: Map<string, Tally>, key: string) => {
    let f = map.get(key);
    if (!f) map.set(key, (f = newTally()));
    return f;
  };
  for (const v of views) {
    const targets = [slot(funnel, sourceGroup(v.source))];
    if (isGroupLink(v.source)) targets.push(slot(byLink, v.source));
    for (const f of targets) {
      f.visits++;
      if (!f.visitors.has(v.visitor_id)) {
        f.visitors.add(v.visitor_id);
        if (v.already_registered) f.returning.add(v.visitor_id);
      }
    }
  }
  if (since) {
    for (const r of rows) {
      if (r.created_at < since) continue;
      slot(funnel, sourceGroup(r.source)).signups++;
      if (isGroupLink(r.source)) slot(byLink, r.source).signups++;
    }
  }
  const summarize = (f: Tally) => ({
    visitors: f.visitors.size,
    returning: f.returning.size,
    fresh: f.visitors.size - f.returning.size,
    visits: f.visits,
    signups: f.signups,
  });
  const funnelRows = GROUP_ORDER.filter((g) => funnel.has(g)).map((g) => ({ g, ...summarize(funnel.get(g)!) }));
  const totals = funnelRows.reduce(
    (t, r) => ({
      visitors: t.visitors + r.visitors,
      returning: t.returning + r.returning,
      fresh: t.fresh + r.fresh,
      visits: t.visits + r.visits,
      signups: t.signups + r.signups,
    }),
    { visitors: 0, returning: 0, fresh: 0, visits: 0, signups: 0 },
  );
  const linkRows = [...byLink.entries()]
    .map(([src, f]) => ({ src, ...summarize(f) }))
    .sort((a, b) => b.visitors - a.visitors);
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          נרשמים לאתגר, לפי מקור
        </CardTitle>
        {total > 0 && (
          <Button variant="outline" size="sm" onClick={downloadCsv} className="gap-1.5">
            <Download className="w-4 h-4" />
            הורדה לאקסל
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">שגיאה: {error}</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">עדיין אין נרשמים.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">סה"כ</p>
                <p className="text-2xl font-semibold">{total}</p>
              </div>
              {GROUP_ORDER.filter((g) => byGroup.get(g)).map((g) => (
                <div key={g} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">{SOURCE_GROUP_LABELS[g]}</p>
                  <p className="text-2xl font-semibold">
                    {byGroup.get(g)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}· {Math.round(((byGroup.get(g) ?? 0) / total) * 100)}%
                    </span>
                  </p>
                </div>
              ))}
            </div>

            {since && (
              <CollapsibleSection title="כניסות מול נרשמים, לפי מקור" summary={`${funnelRows.length} מקורות · ${totals.signups} נרשמו`}>
                <p className="text-xs text-muted-foreground mb-2">
                  מאז {new Date(since).toLocaleDateString("he-IL")}, כשהתחלנו לספור כניסות. מבקרים = אנשים שונים
                  (לפי דפדפן); כניסות = כל פתיחה של הדף. "כבר רשומים" = מבקרים מדפדפן שכבר נרשם ממנו
                  (נספר רק מ-2.11.2026), והם לא נכללים בהמרה.
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">מקור</TableHead>
                        <TableHead className="text-right">מבקרים</TableHead>
                        <TableHead className="text-right">מהם כבר רשומים</TableHead>
                        <TableHead className="text-right">כניסות</TableHead>
                        <TableHead className="text-right">נרשמו</TableHead>
                        <TableHead className="text-right">לא נרשמו</TableHead>
                        <TableHead className="text-right">המרה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {funnelRows.map((r) => (
                        <TableRow key={r.g}>
                          <TableCell>{SOURCE_GROUP_LABELS[r.g]}</TableCell>
                          <TableCell>{r.visitors}</TableCell>
                          <TableCell>{r.returning}</TableCell>
                          <TableCell>{r.visits}</TableCell>
                          <TableCell>{r.signups}</TableCell>
                          <TableCell>{Math.max(r.fresh - r.signups, 0)}</TableCell>
                          <TableCell className="font-semibold">{pct(r.signups, r.fresh)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-semibold">סה"כ</TableCell>
                        <TableCell className="font-semibold">{totals.visitors}</TableCell>
                        <TableCell className="font-semibold">{totals.returning}</TableCell>
                        <TableCell className="font-semibold">{totals.visits}</TableCell>
                        <TableCell className="font-semibold">{totals.signups}</TableCell>
                        <TableCell className="font-semibold">{Math.max(totals.fresh - totals.signups, 0)}</TableCell>
                        <TableCell className="font-semibold">{pct(totals.signups, totals.fresh)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleSection>
            )}

            {linkRows.length > 0 && (
              <CollapsibleSection title="קבוצות ווטסאפ ופייסבוק, לפי קישור" summary={`${linkRows.length} קישורים`}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">קישור</TableHead>
                        <TableHead className="text-right">מבקרים</TableHead>
                        <TableHead className="text-right">מהם כבר רשומים</TableHead>
                        <TableHead className="text-right">נרשמו</TableHead>
                        <TableHead className="text-right">המרה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkRows.map((r) => (
                        <TableRow key={r.src}>
                          <TableCell dir="ltr" className="text-right">{r.src}</TableCell>
                          <TableCell>{r.visitors}</TableCell>
                          <TableCell>{r.returning}</TableCell>
                          <TableCell>{r.signups}</TableCell>
                          <TableCell className="font-semibold">{pct(r.signups, r.fresh)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleSection>
            )}

            {detailed.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">פירוט לפי קישור</p>
                <div className="flex flex-wrap gap-2">
                  {detailed.map(([src, n]) => (
                    <span key={src} className="rounded-full bg-secondary px-3 py-1 text-xs" dir="ltr">
                      {src}: {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <CollapsibleSection title="רשימת הנרשמים" summary={`${total} נרשמים`}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">תאריך</TableHead>
                    <TableHead className="text-right">שם</TableHead>
                    <TableHead className="text-right">מייל</TableHead>
                    <TableHead className="text-right">טלפון</TableHead>
                    <TableHead className="text-right">מקור</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("he-IL")}</TableCell>
                      <TableCell>{r.full_name}</TableCell>
                      <TableCell dir="ltr" className="text-right">{r.email}</TableCell>
                      <TableCell dir="ltr" className="text-right">{r.phone ?? "—"}</TableCell>
                      <TableCell>
                        {SOURCE_GROUP_LABELS[sourceGroup(r.source)]}
                        {r.source && sourceGroup(r.source) !== "site" && (
                          <span className="block text-xs text-muted-foreground" dir="ltr">{r.source}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {total > 100 && (
                <p className="text-xs text-muted-foreground mt-2">מוצגים 100 האחרונים. הרשימה המלאה בהורדה לאקסל.</p>
              )}
            </div>
            </CollapsibleSection>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
