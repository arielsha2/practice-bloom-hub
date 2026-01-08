import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name_he: string;
  name_en: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { language, t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "rounded-full transition-all",
          selectedCategory === null 
            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" 
            : "hover:bg-muted"
        )}
      >
        {t('contents.allCategories')}
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            "rounded-full transition-all",
            selectedCategory === category.id 
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" 
              : "hover:bg-muted"
          )}
        >
          {language === 'he' ? category.name_he : category.name_en}
        </Button>
      ))}
    </div>
  );
}
