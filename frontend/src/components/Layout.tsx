import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, Shield } from 'lucide-react';
import { logout } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const handleLogout = async () => {
    await logout().catch(() => {});
    onLogout();
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
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
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item danger">
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      <div className="main-content">{children}</div>
    </div>
  );
}
