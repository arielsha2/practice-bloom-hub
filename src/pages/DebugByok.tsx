import { useState } from "react";
import { ByokKeyDialog } from "@/components/mentor/ByokKeyDialog";
import { Button } from "@/components/ui/button";

export default function DebugByok() {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-8" dir="rtl">
      <Button onClick={() => setOpen(true)}>פתח דיאלוג</Button>
      <ByokKeyDialog open={open} onOpenChange={setOpen} reason="missing" />
    </div>
  );
}
