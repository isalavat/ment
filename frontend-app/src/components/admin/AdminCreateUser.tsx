import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  adminService,
  CreateUserData,
  CreateMentorProfileData,
  Skill,
} from "../../services/adminService";
import { profileService } from "../../services/profileService";
import { PageShell } from "../common/PageShell";
import "./AdminUsers.css";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export const AdminCreateUser: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    [],
  );
  const [selectedSkills, setSelectedSkills] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [newSkillName, setNewSkillName] = useState("");

  const [userData, setUserData] = useState<CreateUserData>({
    email: "",
    password: "",
    role: "USER",
    firstName: "",
    lastName: "",
    avatarUrl: "",
    bio: "",
    goals: "",
  });

  const [mentorData, setMentorData] = useState<CreateMentorProfileData>({
    title: "",
    bio: "",
    yearsExperience: 0,
    hourlyRate: 0,
    currency: "USD",
  });

  useEffect(() => {
    adminService.getSkills().then(setAvailableSkills).catch(console.error);
    profileService
      .getCategories()
      .then((res) => setAvailableCategories(res.categories))
      .catch(console.error);
  }, []);

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
    setMentorData((prev) => ({
      ...prev,
      [name]:
        name === "yearsExperience" || name === "hourlyRate"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleAddCategory = (categoryId: string) => {
    const cat = availableCategories.find((c) => c.id === categoryId);
    if (cat && !selectedCategories.some((sc) => sc.id === cat.id)) {
      setSelectedCategories((prev) => [
        ...prev,
        { id: cat.id, name: cat.name },
      ]);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const handleAddSkill = () => {
    if (selectedSkillId) {
      const skill = availableSkills.find((s) => s.id === selectedSkillId);
      if (skill && !selectedSkills.some((ss) => ss.id === skill.id)) {
        setSelectedSkills((prev) => [
          ...prev,
          { id: skill.id, name: skill.name },
        ]);
      }
      setSelectedSkillId("");
    } else if (newSkillName.trim()) {
      const name = newSkillName.trim();
      if (
        !selectedSkills.some(
          (ss) => ss.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        setSelectedSkills((prev) => [...prev, { id: "", name }]);
      }
      setNewSkillName("");
    }
  };

  const handleRemoveSkill = (key: string) => {
    setSelectedSkills((prev) => prev.filter((s) => (s.id || s.name) !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = userData.role;

    try {
      setLoading(true);
      setError("");

      const user = await adminService.createUser({
        ...userData,
        avatarUrl: userData.avatarUrl || undefined,
        bio: userData.bio || undefined,
        goals: userData.goals || undefined,
      });

      if (role === "MENTOR") {
        await adminService.createMentorProfile(user.id, mentorData);

        await Promise.all([
          ...selectedSkills.map((s) =>
            s.id
              ? adminService.addSkillToMentor(user.id, s.id)
              : adminService.addSkillToMentor(user.id, undefined, s.name),
          ),
          ...selectedCategories.map((c) =>
            adminService.addCategoryToMentor(user.id, c.id),
          ),
        ]);
      }

      navigate("/admin/users");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          t.admin.create.failedToCreate,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title={t.admin.create.title}
      actions={
        <div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate("/admin/users")}
          >
            <ArrowLeft size={16} aria-hidden="true" />{" "}
            {t.admin.create.backToUsers}
          </button>
        </div>
      }
    >
      {error && <div className="alert alert-danger mb-md">{error}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {/* ── User Details ── */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  {t.admin.create.firstName} *
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
                  {t.admin.create.lastName} *
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
                {t.admin.create.email} *
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
                {t.admin.create.password} *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={userData.password}
                onChange={handleUserChange}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                {t.admin.create.role} *
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
                {t.admin.create.avatarUrlOptional}
              </label>
              <input
                type="text"
                id="avatarUrl"
                name="avatarUrl"
                className="form-input"
                value={userData.avatarUrl}
                onChange={handleUserChange}
                placeholder={t.admin.create.avatarPlaceholder}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio" className="form-label">
                {t.admin.create.bioOptional}
              </label>
              <textarea
                id="bio"
                name="bio"
                className="form-textarea"
                rows={2}
                value={userData.bio}
                onChange={handleUserChange}
                placeholder={t.admin.create.bioPlaceholder}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goals" className="form-label">
                {t.admin.create.goalsOptional}
              </label>
              <textarea
                id="goals"
                name="goals"
                className="form-textarea"
                rows={2}
                value={userData.goals}
                onChange={handleUserChange}
                placeholder={t.admin.create.goalsPlaceholder}
              />
            </div>

            {/* ── Mentor Profile ── */}
            {userData.role === "MENTOR" && (
              <>
                <hr className="my-md" />
                <h3 className="mb-md">{t.admin.create.mentorProfile}</h3>

                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    {t.admin.create.professionalTitle} *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-input"
                    value={mentorData.title}
                    onChange={handleMentorChange}
                    required
                    placeholder={t.admin.create.titlePlaceholder}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mentorBio" className="form-label">
                    {t.admin.create.mentorBio} *
                  </label>
                  <textarea
                    id="mentorBio"
                    name="bio"
                    className="form-textarea"
                    rows={4}
                    value={mentorData.bio}
                    onChange={handleMentorChange}
                    required
                    placeholder={t.admin.create.mentorBioPlaceholder}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="yearsExperience" className="form-label">
                      {t.admin.create.yearsExperience} *
                    </label>
                    <input
                      type="number"
                      id="yearsExperience"
                      name="yearsExperience"
                      className="form-input"
                      value={mentorData.yearsExperience}
                      onChange={handleMentorChange}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hourlyRate" className="form-label">
                      {t.admin.create.hourlyRate} *
                    </label>
                    <input
                      type="number"
                      id="hourlyRate"
                      name="hourlyRate"
                      className="form-input"
                      value={mentorData.hourlyRate}
                      onChange={handleMentorChange}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="currency" className="form-label">
                      {t.admin.create.currency}
                    </label>
                    <input
                      type="text"
                      id="currency"
                      name="currency"
                      className="form-input"
                      value={mentorData.currency}
                      onChange={handleMentorChange}
                      maxLength={3}
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="form-group">
                  <label className="form-label">
                    {t.admin.create.categories}
                  </label>
                  <div className="skills-list mb-md">
                    {selectedCategories.length > 0 ? (
                      selectedCategories.map((cat) => (
                        <div key={cat.id} className="skill-chip">
                          <span>{cat.name}</span>
                          <button
                            type="button"
                            className="skill-remove"
                            onClick={() => handleRemoveCategory(cat.id)}
                            title={t.admin.shared.removeCategory}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="admin-muted-text">
                        {t.admin.create.noCategoriesSelected}
                      </p>
                    )}
                  </div>
                  <div className="skill-add-form">
                    <div className="form-row">
                      <div className="form-group admin-form-group-flex">
                        <select
                          className="form-select"
                          value=""
                          onChange={(e) => {
                            if (e.target.value)
                              handleAddCategory(e.target.value);
                          }}
                        >
                          <option value="">
                            {t.admin.create.selectCategory}
                          </option>
                          {availableCategories
                            .filter(
                              (cat) =>
                                !selectedCategories.some(
                                  (sc) => sc.id === cat.id,
                                ),
                            )
                            .map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="form-group">
                  <label className="form-label">{t.admin.create.skills}</label>
                  <div className="skills-list mb-md">
                    {selectedSkills.length > 0 ? (
                      selectedSkills.map((skill) => (
                        <div
                          key={skill.id || skill.name}
                          className="skill-chip"
                        >
                          <span>{skill.name}</span>
                          <button
                            type="button"
                            className="skill-remove"
                            onClick={() =>
                              handleRemoveSkill(skill.id || skill.name)
                            }
                            title={t.admin.shared.removeSkill}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="admin-muted-text">
                        {t.admin.create.noSkillsAdded}
                      </p>
                    )}
                  </div>
                  <div className="skill-add-form">
                    <div className="form-row">
                      <div className="form-group admin-form-group-no-margin">
                        <select
                          className="form-select"
                          value={selectedSkillId}
                          onChange={(e) => setSelectedSkillId(e.target.value)}
                        >
                          <option value="">{t.admin.create.selectSkill}</option>
                          {availableSkills
                            .filter(
                              (s) =>
                                !selectedSkills.some((ss) => ss.id === s.id),
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
                          placeholder={t.admin.create.enterNewSkillName}
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
                        {t.admin.create.addSkill}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate("/admin/users")}
                disabled={loading}
              >
                {t.admin.create.cancel}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading
                  ? t.admin.create.creating
                  : userData.role === "MENTOR"
                    ? t.admin.create.createUserAndProfile
                    : t.admin.create.createUser}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};
