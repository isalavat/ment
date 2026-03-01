export interface MentorProfile {
  id: string;
  userId: string;
  bio: string;
  title: string;
  yearsExperience: number;
  hourlyRate: number;
  currency: string;
  avgRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  categories?: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
      description?: string;
    };
  }>;
  skills?: Array<{
    skill: {
      id: string;
      name: string;
    };
  }>;
}

export interface CreateMentorProfileRequest {
  bio: string;
  title: string;
  yearsExperience: number;
  hourlyRate: number;
  currency?: string;
}

export interface UpdateMentorProfileRequest {
  bio?: string;
  title?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  currency?: string;
}

export interface UpdateMyProfileRequest {
  bio?: string;
  goals?: string;
}
