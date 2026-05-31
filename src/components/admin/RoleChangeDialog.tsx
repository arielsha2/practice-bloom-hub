import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, User, UserX, AlertTriangle, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
}

interface RoleChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  currentRole: 'admin' | 'student' | 'none';
  onChangeRole: (newRole: 'admin' | 'course_member' | null, currentRole: 'admin' | 'course_member' | null) => void;
  isChanging: boolean;
  hasMentorAccess: boolean;
  onToggleMentor: (enable: boolean) => void;
}

export function RoleChangeDialog({
  open,
  onOpenChange,
  user,
  currentRole,
  onChangeRole,
  isChanging,
}: RoleChangeDialogProps) {
  const { isRTL } = useLanguage();
  const [confirmAdmin, setConfirmAdmin] = useState(false);

  if (!user) return null;

  const handleRoleChange = (targetRole: 'admin' | 'student' | 'none') => {
    if (targetRole === currentRole) return;

    // Map to database role values
    const currentDbRole = currentRole === 'admin' ? 'admin' : currentRole === 'student' ? 'course_member' : null;
    const newDbRole = targetRole === 'admin' ? 'admin' : targetRole === 'student' ? 'course_member' : null;

    if (targetRole === 'admin' && !confirmAdmin) {
      setConfirmAdmin(true);
      return;
    }

    onChangeRole(newDbRole, currentDbRole);
    setConfirmAdmin(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmAdmin(false);
    }
    onOpenChange(open);
  };

  const roles = [
    {
      key: 'admin' as const,
      label: isRTL ? 'מנהל' : 'Admin',
      description: isRTL ? 'גישה מלאה לכל התכנים והניהול' : 'Full access to all content and management',
      icon: Shield,
      variant: 'destructive' as const,
    },
    {
      key: 'student' as const,
      label: isRTL ? 'סטודנט' : 'Student',
      description: isRTL ? 'גישה לקורסים שהוא רשום אליהם' : 'Access to enrolled courses',
      icon: User,
      variant: 'default' as const,
    },
    {
      key: 'none' as const,
      label: isRTL ? 'לא רשום' : 'Not Enrolled',
      description: isRTL ? 'רשום לאתר אך ללא גישה לקורסים' : 'Registered but no course access',
      icon: UserX,
      variant: 'secondary' as const,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRTL ? 'שינוי תפקיד' : 'Change Role'}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? `שנה את התפקיד של ${user.display_name || user.email || 'המשתמש'}`
              : `Change the role of ${user.display_name || user.email || 'the user'}`
            }
          </DialogDescription>
        </DialogHeader>

        {confirmAdmin ? (
          <div className="space-y-4 mt-4">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">
                  {isRTL ? 'אישור הפיכה למנהל' : 'Confirm Admin Role'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRTL 
                    ? 'מנהל יקבל גישה מלאה לכל התכנים והניהול. האם להמשיך?'
                    : 'Admin will have full access to all content and management. Continue?'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmAdmin(false)}
              >
                {isRTL ? 'ביטול' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRoleChange('admin')}
                disabled={isChanging}
              >
                {isChanging 
                  ? (isRTL ? 'מעדכן...' : 'Updating...') 
                  : (isRTL ? 'אישור' : 'Confirm')
                }
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = currentRole === role.key;
              
              return (
                <button
                  key={role.key}
                  onClick={() => handleRoleChange(role.key)}
                  disabled={isChanging || isSelected}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'bg-primary/5 border-primary/20 cursor-default' 
                      : 'hover:bg-muted/50 border-border cursor-pointer'
                  } ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="text-start">
                      <p className="font-medium">{role.label}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant={role.variant}>
                      {isRTL ? 'נוכחי' : 'Current'}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
