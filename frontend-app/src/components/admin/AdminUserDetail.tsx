import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  adminService,
  User,
  UpdateUserData,
  UpdateMentorProfileData,
  Skill,
  MentorProfileFull,
} from "../../services/adminService";
import { profileService } from "../../services/profileService";
import { PageShell } from "../common/PageShell";
import "./AdminUsers.css";

export const AdminUserDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [userData, setUserData] = useState<UpdateUserData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "USER",
    avatarUrl: "",
    bio: "",
    goals: "",
  });

  const [mentorProfile, setMentorProfile] = useState<UpdateMentorProfileData>({
    bio: "",
    title: "",
    yearsExperience: 0,
    hourlyRate: 0,
    currency: "USD",
  });

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [mentorSkills, setMentorSkills] = useState<any[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");

  const [availableCategories, setAvailableCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [mentorCategories, setMentorCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [mentorVerification, setMentorVerification] =
    useState<MentorProfileFull | null>(null);
  const [verificationActionLoading, setVerificationActionLoading] =
    useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminService.getUser(id!);
      setUser(data);
      setUserData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        avatarUrl: (data as any).avatarUrl || "",
        bio: (data as any).bio || "",
        goals: (data as any).goals || "",
      });
      if (data.mentorProfile) {
        const mp = data.mentorProfile as any;
        setMentorProfile({
          bio: mp.bio || "",
          title: mp.title || "",
          yearsExperience: mp.yearsExperience || 0,
          hourlyRate: parseFloat(mp.hourlyRate || 0),
          currency: mp.currency || "USD",
        });
        setMentorSkills(mp.skills || []);
        setMentorCategories(mp.categories || []);
        try {
          const fullProfile = await adminService.getMentorProfileFull(id!);
          setMentorVerification(fullProfile);
        } catch {
          setMentorVerification(null);
        }
      } else {
        setMentorProfile({
          bio: "",
          title: "",
          yearsExperience: 0,
          hourlyRate: 0,
          currency: "USD",
        });
        setMentorSkills([]);
        setMentorCategories([]);
        setMentorVerification(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t.admin.detail.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [id, t.admin.detail.failedToLoad]);

  const loadSkills = useCallback(async () => {
    try {
      const skills = await adminService.getSkills();
      setAvailableSkills(skills);
    } catch (err) {
      console.error("Failed to load skills", err);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await profileService.getCategories();
      setAvailableCategories(response.categories);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  }, []);

  useEffect(() => {
    if (id) {
      void loadUser();
      void loadSkills();
      void loadCategories();
    }
  }, [id, loadUser, loadSkills, loadCategories]);

  const handleUserChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMentorChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setMentorProfile((prev) => ({
      ...prev,
      [name]:
        name === "yearsExperience" || name === "hourlyRate"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminService.updateUser(id!, {
        ...userData,
        avatarUrl: userData.avatarUrl || undefined,
        password: (userData as any).password || undefined,
      });

      if (userData.role === "MENTOR") {
        if (user.mentorProfile) {
          await adminService.updateMentorProfile(id!, mentorProfile);
        } else {
          await adminService.createMentorProfile(id!, mentorProfile as any);
        }
      }

      setSuccess(t.admin.detail.updatedSuccess);
      void loadUser();
    } catch (err: any) {
      setError(err.response?.data?.error || t.admin.detail.failedToUpdate);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName && !selectedSkillId) {
      alert(t.profile.common.selectSkill);
      return;
    }
    try {
      setError("");
      const updated = await adminService.addSkillToMentor(
        id!,
        selectedSkillId,
        newSkillName || undefined,
      );
      setMentorSkills(updated.skills);
      setNewSkillName("");
      setSelectedSkillId("");
      setSuccess(t.admin.detail.skillAdded);
      void loadSkills();
    } catch (err: any) {
      setError(err.response?.data?.error || t.admin.detail.failedToAddSkill);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      setError("");
      await adminService.removeSkillFromMentor(id!, skillId);
      setMentorSkills((prev) => prev.filter((ms) => ms.skill.id !== skillId));
      setSuccess(t.admin.detail.skillRemoved);
    } catch (err: any) {
      setError(err.response?.data?.error || t.admin.detail.failedToRemoveSkill);
    }
  };

  const handleAddCategory = async () => {
    if (!selectedCategoryId) return;
    try {
      setError("");
      const updated = await adminService.addCategoryToMentor(
        id!,
        selectedCategoryId,
      );
      if (updated.categories) setMentorCategories(updated.categories);
      setSelectedCategoryId("");
      setSuccess(t.admin.detail.categoryAdded);
      await loadUser();
    } catch (err: any) {
      setError(err.response?.data?.error || t.admin.detail.failedToAddCategory);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    try {
      setError("");
      await adminService.removeCategoryFromMentor(id!, categoryId);
      setMentorCategories((prev) =>
        prev.filter((mc) => mc.category.id !== categoryId),
      );
      setSuccess(t.admin.detail.categoryRemoved);
    } catch (err: any) {
      setError(
        err.response?.data?.error || t.admin.detail.failedToRemoveCategory,
      );
    }
  };

  const handleVerify = async () => {
    if (!mentorVerification) return;
    if (
      !window.confirm(
        `${t.admin.detail.verifyPromptPrefix} "${user?.firstName} ${user?.lastName}"? ${t.admin.detail.verifyPromptSuffix}`,
      )
    )
      return;
    try {
      setVerificationActionLoading(true);
      setError("");
      await adminService.verifyMentor(mentorVerification.id, "verify");
      setSuccess(t.admin.detail.mentorVerified);
      await loadUser();
    } catch (err: any) {
      setError(err.response?.data?.error || t.admin.detail.failedToVerify);
    } finally {
      setVerificationActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!mentorVerification) return;
    try {
      setVerificationActionLoading(true);
      setError("");
      await adminService.verifyMentor(
        mentorVerification.id,
        "reject",
        rejectReason || undefined,
      );
      setShowRejectModal(false);
      setRejectReason("");
      setSuccess(t.admin.detail.mentorRejected);
      await loadUser();
    } catch (err: any) {
      setError(err.response?.data?.error || t.admin.detail.failedToReject);
    } finally {
      setVerificationActionLoading(false);
    }
  };

  const getVerificationLabel = (
    status: MentorProfileFull["verificationStatus"],
  ) => {
    switch (status) {
      case "VERIFIED":
        return t.admin.mentors.verified;
      case "REJECTED":
        return t.admin.mentors.rejected;
      case "PENDING":
      default:
        return t.admin.mentors.pending;
    }
  };

  if (loading) {
    return (
      <PageShell
        title={t.admin.detail.loadingTitle}
        subtitle={t.admin.detail.loadingSubtitle}
      >
        <div className="card">
          <div className="card-body admin-center-state">{t.common.loading}</div>
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell
        title={t.admin.detail.loadingTitle}
        subtitle={t.admin.detail.notFoundSubtitle}
      >
        <div className="card">
          <div className="card-body">
            <p>{t.admin.detail.notFound}</p>
            <button
              className="btn btn-outline mt-md"
              onClick={() => navigate("/admin/users")}
            >
              {t.admin.detail.backToUsers}
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`${t.admin.detail.titlePrefix} ${user.firstName} ${user.lastName}`}
      actions={
        <div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate("/admin/users")}
          >
            <ArrowLeft size={16} aria-hidden="true" /> {t.common.back}
          </button>
        </div>
      }
    >
      {error && <div className="alert alert-danger mb-md">{error}</div>}
      {success && <div className="alert alert-success mb-md">{success}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {/* ── User Details ── */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  {t.admin.detail.firstName} *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="form-input"
                  value={userData.firstName}
                  onChange={handleUserChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  {t.admin.detail.lastName} *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="form-input"
                  value={userData.lastName}
                  onChange={handleUserChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                {t.admin.detail.email} *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={userData.email}
                onChange={handleUserChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                {t.admin.detail.newPassword}{" "}
                <span className="admin-inline-note">
                  ({t.admin.detail.leaveBlankToKeepCurrent})
                </span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                onChange={handleUserChange}
                placeholder={t.admin.detail.passwordPlaceholder}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                {t.admin.detail.role} *
              </label>
              <select
                id="role"
                name="role"
                className="form-select"
                value={userData.role}
                onChange={handleUserChange}
                required
              >
                <option value="USER">{t.common.roles.learner}</option>
                <option value="MENTOR">{t.common.roles.mentor}</option>
                <option value="ADMIN">{t.common.roles.admin}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="avatarUrl" className="form-label">
                {t.admin.detail.avatarUrlOptional}
              </label>
              <input
                type="text"
                id="avatarUrl"
                name="avatarUrl"
                className="form-input"
                value={userData.avatarUrl || ""}
                onChange={handleUserChange}
                placeholder={t.admin.create.avatarPlaceholder}
              />
            </div>

            <div className="form-group">
              <label htmlFor="userBio" className="form-label">
                {t.admin.detail.bioOptional}
              </label>
              <textarea
                id="userBio"
                name="bio"
                className="form-textarea"
                rows={2}
                value={(userData as any).bio || ""}
                onChange={handleUserChange}
                placeholder={t.admin.detail.userBioPlaceholder}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goals" className="form-label">
                {t.admin.detail.goalsOptional}
              </label>
              <textarea
                id="goals"
                name="goals"
                className="form-textarea"
                rows={2}
                value={(userData as any).goals || ""}
                onChange={handleUserChange}
                placeholder={t.admin.detail.goalsPlaceholder}
              />
            </div>

            {/* ── Mentor Profile ── */}
            {userData.role === "MENTOR" && (
              <>
                <hr className="my-md" />
                <h3 className="mb-md">{t.admin.detail.mentorProfile}</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title" className="form-label">
                      {t.admin.detail.professionalTitle} *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="form-input"
                      value={mentorProfile.title}
                      onChange={handleMentorChange}
                      required
                      placeholder={t.admin.detail.titlePlaceholder}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="yearsExperience" className="form-label">
                      {t.admin.detail.yearsExperience} *
                    </label>
                    <input
                      type="number"
                      id="yearsExperience"
                      name="yearsExperience"
                      className="form-input"
                      value={mentorProfile.yearsExperience}
                      onChange={handleMentorChange}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="hourlyRate" className="form-label">
                      {t.admin.detail.hourlyRate} *
                    </label>
                    <input
                      type="number"
                      id="hourlyRate"
                      name="hourlyRate"
                      className="form-input"
                      value={mentorProfile.hourlyRate}
                      onChange={handleMentorChange}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="currency" className="form-label">
                      {t.admin.detail.currency}
                    </label>
                    <input
                      type="text"
                      id="currency"
                      name="currency"
                      className="form-input"
                      value={mentorProfile.currency}
                      onChange={handleMentorChange}
                      maxLength={3}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="mentorBio" className="form-label">
                    {t.admin.detail.mentorBio} *
                  </label>
                  <textarea
                    id="mentorBio"
                    name="bio"
                    className="form-textarea"
                    rows={5}
                    value={mentorProfile.bio}
                    onChange={handleMentorChange}
                    required
                    placeholder={t.admin.detail.mentorBioPlaceholder}
                  />
                </div>

                {/* Skills & Categories — only available after mentor profile is saved */}
                {!user.mentorProfile ? (
                  <div className="alert alert-info admin-alert-top">
                    {t.admin.detail.saveFirstForRelations}
                  </div>
                ) : (
                  <>
                    {/* Skills */}
                    <div className="form-group">
                      <label className="form-label">
                        {t.admin.shared.skills}
                      </label>
                      <div className="skills-list mb-md">
                        {mentorSkills.length > 0 ? (
                          mentorSkills.map((ms: any) => (
                            <div key={ms.skill.id} className="skill-chip">
                              <span>{ms.skill.name}</span>
                              <button
                                type="button"
                                className="skill-remove"
                                onClick={() => handleRemoveSkill(ms.skill.id)}
                                title={t.admin.shared.removeSkill}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="admin-muted-text">
                            {t.admin.detail.noSkillsAddedYet}
                          </p>
                        )}
                      </div>
                      <div className="skill-add-form">
                        <div className="form-row">
                          <div className="form-group admin-form-group-no-margin">
                            <select
                              className="form-select"
                              value={selectedSkillId}
                              onChange={(e) =>
                                setSelectedSkillId(e.target.value)
                              }
                            >
                              <option value="">
                                {t.admin.detail.selectExistingSkill}
                              </option>
                              {availableSkills
                                .filter(
                                  (s) =>
                                    !mentorSkills.some(
                                      (ms) => ms.skill.id === s.id,
                                    ),
                                )
                                .map((skill) => (
                                  <option key={skill.id} value={skill.id}>
                                    {skill.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="admin-inline-separator">
                            <span className="admin-muted-text">
                              {t.admin.shared.or}
                            </span>
                          </div>
                          <div className="form-group admin-form-group-no-margin">
                            <input
                              type="text"
                              className="form-input"
                              placeholder={t.admin.detail.enterNewSkillName}
                              value={newSkillName}
                              onChange={(e) => setNewSkillName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddSkill();
                                }
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleAddSkill}
                          >
                            <Plus size={16} aria-hidden="true" />{" "}
                            {t.admin.detail.addSkill}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="form-group">
                      <label className="form-label">
                        {t.admin.shared.categories}
                      </label>
                      <div className="skills-list mb-md">
                        {mentorCategories.length > 0 ? (
                          mentorCategories.map((mc: any) => (
                            <div key={mc.category.id} className="skill-chip">
                              <span>{mc.category.name}</span>
                              <button
                                type="button"
                                className="skill-remove"
                                onClick={() =>
                                  handleRemoveCategory(mc.category.id)
                                }
                                title={t.admin.shared.removeCategory}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="admin-muted-text">
                            {t.admin.detail.noCategoriesAssignedYet}
                          </p>
                        )}
                      </div>
                      <div className="skill-add-form">
                        <div className="form-row">
                          <div className="form-group admin-form-group-flex">
                            <select
                              className="form-select"
                              value={selectedCategoryId}
                              onChange={(e) =>
                                setSelectedCategoryId(e.target.value)
                              }
                            >
                              <option value="">
                                {t.admin.detail.selectCategory}
                              </option>
                              {availableCategories
                                .filter(
                                  (cat) =>
                                    !mentorCategories.some(
                                      (mc) => mc.category.id === cat.id,
                                    ),
                                )
                                .map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleAddCategory}
                            disabled={!selectedCategoryId}
                          >
                            <Plus size={16} aria-hidden="true" />{" "}
                            {t.admin.detail.addCategory}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Verification */}
                    {mentorVerification && (
                      <>
                        <hr className="my-md" />
                        <h4 className="mb-md">
                          {t.admin.detail.verificationStatus}
                        </h4>
                        <div className="admin-verification-row">
                          <span
                            className={`badge ${
                              mentorVerification.verificationStatus ===
                              "VERIFIED"
                                ? "badge-success"
                                : mentorVerification.verificationStatus ===
                                    "REJECTED"
                                  ? "badge-danger"
                                  : "badge-warning"
                            }`}
                          >
                            {getVerificationLabel(
                              mentorVerification.verificationStatus,
                            )}
                          </span>
                          {mentorVerification.verificationStatus !==
                            "VERIFIED" && (
                            <button
                              type="button"
                              onClick={handleVerify}
                              disabled={verificationActionLoading}
                              className="btn btn-outline btn-sm admin-verify-btn"
                            >
                              {t.admin.detail.verify}
                            </button>
                          )}
                          {mentorVerification.verificationStatus !==
                            "REJECTED" && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                setRejectReason("");
                                setShowRejectModal(true);
                              }}
                              disabled={verificationActionLoading}
                            >
                              {t.admin.detail.reject}
                            </button>
                          )}
                        </div>
                        {mentorVerification.verificationStatus === "REJECTED" &&
                          mentorVerification.rejectionReason && (
                            <div className="admin-rejection-reason">
                              {t.admin.detail.reason}:{" "}
                              {mentorVerification.rejectionReason}
                            </div>
                          )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/admin/users")}
                disabled={saving}
              >
                {t.admin.detail.cancel}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? t.admin.detail.saving : t.admin.detail.saveChanges}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="view-modal-overlay"
          onClick={() => setShowRejectModal(false)}
        >
          <div className="view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="view-modal-header">
              <h2>
                {t.admin.detail.rejectTitlePrefix} {user?.firstName}{" "}
                {user?.lastName}
              </h2>
              <button
                className="view-modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>
            <div className="view-modal-body">
              <div className="form-group">
                <label className="form-label">
                  {t.admin.detail.rejectionReason}{" "}
                  <span className="admin-inline-note">
                    ({t.admin.detail.rejectionReasonHelp})
                  </span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t.admin.detail.rejectionPlaceholder}
                />
              </div>
            </div>
            <div className="view-modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowRejectModal(false)}
              >
                {t.common.cancel}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRejectConfirm}
                disabled={verificationActionLoading}
              >
                {verificationActionLoading
                  ? t.admin.detail.rejecting
                  : t.admin.detail.confirmRejection}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};
