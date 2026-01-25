import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { ContentForm } from '@/components/contents/ContentForm';
import { BulkImportDialog } from '@/components/contents/BulkImportDialog';
import { TagSelector } from '@/components/contents/TagSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, Upload, Search, Edit, Trash2, Eye, Clock, 
  CheckCircle, FileText, Archive
} from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name_he: string;
  name_en: string;
  slug: string;
}

interface Tag {
  id: string;
  name_he: string;
  name_en: string;
  slug: string;
}

interface Content {
  id: string;
  title: string;
  content: string;
  language: string;
  published_at: string | null;
  created_at: string;
  status: string;
  category_id: string | null;
  scheduled_publish_at: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
}

interface ContentWithTags extends Content {
  tags: Tag[];
}

export default function ContentsAdmin() {
  const navigate = useNavigate();
  const { t, isRTL, language } = useLanguage();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  
  const [contents, setContents] = useState<ContentWithTags[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Redirect non-admins
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      toast.error(isRTL ? 'אין לך הרשאה לדף זה' : 'You do not have permission to access this page');
      navigate('/');
    }
  }, [isAdmin, isAdminLoading, navigate, isRTL]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('content_categories')
      .select('*')
      .order('display_order');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('content_tags')
      .select('*')
      .order('name_he');
    
    if (!error && data) {
      setTags(data);
    }
  };

  const fetchContents = async () => {
    try {
      // Fetch all contents (admin can see all)
      const { data: contentsData, error: contentsError } = await supabase
        .from('contents')
        .select('*')
        .order('created_at', { ascending: false });

      if (contentsError) {
        console.error('Error fetching contents:', contentsError);
        return;
      }

      // Fetch tag links for all contents
      const { data: tagLinks, error: tagLinksError } = await supabase
        .from('content_tag_links')
        .select('content_id, tag_id');

      if (tagLinksError) {
        console.error('Error fetching tag links:', tagLinksError);
      }

      // Map tags to contents
      const contentsWithTags: ContentWithTags[] = (contentsData || []).map(content => {
        const contentTagIds = (tagLinks || [])
          .filter(link => link.content_id === content.id)
          .map(link => link.tag_id);
        
        const contentTags = tags.filter(tag => contentTagIds.includes(tag.id));
        
        return { ...content, tags: contentTags };
      });

      setContents(contentsWithTags);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    if (tags.length > 0 || !loading) {
      fetchContents();
    }
  }, [tags]);

  const handleDelete = async () => {
    if (!deletingId) return;
    
    try {
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', deletingId);

      if (error) {
        toast.error(isRTL ? 'שגיאה במחיקת המאמר' : 'Error deleting article');
      } else {
        toast.success(isRTL ? 'המאמר נמחק בהצלחה' : 'Article deleted successfully');
        fetchContents();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleContentSaved = () => {
    setShowForm(false);
    setEditingContent(null);
    fetchContents();
  };

  const handleBulkImportComplete = () => {
    setShowBulkImport(false);
    fetchContents();
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category ? (language === 'he' ? category.name_he : category.name_en) : '-';
  };

  const getStatusIcon = (status: string, scheduledAt: string | null) => {
    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      return <Clock className="w-4 h-4 text-amber-500" />;
    }
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-muted-foreground" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string, scheduledAt: string | null) => {
    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      return isRTL ? 'מתוזמן' : 'Scheduled';
    }
    switch (status) {
      case 'published':
        return isRTL ? 'פורסם' : 'Published';
      case 'draft':
        return isRTL ? 'טיוטה' : 'Draft';
      case 'archived':
        return isRTL ? 'ארכיון' : 'Archived';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter contents
  const filteredContents = useMemo(() => {
    let result = contents;

    if (statusFilter !== 'all') {
      if (statusFilter === 'scheduled') {
        result = result.filter(c => c.scheduled_publish_at && new Date(c.scheduled_publish_at) > new Date());
      } else {
        result = result.filter(c => c.status === statusFilter);
      }
    }

    if (categoryFilter !== 'all') {
      result = result.filter(c => c.category_id === categoryFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.content.toLowerCase().includes(query)
      );
    }

    return result;
  }, [contents, statusFilter, categoryFilter, searchQuery]);

  if (isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground">
                {isRTL ? 'ניהול מאמרים' : 'Article Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isRTL ? `${contents.length} מאמרים במערכת` : `${contents.length} articles in system`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBulkImport(true)}>
                <Upload className="w-4 h-4 me-2" />
                {isRTL ? 'ייבוא מרובה' : 'Bulk Import'}
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 me-2" />
                {isRTL ? 'מאמר חדש' : 'New Article'}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'חיפוש מאמרים...' : 'Search articles...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={isRTL ? 'סטטוס' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'כל הסטטוסים' : 'All Statuses'}</SelectItem>
                <SelectItem value="published">{isRTL ? 'פורסם' : 'Published'}</SelectItem>
                <SelectItem value="draft">{isRTL ? 'טיוטה' : 'Draft'}</SelectItem>
                <SelectItem value="scheduled">{isRTL ? 'מתוזמן' : 'Scheduled'}</SelectItem>
                <SelectItem value="archived">{isRTL ? 'ארכיון' : 'Archived'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={isRTL ? 'קטגוריה' : 'Category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'כל הקטגוריות' : 'All Categories'}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === 'he' ? cat.name_he : cat.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredContents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {isRTL ? 'לא נמצאו מאמרים' : 'No articles found'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? 'כותרת' : 'Title'}</TableHead>
                    <TableHead>{isRTL ? 'קטגוריה' : 'Category'}</TableHead>
                    <TableHead>{isRTL ? 'תגיות' : 'Tags'}</TableHead>
                    <TableHead>{isRTL ? 'סטטוס' : 'Status'}</TableHead>
                    <TableHead>{isRTL ? 'תאריך' : 'Date'}</TableHead>
                    <TableHead className="text-end">{isRTL ? 'פעולות' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContents.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {content.title}
                      </TableCell>
                      <TableCell>{getCategoryName(content.category_id)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {content.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              {language === 'he' ? tag.name_he : tag.name_en}
                            </Badge>
                          ))}
                          {content.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{content.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(content.status, content.scheduled_publish_at)}
                          <span className="text-sm">
                            {getStatusLabel(content.status, content.scheduled_publish_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {content.scheduled_publish_at && new Date(content.scheduled_publish_at) > new Date()
                          ? formatDate(content.scheduled_publish_at)
                          : formatDate(content.published_at || content.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/contents/${content.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingContent(content);
                              setShowForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(content.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Back to public view link */}
          <div className="mt-6 text-center">
            <Link to="/contents" className="text-primary hover:underline">
              {isRTL ? '← חזרה לתצוגה הציבורית' : '← Back to public view'}
            </Link>
          </div>
        </div>
      </main>

      {/* Add/Edit Content Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditingContent(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContent 
                ? (isRTL ? 'עריכת מאמר' : 'Edit Article')
                : (isRTL ? 'מאמר חדש' : 'New Article')}
            </DialogTitle>
          </DialogHeader>
          <ContentForm 
            content={editingContent || undefined}
            onSaved={handleContentSaved} 
            onCancel={() => {
              setShowForm(false);
              setEditingContent(null);
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onImportComplete={handleBulkImportComplete}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? 'מחיקת מאמר' : 'Delete Article'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL 
                ? 'האם אתה בטוח שברצונך למחוק מאמר זה? פעולה זו אינה ניתנת לביטול.'
                : 'Are you sure you want to delete this article? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'ביטול' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isRTL ? 'מחק' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
