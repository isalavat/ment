import api from "./api";
import { Booking, CreateBookingData, TimeSlot } from "../types/booking";

export const bookingService = {
  // Create a new booking
  async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await api.post("/bookings", data);
    return response.data;
  },

  // Get bookings for mentee
  async getBookingsForMentee(
    menteeId: number,
    status?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Booking[]> {
    const params: any = {};
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get(`/bookings/mentee/${menteeId}`, { params });
    return response.data;
  },

  // Get bookings for mentor
  async getBookingsForMentor(
    mentorId: number,
    status?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Booking[]> {
    const params: any = {};
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get(`/bookings/mentor/${mentorId}`, { params });
    return response.data;
  },

  // Get single booking
  async getBookingById(bookingId: number): Promise<Booking> {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // Confirm booking (mentor)
  async confirmBooking(bookingId: number, mentorId: number): Promise<Booking> {
    const response = await api.patch(`/bookings/${bookingId}/confirm`, {
      mentorId,
    });
    return response.data;
  },

  // Cancel booking (mentee)
  async cancelBookingByMentee(
    bookingId: number,
    menteeId: number
  ): Promise<Booking> {
    const response = await api.patch(`/bookings/${bookingId}/cancel-mentee`, {
      menteeId,
    });
    return response.data;
  },

  // Cancel booking (mentor)
  async cancelBookingByMentor(
    bookingId: number,
    mentorId: number
  ): Promise<Booking> {
    const response = await api.patch(`/bookings/${bookingId}/cancel-mentor`, {
      mentorId,
    });
    return response.data;
  },

  // Complete booking
  async completeBooking(bookingId: number): Promise<Booking> {
    const response = await api.patch(`/bookings/${bookingId}/complete`);
    return response.data;
  },

  // Update meeting link
  async updateMeetingLink(
    bookingId: number,
    mentorId: number,
    meetingLink: string
  ): Promise<Booking> {
    const response = await api.patch(`/bookings/${bookingId}/meeting-link`, {
      mentorId,
      meetingLink,
    });
    return response.data;
  },

  // Get available time slots for a mentor
  async getAvailableTimeSlots(
    mentorId: number,
    startDate?: string,
    endDate?: string
  ): Promise<TimeSlot[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get(`/time-slots/mentor/${mentorId}/available`, {
      params,
    });
    return response.data;
  },
};
