import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ContentSearch({ searchQuery, onSearchChange }: ContentSearchProps) {
  const { t } = useLanguage();

  return (
    <div className="relative max-w-md mx-auto">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={t('contents.searchPlaceholder')}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="ps-10 pe-10 rounded-full"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => onSearchChange('')}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
