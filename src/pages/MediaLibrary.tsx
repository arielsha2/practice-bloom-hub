import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Plus, Search, Loader2, FolderPlus, Folder, ArrowUp } from 'lucide-react';
import { MediaLibraryTable } from '@/components/portal/admin/MediaLibraryTable';
import { MediaUploadDialog } from '@/components/portal/admin/MediaUploadDialog';
import { MediaEditDialog } from '@/components/portal/admin/MediaEditDialog';
import { FolderCard } from '@/components/portal/admin/FolderCard';
import { CreateFolderDialog } from '@/components/portal/admin/CreateFolderDialog';
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
  folder: string | null;
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
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [dbFolders, setDbFolders] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchMedia();
      fetchFolders();
    }
  }, [isAdmin]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('media_folders')
        .select('name')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setDbFolders((data || []).map((f) => f.name));
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const { data: mediaData, error: mediaError } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      const { data: linksData, error: linksError } = await supabase
        .from('lesson_media_links')
        .select('media_id');

      if (linksError) throw linksError;

      const usageMap = new Map<string, number>();
      linksData?.forEach((link) => {
        usageMap.set(link.media_id, (usageMap.get(link.media_id) || 0) + 1);
      });

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
      if (item.file_path) {
        await supabase.storage.from('course-materials').remove([item.file_path]);
      }
      const { error } = await supabase.from('media_library').delete().eq('id', item.id);
      if (error) throw error;
      toast.success(t('portal.admin.resourceDeleted'));
      fetchMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error(t('portal.admin.deleteError'));
    }
  };

  const handleMoveToFolder = async (itemId: string, folder: string | null) => {
    try {
      const { error } = await supabase
        .from('media_library')
        .update({ folder })
        .eq('id', itemId);
      if (error) throw error;
      toast.success(folder ? t('media.moveToFolder') : t('media.movedToRoot'));
      fetchMedia();
    } catch (error) {
      console.error('Error moving media:', error);
      toast.error(t('portal.admin.deleteError'));
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    try {
      const { error: moveError } = await supabase
        .from('media_library')
        .update({ folder: null })
        .eq('folder', folderName);
      if (moveError) throw moveError;

      const { error: delError } = await supabase
        .from('media_folders')
        .delete()
        .eq('name', folderName);
      if (delError) throw delError;

      toast.success(t('media.folderDeleted'));
      if (currentFolder === folderName) setCurrentFolder(null);
      fetchMedia();
      fetchFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(t('portal.admin.deleteError'));
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const { error } = await supabase
        .from('media_folders')
        .insert({ name });
      if (error) throw error;
      toast.success(t('media.folderCreated'));
      setCreateFolderOpen(false);
      setCurrentFolder(name);
      fetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error(t('portal.admin.deleteError'));
    }
  };

  // Merge DB folders with any folder values on media items (backward compat)
  const mediaFolders = media.map((m) => m.folder).filter(Boolean) as string[];
  const folders = [...new Set([...dbFolders, ...mediaFolders])];

  // Filter media
  const filteredMedia = media.filter((item) => {
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKind = kindFilter === 'all' || item.media_kind === kindFilter;
    const matchesFolder = currentFolder === null ? true : (currentFolder === '__unsorted__' ? !item.folder : item.folder === currentFolder);
    return matchesSearch && matchesKind && matchesFolder;
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

  const unsortedCount = media.filter((m) => !m.folder).length;

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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
              <FolderPlus className="w-4 h-4 me-2" />
              {t('media.createFolder')}
            </Button>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="w-4 h-4 me-2" />
              {t('media.upload')}
            </Button>
          </div>
        </div>

        {/* Active folder indicator */}
        {currentFolder !== null && (
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFolder(null)}
              className="gap-1"
            >
              <ArrowUp className="w-4 h-4" />
              {t('media.backToFolders')}
            </Button>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-sm">
              {currentFolder === '__unsorted__' ? t('media.unsorted') : currentFolder}
            </span>
          </div>
        )}

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

        {/* Folders as drop targets - always visible when folders exist */}
        {folders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              {t('media.folders')}
            </h2>
            <div className="flex flex-wrap gap-3">
              {folders.map((folder) => {
                const count = media.filter((m) => m.folder === folder).length;
                const isActive = currentFolder === folder;
                return (
                  <FolderCard
                    key={folder}
                    name={folder}
                    count={count}
                    onClick={() => setCurrentFolder(isActive ? null : folder)}
                    onDelete={() => handleDeleteFolder(folder)}
                    onDropMedia={(mediaId) => handleMoveToFolder(mediaId, folder)}
                    isActive={isActive}
                  />
                );
              })}
              {/* Unsorted "folder" */}
              <FolderCard
                name={t('media.unsorted')}
                count={unsortedCount}
                onClick={() => setCurrentFolder(currentFolder === '__unsorted__' ? null : '__unsorted__')}
                onDropMedia={(mediaId) => handleMoveToFolder(mediaId, null)}
                isUnsorted
                isActive={currentFolder === '__unsorted__'}
              />
            </div>
          </div>
        )}

        {/* Media table - always shown */}
        <MediaLibraryTable
          media={filteredMedia}
          folders={folders}
          currentFolder={currentFolder}
          onEdit={setEditingMedia}
          onDelete={handleDelete}
          onMoveToFolder={handleMoveToFolder}
          onRenamed={fetchMedia}
        />

        {/* Dialogs */}
        <MediaUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onUploaded={fetchMedia}
        />

        <CreateFolderDialog
          open={createFolderOpen}
          onOpenChange={setCreateFolderOpen}
          existingFolders={folders}
          onCreate={handleCreateFolder}
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
