import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "../language/LanguageSwitcher";
import "./Header.css";

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const getInitials = () => {
    if (!user) return "";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case "ADMIN":
        return t.common.roles.admin;
      case "MENTOR":
        return t.common.roles.mentor;
      case "USER":
        return t.common.roles.learner;
      default:
        return "";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goToProfile = () => {
    if (user?.role === "MENTOR") {
      navigate("/profile/mentor");
    } else {
      navigate("/profile/me");
    }
  };

  if (!user) return null;

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <button
            className="menu-toggle"
            onClick={onMenuToggle}
            aria-label={t.nav.openNavigation}
          >
            <Menu size={18} />
          </button>

          <div className="header-identity">
            <span className="header-overline">{getRoleLabel()}</span>
            <div className="user-menu" onClick={goToProfile}>
              <div className="user-avatar">{getInitials()}</div>
              <div className="user-info">
                <span className="user-name">
                  {user.firstName} {user.lastName}
                </span>
                <span className="user-secondary">
                  {user.role === "MENTOR"
                    ? t.nav.mentorTools.availability
                    : t.nav.profile}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right">
          <LanguageSwitcher />

          <button
            className="header-ghost-btn logout-btn"
            onClick={handleLogout}
            title={t.nav.logout}
            aria-label={t.nav.logout}
          >
            <LogOut size={16} />
            <span className="logout-label">{t.nav.logout}</span>
          </button>
        </div>
      </header>

      {user.role === "MENTOR" &&
        user.mentorVerificationStatus === "VERIFIED" &&
        user.mentorHasAvailability === false && (
          <div className="verification-banner verification-banner-verified">
            {t.verification.verifiedBanner}
          </div>
        )}
      {user.role === "MENTOR" && !user.mentorVerificationStatus && (
        <div className="verification-banner verification-banner-incomplete">
          {t.verification.incompleteBanner}
        </div>
      )}
      {user.role === "MENTOR" &&
        user.mentorVerificationStatus === "PENDING" &&
        (user.mentorHasSkills === false ||
          user.mentorHasCategories === false) && (
          <div className="verification-banner verification-banner-incomplete">
            {t.verification.pendingIncompleteBanner}
          </div>
        )}
      {user.role === "MENTOR" &&
        user.mentorVerificationStatus === "PENDING" &&
        user.mentorHasSkills !== false &&
        user.mentorHasCategories !== false && (
          <div className="verification-banner verification-banner-pending">
            {t.verification.pendingBanner}
          </div>
        )}
      {user.role === "MENTOR" &&
        user.mentorVerificationStatus === "REJECTED" && (
          <div className="verification-banner verification-banner-rejected">
            {t.verification.rejectedBanner}
            {user.mentorRejectionReason && (
              <>
                {" "}
                {t.verification.rejectedReason}{" "}
                <strong>{user.mentorRejectionReason}</strong>.
              </>
            )}{" "}
            {t.verification.rejectedContact}
          </div>
        )}
    </>
  );
};
