import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  adminService,
  User,
  UpdateUserData,
  UpdateMentorProfileData,
  Skill,
} from "../../services/adminService";
import { profileService } from "../../services/profileService";
import "./AdminUsers.css";

export const AdminUserDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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

  useEffect(() => {
    if (id) {
      loadUser();
      loadSkills();
      loadCategories();
    }
  }, [id]);

  const loadUser = async () => {
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
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    try {
      const skills = await adminService.getSkills();
      setAvailableSkills(skills);
    } catch (err) {
      console.error("Failed to load skills", err);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await profileService.getCategories();
      setAvailableCategories(response.categories);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

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

      setSuccess("User updated successfully");
      loadUser();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName && !selectedSkillId) {
      alert("Please select or enter a skill");
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
      setSuccess("Skill added");
      loadSkills();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add skill");
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      setError("");
      await adminService.removeSkillFromMentor(id!, skillId);
      setMentorSkills((prev) => prev.filter((ms) => ms.skill.id !== skillId));
      setSuccess("Skill removed");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove skill");
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
      setSuccess("Category added");
      await loadUser();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add category");
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    try {
      setError("");
      await adminService.removeCategoryFromMentor(id!, categoryId);
      setMentorCategories((prev) =>
        prev.filter((mc) => mc.category.id !== categoryId),
      );
      setSuccess("Category removed");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove category");
    }
  };

  if (loading) {
    return (
      <div className="content-area">
        <div className="card">
          <div
            className="card-body"
            style={{ textAlign: "center", padding: "var(--space-xxl)" }}
          >
            Loading user...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="content-area">
        <div className="card">
          <div className="card-body">
            <p>User not found</p>
            <button
              className="btn btn-outline mt-md"
              onClick={() => navigate("/admin/users")}
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="page-title mt-sm">
            Edit User: {user.firstName} {user.lastName}
          </h1>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-md">{error}</div>}
      {success && <div className="alert alert-success mb-md">{success}</div>}

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
                New Password{" "}
                <span style={{ color: "var(--neutral-500)", fontWeight: 400 }}>
                  (leave blank to keep current)
                </span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                onChange={handleUserChange}
                placeholder="Enter new password"
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
                value={userData.avatarUrl || ""}
                onChange={handleUserChange}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="form-group">
              <label htmlFor="userBio" className="form-label">
                Bio (optional)
              </label>
              <textarea
                id="userBio"
                name="bio"
                className="form-textarea"
                rows={2}
                value={(userData as any).bio || ""}
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
                value={(userData as any).goals || ""}
                onChange={handleUserChange}
                placeholder="User's goals or objectives..."
              />
            </div>

            {/* ── Mentor Profile ── */}
            {userData.role === "MENTOR" && (
              <>
                <hr className="my-md" />
                <h3 className="mb-md">Mentor Profile</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title" className="form-label">
                      Professional Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="form-input"
                      value={mentorProfile.title}
                      onChange={handleMentorChange}
                      required
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="yearsExperience" className="form-label">
                      Years of Experience *
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
                      Hourly Rate *
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
                      Currency
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
                    Mentor Bio *
                  </label>
                  <textarea
                    id="mentorBio"
                    name="bio"
                    className="form-textarea"
                    rows={5}
                    value={mentorProfile.bio}
                    onChange={handleMentorChange}
                    required
                    placeholder="Tell about your experience and expertise..."
                  />
                </div>

                {/* Skills & Categories — only available after mentor profile is saved */}
                {!user.mentorProfile ? (
                  <div
                    className="alert alert-info"
                    style={{ marginTop: "var(--space-md)" }}
                  >
                    Save changes first to enable skills and categories
                    management.
                  </div>
                ) : (
                  <>
                    {/* Skills */}
                    <div className="form-group">
                      <label className="form-label">Skills</label>
                      <div className="skills-list mb-md">
                        {mentorSkills.length > 0 ? (
                          mentorSkills.map((ms: any) => (
                            <div key={ms.skill.id} className="skill-chip">
                              <span>{ms.skill.name}</span>
                              <button
                                type="button"
                                className="skill-remove"
                                onClick={() => handleRemoveSkill(ms.skill.id)}
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
                            No skills added yet
                          </p>
                        )}
                      </div>
                      <div className="skill-add-form">
                        <div className="form-row">
                          <div
                            className="form-group"
                            style={{ marginBottom: 0 }}
                          >
                            <select
                              className="form-select"
                              value={selectedSkillId}
                              onChange={(e) =>
                                setSelectedSkillId(e.target.value)
                              }
                            >
                              <option value="">Select existing skill...</option>
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "0 var(--space-md)",
                            }}
                          >
                            <span style={{ color: "var(--neutral-500)" }}>
                              or
                            </span>
                          </div>
                          <div
                            className="form-group"
                            style={{ marginBottom: 0 }}
                          >
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Enter new skill name..."
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
                            + Add Skill
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="form-group">
                      <label className="form-label">Categories</label>
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
                            No categories assigned yet
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
                              value={selectedCategoryId}
                              onChange={(e) =>
                                setSelectedCategoryId(e.target.value)
                              }
                            >
                              <option value="">Select category...</option>
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
                            + Add Category
                          </button>
                        </div>
                      </div>
                    </div>
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
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
