import axios from './api';

export interface User {
  id: string;
  email: string;
  role: 'MENTEE' | 'MENTOR' | 'ADMIN';
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
  role: 'MENTEE' | 'MENTOR' | 'ADMIN';
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  role?: 'MENTEE' | 'MENTOR' | 'ADMIN';
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
  // Get all users with optional filters
  getUsers: async (params?: {
    role?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<UsersResponse> => {
    const response = await axios.get('/admin/users', { params });
    return response.data;
  },

  // Get single user by ID
  getUser: async (userId: string): Promise<User> => {
    const response = await axios.get(`/admin/users/${userId}`);
    return response.data.user;
  },

  // Create new user
  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await axios.post('/admin/users', data);
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
  createMentorProfile: async (userId: string, data: CreateMentorProfileData): Promise<any> => {
    const response = await axios.post(`/admin/users/${userId}/mentor-profile`, data);
    return response.data.profile;
  },

  // Create mentee profile for user
  createMenteeProfile: async (userId: string, data: CreateMenteeProfileData): Promise<any> => {
    const response = await axios.post(`/admin/users/${userId}/mentee-profile`, data);
    return response.data.profile;
  },

  // Update mentor profile
  updateMentorProfile: async (userId: string, data: UpdateMentorProfileData): Promise<any> => {
    const response = await axios.put(`/admin/users/${userId}/mentor-profile`, data);
    return response.data.profile;
  },

  // Update mentee profile
  updateMenteeProfile: async (userId: string, data: UpdateMenteeProfileData): Promise<any> => {
    const response = await axios.put(`/admin/users/${userId}/mentee-profile`, data);
    return response.data.profile;
  },

  // Get all skills
  getSkills: async (): Promise<Skill[]> => {
    const response = await axios.get('/admin/skills');
    return response.data.skills;
  },

  // Create new skill
  createSkill: async (name: string): Promise<Skill> => {
    const response = await axios.post('/admin/skills', { name });
    return response.data.skill;
  },

  // Add skill to mentor profile
  addSkillToMentor: async (userId: string, skillId?: string, skillName?: string): Promise<any> => {
    const response = await axios.post(`/admin/users/${userId}/mentor-profile/skills`, { 
      skillId, 
      skillName 
    });
    return response.data.profile;
  },

  // Remove skill from mentor profile
  removeSkillFromMentor: async (userId: string, skillId: string): Promise<void> => {
    await axios.delete(`/admin/users/${userId}/mentor-profile/skills/${skillId}`);
  },

  // Add category to mentor profile
  addCategoryToMentor: async (userId: string, categoryId: string): Promise<any> => {
    const response = await axios.post(`/admin/users/${userId}/mentor-profile/categories`, { categoryId });
    return response.data.profile;
  },

  // Remove category from mentor profile
  removeCategoryFromMentor: async (userId: string, categoryId: string): Promise<void> => {
    await axios.delete(`/admin/users/${userId}/mentor-profile/categories/${categoryId}`);
  }
};
