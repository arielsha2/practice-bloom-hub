import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Plus, Search, Loader2 } from 'lucide-react';
import { MediaLibraryTable } from '@/components/portal/admin/MediaLibraryTable';
import { MediaUploadDialog } from '@/components/portal/admin/MediaUploadDialog';
import { MediaEditDialog } from '@/components/portal/admin/MediaEditDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  media_kind: 'video' | 'document' | 'presentation' | 'audio' | 'link';
  file_format: string | null;
  file_path: string | null;
  url: string | null;
  source: string;
  external_id: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  intended_use: string | null;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

type MediaKindFilter = 'all' | 'video' | 'document' | 'presentation' | 'audio' | 'link';

export default function MediaLibrary() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isLoading: isCheckingAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<MediaKindFilter>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (isAdmin) {
      fetchMedia();
    }
  }, [isAdmin]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      // Fetch media with usage count
      const { data: mediaData, error: mediaError } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      // Fetch usage counts
      const { data: linksData, error: linksError } = await supabase
        .from('lesson_media_links')
        .select('media_id');

      if (linksError) throw linksError;

      // Count usage per media
      const usageMap = new Map<string, number>();
      linksData?.forEach((link) => {
        usageMap.set(link.media_id, (usageMap.get(link.media_id) || 0) + 1);
      });

      // Combine data
      const mediaWithUsage = (mediaData || []).map((item) => ({
        ...item,
        usage_count: usageMap.get(item.id) || 0,
      })) as MediaItem[];

      setMedia(mediaWithUsage);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error(t('portal.admin.fileError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    try {
      // Delete from storage if it's a file
      if (item.file_path) {
        await supabase.storage.from('course-materials').remove([item.file_path]);
      }

      // Delete from database
      const { error } = await supabase.from('media_library').delete().eq('id', item.id);

      if (error) throw error;

      toast.success(t('portal.admin.resourceDeleted'));
      fetchMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error(t('portal.admin.deleteError'));
    }
  };

  // Filter media
  const filteredMedia = media.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKind = kindFilter === 'all' || item.media_kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  // Loading state
  if (isCheckingAdmin || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Access denied
  if (!user || !isAdmin) {
    navigate('/portal');
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/portal/admin')}>
              <BackArrow className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{t('media.title')}</h1>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="w-4 h-4 me-2" />
            {t('media.upload')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('media.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
          <Select
            value={kindFilter}
            onValueChange={(value) => setKindFilter(value as MediaKindFilter)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('media.filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('media.allTypes')}</SelectItem>
              <SelectItem value="video">{t('media.typeVideo')}</SelectItem>
              <SelectItem value="document">{t('media.typeDocument')}</SelectItem>
              <SelectItem value="presentation">{t('media.typePresentation')}</SelectItem>
              <SelectItem value="audio">{t('media.typeAudio')}</SelectItem>
              <SelectItem value="link">{t('media.typeLink')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <MediaLibraryTable
          media={filteredMedia}
          onEdit={setEditingMedia}
          onDelete={handleDelete}
        />

        {/* Dialogs */}
        <MediaUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onUploaded={fetchMedia}
        />

        {editingMedia && (
          <MediaEditDialog
            open={!!editingMedia}
            onOpenChange={(open) => !open && setEditingMedia(null)}
            media={editingMedia}
            onUpdated={fetchMedia}
          />
        )}
      </div>
    </div>
  );
}
