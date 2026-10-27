import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contents = lazy(() => import("./pages/Contents"));
const ContentDetail = lazy(() => import("./pages/ContentDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const StudentPortal = lazy(() => import("./pages/StudentPortal"));
const LessonDetail = lazy(() => import("./pages/LessonDetail"));
const PortalAdmin = lazy(() => import("./pages/PortalAdmin"));
const MediaLibrary = lazy(() => import("./pages/MediaLibrary"));
const AIAssistants = lazy(() => import("./pages/AIAssistants"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ContentsAdmin = lazy(() => import("./pages/ContentsAdmin"));
const BotAdmin = lazy(() => import("./pages/BotAdmin"));
const BotChat = lazy(() => import("./pages/BotChat"));
const UsersAdmin = lazy(() => import("./pages/UsersAdmin"));
const CoursesAdmin = lazy(() => import("./pages/CoursesAdmin"));
const TurningPoint = lazy(() => import("./pages/TurningPoint"));
const Mentor = lazy(() => import("./pages/Mentor"));
const Welcome = lazy(() => import("./pages/Welcome"));
const AdminInsights = lazy(() => import("./pages/AdminInsights"));
const WebsiteBuilder = lazy(() => import("./pages/WebsiteBuilder"));
const PublicTherapistSite = lazy(() => import("./pages/PublicTherapistSite"));
const ReportByLink = lazy(() => import("./pages/ReportByLink"));
const MentorAdmin = lazy(() => import("./pages/MentorAdmin"));
const MentorTestimonialsAdmin = lazy(() => import("./pages/MentorTestimonialsAdmin"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const ShivukKlinika = lazy(() => import("./pages/ShivukKlinika"));
const ShivukLoMitchabel = lazy(() => import("./pages/ShivukLoMitchabel"));
const ShinuyPnimiShivuk = lazy(() => import("./pages/ShinuyPnimiShivuk"));
const MetuplimRishonim = lazy(() => import("./pages/MetuplimRishonim"));
const AlSfatHaklinika = lazy(() => import("./pages/AlSfatHaklinika"));
const ChallengeLanding = lazy(() => import("./pages/ChallengeLanding"));
const TherapistsHateMarketing = lazy(() => import("./pages/en/TherapistsHateMarketing"));
const MarketWithoutLosingSoul = lazy(() => import("./pages/en/MarketWithoutLosingSoul"));
const TherapistsUndercharge = lazy(() => import("./pages/en/TherapistsUndercharge"));
const KnowLikeTrust = lazy(() => import("./pages/en/KnowLikeTrust"));
const FirstClients = lazy(() => import("./pages/en/FirstClients"));
// Every page is its own chunk: a visitor (e.g. on /challenge from an ad) only
// downloads the page they open, not the whole app.
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageProvider>
            <ScrollToTop />
            <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/en" element={<Index />} />
              <Route path="/ai-assistants" element={<AIAssistants />} />
              <Route path="/ai-assistants/:botKey" element={<BotChat />} />
              <Route path="/en/ai-assistants/:botKey" element={<BotChat />} />
              <Route path="/contents" element={<Contents />} />
              <Route path="/contents/admin" element={<ContentsAdmin />} />
              <Route path="/contents/:id" element={<ContentDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/en/auth" element={<Auth />} />
              <Route path="/portal" element={<StudentPortal />} />
              <Route path="/portal/:tab" element={<StudentPortal />} />
              <Route path="/portal/lesson/:id" element={<LessonDetail />} />
              <Route path="/portal/admin" element={<PortalAdmin />} />
              <Route path="/media-library" element={<MediaLibrary />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin/bots" element={<BotAdmin />} />
              <Route path="/admin/users" element={<UsersAdmin />} />
              <Route path="/admin/courses" element={<CoursesAdmin />} />
              <Route path="/turning-point" element={<TurningPoint />} />
              <Route path="/mentor" element={<Mentor />} />
              <Route path="/en/mentor" element={<Mentor />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/mentor/website-builder" element={<WebsiteBuilder />} />
              <Route path="/t/:slug" element={<PublicTherapistSite />} />
              <Route path="/r/:token" element={<ReportByLink />} />
              <Route path="/contact-finder" element={<BotChat />} />
              <Route path="/admin-insights" element={<AdminInsights />} />
              <Route path="/admin/mentor" element={<MentorAdmin />} />
              <Route path="/admin/testimonials" element={<MentorTestimonialsAdmin />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/שיווק-קליניקה-למטפלים" element={<ShivukKlinika />} />
              <Route path="/shivuk-klinika-lamtapelim" element={<ShivukKlinika />} />
              <Route path="/shivuk-lo-mitchabel" element={<ShivukLoMitchabel />} />
              <Route path="/shinuy-pnimi-shivuk" element={<ShinuyPnimiShivuk />} />
              <Route path="/matorpelim-rishonim" element={<MetuplimRishonim />} />
              <Route path="/al-sfat-haklinika" element={<AlSfatHaklinika />} />
              <Route path="/challenge" element={<ChallengeLanding />} />
              <Route path="/en/therapists-who-hate-marketing" element={<TherapistsHateMarketing />} />
              <Route path="/en/market-without-losing-soul" element={<MarketWithoutLosingSoul />} />
              <Route path="/en/why-therapists-undercharge" element={<TherapistsUndercharge />} />
              <Route path="/en/know-like-trust-for-therapists" element={<KnowLikeTrust />} />
              <Route path="/en/first-private-practice-clients" element={<FirstClients />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
