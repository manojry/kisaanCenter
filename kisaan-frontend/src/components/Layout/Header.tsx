
import { Button } from "../ui/button"
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Leaf, Menu, UserCircle, Home } from "lucide-react"
import { useAuth } from '../../context/AuthContext';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to handle nav to section from any page
  const handleNav = (e, section) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate(`/#${section}`);
      // Delay scroll to allow page to load
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else window.location.hash = `#${section}`;
    }
  };
  const { user } = useAuth();
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-emerald to-primary-forest bg-clip-text text-transparent">
              KisaanCenter
            </span>
          </a>
        </div>
  <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Show nav for logged-in users, else show landing nav and login */}
          {user ? (
            <div className="flex items-center gap-4">
              {/* Dashboard button for mobile */}
              <Button asChild variant="ghost" size="sm" className="md:hidden">
                <Link to={user.role === 'owner' ? '/owner' : '/dashboard'} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              
              {/* Desktop navigation */}
              <DesktopNav />
              
              {/* Mobile navigation */}
              <MobileNav />
            </div>
          ) : (
            <>
              <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                <a href="/#features" className="text-foreground/60 hover:text-foreground transition-colors" onClick={e => handleNav(e, 'features')}>
                  Features
                </a>
                <a href="/#about" className="text-foreground/60 hover:text-foreground transition-colors" onClick={e => handleNav(e, 'about')}>
                  About
                </a>
                <a href="/#contact" className="text-foreground/60 hover:text-foreground transition-colors" onClick={e => handleNav(e, 'contact')}>
                  Contact
                </a>
              </nav>
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">
                    <UserCircle className="h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button variant="emerald" size="sm">
                  Get Started
                </Button>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header