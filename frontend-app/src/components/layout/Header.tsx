import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../i18n/LanguageContext";
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

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case "ADMIN":
        return "role-badge role-admin";
      case "MENTOR":
        return "role-badge role-mentor";
      case "USER":
        return "role-badge role-mentee";
      default:
        return "role-badge";
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case "ADMIN":
        return "Admin";
      case "MENTOR":
        return "Mentor";
      case "USER":
        return "Learner";
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
          <button className="menu-toggle" onClick={onMenuToggle}>
            ☰
          </button>
        </div>

        <div className="header-right">
          <div className="user-menu" onClick={goToProfile}>
            <div className="user-avatar">{getInitials()}</div>
            <div className="user-info">
              <span className="user-name">
                {user.firstName} {user.lastName}
              </span>
              <span className={getRoleBadgeClass()}>{getRoleLabel()}</span>
            </div>
          </div>

          <button
            className="btn btn-outline btn-sm logout-btn"
            onClick={handleLogout}
            title={t.nav.logout}
          >
            ⎋ {t.nav.logout}
          </button>
        </div>
      </header>

      {user.role === "MENTOR" && user.mentorVerificationStatus === "VERIFIED" && user.mentorHasAvailability === false && (
        <div className="verification-banner verification-banner-verified">
          ✓ {t.verification.verifiedBanner}
        </div>
      )}
      {user.role === "MENTOR" && !user.mentorVerificationStatus && (
        <div className="verification-banner verification-banner-incomplete">
          ℹ {t.verification.incompleteBanner}
        </div>
      )}
      {user.role === "MENTOR" && user.mentorVerificationStatus === "PENDING" && (user.mentorHasSkills === false || user.mentorHasCategories === false) && (
        <div className="verification-banner verification-banner-incomplete">
          ℹ {t.verification.pendingIncompleteBanner}
        </div>
      )}
      {user.role === "MENTOR" && user.mentorVerificationStatus === "PENDING" && user.mentorHasSkills !== false && user.mentorHasCategories !== false && (
        <div className="verification-banner verification-banner-pending">
          ⏳ {t.verification.pendingBanner}
        </div>
      )}
      {user.role === "MENTOR" && user.mentorVerificationStatus === "REJECTED" && (
        <div className="verification-banner verification-banner-rejected">
          ✕ {t.verification.rejectedBanner}
          {user.mentorRejectionReason && <> {t.verification.rejectedReason} <strong>{user.mentorRejectionReason}</strong>.</>}
          {" "}{t.verification.rejectedContact}
        </div>
      )}
    </>
  );
};
