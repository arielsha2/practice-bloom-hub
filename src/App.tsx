import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Contents from "./pages/Contents";
import ContentDetail from "./pages/ContentDetail";
import Auth from "./pages/Auth";
import StudentPortal from "./pages/StudentPortal";
import LessonDetail from "./pages/LessonDetail";
import PortalAdmin from "./pages/PortalAdmin";
import MediaLibrary from "./pages/MediaLibrary";
import AIAssistants from "./pages/AIAssistants";
import Dashboard from "./pages/Dashboard";
import ContentsAdmin from "./pages/ContentsAdmin";
import BotAdmin from "./pages/BotAdmin";
import BotChat from "./pages/BotChat";
import UsersAdmin from "./pages/UsersAdmin";
import CoursesAdmin from "./pages/CoursesAdmin";
import TurningPoint from "./pages/TurningPoint";
import Mentor from "./pages/Mentor";
import Welcome from "./pages/Welcome";
import AdminInsights from "./pages/AdminInsights";
import WebsiteBuilder from "./pages/WebsiteBuilder";
import PublicTherapistSite from "./pages/PublicTherapistSite";
import MentorAdmin from "./pages/MentorAdmin";
import MentorTestimonialsAdmin from "./pages/MentorTestimonialsAdmin";
import AdminAnalytics from "./pages/AdminAnalytics";
import ShivukKlinika from "./pages/ShivukKlinika";
import ShivukLoMitchabel from "./pages/ShivukLoMitchabel";
import ShinuyPnimiShivuk from "./pages/ShinuyPnimiShivuk";
import MetuplimRishonim from "./pages/MetuplimRishonim";
import AlSfatHaklinika from "./pages/AlSfatHaklinika";
import TherapistsHateMarketing from "./pages/en/TherapistsHateMarketing";
import MarketWithoutLosingSoul from "./pages/en/MarketWithoutLosingSoul";
import TherapistsUndercharge from "./pages/en/TherapistsUndercharge";
import KnowLikeTrust from "./pages/en/KnowLikeTrust";
import FirstClients from "./pages/en/FirstClients";
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
              <Route path="/en/therapists-who-hate-marketing" element={<TherapistsHateMarketing />} />
              <Route path="/en/market-without-losing-soul" element={<MarketWithoutLosingSoul />} />
              <Route path="/en/why-therapists-undercharge" element={<TherapistsUndercharge />} />
              <Route path="/en/know-like-trust-for-therapists" element={<KnowLikeTrust />} />
              <Route path="/en/first-private-practice-clients" element={<FirstClients />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
