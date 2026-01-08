import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { ContentForm } from '@/components/contents/ContentForm';
import { CategoryBadge } from '@/components/contents/CategoryBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Edit, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';

interface Category {
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
  published_at: string;
  status: string;
  category_id: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
}

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { isAdmin } = useIsAdmin();
  
  const [content, setContent] = useState<Content | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchContent = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching content:', error);
        navigate('/contents');
      } else {
        setContent(data);
        
        // Fetch category if exists
        if (data.category_id) {
          const { data: catData } = await supabase
            .from('content_categories')
            .select('*')
            .eq('id', data.category_id)
            .single();
          
          if (catData) {
            setCategory(catData);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error(t('contents.admin.deleteError'));
      } else {
        toast.success(t('contents.admin.deleteSuccess'));
        navigate('/contents');
      }
    } catch (error) {
      toast.error(t('contents.admin.deleteError'));
    }
  };

  const handleContentSaved = () => {
    setShowEditForm(false);
    fetchContent();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back Button */}
          <Link 
            to="/contents"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <BackIcon className="w-4 h-4" />
            {t('contents.back')}
          </Link>

          {/* Featured Image */}
          {content.featured_image_url && (
            <div className="aspect-video overflow-hidden rounded-lg mb-8">
              <img 
                src={content.featured_image_url} 
                alt={content.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <article>
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                {category && <CategoryBadge category={category} />}
                <time className="text-muted-foreground">
                  {formatDate(content.published_at)}
                </time>
              </div>
              
              <h1 className="text-4xl font-bold text-foreground mb-4">
                {content.title}
              </h1>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditForm(true)}
                  >
                    <Edit className="w-4 h-4 me-2" />
                    {t('contents.admin.edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 me-2" />
                    {t('contents.admin.delete')}
                  </Button>
                </div>
              )}
            </header>

            {/* Rich text content - rendered as HTML */}
            <div 
              className="prose prose-lg max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          </article>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('contents.admin.edit')}</DialogTitle>
          </DialogHeader>
          <ContentForm 
            content={content} 
            onSaved={handleContentSaved} 
            onCancel={() => setShowEditForm(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contents.admin.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contents.admin.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('contents.admin.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t('contents.admin.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
