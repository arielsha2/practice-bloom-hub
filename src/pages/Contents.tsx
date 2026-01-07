import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { ContentCard } from '@/components/contents/ContentCard';
import { ContentForm } from '@/components/contents/ContentForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Content {
  id: string;
  title: string;
  content: string;
  language: string;
  published_at: string;
  is_published: boolean;
}

export default function Contents() {
  const { t, isRTL, language } = useLanguage();
  const { isAdmin } = useIsAdmin();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('language', language)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching contents:', error);
      } else {
        setContents(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [language]);

  const handleContentSaved = () => {
    setShowForm(false);
    fetchContents();
  };

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="flex-1 pt-16">
        {/* Hero Header */}
        <div className="bg-secondary py-16 mb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4">
              {t('contents.title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('contents.subtitle')}
            </p>
            
            {isAdmin && (
              <Button 
                onClick={() => setShowForm(true)}
                variant="cta"
                className="mt-8"
              >
                <Plus className="w-4 h-4 me-2" />
                {t('contents.admin.add')}
              </Button>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 pb-12">

          {/* Content Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {t('contents.empty')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {contents.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Content Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('contents.admin.add')}</DialogTitle>
          </DialogHeader>
          <ContentForm onSaved={handleContentSaved} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
