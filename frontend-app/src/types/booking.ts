export interface TimeSlot {
  id: string;
  mentorId: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "UNAVAILABLE";
}

export interface Booking {
  id: string;
  mentorId: string;
  menteeId: string;
  timeSlotId: string;
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
    id: string;
    title: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  mentee?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  timeSlot?: TimeSlot;
  review?: {
    id: string;
    rating: number;
    comment?: string;
  };
}

export interface CreateBookingData {
  menteeId: string;
  mentorId: string;
  timeSlotId: string;
  notes?: string;
}
