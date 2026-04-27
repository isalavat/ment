import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarRange,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { LanguageSwitcher } from "../language/LanguageSwitcher";
import { useLanguage } from "../../i18n/LanguageContext";
import { PlantIcon } from "../common/PlantIcon";
import "./Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when clicking a link
    onClose();
  };

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-item nav-item-active" : "nav-item";

  return (
    <aside id="sidebar" className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <NavLink
          to="/dashboard"
          className="sidebar-brand"
          onClick={handleLinkClick}
        >
          <span className="sidebar-brand-icon">
            <PlantIcon size={20} className="sidebar-brand-icon-svg" />
          </span>
          <span className="sidebar-brand-text">MentorHub</span>
        </NavLink>
        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      <div className="sidebar-language-wrap">
        <LanguageSwitcher />
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">{t.nav.sections.main}</div>
          <NavLink
            to="/"
            end
            className={navLinkClassName}
            onClick={handleLinkClick}
          >
            <span className="nav-icon">
              <PlantIcon size={18} />
            </span>
            <span>{t.nav.home}</span>
          </NavLink>
          <NavLink
            to="/dashboard"
            className={navLinkClassName}
            onClick={handleLinkClick}
          >
            <span className="nav-icon">
              <LayoutDashboard size={18} />
            </span>
            <span>{t.nav.dashboard}</span>
          </NavLink>
          <NavLink
            to="/mentors"
            className={navLinkClassName}
            onClick={handleLinkClick}
          >
            <span className="nav-icon">
              <Users size={18} />
            </span>
            <span>{t.nav.mentors}</span>
          </NavLink>
          <NavLink
            to="/bookings"
            className={navLinkClassName}
            onClick={handleLinkClick}
          >
            <span className="nav-icon">
              <CalendarRange size={18} />
            </span>
            <span>{t.nav.bookings}</span>
          </NavLink>
        </div>
      </nav>

      {user?.role === "MENTOR" && (
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">
              {t.nav.sections.mentorTools}
            </div>
            <NavLink
              to="/availability"
              className={navLinkClassName}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">
                <CalendarRange size={18} />
              </span>
              <span>{t.nav.mentorTools.availability}</span>
            </NavLink>
            <NavLink
              to="/time-slots"
              className={navLinkClassName}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">
                <BookOpen size={18} />
              </span>
              <span>{t.nav.mentorTools.timeSlots}</span>
            </NavLink>
          </div>
        </nav>
      )}

      {user?.role === "ADMIN" && (
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">{t.nav.sections.admin}</div>
            <NavLink
              to="/admin/users"
              className={navLinkClassName}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">
                <ShieldCheck size={18} />
              </span>
              <span>{t.nav.admin.userManagement}</span>
            </NavLink>
            <NavLink
              to="/admin/mentors"
              className={navLinkClassName}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">
                <ShieldCheck size={18} />
              </span>
              <span>{t.nav.admin.mentorVerification}</span>
            </NavLink>
          </div>
        </nav>
      )}

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">{t.nav.profile}</div>

          {user?.role === "USER" && (
            <NavLink
              to="/profile/me"
              className={navLinkClassName}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">
                <UserRound size={18} />
              </span>
              <span>{t.nav.profile}</span>
            </NavLink>
          )}

          {user?.role === "MENTOR" && (
            <NavLink
              to="/profile/mentor"
              className={navLinkClassName}
              onClick={handleLinkClick}
            >
              <span className="nav-icon">
                <UserRound size={18} />
              </span>
              <span>{t.nav.profile}</span>
            </NavLink>
          )}
        </div>
      </nav>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">{t.nav.sections.account}</div>

          <button className="nav-item nav-item-button" onClick={handleLogout}>
            <span className="nav-icon">
              <Wallet size={18} />
            </span>
            <span>{t.nav.logout}</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};
