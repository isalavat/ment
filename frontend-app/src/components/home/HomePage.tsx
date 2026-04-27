import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { LanguageSwitcher } from "../language/LanguageSwitcher";
import { PlantIcon } from "../common/PlantIcon";
import "./HomePage.css";

export const HomePage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <main className="landing-page">
      <header className="landing-topbar">
        <div className="landing-brand">
          <span className="landing-brand-icon" aria-hidden="true">
            <PlantIcon size={20} />
          </span>
          <span className="landing-brand-text">MentorHub</span>
        </div>
        <div className="landing-topbar-actions">
          <LanguageSwitcher />
          <Link to="/login" className="btn btn-outline landing-auth-btn">
            {t.nav.login}
          </Link>
          <Link to="/register" className="btn btn-primary landing-auth-btn">
            {t.nav.register}
          </Link>
        </div>
      </header>

      <section className="landing-hero card">
        <div className="landing-hero-copy">
          <span className="landing-kicker">{t.landing.hero.kicker}</span>
          <h1>{t.landing.hero.title}</h1>
          <p>{t.landing.hero.subtitle}</p>
          <div className="landing-hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              {t.landing.hero.primaryCta}
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              {t.landing.hero.secondaryCta}
            </Link>
          </div>
        </div>
        <div className="landing-hero-panel">
          <div className="landing-hero-panel-icon">
            <PlantIcon size={40} />
          </div>
          <h2>{t.landing.hero.panelTitle}</h2>
          <ul>
            <li>{t.landing.hero.panelItemOne}</li>
            <li>{t.landing.hero.panelItemTwo}</li>
            <li>{t.landing.hero.panelItemThree}</li>
          </ul>
        </div>
      </section>

      <section className="landing-stats">
        <article className="card landing-stat-card">
          <strong>1,000+</strong>
          <span>{t.landing.stats.mentors}</span>
        </article>
        <article className="card landing-stat-card">
          <strong>12,500+</strong>
          <span>{t.landing.stats.sessions}</span>
        </article>
        <article className="card landing-stat-card">
          <strong>30+</strong>
          <span>{t.landing.stats.categories}</span>
        </article>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <h2>{t.landing.features.title}</h2>
          <p>{t.landing.features.subtitle}</p>
        </div>
        <div className="landing-grid landing-grid-3">
          <article className="card landing-feature-card">
            <span className="landing-feature-icon">
              <Compass size={18} />
            </span>
            <h3>{t.landing.features.matchingTitle}</h3>
            <p>{t.landing.features.matchingText}</p>
          </article>
          <article className="card landing-feature-card">
            <span className="landing-feature-icon">
              <CalendarDays size={18} />
            </span>
            <h3>{t.landing.features.schedulingTitle}</h3>
            <p>{t.landing.features.schedulingText}</p>
          </article>
          <article className="card landing-feature-card">
            <span className="landing-feature-icon">
              <ShieldCheck size={18} />
            </span>
            <h3>{t.landing.features.qualityTitle}</h3>
            <p>{t.landing.features.qualityText}</p>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <h2>{t.landing.howItWorks.title}</h2>
          <p>{t.landing.howItWorks.subtitle}</p>
        </div>
        <div className="landing-grid landing-grid-3">
          <article className="card landing-step-card">
            <span className="landing-step-index">01</span>
            <h3>{t.landing.howItWorks.stepOneTitle}</h3>
            <p>{t.landing.howItWorks.stepOneText}</p>
          </article>
          <article className="card landing-step-card">
            <span className="landing-step-index">02</span>
            <h3>{t.landing.howItWorks.stepTwoTitle}</h3>
            <p>{t.landing.howItWorks.stepTwoText}</p>
          </article>
          <article className="card landing-step-card">
            <span className="landing-step-index">03</span>
            <h3>{t.landing.howItWorks.stepThreeTitle}</h3>
            <p>{t.landing.howItWorks.stepThreeText}</p>
          </article>
        </div>
      </section>

      <section className="landing-cta card">
        <div>
          <h2>{t.landing.cta.title}</h2>
          <p>{t.landing.cta.subtitle}</p>
        </div>
        <Link to="/register" className="btn btn-primary btn-lg">
          <GraduationCap size={16} />
          {t.landing.cta.button}
        </Link>
      </section>
    </main>
  );
};
