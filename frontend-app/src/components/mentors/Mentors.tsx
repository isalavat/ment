import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { mentorService, MentorProfile } from "../../services/mentorService";
import { profileService } from "../../services/profileService";
import { PageShell } from "../common/PageShell";
import "./Mentors.css";

export const Mentors: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [skills, setSkills] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: "",
    skill: "",
    rating: "",
    price: "",
    sort: "rating",
  });

  // Load skills on mount
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const result = await profileService.getSkills();
        setSkills(result.skills);
      } catch (err) {
        console.error("Failed to load skills:", err);
      }
    };
    loadSkills();
  }, []);

  // Fetch mentors from API
  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      setError("");
      try {
        const params: any = {
          page: currentPage,
          limit: 9,
        };

        if (filters.category) {
          params.category = filters.category;
        }

        if (filters.skill) {
          params.skill = filters.skill;
        }

        if (filters.rating) {
          params.rating = parseFloat(filters.rating);
        }

        if (filters.price) {
          if (filters.price === "0-50") {
            params.maxPrice = 50;
          } else if (filters.price === "50-100") {
            params.minPrice = 50;
            params.maxPrice = 100;
          } else if (filters.price === "100+") {
            params.minPrice = 100;
          }
        }

        const data = await mentorService.getMentors(params);
        setMentors(data.mentors);
        setTotalPages(data.pagination.totalPages);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch mentors");
        console.error("Error fetching mentors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [
    filters.category,
    filters.skill,
    filters.rating,
    filters.price,
    currentPage,
  ]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      skill: "",
      rating: "",
      price: "",
      sort: "rating",
    });
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Sort mentors locally
  const sortedMentors = [...mentors].sort((a, b) => {
    if (filters.sort === "rating")
      return (b.avgRating || 0) - (a.avgRating || 0);
    if (filters.sort === "price-low")
      return (a.hourlyRate || 0) - (b.hourlyRate || 0);
    if (filters.sort === "price-high")
      return (b.hourlyRate || 0) - (a.hourlyRate || 0);
    if (filters.sort === "reviews")
      return (b.totalReviews || 0) - (a.totalReviews || 0);
    return 0;
  });

  // Helper function to get initials
  const getInitials = (mentor: MentorProfile) => {
    const firstName = mentor.user?.firstName || "";
    const lastName = mentor.user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const activeFilterCount = [
    filters.category,
    filters.skill,
    filters.rating,
    filters.price,
  ].filter(Boolean).length;

  return (
    <PageShell
      title={t.mentors.title}
      subtitle={t.mentors.subtitle}
      eyebrow="Mentor discovery"
      className="mentors-page"
    >
      <section className="mentor-discovery-card card">
        <div className="mentor-discovery-copy">
          <span className="mentor-discovery-kicker">
            <Sparkles size={16} />
            Curated mentors
          </span>
          <h2 className="mentor-discovery-title">
            Find the right person for your next step
          </h2>
          <p className="mentor-discovery-text">
            Filter by skill, category, rating, and price to narrow the field
            quickly.
          </p>
        </div>
        <div
          className="mentor-discovery-metrics"
          aria-label="Mentor discovery summary"
        >
          <div className="mentor-discovery-metric">
            <span className="mentor-discovery-metric-label">Page size</span>
            <strong className="mentor-discovery-metric-value">9 mentors</strong>
          </div>
          <div className="mentor-discovery-metric">
            <span className="mentor-discovery-metric-label">
              Active filters
            </span>
            <strong className="mentor-discovery-metric-value">
              {activeFilterCount}
            </strong>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="filter-bar mentor-filter-bar">
        <div className="mentor-filter-header">
          <div className="mentor-filter-title-wrap">
            <span className="mentor-filter-icon">
              <SlidersHorizontal size={16} />
            </span>
            <div>
              <div className="mentor-filter-title">Refine results</div>
              <div className="mentor-filter-subtitle">
                {activeFilterCount > 0
                  ? `${activeFilterCount} active filters applied`
                  : "Showing all mentors"}
              </div>
            </div>
          </div>
        </div>
        <div className="mentor-filter-grid">
          <div className="filter-item">
            <label className="form-label">{t.mentors.category}</label>
            <select
              className="form-select"
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="">{t.mentors.allCategories}</option>
              <option value="software">Software Development</option>
              <option value="data">Data Science</option>
              <option value="design">Design</option>
              <option value="product">Product Management</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="form-label">{t.mentors.skills}</label>
            <select
              className="form-select"
              value={filters.skill}
              onChange={(e) => handleFilterChange("skill", e.target.value)}
            >
              <option value="">{t.mentors.allSkills}</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.name}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="form-label">{t.mentors.minRating}</label>
            <select
              className="form-select"
              value={filters.rating}
              onChange={(e) => handleFilterChange("rating", e.target.value)}
            >
              <option value="">{t.mentors.anyRating}</option>
              <option value="4.5">4.5+ ⭐</option>
              <option value="4.0">4.0+ ⭐</option>
              <option value="3.5">3.5+ ⭐</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="form-label">{t.mentors.priceRange}</label>
            <select
              className="form-select"
              value={filters.price}
              onChange={(e) => handleFilterChange("price", e.target.value)}
            >
              <option value="">{t.mentors.anyPrice}</option>
              <option value="0-50">$0 - $50/hr</option>
              <option value="50-100">$50 - $100/hr</option>
              <option value="100+">$100+/hr</option>
            </select>
          </div>

          <div className="filter-item mentor-filter-action">
            <button
              className="btn btn-outline mentor-filter-clear"
              onClick={clearFilters}
            >
              {t.mentors.clearFilters}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && <div className="mentor-state-box">Loading mentors...</div>}

      {/* Error State */}
      {error && <div className="mentor-error-box">{error}</div>}

      {/* Empty State */}
      {!loading && !error && sortedMentors.length === 0 && (
        <div className="mentor-state-box">
          No mentors found. Try adjusting your filters.
        </div>
      )}

      {/* Results Info */}
      {!loading && !error && sortedMentors.length > 0 && (
        <>
          <div className="mentor-results-bar mb-md">
            <div className="mentor-results-text">
              <span className="mentor-results-icon">
                <Search size={16} />
              </span>
              <span>
                {t.mentors.showing}{" "}
                <strong>
                  {sortedMentors.length} {t.mentors.mentorsFound}
                </strong>
              </span>
            </div>
            <div className="mentor-sort-wrap">
              <select
                className="form-select mentor-sort-select"
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
              >
                <option value="rating">{t.mentors.sortBy}</option>
                <option value="price-low">{t.mentors.priceLowToHigh}</option>
                <option value="price-high">{t.mentors.priceHighToLow}</option>
                <option value="reviews">{t.mentors.mostReviews}</option>
              </select>
            </div>
          </div>

          {/* Mentor Grid */}
          <div className="mentors-grid">
            {sortedMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="mentor-card"
                onClick={() => navigate(`/mentors/${mentor.id}`)}
              >
                <div className="mentor-card-top">
                  <span className="mentor-card-badge">
                    <Star size={14} />
                    {mentor.avgRating?.toFixed(1) || "0.0"}
                  </span>
                  <span className="mentor-card-rate-pill">
                    ${mentor.hourlyRate || 0}
                    {t.mentors.perHour}
                  </span>
                </div>

                <div className="mentor-card-header">
                  <div className="mentor-avatar-lg">{getInitials(mentor)}</div>
                  <div className="mentor-info">
                    <h3>
                      {mentor.user?.firstName} {mentor.user?.lastName}
                    </h3>
                    <div className="mentor-title">
                      {mentor.title || "Mentor"}
                    </div>
                    <div className="mentor-rating">
                      ⭐{" "}
                      <strong>{mentor.avgRating?.toFixed(1) || "0.0"}</strong>{" "}
                      <span className="mentor-rating-meta">
                        ({mentor.totalReviews || 0} {t.mentors.reviews})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mentor-card-body">
                  <p className="mentor-bio">
                    {mentor.bio || "No bio available"}
                  </p>

                  <div className="mentor-skills">
                    {mentor.skills?.slice(0, 4).map((skillRel) => (
                      <span key={skillRel.skill.id} className="skill-tag">
                        {skillRel.skill.name}
                      </span>
                    ))}
                  </div>

                  {mentor.categories && mentor.categories.length > 0 && (
                    <div className="mentor-categories-row">
                      {mentor.categories.slice(0, 2).map((categoryRel) => (
                        <span
                          key={categoryRel.category.id}
                          className="mentor-category-tag"
                        >
                          {categoryRel.category.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mentor-card-footer">
                  <div className="mentor-rate-block">
                    <div className="mentor-rate">
                      ${mentor.hourlyRate || 0}
                      {t.mentors.perHour}
                    </div>
                    <div className="mentor-rate-caption">
                      {mentor.currency || "USD"}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mentor-card-cta"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/mentors/${mentor.id}`);
                    }}
                  >
                    {t.common.viewProfile}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mentor-pagination">
          <button
            className="btn btn-outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show first page, last page, current page, and pages around current
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  className={`btn ${page === currentPage ? "btn-primary" : "btn-outline"}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page}>...</span>;
            }
            return null;
          })}

          <button
            className="btn btn-outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </PageShell>
  );
};
