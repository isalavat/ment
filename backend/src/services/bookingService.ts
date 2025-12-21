import { PrismaClient, BookingStatus, SlotStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface CreateBookingData {
  menteeId: number;
  mentorId: number;
  timeSlotId: number;
  notes?: string;
}

interface BookingFilters {
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
}

export const bookingService = {
  /**
   * Create a new booking (mentee initiates)
   */
  async createBooking(data: CreateBookingData) {
    const { menteeId, mentorId, timeSlotId, notes } = data;

    // Verify the time slot exists and is available
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        booking: true,
      },
    });

    if (!timeSlot) {
      throw new Error("Time slot not found");
    }

    if (timeSlot.status !== SlotStatus.AVAILABLE) {
      throw new Error("Time slot is not available");
    }

    if (timeSlot.booking) {
      throw new Error("Time slot is already booked");
    }

    // Verify the time slot belongs to the mentor
    if (timeSlot.mentorId !== mentorId) {
      throw new Error("Time slot does not belong to this mentor");
    }

    // Get mentor profile for pricing
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
    });

    if (!mentorProfile) {
      throw new Error("Mentor profile not found");
    }

    // Verify mentee profile exists
    const menteeProfile = await prisma.menteeProfile.findUnique({
      where: { id: menteeId },
    });

    if (!menteeProfile) {
      throw new Error("Mentee profile not found");
    }

    // Calculate duration and total amount
    const duration = Math.round(
      (timeSlot.endTime.getTime() - timeSlot.startTime.getTime()) / (1000 * 60)
    );
    const totalAmount = mentorProfile.hourlyRate.toNumber() * (duration / 60);

    // Create booking and update slot status in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Update time slot status
      await tx.timeSlot.update({
        where: { id: timeSlotId },
        data: { status: SlotStatus.BOOKED },
      });

      // Create booking
      return tx.booking.create({
        data: {
          mentorId,
          menteeId,
          timeSlotId,
          notes,
          status: BookingStatus.PENDING,
          hourlyRate: mentorProfile.hourlyRate,
          duration,
          totalAmount,
          currency: mentorProfile.currency,
        },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          mentee: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          timeSlot: true,
        },
      });
    });

    return booking;
  },

  /**
   * Confirm a booking (mentor confirms)
   */
  async confirmBooking(bookingId: number, mentorId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.mentorId !== mentorId) {
      throw new Error("Not authorized to confirm this booking");
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new Error("Only pending bookings can be confirmed");
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        mentee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        timeSlot: true,
      },
    });
  },

  /**
   * Cancel booking by mentee
   */
  async cancelBookingByMentee(bookingId: number, menteeId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { timeSlot: true },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.menteeId !== menteeId) {
      throw new Error("Not authorized to cancel this booking");
    }

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED_BY_MENTEE ||
      booking.status === BookingStatus.CANCELLED_BY_MENTOR
    ) {
      throw new Error("Cannot cancel this booking");
    }

    // Cancel booking and free up the time slot
    return prisma.$transaction(async (tx) => {
      // Update time slot back to available
      await tx.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: { status: SlotStatus.AVAILABLE },
      });

      // Update booking status
      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED_BY_MENTEE,
          cancelledAt: new Date(),
        },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          mentee: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          timeSlot: true,
        },
      });
    });
  },

  /**
   * Cancel booking by mentor
   */
  async cancelBookingByMentor(bookingId: number, mentorId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { timeSlot: true },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.mentorId !== mentorId) {
      throw new Error("Not authorized to cancel this booking");
    }

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED_BY_MENTEE ||
      booking.status === BookingStatus.CANCELLED_BY_MENTOR
    ) {
      throw new Error("Cannot cancel this booking");
    }

    // Cancel booking and free up the time slot
    return prisma.$transaction(async (tx) => {
      // Update time slot back to available
      await tx.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: { status: SlotStatus.AVAILABLE },
      });

      // Update booking status
      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED_BY_MENTOR,
          cancelledAt: new Date(),
        },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          mentee: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          timeSlot: true,
        },
      });
    });
  },

  /**
   * Complete a booking
   */
  async completeBooking(bookingId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new Error("Only confirmed bookings can be completed");
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        mentee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        timeSlot: true,
      },
    });
  },

  /**
   * Get bookings for a mentee
   */
  async getBookingsForMentee(menteeId: number, filters?: BookingFilters) {
    const where: any = { menteeId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timeSlot = {};
      if (filters.startDate) {
        where.timeSlot.startTime = { gte: filters.startDate };
      }
      if (filters.endDate) {
        where.timeSlot.endTime = { lte: filters.endDate };
      }
    }

    return prisma.booking.findMany({
      where,
      include: {
        mentor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        timeSlot: true,
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Get bookings for a mentor
   */
  async getBookingsForMentor(mentorId: number, filters?: BookingFilters) {
    const where: any = { mentorId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timeSlot = {};
      if (filters.startDate) {
        where.timeSlot.startTime = { gte: filters.startDate };
      }
      if (filters.endDate) {
        where.timeSlot.endTime = { lte: filters.endDate };
      }
    }

    return prisma.booking.findMany({
      where,
      include: {
        mentee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        timeSlot: true,
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Get a single booking by ID
   */
  async getBookingById(bookingId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        mentee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        timeSlot: true,
        review: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  },

  /**
   * Update meeting link (typically by mentor)
   */
  async updateMeetingLink(
    bookingId: number,
    mentorId: number,
    meetingLink: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.mentorId !== mentorId) {
      throw new Error("Not authorized to update this booking");
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { meetingLink },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        mentee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        timeSlot: true,
      },
    });
  },
};
