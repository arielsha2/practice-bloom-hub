import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';

interface Category {
  id: string;
  name_he: string;
  name_en: string;
  slug: string;
}

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    content: string;
    published_at: string;
    excerpt?: string | null;
    featured_image_url?: string | null;
  };
  category?: Category | null;
}

export function ContentCard({ content, category }: ContentCardProps) {
  const { t, isRTL } = useLanguage();
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Use excerpt if available, otherwise get first 150 characters of content
  const getPreview = () => {
    if (content.excerpt) return content.excerpt;
    // Strip HTML tags for plain text preview
    const plainText = content.content.replace(/<[^>]*>/g, '');
    return plainText.length > 150 
      ? plainText.substring(0, 150) + '...' 
      : plainText;
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Card className="flex flex-col h-full hover:shadow-elevated transition-shadow duration-300 overflow-hidden">
      {/* Featured Image */}
      {content.featured_image_url && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={content.featured_image_url} 
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          {category && <CategoryBadge category={category} />}
          <time className="text-sm text-muted-foreground">
            {formatDate(content.published_at)}
          </time>
        </div>
        <CardTitle className="text-xl line-clamp-2">
          {content.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-3">
          {getPreview()}
        </p>
      </CardContent>

      <CardFooter>
        <Link to={`/contents/${content.id}`} className="w-full">
          <Button variant="outline" className="w-full group">
            {t('contents.readMore')}
            <ArrowIcon className="w-4 h-4 ms-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
