import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const GROUP_ORDER: SourceGroup[] = ["site", "lecture", "paid", "referral", "direct", "other"];

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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
