import { useLanguage } from '@/contexts/LanguageContext';
import foundersImage from '@/assets/founders/founders.jpg';

export function AuthorFooter() {
  const { isRTL } = useLanguage();

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="bg-secondary/50 rounded-2xl p-6 md:p-8">
        <p className="text-sm text-muted-foreground mb-4">
          {isRTL ? '✍️ נכתב על ידי' : '✍️ Written by'}
        </p>
        
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
            <img 
              src={foundersImage} 
              alt={isRTL ? 'אריאל ואליענה' : 'Ariel and Eliana'}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-serif font-medium text-foreground">
              {isRTL ? 'אריאל ואליענה' : 'Ariel & Eliana'}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {isRTL 
                ? 'מייסדי "מפתחות לפרקטיקה" - מלווים מטפלים בבניית פרקטיקה פרטית יציבה ומספקת'
                : 'Founders of "Practice Keys" - helping therapists build stable and fulfilling private practices'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
