import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { SEOHead } from '@/components/SEOHead';
import { ContentForm } from '@/components/contents/ContentForm';
import { CategoryBadge } from '@/components/contents/CategoryBadge';
import { AuthorFooter } from '@/components/contents/AuthorFooter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Edit, Trash2, Clock } from 'lucide-react';
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

  // Estimate reading time (words per minute)
  const getReadingTime = (text: string) => {
    const plainText = text.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return isRTL ? `${minutes} דקות קריאה` : `${minutes} min read`;
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  const articleTitle = (isRTL ? (content as any).title_he : (content as any).title_en) || (content as any).title_he || (content as any).title_en || '';
  const articleExcerpt = (isRTL ? (content as any).excerpt_he : (content as any).excerpt_en) || (content as any).excerpt_he || (content as any).excerpt_en || '';
  const seoDesc = (articleExcerpt || articleTitle).toString().replace(/\s+/g, ' ').slice(0, 160);

  const plainText = (content.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : undefined;
  const canonicalPath = `/contents/${(content as any).id}`;

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead
        title={`${articleTitle} | TherapyKeys`}
        description={seoDesc || 'מאמר מקצועי למטפלים — TherapyKeys'}
        canonicalUrl={canonicalPath}
        ogImage={(content as any).featured_image_url || undefined}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: articleTitle,
          description: seoDesc,
          image: (content as any).featured_image_url,
          inLanguage: "he",
          ...(content.published_at ? { datePublished: content.published_at } : {}),
          ...(wordCount ? { wordCount } : {}),
          author: {
            "@type": "Person",
            "@id": "https://therapykeys.co.il/#ariel-shapira",
            name: 'ד"ר אריאל שפירא',
            url: "https://therapykeys.co.il",
          },
          publisher: {
            "@type": "Organization",
            "@id": "https://therapykeys.co.il/#organization",
            name: "TherapyKeys",
            logo: {
              "@type": "ImageObject",
              url: "https://therapykeys.co.il/og-image.jpg",
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://therapykeys.co.il${canonicalPath}`,
          },
        }}
      />
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="max-w-2xl mx-auto mb-8">
            <Link 
              to="/contents"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BackIcon className="w-4 h-4" />
              {t('contents.back')}
            </Link>
          </div>

          {/* Article Container - WriteToDone style */}
          <article className="max-w-2xl mx-auto">
            {/* Featured Image - Full width, large */}
            {content.featured_image_url && (
              <div className="aspect-video overflow-hidden rounded-xl mb-8 shadow-card">
                <img 
                  src={content.featured_image_url} 
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Meta info bar */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              {category && <CategoryBadge category={category} />}
              <span className="text-muted-foreground/50">|</span>
              <time>{formatDate(content.published_at)}</time>
              <span className="text-muted-foreground/50">|</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getReadingTime(content.content)}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-foreground mb-8 leading-tight">
              {content.title}
            </h1>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="flex gap-2 mb-8 pb-8 border-b">
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

            {/* Rich text content */}
            <div 
              className="prose-article"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />

            {/* Author Footer */}
            <AuthorFooter />
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
