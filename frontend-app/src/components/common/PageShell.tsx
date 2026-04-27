import React from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  className = "",
}) => {
  const contentClass = `content-area page-shell ${className}`.trim();

  return (
    <section className={contentClass}>
      <header className="page-header">
        {(eyebrow || actions) && (
          <div className="page-header-top">
            {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
            {actions && <div className="page-actions">{actions}</div>}
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
};
