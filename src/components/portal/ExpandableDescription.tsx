import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExpandableDescriptionProps {
  description: string | null;
  maxLines?: number;
}

export function ExpandableDescription({ description, maxLines = 3 }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isRTL } = useLanguage();

  if (!description) return null;

  // Check if description is long enough to need expansion
  const needsExpansion = description.length > 150;

  return (
    <div className="space-y-2">
      <p 
        className={`text-muted-foreground leading-relaxed ${
          !isExpanded && needsExpansion ? `line-clamp-${maxLines}` : ''
        }`}
        style={!isExpanded && needsExpansion ? { 
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        } : undefined}
      >
        {description}
      </p>
      
      {needsExpansion && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:text-primary/80 p-0 h-auto font-normal"
        >
          {isExpanded ? (
            <>
              {isRTL ? 'הצג פחות' : 'Show less'}
              <ChevronUp className="w-4 h-4 ms-1" />
            </>
          ) : (
            <>
              {isRTL ? 'קראי עוד' : 'Read more'}
              <ChevronDown className="w-4 h-4 ms-1" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
