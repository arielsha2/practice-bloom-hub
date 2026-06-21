import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function Header() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-card">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-foreground tracking-tight">Turning Point</span>
        </Link>

        {/* Desktop Navigation - Simplified to 4 links */}
        <div className={`hidden md:flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Link
            to="/"
            className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium rounded-lg hover:bg-primary-foreground/10"
          >
            {t("nav.home")}
          </Link>
          <Link
            to={language === "en" ? "/en/mentor" : "/mentor"}
            className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium rounded-lg hover:bg-primary-foreground/10"
          >
            {isRTL ? "המנטור" : "The Mentor"}
          </Link>
          <Link
            to="/ai-assistants"
            className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium rounded-lg hover:bg-primary-foreground/10"
          >
            {t("nav.bots")}
          </Link>
          <Link
            to="/contents"
            className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium rounded-lg hover:bg-primary-foreground/10"
          >
            {t("nav.contents")}
          </Link>
          <Link
            to="/portal"
            className="px-4 py-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium rounded-lg hover:bg-primary-foreground/10"
          >
            {t("nav.portal")}
          </Link>
          {user && (
            <Link to="/dashboard">
              <Button variant="cta" size="sm" className="gap-1.5">
                <LayoutDashboard className="w-4 h-4" />
                {t("nav.dashboard")}
              </Button>
            </Link>
          )}
        </div>

        {/* Language Toggles & Auth */}
        <div className="flex items-center gap-2">
          <Button
            variant={language === "he" ? "header-active" : "header-ghost"}
            size="sm"
            onClick={() => setLanguage("he")}
            className="font-medium"
          >
            עב
          </Button>
          <Button
            variant={language === "en" ? "header-active" : "header-ghost"}
            size="sm"
            onClick={() => setLanguage("en")}
            className="font-medium"
          >
            En
          </Button>

          {/* Auth Button */}
          <div className="hidden md:block">
            {user ? (
              <Button variant="header-ghost" size="sm" onClick={handleSignOut} className="font-medium">
                <LogOut className="w-4 h-4 me-1" />
                {t("nav.logout")}
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="header-ghost" size="sm" className="font-medium">
                  <LogIn className="w-4 h-4 me-1" />
                  {t("nav.login")}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="header-ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu - Simplified */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary border-t border-primary-foreground/10 animate-fade-in">
          <div className={`container mx-auto px-4 py-4 flex flex-col gap-2 ${isRTL ? "text-right" : "text-left"}`}>
            <Link
              to="/"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.home")}
            </Link>
            <Link
              to={language === "en" ? "/en/mentor" : "/mentor"}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {isRTL ? "המנטור" : "The Mentor"}
            </Link>
            <Link
              to="/ai-assistants"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.bots")}
            </Link>
            <Link
              to="/contents"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.contents")}
            </Link>
            <Link
              to="/portal"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.portal")}
            </Link>
            {user && (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="cta" size="sm" className="gap-2 w-full justify-start">
                  <LayoutDashboard className="w-4 h-4" />
                  {t("nav.dashboard")}
                </Button>
              </Link>
            )}

            {/* Mobile Auth */}
            {user ? (
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10 text-start flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t("nav.logout")}
              </button>
            ) : (
              <Link
                to="/auth"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium py-3 px-4 rounded-lg hover:bg-primary-foreground/10 flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
