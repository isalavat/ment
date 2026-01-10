import axios from './api';

export interface MentorProfile {
  id: string;
  userId: string;
  title: string;
  bio: string;
  yearsExperience: number;
  hourlyRate: number;
  currency: string;
  avgRating: number;
  totalReviews: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  skills: Array<{
    skill: {
      id: string;
      name: string;
    };
  }>;
  categories: Array<{
    category: {
      id: string;
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
  page?: number;
  limit?: number;
}

export interface MentorsResponse {
  mentors: MentorProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const mentorService = {
  // Get all mentors with optional filters
  getMentors: async (params?: GetMentorsParams): Promise<MentorsResponse> => {
    const response = await axios.get('/profiles/mentors', { params });
    return response.data;
  },
  
  // Get a single mentor by ID
  getMentorById: async (id: string): Promise<MentorProfile> => {
    const response = await axios.get(`/profiles/mentors/${id}`);
    return response.data.mentor;
  }
};
