import axios from './api';

export interface MentorProfile {
  id: number;
  userId: number;
  title: string;
  bio: string;
  yearsExperience: number;
  hourlyRate: number;
  currency: string;
  avgRating: number;
  totalReviews: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  skills: Array<{
    skill: {
      id: number;
      name: string;
    };
  }>;
  categories: Array<{
    category: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
}

export interface GetMentorsParams {
  category?: string;
  skill?: string;
  rating?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export const mentorService = {
  // Get all mentors with optional filters
  getMentors: async (params?: GetMentorsParams): Promise<MentorProfile[]> => {
    const response = await axios.get('/profiles/mentors', { params });
    return response.data.mentors;
  },
  
  // Get a single mentor by ID
  getMentorById: async (id: number): Promise<MentorProfile> => {
    const response = await axios.get(`/profiles/mentors/${id}`);
    return response.data.mentor;
  }
};
