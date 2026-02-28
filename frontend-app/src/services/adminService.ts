import axios from "./api";

export interface User {
  id: string;
  email: string;
  role: "MENTEE" | "MENTOR" | "ADMIN";
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt: string;
  mentorProfile?: {
    id: string;
    title: string;
    hourlyRate: number;
    avgRating: number;
  };
  menteeProfile?: {
    id: string;
  };
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
  role: "MENTEE" | "MENTOR" | "ADMIN";
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  role?: "MENTEE" | "MENTOR" | "ADMIN";
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface CreateMentorProfileData {
  bio: string;
  title: string;
  yearsExperience: number;
  hourlyRate: number;
  currency?: string;
}

export interface CreateMenteeProfileData {
  bio?: string;
  goals?: string;
}

export interface UpdateMentorProfileData {
  bio?: string;
  title?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  currency?: string;
}

export interface UpdateMenteeProfileData {
  bio?: string;
  goals?: string;
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

  // Get all mentees from /admin/mentees
  getMentees: async (): Promise<User[]> => {
    const response = await axios.get("/admin/mentees");
    const menteeProfiles: any[] = response.data.menteeProfiles ?? [];
    return menteeProfiles.map((mp) => ({
      id: mp.user.id,
      email: mp.user.email,
      firstName: mp.user.firstName,
      lastName: mp.user.lastName,
      role: mp.user.role,
      createdAt: "",
      menteeProfile: { id: mp.id },
    }));
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

  // Get single mentee by userId
  getMentee: async (userId: string): Promise<User> => {
    const response = await axios.get(`/admin/mentees/by-user/${userId}`);
    const mp = response.data.menteeProfile;
    return {
      id: mp.user.id,
      email: mp.user.email,
      firstName: mp.user.firstName,
      lastName: mp.user.lastName,
      role: mp.user.role,
      createdAt: "",
      menteeProfile: {
        id: mp.id,
        bio: mp.bio,
        goals: mp.goals,
      } as any,
    };
  },

  // Get single mentor by userId
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
    data: CreateMentorProfileData
  ): Promise<any> => {
    const response = await axios.post(`/admin/mentors/by-user/${userId}`, data);
    return response.data.mentorProfile;
  },

  // Create mentee profile for user
  createMenteeProfile: async (
    userId: string,
    data: CreateMenteeProfileData
  ): Promise<any> => {
    const response = await axios.post(`/admin/mentees/by-user/${userId}`, data);
    return response.data.menteeProfile;
  },

  // Update mentor profile
  updateMentorProfile: async (
    userId: string,
    data: UpdateMentorProfileData
  ): Promise<any> => {
    const response = await axios.put(`/admin/mentors/by-user/${userId}`, data);
    return response.data.mentorProfile;
  },

  // Update mentee profile
  updateMenteeProfile: async (
    userId: string,
    data: UpdateMenteeProfileData
  ): Promise<any> => {
    const response = await axios.put(`/admin/mentees/by-user/${userId}`, data);
    return response.data.menteeProfile;
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
    skillName?: string
  ): Promise<any> => {
    const response = await axios.post(
      `/admin/mentors/by-user/${userId}/skills`,
      { skillId, skillName }
    );
    return response.data.mentorProfile;
  },

  // Remove skill from mentor profile
  removeSkillFromMentor: async (
    userId: string,
    skillId: string
  ): Promise<void> => {
    await axios.delete(`/admin/mentors/by-user/${userId}/skills/${skillId}`);
  },

  // Add category to mentor profile
  addCategoryToMentor: async (
    userId: string,
    categoryId: string
  ): Promise<any> => {
    const response = await axios.post(
      `/admin/mentors/by-user/${userId}/categories`,
      { categoryId }
    );
    return response.data.mentorProfile;
  },

  // Remove category from mentor profile
  removeCategoryFromMentor: async (
    userId: string,
    categoryId: string
  ): Promise<void> => {
    await axios.delete(
      `/admin/mentors/by-user/${userId}/categories/${categoryId}`
    );
  },
};
