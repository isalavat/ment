import api from './api';
import {
  CreateMentorProfileRequest,
  CreateMenteeProfileRequest,
  UpdateMentorProfileRequest,
  UpdateMenteeProfileRequest,
  MentorProfile,
  MenteeProfile,
} from '../types/profile';
import { User } from '../types/auth';

export const profileService = {
  // Get current user profile with mentor/mentee data
  getMyProfile: async (): Promise<{ user: User & { mentorProfile?: MentorProfile; menteeProfile?: MenteeProfile } }> => {
    const response = await api.get('/profiles/me');
    return response.data;
  },

  // Mentor Profile
  createMentorProfile: async (data: CreateMentorProfileRequest): Promise<{ profile: MentorProfile }> => {
    const response = await api.post('/profiles/mentor', data);
    return response.data;
  },

  updateMentorProfile: async (data: UpdateMentorProfileRequest): Promise<{ profile: MentorProfile }> => {
    const response = await api.put('/profiles/mentor', data);
    return response.data;
  },

  // Mentee Profile
  createMenteeProfile: async (data: CreateMenteeProfileRequest): Promise<{ profile: MenteeProfile }> => {
    const response = await api.post('/profiles/mentee', data);
    return response.data;
  },

  updateMenteeProfile: async (data: UpdateMenteeProfileRequest): Promise<{ profile: MenteeProfile }> => {
    const response = await api.put('/profiles/mentee', data);
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<{ categories: Array<{ id: number; name: string; slug: string; description?: string }> }> => {
    const response = await api.get('/profiles/categories');
    return response.data;
  },

  // Skills
  getSkills: async (): Promise<{ skills: Array<{ id: number; name: string }> }> => {
    const response = await api.get('/profiles/skills');
    return response.data;
  },

  addCategoryToMentorProfile: async (categoryId: number): Promise<{ message: string }> => {
    const response = await api.post('/profiles/mentor/categories', { categoryId });
    return response.data;
  },

  removeCategoryFromMentorProfile: async (categoryId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/profiles/mentor/categories/${categoryId}`);
    return response.data;
  },

  // Skills
  addSkillToMentorProfile: async (skillId?: number, skillName?: string): Promise<MentorProfile> => {
    const response = await api.post('/profiles/mentor/skills', { skillId, skillName });
    return response.data.profile;
  },

  removeSkillFromMentorProfile: async (skillId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/profiles/mentor/skills/${skillId}`);
    return response.data;
  },
};
