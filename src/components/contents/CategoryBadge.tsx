import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name_he: string;
  name_en: string;
  slug: string;
}

interface CategoryBadgeProps {
  category: Category | null;
}

const categoryColors: Record<string, string> = {
  'building-practice': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  'marketing': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  'pricing': 'bg-green-100 text-green-800 hover:bg-green-100',
  'identity': 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  'general': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const { language } = useLanguage();

  if (!category) return null;

  const colorClass = categoryColors[category.slug] || categoryColors['general'];
  const name = language === 'he' ? category.name_he : category.name_en;

  return (
    <Badge variant="secondary" className={colorClass}>
      {name}
    </Badge>
  );
}
