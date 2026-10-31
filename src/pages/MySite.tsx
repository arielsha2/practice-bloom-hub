import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Check, Copy, ExternalLink, Loader2, Lock, Sparkles, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SEOHead } from '@/components/SEOHead';
import { SITE_STYLES, SITE_STYLE_LABELS, TherapistSite, type SiteStyle } from '@/components/site/TherapistSite';
import { type StoredSite, isWizardSite, romanize, toSiteView } from '@/lib/siteContent';
import { uploadSitePhoto } from '@/lib/sitePhoto';
import { trackEvent } from '@/lib/analytics';

type Step = 'loading' | 'needs_info' | 'words' | 'details' | 'style' | 'publish' | 'locked' | 'failed';

const EMPTY: StoredSite = {
  style: 'warm', fullName: '', title: '', keyPhrase: '', heroLine: '', about: '', forYouIf: ['', '', ''],
  firstSession: ['', '', ''], faq: [], contactLine: '', phone: '', email: '', location: '',
};

const STEP_LABELS: Array<[Step, string]> = [['words', 'המילים שלך'], ['details', 'פרטים'], ['style', 'סגנון'], ['publish', 'פרסום']];

export default function MySite() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('loading');
  const [site, setSite] = useState<StoredSite>(EMPTY);
  const [options, setOptions] = useState<string[]>([]);
  const [fields, setFields] = useState<Array<{ key: string; label: string; hint: string }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [published, setPublished] = useState(false);
  const [calendarLink, setCalendarLink] = useState('');
  const [fullPreview, setFullPreview] = useState<SiteStyle | null>(null);

  const patch = (p: Partial<StoredSite>) => setSite((s) => ({ ...s, ...p }));

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    void (async () => {
      const [{ data: row }, { data: prof }] = await Promise.all([
        supabase.from('therapist_websites').select('id, slug, is_published, content, calendar_link').eq('user_id', user.id).maybeSingle(),
        supabase.from('therapist_profiles').select('profile').eq('user_id', user.id).maybeSingle(),
      ]);
      const profile = ((prof as { profile?: Record<string, string> } | null)?.profile ?? {}) as Record<string, string>;
      const defaults: Partial<StoredSite> = {
        fullName: String((user.user_metadata as { full_name?: string })?.full_name ?? '').trim(),
        title: profile.profession ?? '',
        email: user.email ?? '',
        location: profile.location ?? '',
      };
      if (row) {
        setRowId(row.id as string);
        setSlug(row.slug as string);
        setPublished(!!row.is_published);
        setCalendarLink((row.calendar_link as string) ?? '');
        if (isWizardSite(row.content)) {
          setSite({ ...EMPTY, ...defaults, ...(row.content as StoredSite) });
          setConfirmed(true);
          setStep('words');
          return;
        }
      }
      setSite({ ...EMPTY, ...defaults });
      await generate({});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function generate(extra: Record<string, string>) {
    setBusy(true);
    setStep('loading');
    try {
      const { data, error } = await supabase.functions.invoke('generate-site-content', { body: { answers: extra } });
      if (error) {
        const status = (error as { context?: Response }).context?.status;
        setStep(status === 403 ? 'locked' : 'failed');
        return;
      }
      if (data?.status === 'needs_info') { setFields(data.fields); setStep('needs_info'); return; }
      if (data?.status !== 'ok') { setStep('failed'); return; }
      const c = data.content;
      const opts: string[] = data.key_phrase_options ?? [];
      setOptions(opts);
      setSite((s) => ({
        ...s,
        keyPhrase: s.keyPhrase || opts[0] || '',
        heroLine: c.hero_line, about: c.about, forYouIf: c.for_you_if, firstSession: c.first_session,
        faq: c.faq, contactLine: c.contact_line,
      }));
      setStep('words');
    } finally {
      setBusy(false);
    }
  }

  const view = useMemo(() => toSiteView(site, calendarLink), [site, calendarLink]);

  async function save(publish: boolean): Promise<boolean> {
    if (!user) return false;
    const finalSlug = slug || romanize(site.fullName);
    const content: StoredSite = { ...site, confirmedAt: site.confirmedAt ?? new Date().toISOString() };
    const payload = { user_id: user.id, slug: finalSlug, content: content as never, calendar_link: calendarLink || null, contact_method: calendarLink ? 'calendar' : 'form', ...(publish ? { is_published: true } : {}) };
    let error;
    if (rowId) ({ error } = await supabase.from('therapist_websites').update(payload).eq('id', rowId));
    else {
      const res = await supabase.from('therapist_websites').insert({ ...payload, is_published: !!publish }).select('id').single();
      error = res.error;
      if (res.data) setRowId(res.data.id as string);
    }
    if (error) {
      const msg = String((error as { message?: string }).message ?? '');
      if (msg.includes('Mentor') || (error as { code?: string }).code === '42501') toast.error('פרסום האתר הוא חלק מהמנטור המלא');
      else if ((error as { code?: string }).code === '23505') toast.error('הכתובת הזו תפוסה. אפשר לבחור כתובת אחרת');
      else toast.error('השמירה נכשלה');
      return false;
    }
    setSlug(finalSlug);
    return true;
  }

  async function next(to: Step) {
    setBusy(true);
    const ok = await save(false);
    setBusy(false);
    if (ok) setStep(to);
  }

  async function publish() {
    setBusy(true);
    const ok = await save(true);
    setBusy(false);
    if (ok) { setPublished(true); trackEvent('site_published', { style: site.style }); toast.success('האתר פורסם'); }
  }

  const wordsOk = !!site.keyPhrase.trim() && !!site.about.trim() && site.forYouIf.every((x) => x.trim()) && confirmed;
  const detailsOk = !!site.fullName.trim() && !!site.title.trim() && (!!site.phone?.trim() || !!site.email?.trim());
  const url = `${window.location.origin}/t/${slug}`;

  const stepIndex = STEP_LABELS.findIndex(([k]) => k === step);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <SEOHead title="האתר שלי" description="בניית האתר האישי" canonicalUrl="https://therapykeys.co.il/" noindex />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <Link to="/mentor" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline"><ArrowRight className="w-4 h-4" />חזרה למנטור</Link>
          <h1 className="text-xl font-serif font-semibold">האתר שלי</h1>
          <span />
        </div>

        {stepIndex >= 0 && (
          <ol className="flex items-center gap-2 mb-6 text-sm flex-wrap">
            {STEP_LABELS.map(([k, label], i) => (
              <li key={k} className={`px-3 py-1 rounded-full border ${i === stepIndex ? 'bg-primary text-primary-foreground border-primary' : i < stepIndex ? 'border-primary/40 text-foreground' : 'text-muted-foreground'}`}>
                {i < stepIndex && <Check className="w-3.5 h-3.5 inline me-1" />}{label}
              </li>
            ))}
          </ol>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="w-7 h-7 animate-spin" />
            <p>כותבים את הטיוטה ממה שסיפרת למנטור. זה לוקח כחצי דקה.</p>
          </div>
        )}

        {step === 'locked' && (
          <div className="rounded-2xl border p-8 text-center space-y-3">
            <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">בניית אתר היא חלק מהמנטור</h2>
            <p className="text-muted-foreground">אחרי שפותחים את המנטור, האתר נבנה ממה שסיפרת ומהתוצרים שלך.</p>
            <Button asChild><Link to="/mentor">למנטור</Link></Button>
          </div>
        )}

        {step === 'failed' && (
          <div className="rounded-2xl border p-8 text-center space-y-3">
            <p>לא הצלחנו לכתוב את הטיוטה עכשיו.</p>
            <Button onClick={() => generate(answers)}>לנסות שוב</Button>
          </div>
        )}

        {step === 'needs_info' && (
          <div className="rounded-2xl border p-6 space-y-4 max-w-2xl">
            <h2 className="text-lg font-semibold">כדי לכתוב את הדף חסרים כמה פרטים</h2>
            {fields.map((f) => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Textarea rows={2} className="mt-1" placeholder={f.hint} value={answers[f.key] ?? ''} onChange={(e) => setAnswers({ ...answers, [f.key]: e.target.value })} />
              </div>
            ))}
            <Button disabled={busy || fields.some((f) => !(answers[f.key] ?? '').trim())} onClick={() => generate(answers)} className="gap-2"><Sparkles className="w-4 h-4" />כתבו לי את הטיוטה</Button>
          </div>
        )}

        {step === 'words' && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h2 className="text-lg font-semibold">המילים שיופיעו באתר</h2>
              <p className="text-sm text-muted-foreground">זו טיוטה, ואתה מחליט מה נכנס. עבור על כל משפט ושנה אותו עד שהוא נשמע בדיוק כמוך.</p>
            </div>

            <div>
              <Label>הכותרת הראשית</Label>
              {options.length > 1 && (
                <div className="flex flex-col gap-1 my-2">
                  {options.map((o, i) => (
                    <button key={i} type="button" onClick={() => patch({ keyPhrase: o })} className={`text-start text-sm rounded-lg border px-3 py-2 ${site.keyPhrase === o ? 'border-primary bg-primary/5' : ''}`}>{o}</button>
                  ))}
                </div>
              )}
              <Textarea rows={2} value={site.keyPhrase} onChange={(e) => patch({ keyPhrase: e.target.value })} placeholder="משפט אחד שאומר למי העבודה שלך מתאימה ובמה היא עוזרת" />
              {!options.length && <p className="text-xs text-muted-foreground mt-1">אפשר להכין משפט מיקוד ב"התיק שלי" במנטור, או לכתוב כאן בעצמך.</p>}
            </div>
            <div><Label>שורה מתחת לכותרת</Label><Textarea rows={2} value={site.heroLine ?? ''} onChange={(e) => patch({ heroLine: e.target.value })} /></div>
            <div><Label>קצת עליי</Label><Textarea rows={6} value={site.about} onChange={(e) => patch({ about: e.target.value })} /></div>
            <div className="space-y-2"><Label>למי זה מתאים (שלושה משפטים)</Label>
              {site.forYouIf.map((l, i) => <Input key={i} value={l} onChange={(e) => patch({ forYouIf: site.forYouIf.map((x, j) => (j === i ? e.target.value : x)) })} />)}
            </div>
            <div className="space-y-2"><Label>איך מתחילים (שלושה צעדים)</Label>
              {site.firstSession.map((l, i) => <Input key={i} value={l} onChange={(e) => patch({ firstSession: site.firstSession.map((x, j) => (j === i ? e.target.value : x)) })} />)}
            </div>
            <div className="space-y-3"><Label>שאלות נפוצות</Label>
              {site.faq.map((f, i) => (
                <div key={i} className="rounded-xl border p-3 space-y-2">
                  <Input value={f.q} onChange={(e) => patch({ faq: site.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} />
                  <Textarea rows={2} value={f.a} onChange={(e) => patch({ faq: site.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} />
                </div>
              ))}
            </div>
            <div><Label>משפט לפני כפתורי הפנייה</Label><Input value={site.contactLine ?? ''} onChange={(e) => patch({ contactLine: e.target.value })} /></div>

            <label className="flex items-start gap-2 rounded-xl border p-3 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span className="text-sm">עברתי על הטקסטים, והם מייצגים אותי. אין בהם הבטחת תוצאות, המלצות מטופלים או פרטים של מטופלים.</span>
            </label>
            <div className="flex gap-2">
              <Button disabled={!wordsOk || busy} onClick={() => next('details')}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'המשך לפרטים'}</Button>
              <Button variant="outline" disabled={busy} onClick={() => generate(answers)}>כתבו לי טיוטה חדשה</Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-lg font-semibold">הפרטים שיופיעו בדף</h2>
            <div><Label>שם מלא *</Label><Input value={site.fullName} onChange={(e) => patch({ fullName: e.target.value })} /></div>
            <div><Label>המקצוע *</Label><Input value={site.title} onChange={(e) => patch({ title: e.target.value })} placeholder="למשל: פסיכולוגית קלינית, טיפול זוגי" /></div>
            <div><Label>מיקום ופורמט</Label><Input value={site.location ?? ''} onChange={(e) => patch({ location: e.target.value })} placeholder="למשל: חיפה · גם אונליין" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>טלפון</Label><Input value={site.phone ?? ''} onChange={(e) => patch({ phone: e.target.value })} dir="ltr" /></div>
              <div><Label>אימייל</Label><Input value={site.email ?? ''} onChange={(e) => patch({ email: e.target.value })} dir="ltr" /></div>
            </div>
            <div><Label>קישור ליומן לקביעת פגישות (לא חובה)</Label><Input value={calendarLink} onChange={(e) => setCalendarLink(e.target.value)} dir="ltr" placeholder="https://" /></div>
            <div>
              <Label>תמונה</Label>
              <div className="flex items-center gap-3 mt-1">
                {site.avatarUrl && <img src={site.avatarUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />}
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer hover:bg-accent text-sm">
                  <Upload className="w-4 h-4" />{site.avatarUrl ? 'החלפת תמונה' : 'העלאת תמונה'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f || !user) return;
                    const r = await uploadSitePhoto(user.id, f);
                    if ('url' in r) patch({ avatarUrl: r.url }); else toast.error(r.message);
                  }} />
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('words')}>חזרה</Button>
              <Button disabled={!detailsOk || busy} onClick={() => next('style')}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'המשך לבחירת סגנון'}</Button>
            </div>
          </div>
        )}

        {step === 'style' && (
          <div className="space-y-4">
            <div><h2 className="text-lg font-semibold">איך הדף שלך ייראה</h2><p className="text-sm text-muted-foreground">אותו תוכן בשלושה סגנונות. בחר את זה שמרגיש הכי קרוב אליך, אפשר להחליף בכל זמן.</p></div>
            <div className="grid md:grid-cols-3 gap-4">
              {SITE_STYLES.map((st) => (
                <div key={st} className={`rounded-2xl border-2 overflow-hidden ${site.style === st ? 'border-primary' : 'border-border'}`}>
                  <button type="button" onClick={() => patch({ style: st })} className="block w-full text-start">
                    <div style={{ height: 380, overflow: 'hidden', position: 'relative', pointerEvents: 'none' }}>
                      <div style={{ width: 1100, transform: 'scale(0.29)', transformOrigin: 'top right', position: 'absolute', top: 0, right: 0 }}>
                        <TherapistSite site={view} style={st} />
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between"><span className="font-medium">{SITE_STYLE_LABELS[st]}</span>{site.style === st && <Check className="w-4 h-4 text-primary" />}</div>
                  </button>
                  <div className="px-3 pb-3"><Button size="sm" variant="outline" onClick={() => setFullPreview(st)}>תצוגה מלאה</Button></div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('details')}>חזרה</Button>
              <Button disabled={busy} onClick={() => next('publish')}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'המשך לפרסום'}</Button>
            </div>
          </div>
        )}

        {step === 'publish' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-lg font-semibold">{published ? 'האתר שלך חי' : 'מוכן לפרסום'}</h2>
            <div>
              <Label>הכתובת של הדף</Label>
              <div className="flex items-center gap-2 mt-1" dir="ltr">
                <span className="text-sm text-muted-foreground">{window.location.origin}/t/</span>
                <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="max-w-[16rem]" />
              </div>
            </div>
            {published ? (
              <div className="rounded-xl border p-4 space-y-3">
                <a href={url} target="_blank" rel="noreferrer" className="text-primary font-semibold inline-flex items-center gap-1" dir="ltr">{url}<ExternalLink className="w-4 h-4" /></a>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(url); toast.success('הקישור הועתק'); }}><Copy className="w-4 h-4 me-1" />העתקה</Button>
                  <Button size="sm" onClick={() => setStep('words')}>עריכה</Button>
                </div>
                <p className="text-xs text-muted-foreground">שינויים מופיעים באתר תוך כעשר דקות. כדי להופיע בחיפוש בגוגל, אפשר להוסיף את הכתובת ב-Google Search Console.</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('style')}>חזרה</Button>
                <Button onClick={publish} disabled={busy || !slug} className="gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}פרסום האתר</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {fullPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-auto" onClick={() => setFullPreview(null)}>
          <div className="min-h-full max-w-5xl mx-auto bg-background" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between bg-black text-white px-4 py-2 text-sm">
              <span>{SITE_STYLE_LABELS[fullPreview]}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { patch({ style: fullPreview }); setFullPreview(null); }}>בחירה בסגנון הזה</Button>
                <Button size="sm" variant="ghost" className="text-white" onClick={() => setFullPreview(null)}>סגירה</Button>
              </div>
            </div>
            <TherapistSite site={view} style={fullPreview} />
          </div>
        </div>
      )}
    </div>
  );
}
