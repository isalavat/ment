import React from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarRange,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import "./MobileBottomNav.css";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const roleItem: NavItem =
    user.role === "ADMIN"
      ? {
          to: "/admin/users",
          label: t.common.roles.admin,
          icon: <ShieldCheck size={18} />,
        }
      : user.role === "MENTOR"
        ? {
            to: "/availability",
            label: t.nav.mentorTools.availability,
            icon: <ShieldCheck size={18} />,
          }
        : {
            to: "/profile/me",
            label: t.nav.profile,
            icon: <UserRound size={18} />,
          };

  const items: NavItem[] = [
    {
      to: "/dashboard",
      label: t.nav.dashboard,
      icon: <LayoutDashboard size={18} />,
    },
    { to: "/mentors", label: t.nav.mentors, icon: <Users size={18} /> },
    {
      to: "/bookings",
      label: t.nav.bookings,
      icon: <CalendarRange size={18} />,
    },
    roleItem,
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      <div className="mobile-bottom-nav-shell">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive
                ? "mobile-bottom-nav-item mobile-bottom-nav-item-active"
                : "mobile-bottom-nav-item"
            }
          >
            <span className="mobile-bottom-nav-icon">{item.icon}</span>
            <span className="mobile-bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
