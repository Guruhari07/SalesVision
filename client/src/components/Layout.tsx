import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UploadCloud,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Bell,
  Search,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Data', path: '/upload', icon: UploadCloud },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground font-sans selection:bg-primary/10">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-14 bg-card border-b border-border/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-flat shrink-0">
        
        {/* Left Side: Logo & Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-secondary md:hidden text-muted hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 bg-primary rounded flex items-center justify-center text-primary-foreground shadow-sm">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground select-none">
              SalesVision
            </span>
          </Link>
        </div>

        {/* Center: Search Box */}
        <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted/60" />
          <input
            type="text"
            placeholder="Search records, products, categories..."
            className="w-full pl-9 pr-4 py-1.5 bg-secondary/50 border border-border/60 rounded-md text-xs font-medium placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60 transition-all"
          />
        </div>

        {/* Right Side: Theme, Notifications, Profile */}
        <div className="flex items-center gap-3 relative">
          
          {/* Theme Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-md hover:bg-secondary text-muted hover:text-foreground transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setIsProfileOpen(false);
              }}
              className="p-1.5 rounded-md hover:bg-secondary text-muted hover:text-foreground relative transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-primary rounded-full" />
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border/80 rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-1.5 border-b border-border/40 flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground">Notifications</span>
                  <span className="text-[10px] text-primary font-semibold hover:underline cursor-pointer">Mark all read</span>
                </div>
                <div className="divide-y divide-border/30 text-xs">
                  <div className="px-4 py-3 hover:bg-secondary/20 flex gap-2.5">
                    <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">System audit completed</p>
                      <p className="text-[10px] text-muted mt-0.5">Database indices parsed successfully.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-border/80" />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 hover:bg-secondary p-1 rounded-md transition-colors"
            >
              <div className="h-6.5 w-6.5 rounded bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs select-none">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-foreground/80 truncate max-w-24">
                {user?.full_name || 'Account'}
              </span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border/80 rounded-lg shadow-lg py-1.5 z-50 divide-y divide-border/30">
                <div className="px-4 py-2">
                  <p className="text-xs font-bold text-foreground truncate">{user?.full_name || 'Account'}</p>
                  <p className="text-[10px] text-muted truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-1.5 text-xs text-secondary-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Account Settings
                  </Link>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. BODY INNER AREA (flex sidebar + view) */}
      <div className="flex-1 flex flex-row overflow-hidden">
        
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:flex flex-col w-56 bg-card border-r border-border/80 p-4 shrink-0 gap-4 justify-between select-none">
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted px-2.5">Menu</span>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-secondary-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border/40 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold text-destructive hover:bg-destructive/15 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 bg-black z-40 md:hidden"
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="fixed inset-y-0 left-0 w-56 bg-card border-r border-border/80 p-4 z-50 flex flex-col justify-between md:hidden"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="text-sm font-bold tracking-tight">SalesVision</span>
                    </div>
                    <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded-md hover:bg-secondary">
                      <X className="h-5 w-5 text-muted" />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all ${
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-secondary-foreground hover:bg-secondary hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-4.5 w-4.5" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 3. Main Viewport Panel */}
        <main className="flex-1 overflow-y-auto bg-background/40">
          <div className="p-6 md:p-8 h-full max-w-7xl mx-auto">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>

      </div>
    </div>
  );
};
