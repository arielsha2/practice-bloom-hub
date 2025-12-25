import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    content: string;
    published_at: string;
  };
}

export function ContentCard({ content }: ContentCardProps) {
  const { t, isRTL } = useLanguage();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get first 150 characters as preview
  const preview = content.content.length > 150 
    ? content.content.substring(0, 150) + '...' 
    : content.content;

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Card className="flex flex-col h-full hover:shadow-elevated transition-shadow duration-300">
      <CardHeader>
        <time className="text-sm text-muted-foreground mb-2 block">
          {formatDate(content.published_at)}
        </time>
        <CardTitle className="text-xl line-clamp-2">
          {content.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-3">
          {preview}
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
