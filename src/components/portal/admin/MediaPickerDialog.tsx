import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Video,
  FileText,
  Presentation,
  Music,
  Link,
  Search,
  Plus,
  Check,
  Loader2,
  Youtube,
} from 'lucide-react';
import { toast } from 'sonner';
import { MediaUploadDialog } from './MediaUploadDialog';

interface MediaItem {
  id: string;
  title: string;
  media_kind: 'video' | 'document' | 'presentation' | 'audio' | 'link';
  source: string;
  duration_seconds: number | null;
}

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  existingMediaIds: string[];
  onMediaAdded: () => void;
}

type MediaKindFilter = 'all' | 'video' | 'document' | 'presentation' | 'audio' | 'link';

const getMediaIcon = (kind: string, source?: string) => {
  if (kind === 'video' && source === 'youtube') return Youtube;
  switch (kind) {
    case 'video':
      return Video;
    case 'document':
      return FileText;
    case 'presentation':
      return Presentation;
    case 'audio':
      return Music;
    case 'link':
      return Link;
    default:
      return FileText;
  }
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  lessonId,
  existingMediaIds,
  onMediaAdded,
}: MediaPickerDialogProps) {
  const { t, isRTL } = useLanguage();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<MediaKindFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMedia();
      setSelectedIds(new Set());
    }
  }, [open]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('id, title, media_kind, source, duration_seconds')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia((data || []) as MediaItem[]);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleAddToLesson = async () => {
    if (selectedIds.size === 0) return;

    setIsAdding(true);
    try {
      // Get current max display_order
      const { data: existingLinks } = await supabase
        .from('lesson_media_links')
        .select('display_order')
        .eq('lesson_id', lessonId)
        .order('display_order', { ascending: false })
        .limit(1);

      let nextOrder = (existingLinks?.[0]?.display_order ?? -1) + 1;

      // Insert new links
      const newLinks = Array.from(selectedIds).map((mediaId, index) => ({
        lesson_id: lessonId,
        media_id: mediaId,
        display_order: nextOrder + index,
      }));

      const { error } = await supabase.from('lesson_media_links').insert(newLinks);

      if (error) throw error;

      toast.success(t('media.addedToLesson'));
      onMediaAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding media to lesson:', error);
      toast.error(t('portal.admin.fileError'));
    } finally {
      setIsAdding(false);
    }
  };

  // Filter media (exclude already linked)
  const filteredMedia = media.filter((item) => {
    if (existingMediaIds.includes(item.id)) return false;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKind = kindFilter === 'all' || item.media_kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{t('media.selectFromLibrary')}</span>
              <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
                <Plus className="w-4 h-4 me-1" />
                {t('media.uploadNew')}
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex gap-3 py-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('media.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as MediaKindFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('media.allTypes')}</SelectItem>
                <SelectItem value="video">{t('media.typeVideo')}</SelectItem>
                <SelectItem value="document">{t('media.typeDocument')}</SelectItem>
                <SelectItem value="presentation">{t('media.typePresentation')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Media list */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t('media.noMedia')}
              </div>
            ) : (
              filteredMedia.map((item) => {
                const Icon = getMediaIcon(item.media_kind, item.source);
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.source !== 'file' && item.source}
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {t(`media.type${item.media_kind.charAt(0).toUpperCase() + item.media_kind.slice(1)}`)}
                    </Badge>
                    {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0
                ? t('media.selectedCount').replace('{count}', String(selectedIds.size))
                : ''}
            </span>
            <Button onClick={handleAddToLesson} disabled={selectedIds.size === 0 || isAdding}>
              {isAdding ? (
                <Loader2 className="w-4 h-4 me-1 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 me-1" />
              )}
              {t('media.addToLesson')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploaded={() => {
          fetchMedia();
          setUploadDialogOpen(false);
        }}
      />
    </>
  );
}
