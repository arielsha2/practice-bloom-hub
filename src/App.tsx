import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/ai-assistants" element={<AIAssistants />} />
              <Route path="/ai-assistants/:botKey" element={<BotChat />} />
              <Route path="/contents" element={<Contents />} />
              <Route path="/contents/admin" element={<ContentsAdmin />} />
              <Route path="/contents/:id" element={<ContentDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/portal" element={<StudentPortal />} />
              <Route path="/portal/lesson/:id" element={<LessonDetail />} />
              <Route path="/portal/admin" element={<PortalAdmin />} />
              <Route path="/media-library" element={<MediaLibrary />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin/bots" element={<BotAdmin />} />
              <Route path="/admin/users" element={<UsersAdmin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
