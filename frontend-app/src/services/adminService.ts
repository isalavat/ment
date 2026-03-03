import axios from "./api";
import type { VerificationStatus } from "../types/profile";

export interface User {
  id: string;
  email: string;
  role: "USER" | "MENTOR" | "ADMIN";
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string | null;
  goals?: string | null;
  createdAt: string;
  mentorProfile?: {
    id: string;
    title: string;
    hourlyRate: number;
    avgRating: number;
  };
}

export interface MentorProfileFull {
  id: string;
  title: string;
  bio: string;
  yearsExperience: number;
  hourlyRate: number;
  currency: string;
  avgRating: number;
  totalReviews: number;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  skills: Array<{ skill: { id: string; name: string } }>;
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserData {
  email: string;
  password: string;
  role: "USER" | "MENTOR" | "ADMIN";
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  goals?: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  role?: "USER" | "MENTOR" | "ADMIN";
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string | null;
  goals?: string | null;
}

export interface CreateMentorProfileData {
  bio: string;
  title: string;
  yearsExperience: number;
  hourlyRate: number;
  currency?: string;
}

export interface UpdateMentorProfileData {
  bio?: string;
  title?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  currency?: string;
}

export interface Skill {
  id: string;
  name: string;
}

export const adminService = {
  // Get all mentors from /admin/mentors
  getMentors: async (): Promise<UsersResponse> => {
    const response = await axios.get("/admin/mentors");
    const mentorProfiles: any[] = response.data.mentorProfiles ?? [];
    const users: User[] = mentorProfiles.map((mp) => ({
      id: mp.user.id,
      email: mp.user.email,
      firstName: mp.user.firstName,
      lastName: mp.user.lastName,
      role: mp.user.role,
      createdAt: "",
      mentorProfile: {
        id: mp.id,
        title: mp.title,
        hourlyRate: mp.hourlyRate,
        avgRating: mp.avgRating,
      },
    }));
    return {
      users,
      pagination: {
        page: 1,
        limit: users.length,
        total: users.length,
        totalPages: 1,
      },
    };
  },

  // Get all users with optional filters
  getUsers: async (params?: {
    role?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<UsersResponse> => {
    const response = await axios.get("/admin/users", { params });
    return response.data;
  },

  // Get single user by ID
  getUser: async (userId: string): Promise<User> => {
    const response = await axios.get(`/admin/users/${userId}`);
    return response.data.user;
  },

  // Get single mentor by userId (raw full profile)
  getMentor: async (userId: string): Promise<User> => {
    const response = await axios.get(`/admin/mentors/by-user/${userId}`);
    const mp = response.data.mentorProfile;
    return {
      id: mp.user.id,
      email: mp.user.email,
      firstName: mp.user.firstName,
      lastName: mp.user.lastName,
      role: mp.user.role,
      createdAt: "",
      mentorProfile: {
        id: mp.id,
        title: mp.title,
        hourlyRate: mp.hourlyRate,
        avgRating: mp.avgRating,
        bio: mp.bio,
        yearsExperience: mp.yearsExperience,
        currency: mp.currency,
        totalReviews: mp.totalReviews,
        skills: mp.skills,
        categories: mp.categories,
      } as any,
    };
  },

  // Get the full raw mentor profile by userId (includes verificationStatus)
  getMentorProfileFull: async (userId: string): Promise<MentorProfileFull> => {
    const response = await axios.get(`/admin/mentors/by-user/${userId}`);
    return response.data.mentorProfile;
  },

  // Create new user
  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await axios.post("/admin/users", data);
    return response.data.user;
  },

  // Update user
  updateUser: async (userId: string, data: UpdateUserData): Promise<User> => {
    const response = await axios.put(`/admin/users/${userId}`, data);
    return response.data.user;
  },

  // Delete user
  deleteUser: async (userId: string): Promise<void> => {
    await axios.delete(`/admin/users/${userId}`);
  },

  // Create mentor profile for user
  createMentorProfile: async (
    userId: string,
    data: CreateMentorProfileData,
  ): Promise<any> => {
    const response = await axios.post(`/admin/mentors/by-user/${userId}`, data);
    return response.data.mentorProfile;
  },

  // Update mentor profile
  updateMentorProfile: async (
    userId: string,
    data: UpdateMentorProfileData,
  ): Promise<any> => {
    const response = await axios.put(`/admin/mentors/by-user/${userId}`, data);
    return response.data.mentorProfile;
  },

  // Get all skills
  getSkills: async (): Promise<Skill[]> => {
    const response = await axios.get("/admin/skills");
    return response.data.skills;
  },

  // Create new skill
  createSkill: async (name: string): Promise<Skill> => {
    const response = await axios.post("/admin/skills", { name });
    return response.data.skill;
  },

  // Add skill to mentor profile
  addSkillToMentor: async (
    userId: string,
    skillId?: string,
    skillName?: string,
  ): Promise<any> => {
    const response = await axios.post(
      `/admin/mentors/by-user/${userId}/skills`,
      { skillId, skillName },
    );
    return response.data.mentorProfile;
  },

  // Remove skill from mentor profile
  removeSkillFromMentor: async (
    userId: string,
    skillId: string,
  ): Promise<void> => {
    await axios.delete(`/admin/mentors/by-user/${userId}/skills/${skillId}`);
  },

  // Add category to mentor profile
  addCategoryToMentor: async (
    userId: string,
    categoryId: string,
  ): Promise<any> => {
    const response = await axios.post(
      `/admin/mentors/by-user/${userId}/categories`,
      { categoryId },
    );
    return response.data.mentorProfile;
  },

  // Remove category from mentor profile
  removeCategoryFromMentor: async (
    userId: string,
    categoryId: string,
  ): Promise<void> => {
    await axios.delete(
      `/admin/mentors/by-user/${userId}/categories/${categoryId}`,
    );
  },

  // Get all mentor profiles with optional verificationStatus filter
  getMentorProfiles: async (
    verificationStatus?: VerificationStatus,
  ): Promise<MentorProfileFull[]> => {
    const params = verificationStatus ? { verificationStatus } : undefined;
    const response = await axios.get("/admin/mentors", { params });
    return response.data.mentorProfiles ?? [];
  },

  // Verify or reject a mentor profile
  verifyMentor: async (
    mentorId: string,
    action: "verify" | "reject",
    rejectionReason?: string,
  ): Promise<MentorProfileFull> => {
    const response = await axios.patch(
      `/admin/mentors/${mentorId}/verification`,
      { action, rejectionReason },
    );
    return response.data.mentorProfile;
  },
};
