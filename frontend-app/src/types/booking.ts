export interface TimeSlot {
  id: number;
  mentorId: number;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "UNAVAILABLE";
}

export interface Booking {
  id: number;
  mentorId: number;
  menteeId: number;
  timeSlotId: number;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED_BY_MENTEE"
    | "CANCELLED_BY_MENTOR";
  notes?: string;
  hourlyRate: number;
  duration: number;
  totalAmount: number;
  currency: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  mentor?: {
    id: number;
    title: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  mentee?: {
    id: number;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  timeSlot?: TimeSlot;
  review?: {
    id: number;
    rating: number;
    comment?: string;
  };
}

export interface CreateBookingData {
  menteeId: number;
  mentorId: number;
  timeSlotId: number;
  notes?: string;
}
