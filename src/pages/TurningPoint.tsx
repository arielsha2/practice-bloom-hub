import { PortalAccessDenied } from '@/components/portal/PortalAccessDenied';
import { SEOHead } from '@/components/SEOHead';

export default function TurningPoint() {
  return (
    <>
      <SEOHead
        title='נקודת המפנה | תוכנית הליווי של ד"ר אריאל שפירא'
        description='נקודת המפנה — תוכנית הליווי המלאה של ד"ר אריאל שפירא לבניית קליניקה פרטית מצליחה למטפלים בישראל. שיטת "על שפת הקליניקה" צעד אחר צעד.'
        canonicalUrl="/turning-point"
      />
      <PortalAccessDenied />
    </>
  );
}
