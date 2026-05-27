import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Shield, Activity, Menu } from 'lucide-react';
import { logout } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout().catch(() => {});
    onLogout();
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon-wrap">
            <Shield size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-text">Sentinel</div>
            <div className="logo-sub">Infrastructure Monitor</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </NavLink>
          <NavLink
            to="/health"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Activity size={15} />
            Health Checks
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item danger">
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="mobile-header-title">Sentinel</div>
        </div>
        {children}
      </div>
    </div>
  );
}
