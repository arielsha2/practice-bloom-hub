import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus } from 'lucide-react';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingFolders: string[];
  onCreate: (name: string) => void;
}

export function CreateFolderDialog({ open, onOpenChange, existingFolders, onCreate }: CreateFolderDialogProps) {
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState('');

  const isDuplicate = existingFolders.some((f) => f.toLowerCase() === name.trim().toLowerCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isDuplicate) return;
    onCreate(name.trim());
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setName(''); onOpenChange(o); }}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            {t('media.createFolder')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">{t('media.folderName')}</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('media.folderName')}
              autoFocus
            />
            {isDuplicate && (
              <p className="text-sm text-destructive">
                {isRTL ? 'תיקייה בשם זה כבר קיימת' : 'A folder with this name already exists'}
              </p>
            )}
          </div>
          <Button type="submit" disabled={!name.trim() || isDuplicate} className="w-full">
            {t('media.createFolder')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
