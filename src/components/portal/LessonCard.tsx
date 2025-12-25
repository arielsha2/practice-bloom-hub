import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LessonCardProps {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
}

export function LessonCard({ id, title, description, orderIndex }: LessonCardProps) {
  const { isRTL } = useLanguage();

  return (
    <Link to={`/portal/lesson/${id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <span className="text-lg font-bold text-primary">{orderIndex + 1}</span>
          </div>
          <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            {description && (
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <BookOpen className="w-5 h-5 text-muted-foreground shrink-0" />
        </CardHeader>
      </Card>
    </Link>
  );
}
