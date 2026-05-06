import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Sparkles, Compass, Calculator, Mic, Users, Handshake, Check } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const STAGES_HE = [
  { icon: Compass, title: "מציאת הנישה", desc: "הגדירו את הקהל שאתם הכי טובים בלעזור לו." },
  { icon: Calculator, title: "תמחור הקליניקה", desc: "קבעו מחיר שמשקף את הערך שלכם." },
  { icon: Mic, title: "הצגה עצמית", desc: "נסחו מסר שמושך את המטופל הנכון." },
  { icon: Users, title: "מציאת אנשי קשר להפניות", desc: "בנו רשת מקצועית שמזרימה פניות." },
  { icon: Handshake, title: "גשר ההתקשרות", desc: "סגרו את הפער בין שיחת היכרות לטיפול." },
];

const STAGES_EN = [
  { icon: Compass, title: "Define Your Niche", desc: "Identify the audience you serve best." },
  { icon: Calculator, title: "Set Your Pricing", desc: "Price that reflects your real value." },
  { icon: Mic, title: "Craft Your Self-Presentation", desc: "Speak in a way the right client hears." },
  { icon: Users, title: "Find Referral Contacts", desc: "Build a network that sends inquiries." },
  { icon: Handshake, title: "The Connection Bridge", desc: "Turn first calls into committed clients." },
];

export default function Mentor() {
  const { isRTL, language } = useLanguage();
  const stages = language === "he" ? STAGES_HE : STAGES_EN;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error(isRTL ? "יותר מדי בקשות, נסו שוב בעוד רגע" : "Rate limited, try again soon");
        else if (resp.status === 402) toast.error(isRTL ? "נגמרו הקרדיטים, פנו למנהל" : "Credits exhausted");
        else toast.error(isRTL ? "שגיאה בשליחה" : "Send failed");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((prev) =>
                prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistant } : m))
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? "שגיאת רשת" : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageClick = (idx: number) => {
    setActiveStage(idx);
    const stage = stages[idx];
    send(isRTL ? `אני רוצה להתמקד בשלב: ${stage.title}` : `I'd like to focus on: ${stage.title}`);
  };

  const showWelcome = messages.length === 0;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-mentor-bg">
      <Header />
      <main className="flex-1 pt-16">
        <section className="py-12 md:py-16 border-b border-mentor-border/50">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-mentor-accent/10 border border-mentor-accent/30 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-mentor-accent" />
              <span className="text-mentor-accent font-medium text-sm">
                {isRTL ? "המנטור" : "The Mentor"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-foreground mb-4 tracking-tight">
              {isRTL ? "האדריכל לצמיחת הקליניקה שלך" : "Your Practice Growth Architect"}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              {isRTL
                ? "ליווי אישי, אסטרטגי ורגיש — מהמטפלים, ובשבילם. שאלו, רפלקטו, וצמחו."
                : "Personal, strategic, and emotionally attuned guidance — by therapists, for therapists."}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* Chat — 60% */}
            <div className="lg:col-span-3 bg-card border border-mentor-border/60 rounded-2xl shadow-sm flex flex-col h-[70vh] min-h-[520px] overflow-hidden">
              <div className="px-5 py-4 border-b border-mentor-border/60 bg-mentor-surface flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-mentor-accent/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-mentor-accent" />
                </div>
                <div>
                  <h2 className="font-serif font-semibold text-foreground leading-tight">
                    {isRTL ? "המנטור" : "The Mentor"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "ליווי אסטרטגי לקליניקה" : "Strategic practice mentor"}
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 px-5 py-6">
                <div className="space-y-4 max-w-2xl mx-auto">
                  {showWelcome && (
                    <div className="bg-mentor-surface border border-mentor-border/60 rounded-xl p-5">
                      <p className="text-foreground leading-relaxed">
                        {isRTL
                          ? "ברוכים הבאים. באיזה שלב של הקליניקה נתמקד היום?"
                          : "Welcome. Which stage of your practice are we focusing on today?"}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2 mt-4">
                        {stages.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => handleStageClick(i)}
                            className="text-start text-sm px-3 py-2 rounded-lg border border-mentor-border/60 hover:bg-mentor-accent/10 hover:border-mentor-accent/40 transition-colors"
                          >
                            {i + 1}. {s.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          m.role === "user"
                            ? "bg-mentor-accent text-mentor-accent-foreground"
                            : "bg-mentor-surface border border-mentor-border/60 text-foreground"
                        }`}
                      >
                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-headings:my-2 prose-a:text-mentor-accent">
                          <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              </ScrollArea>

              <div className="border-t border-mentor-border/60 p-4 bg-mentor-surface">
                <div className="flex gap-2 items-end max-w-2xl mx-auto">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder={isRTL ? "כתבו את שאלתכם…" : "Type your question…"}
                    className="min-h-[48px] max-h-[140px] resize-none bg-card border-mentor-border/60"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={() => send(input)}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-[48px] w-[48px] flex-shrink-0 bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Roadmap — 40% */}
            <aside className="lg:col-span-2">
              <div className="bg-card border border-mentor-border/60 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-serif font-semibold text-foreground mb-1">
                  {isRTL ? "מפת הדרך" : "Your Roadmap"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {isRTL ? "5 שלבים לבניית קליניקה משגשגת" : "5 steps to a thriving practice"}
                </p>

                <ol className="relative space-y-4">
                  {stages.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = activeStage === i;
                    return (
                      <li key={i} className="relative">
                        <button
                          onClick={() => handleStageClick(i)}
                          className={`w-full text-start flex gap-4 p-3 rounded-xl border transition-all ${
                            isActive
                              ? "border-mentor-accent bg-mentor-accent/10"
                              : "border-mentor-border/50 hover:border-mentor-accent/40 hover:bg-mentor-surface"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              isActive
                                ? "bg-mentor-accent text-mentor-accent-foreground"
                                : "bg-mentor-surface text-mentor-accent"
                            }`}
                          >
                            {isActive ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-semibold text-mentor-accent">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <h4 className="font-medium text-foreground">{s.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
