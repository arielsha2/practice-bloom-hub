import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, X, Search, Shield, Sparkles, Gift, CheckCircle2, Trash2, ArrowUpCircle, KeyRound, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TrialStatus } from "@/hooks/useUsersManagement";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
}

interface Enrollment {
  id: string;
  user_id: string | null;
  email: string;
  course_key: string;
  cohort_id: string | null;
  enrolled_at: string | null;
  activated_at: string | null;
  full_name: string | null;
}

interface Course {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
  cohort_id: string | null;
}

interface Cohort {
  id: string;
  name_he: string;
  name_en: string;
  is_active: boolean | null;
}

interface UsersTableProps {
  users: UserProfile[];
  enrollments: Enrollment[];
  courses: Course[];
  cohorts: Cohort[];
  getUserRole: (userId: string) => "admin" | "student" | "none";
  getUserCohorts: (userId: string) => Cohort[];
  hasMentorAccess: (userId: string) => boolean;
  getTrialStatus: (userId: string) => { status: TrialStatus; endsAt: Date | null };
  isEmailConfirmed?: (userId: string) => boolean;
  onAssignCourse: (user: UserProfile) => void;
  onRemoveFromCourse: (enrollmentId: string) => void;
  onChangeRole: (user: UserProfile) => void;
  onGrantFreeTrial: (user: UserProfile) => void;
  onDeleteUser: (user: UserProfile) => void;
  onUpgradeToPaid: (user: UserProfile) => void;
  onVerifyEmail?: (user: UserProfile) => void;
  isGrantingTrial?: boolean;
  isDeletingUser?: boolean;
  isUpgradingToPaid?: boolean;
  isVerifyingEmail?: boolean;
}


export function UsersTable({
  users,
  enrollments,
  courses,
  cohorts,
  getUserRole,
  getUserCohorts,
  hasMentorAccess,
  getTrialStatus,
  
  onAssignCourse,
  onRemoveFromCourse,
  onChangeRole,
  onGrantFreeTrial,
  onDeleteUser,
  onUpgradeToPaid,
  isGrantingTrial,
  isDeletingUser,
  isUpgradingToPaid,
}: UsersTableProps) {
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [cohortFilter, setCohortFilter] = useState<string>("all");
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToUpgrade, setUserToUpgrade] = useState<UserProfile | null>(null);

  const getUserEnrollments = (userId: string) => {
    return enrollments.filter((e) => e.user_id === userId);
  };

  const getCourseName = (courseKey: string) => {
    const course = courses.find((c) => c.course_key === courseKey);
    return course ? (isRTL ? course.name_he : course.name_en) : courseKey;
  };

  const getCohortName = (cohortId: string | null) => {
    if (!cohortId) return null;
    const cohort = cohorts.find((c) => c.id === cohortId);
    return cohort ? (isRTL ? cohort.name_he : cohort.name_en) : null;
  };

  const getRoleBadge = (role: "admin" | "student" | "none") => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="destructive" className="gap-1">
            <Shield className="w-3 h-3" />
            {isRTL ? "מנהל" : "Admin"}
          </Badge>
        );
      case "student":
        return <Badge variant="default">{isRTL ? "סטודנט" : "Student"}</Badge>;
      default:
        return <Badge variant="secondary">{isRTL ? "לא רשום" : "Not Enrolled"}</Badge>;
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query || user.email?.toLowerCase().includes(query) || user.display_name?.toLowerCase().includes(query);

    // Cohort filter
    let matchesCohort = true;
    if (cohortFilter !== "all") {
      const userCohorts = getUserCohorts(user.id);
      if (cohortFilter === "none") {
        matchesCohort = userCohorts.length === 0;
      } else {
        matchesCohort = userCohorts.some((c) => c.id === cohortFilter);
      }
    }

    return matchesSearch && matchesCohort;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? "חפש לפי מייל או שם..." : "Search by email or name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>

        {/* Cohort Filter */}
        <Select value={cohortFilter} onValueChange={setCohortFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={isRTL ? "סנן לפי מחזור" : "Filter by cohort"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "כל המחזורים" : "All Cohorts"}</SelectItem>
            <SelectItem value="none">{isRTL ? "ללא מחזור" : "No Cohort"}</SelectItem>
            {cohorts.map((cohort) => (
              <SelectItem key={cohort.id} value={cohort.id}>
                {isRTL ? cohort.name_he : cohort.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRTL ? "מייל" : "Email"}</TableHead>
              <TableHead>{isRTL ? "שם" : "Name"}</TableHead>
              <TableHead>{isRTL ? "תפקיד" : "Role"}</TableHead>
              <TableHead>{isRTL ? "מחזורים" : "Cohorts"}</TableHead>
              <TableHead>{isRTL ? "קורסים" : "Courses"}</TableHead>
              <TableHead>{isRTL ? "תאריך הצטרפות" : "Joined"}</TableHead>
              <TableHead>{isRTL ? "התנסות חינם" : "Free Trial"}</TableHead>
              <TableHead>{isRTL ? "פעולות" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {isRTL ? "לא נמצאו משתמשים" : "No users found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const userEnrollments = getUserEnrollments(user.id);
                const userCohorts = getUserCohorts(user.id);
                const role = getUserRole(user.id);

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email || "-"}</TableCell>
                    <TableCell>{user.display_name || (isRTL ? "ללא שם" : "No name")}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {getRoleBadge(role)}
                        {hasMentorAccess(user.id) && (
                          <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                            <Sparkles className="w-3 h-3" />
                            {isRTL ? "מנטור" : "Mentor"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userCohorts.length === 0 ? (
                          <span className="text-muted-foreground text-sm">{isRTL ? "ללא מחזור" : "No cohort"}</span>
                        ) : (
                          userCohorts.map((cohort) => (
                            <Badge key={cohort.id} variant="outline">
                              {isRTL ? cohort.name_he : cohort.name_en}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role === "admin" ? (
                          <span className="text-primary text-sm font-medium">
                            {isRTL ? "גישה לכל הקורסים" : "Access to all courses"}
                          </span>
                        ) : userEnrollments.length === 0 ? (
                          <span className="text-muted-foreground text-sm">{isRTL ? "ללא קורסים" : "No courses"}</span>
                        ) : (
                          userEnrollments.map((enrollment) => (
                            <Badge key={enrollment.id} variant="secondary" className="gap-1 pe-1">
                              {getCourseName(enrollment.course_key)}
                              {enrollment.cohort_id && (
                                <span className="text-xs opacity-70">({getCohortName(enrollment.cohort_id)})</span>
                              )}
                              <button
                                onClick={() => onRemoveFromCourse(enrollment.id)}
                                className="hover:bg-destructive/20 rounded p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : "-"}</TableCell>
                    <TableCell>
                      {(() => {
                        const trial = getTrialStatus(user.id);
                        if (trial.status === "paid") {
                          return (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {isRTL ? "שילם" : "Paid"}
                            </Badge>
                          );
                        }
                        if (trial.status === "active") {
                          const days = Math.max(
                            0,
                            Math.ceil((trial.endsAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                          );
                          const isMentor = hasMentorAccess(user.id);
                          return (
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                                <Gift className="w-3 h-3" />
                                {isRTL ? `התנסות (${days} ימים)` : `Trial (${days}d)`}
                              </Badge>
                              {isMentor && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setUserToUpgrade(user)}
                                  disabled={isUpgradingToPaid}
                                >
                                  <ArrowUpCircle className="w-3.5 h-3.5 me-1" />
                                  {isRTL ? "שדרג לתשלום" : "Upgrade to paid"}
                                </Button>
                              )}
                            </div>
                          );
                        }
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onGrantFreeTrial(user)}
                            disabled={isGrantingTrial}
                          >
                            <Gift className="w-4 h-4 me-1" />
                            {isRTL ? "הענק 24ש' התנסות (תמחור)" : "Grant 24h trial (pricing)"}
                          </Button>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onAssignCourse(user)}>
                          <UserPlus className="w-4 h-4 me-1" />
                          {isRTL ? "שייך" : "Assign"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onChangeRole(user)}>
                          <Shield className="w-4 h-4 me-1" />
                          {isRTL ? "תפקיד" : "Role"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(user)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 me-1" />
                          {isRTL ? "הסר" : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {isRTL
          ? `סה"כ ${filteredUsers.length} משתמשים${filteredUsers.length !== users.length ? ` (מתוך ${users.length})` : ""}`
          : `${filteredUsers.length} users${filteredUsers.length !== users.length ? ` (of ${users.length})` : ""} total`}
      </p>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "מחיקת משתמש" : "Delete user"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? `פעולה זו תמחק לצמיתות את ${userToDelete?.email || "המשתמש"} ואת כל הנתונים המשויכים (הרשמות, תפקידים, פרופיל). לא ניתן לבטל.`
                : `This will permanently delete ${userToDelete?.email || "this user"} and all related data (enrollments, roles, profile). This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "ביטול" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingUser}
              onClick={() => {
                if (userToDelete) {
                  onDeleteUser(userToDelete);
                  setUserToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRTL ? "מחק לצמיתות" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!userToUpgrade} onOpenChange={(open) => !open && setUserToUpgrade(null)}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? "שדרוג לגישה מלאה" : "Upgrade to paid"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? `האם לשדרג את ${userToUpgrade?.email || "המשתמש"} לגישה מלאה?`
                : `Upgrade ${userToUpgrade?.email || "this user"} to full access?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "ביטול" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isUpgradingToPaid}
              onClick={() => {
                if (userToUpgrade) {
                  onUpgradeToPaid(userToUpgrade);
                  setUserToUpgrade(null);
                }
              }}
            >
              {isRTL ? "שדרג" : "Upgrade"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
