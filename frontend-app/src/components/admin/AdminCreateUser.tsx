import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminService,
  CreateUserData,
  CreateMentorProfileData,
  Skill,
} from "../../services/adminService";
import { profileService } from "../../services/profileService";
import "./AdminUsers.css";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export const AdminCreateUser: React.FC = () => {
  const navigate = useNavigate();
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
        err.response?.data?.error || err.message || "Failed to create user",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate("/admin/users")}
          >
            ← Back
          </button>
          <h1 className="page-title mt-sm">Create New User</h1>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-md">{error}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            {/* ── User Details ── */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name *
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
                  Last Name *
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
                Email *
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
                Password *
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
                Role *
              </label>
              <select
                id="role"
                name="role"
                className="form-select"
                value={userData.role}
                onChange={handleUserChange}
                required
              >
                <option value="USER">User</option>
                <option value="MENTOR">Mentor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="avatarUrl" className="form-label">
                Avatar URL (optional)
              </label>
              <input
                type="text"
                id="avatarUrl"
                name="avatarUrl"
                className="form-input"
                value={userData.avatarUrl}
                onChange={handleUserChange}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio" className="form-label">
                Bio (optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                className="form-textarea"
                rows={2}
                value={userData.bio}
                onChange={handleUserChange}
                placeholder="Short bio or description..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="goals" className="form-label">
                Goals (optional)
              </label>
              <textarea
                id="goals"
                name="goals"
                className="form-textarea"
                rows={2}
                value={userData.goals}
                onChange={handleUserChange}
                placeholder="User's goals or objectives..."
              />
            </div>

            {/* ── Mentor Profile ── */}
            {userData.role === "MENTOR" && (
              <>
                <hr className="my-md" />
                <h3 className="mb-md">Mentor Profile</h3>

                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-input"
                    value={mentorData.title}
                    onChange={handleMentorChange}
                    required
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mentorBio" className="form-label">
                    Mentor Bio *
                  </label>
                  <textarea
                    id="mentorBio"
                    name="bio"
                    className="form-textarea"
                    rows={4}
                    value={mentorData.bio}
                    onChange={handleMentorChange}
                    required
                    placeholder="Experience, expertise, what mentees can expect..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="yearsExperience" className="form-label">
                      Years of Experience *
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
                      Hourly Rate *
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
                      Currency
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
                  <label className="form-label">Categories</label>
                  <div className="skills-list mb-md">
                    {selectedCategories.length > 0 ? (
                      selectedCategories.map((cat) => (
                        <div key={cat.id} className="skill-chip">
                          <span>{cat.name}</span>
                          <button
                            type="button"
                            className="skill-remove"
                            onClick={() => handleRemoveCategory(cat.id)}
                            title="Remove category"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p
                        style={{
                          color: "var(--neutral-500)",
                          fontSize: "var(--font-size-sm)",
                        }}
                      >
                        No categories selected
                      </p>
                    )}
                  </div>
                  <div className="skill-add-form">
                    <div className="form-row">
                      <div
                        className="form-group"
                        style={{ marginBottom: 0, flex: 1 }}
                      >
                        <select
                          className="form-select"
                          value=""
                          onChange={(e) => {
                            if (e.target.value)
                              handleAddCategory(e.target.value);
                          }}
                        >
                          <option value="">Select a category...</option>
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
                  <label className="form-label">Skills</label>
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
                            title="Remove skill"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p
                        style={{
                          color: "var(--neutral-500)",
                          fontSize: "var(--font-size-sm)",
                        }}
                      >
                        No skills added
                      </p>
                    )}
                  </div>
                  <div className="skill-add-form">
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <select
                          className="form-select"
                          value={selectedSkillId}
                          onChange={(e) => setSelectedSkillId(e.target.value)}
                        >
                          <option value="">Select a skill...</option>
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0 var(--space-md)",
                        }}
                      >
                        <span style={{ color: "var(--neutral-500)" }}>or</span>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter new skill name"
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
                        Add Skill
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
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : userData.role === "MENTOR"
                    ? "Create User & Profile"
                    : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
