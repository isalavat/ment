import api from "./api";

export interface Availability {
  id: string;
  mentorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityData {
  mentorId: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  specificDate?: string;
}

export interface WeeklyScheduleSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export const availabilityService = {
  // Create single availability
  async createAvailability(
    data: CreateAvailabilityData
  ): Promise<Availability> {
    const response = await api.post("/availability", data);
    return response.data;
  },

  // Create weekly schedule
  async createWeeklySchedule(
    mentorId: string,
    schedule: WeeklyScheduleSlot[]
  ): Promise<{ count: number; message: string }> {
    const response = await api.post("/availability/weekly", {
      mentorId,
      schedule,
    });
    return response.data;
  },

  // Get all availabilities for mentor
  async getAvailabilitiesForMentor(mentorId: string): Promise<Availability[]> {
    const response = await api.get(`/availability/mentor/${mentorId}`);
    return response.data;
  },

  // Get recurring availabilities
  async getRecurringAvailabilities(
    mentorId: string,
    dayOfWeek?: number
  ): Promise<Availability[]> {
    const params: any = {};
    if (dayOfWeek !== undefined) params.dayOfWeek = dayOfWeek;

    const response = await api.get(
      `/availability/mentor/${mentorId}/recurring`,
      { params }
    );
    return response.data;
  },

  // Update availability
  async updateAvailability(
    id: string,
    mentorId: string,
    data: Partial<CreateAvailabilityData>
  ): Promise<Availability> {
    const response = await api.patch(`/availability/${id}`, {
      mentorId,
      ...data,
    });
    return response.data;
  },

  // Delete availability
  async deleteAvailability(
    id: string,
    mentorId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/availability/${id}`, {
      data: { mentorId },
    });
    return response.data;
  },

  // Generate time slots from availability
  async generateTimeSlots(
    mentorId: string,
    startDate: string,
    endDate: string,
    slotDuration?: number
  ): Promise<{ count: number; message: string }> {
    const response = await api.post("/time-slots/generate", {
      mentorId,
      startDate,
      endDate,
      slotDuration,
    });
    return response.data;
  },

  // Get time slots for mentor
  async getTimeSlotsForMentor(
    mentorId: string,
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<any[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (status) params.status = status;

    const response = await api.get(`/time-slots/mentor/${mentorId}`, {
      params,
    });
    return response.data;
  },

  // Delete time slot
  async deleteTimeSlot(
    slotId: string,
    mentorId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/time-slots/${slotId}`, {
      data: { mentorId },
    });
    return response.data;
  },

  // Update time slot status
  async updateTimeSlotStatus(
    slotId: string,
    mentorId: string,
    status: string
  ): Promise<any> {
    const response = await api.patch(`/time-slots/${slotId}/status`, {
      mentorId,
      status,
    });
    return response.data;
  },
};
