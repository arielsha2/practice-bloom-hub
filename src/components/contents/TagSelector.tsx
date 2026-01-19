import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { X, Plus, ChevronDown, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface TagItem {
  id: string;
  name_he: string;
  name_en: string;
  slug: string;
}

interface TagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagSelector({ selectedTagIds, onTagsChange }: TagSelectorProps) {
  const { isRTL, language } = useLanguage();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('content_tags')
        .select('*')
        .order('name_he');

      if (error) {
        console.error('Error fetching tags:', error);
      } else {
        setTags(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      // Create slug from name
      const slug = newTagName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]/g, '');

      const { data, error } = await supabase
        .from('content_tags')
        .insert({
          name_he: newTagName,
          name_en: newTagName,
          slug: slug + '-' + Date.now().toString(36)
        })
        .select()
        .single();

      if (error) {
        toast.error(isRTL ? 'שגיאה ביצירת תגית' : 'Error creating tag');
        console.error('Error creating tag:', error);
      } else if (data) {
        setTags([...tags, data]);
        onTagsChange([...selectedTagIds, data.id]);
        setNewTagName('');
        toast.success(isRTL ? 'התגית נוצרה בהצלחה' : 'Tag created successfully');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));
  const availableTags = tags.filter(tag => !selectedTagIds.includes(tag.id));

  const getTagName = (tag: TagItem) => {
    return language === 'he' ? tag.name_he : tag.name_en;
  };

  return (
    <div className="space-y-2">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1 px-2 py-1">
              {getTagName(tag)}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ms-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Selector Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Tag className="w-4 h-4" />
            {isRTL ? 'בחר תגיות' : 'Select Tags'}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Available Tags */}
              {availableTags.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.id)}
                      className="w-full text-start px-2 py-1.5 rounded hover:bg-muted transition-colors text-sm"
                    >
                      {getTagName(tag)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {tags.length === 0 
                    ? (isRTL ? 'אין תגיות עדיין' : 'No tags yet')
                    : (isRTL ? 'כל התגיות נבחרו' : 'All tags selected')}
                </p>
              )}

              {/* Create New Tag */}
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  {isRTL ? 'צור תגית חדשה:' : 'Create new tag:'}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder={isRTL ? 'שם התגית' : 'Tag name'}
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || isCreating}
                    className="h-8 px-2"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
