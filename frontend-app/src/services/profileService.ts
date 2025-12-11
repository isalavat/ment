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
};
