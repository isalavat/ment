import api from "./api";
import {
  CreateMentorProfileRequest,
  UpdateMentorProfileRequest,
  UpdateMyProfileRequest,
  MentorProfile,
} from "../types/profile";
import { User } from "../types/auth";

export const profileService = {
  // Get current user profile with optional mentor data
  getMyProfile: async (): Promise<{
    user: User & { mentorProfile?: MentorProfile };
  }> => {
    const response = await api.get("/profiles/me");
    return response.data;
  },

  // Update bio/goals on the current user
  updateMyProfile: async (
    data: UpdateMyProfileRequest,
  ): Promise<{ user: User }> => {
    const response = await api.put("/profiles/me", data);
    return response.data;
  },

  // Mentor Profile
  createMentorProfile: async (
    data: CreateMentorProfileRequest,
  ): Promise<{ profile: MentorProfile }> => {
    const response = await api.post("/profiles/mentor", data);
    return response.data;
  },

  updateMentorProfile: async (
    data: UpdateMentorProfileRequest,
  ): Promise<{ profile: MentorProfile }> => {
    const response = await api.put("/profiles/mentor", data);
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<{
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      description?: string;
    }>;
  }> => {
    const response = await api.get("/profiles/categories");
    return response.data;
  },

  // Skills
  getSkills: async (): Promise<{
    skills: Array<{ id: string; name: string }>;
  }> => {
    const response = await api.get("/profiles/skills");
    return response.data;
  },

  addCategoryToMentorProfile: async (
    categoryId: string,
  ): Promise<{ message: string }> => {
    const response = await api.post("/profiles/mentor/categories", {
      categoryId,
    });
    return response.data;
  },

  removeCategoryFromMentorProfile: async (
    categoryId: string,
  ): Promise<{ message: string }> => {
    const response = await api.delete(
      `/profiles/mentor/categories/${categoryId}`,
    );
    return response.data;
  },

  addSkillToMentorProfile: async (
    skillId?: string,
    skillName?: string,
  ): Promise<MentorProfile> => {
    const response = await api.post("/profiles/mentor/skills", {
      skillId,
      skillName,
    });
    return response.data.profile;
  },

  removeSkillFromMentorProfile: async (
    skillId: string,
  ): Promise<{ message: string }> => {
    const response = await api.delete(`/profiles/mentor/skills/${skillId}`);
    return response.data;
  },
};
