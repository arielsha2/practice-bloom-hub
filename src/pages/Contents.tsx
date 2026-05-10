import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { SEOHead } from '@/components/SEOHead';
import { ContentCard } from '@/components/contents/ContentCard';
import { ContentForm } from '@/components/contents/ContentForm';
import { CategoryFilter } from '@/components/contents/CategoryFilter';
import { ContentSearch } from '@/components/contents/ContentSearch';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Category {
  id: string;
  name_he: string;
  name_en: string;
  slug: string;
  display_order: number;
}

interface Content {
  id: string;
  title: string;
  content: string;
  language: string;
  published_at: string;
  status: string;
  excerpt: string | null;
  featured_image_url: string | null;
  category_id: string | null;
}

export default function Contents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, isRTL, language } = useLanguage();
  const { isAdmin } = useIsAdmin();
  const [contents, setContents] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Derive selectedCategory from URL search params
  const selectedCategorySlug = searchParams.get('category');
  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    const cat = categories.find(c => c.slug === selectedCategorySlug);
    return cat ? cat.id : null;
  }, [selectedCategorySlug, categories]);

  const setSelectedCategory = (categoryId: string | null) => {
    if (!categoryId) {
      searchParams.delete('category');
    } else {
      const cat = categories.find(c => c.id === categoryId);
      if (cat) {
        searchParams.set('category', cat.slug);
      }
    }
    setSearchParams(searchParams, { replace: true });
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('content_categories')
      .select('*')
      .order('display_order');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('language', language)
        .eq('status', 'published')
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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchContents();
  }, [language]);

  const handleContentSaved = () => {
    setShowForm(false);
    fetchContents();
  };

  // Filter contents by category and search query
  const filteredContents = useMemo(() => {
    let result = contents;

    // Filter by category
    if (selectedCategory) {
      result = result.filter(c => c.category_id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.content.toLowerCase().includes(query) ||
        (c.excerpt && c.excerpt.toLowerCase().includes(query))
      );
    }

    return result;
  }, [contents, selectedCategory, searchQuery]);

  // Get category by id
  const getCategoryById = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId) || null;
  };

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead
        title="ספריית תכנים למטפלים | TherapyKeys"
        description="מאמרים, סרטונים ומדריכים לבניית קליניקה פרטית מצליחה — תוכן מקצועי למטפלים ופסיכולוגים בישראל מאת ד״ר אריאל שפירא."
        canonicalUrl="/contents"
      />
      <Header />
      
      <main className="flex-1 pt-16">
        {/* Hero Header */}
        <div className="bg-secondary py-16 mb-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4">
              {t('contents.title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('contents.subtitle')}
            </p>
            
            {/* Search */}
            <div className="mb-8">
              <ContentSearch 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery} 
              />
            </div>

            {/* Category Filter */}
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            
            {isAdmin && (
              <div className="flex gap-2 mt-8">
                <Button 
                  onClick={() => setShowForm(true)}
                  variant="cta"
                >
                  <Plus className="w-4 h-4 me-2" />
                  {t('contents.admin.add')}
                </Button>
                <Link to="/contents/admin">
                  <Button variant="outline">
                    <Settings className="w-4 h-4 me-2" />
                    {isRTL ? 'ניהול מאמרים' : 'Manage Articles'}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 pb-12">
          {/* Results count */}
          {(searchQuery || selectedCategory) && (
            <p className="text-sm text-muted-foreground mb-6 text-center">
              {t('contents.resultsCount').replace('{count}', filteredContents.length.toString())}
            </p>
          )}

          {/* Content Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchQuery || selectedCategory ? t('contents.noResults') : t('contents.empty')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredContents.map((content) => (
                <ContentCard 
                  key={content.id} 
                  content={content}
                  category={getCategoryById(content.category_id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Content Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
