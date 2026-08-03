import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export interface DreamContact {
  id: string;
  profession: string;
  reasoning: string;
  name: string;
  phone: string;
  email: string;
}

interface ContactDreamTableProps {
  contacts: DreamContact[];
}

export function ContactDreamTable({ contacts: initial }: ContactDreamTableProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<DreamContact[]>(initial);

  const persist = async (next: DreamContact[]) => {
    setContacts(next);
    if (!user) return;
    await supabase
      .from("therapist_journeys")
      .update({ contact_finder_output: next as any })
      .eq("user_id", user.id);
  };

  const updateField = (id: string, field: keyof DreamContact, value: string) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const saveField = () => {
    persist(contacts);
  };

  const addRow = () => {
    const next: DreamContact[] = [
      ...contacts,
      { id: crypto.randomUUID(), profession: "", reasoning: "", name: "", phone: "", email: "" },
    ];
    persist(next);
  };

  return (
    <div className="bg-card/80 backdrop-blur border border-mentor-border/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-serif font-semibold text-lg text-foreground">רשימת אנשי הקשר שלך</h3>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={addRow}>
          <Plus className="w-3.5 h-3.5" />
          <span className="ms-1">הוסיפי איש קשר</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        אלה סוגי אנשי הקשר שעלו בשיחה שלך — השלימי שם, טלפון ומייל כשתאתרי מישהו מתאים, או הוסיפי רעיונות נוספים משלך.
      </p>
      <div className="space-y-3">
        {contacts.map((c) => (
          <div key={c.id} className="border border-mentor-border/50 rounded-xl p-3">
            <div className="mb-2">
              {c.profession ? (
                <p className="font-medium text-sm text-foreground">{c.profession}</p>
              ) : (
                <Input
                  placeholder="תחום / תפקיד"
                  value={c.profession}
                  onChange={(e) => updateField(c.id, "profession", e.target.value)}
                  onBlur={saveField}
                  className="h-8 text-sm"
                />
              )}
              {c.reasoning && <p className="text-xs text-muted-foreground mt-0.5">{c.reasoning}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="שם"
                value={c.name}
                onChange={(e) => updateField(c.id, "name", e.target.value)}
                onBlur={saveField}
                className="h-8 text-sm"
              />
              <Input
                placeholder="טלפון"
                value={c.phone}
                onChange={(e) => updateField(c.id, "phone", e.target.value)}
                onBlur={saveField}
                className="h-8 text-sm"
              />
              <Input
                placeholder="מייל"
                value={c.email}
                onChange={(e) => updateField(c.id, "email", e.target.value)}
                onBlur={saveField}
                className="h-8 text-sm"
              />
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">אין עדיין אנשי קשר — הוסיפי את הראשון.</p>
        )}
      </div>
    </div>
  );
}
