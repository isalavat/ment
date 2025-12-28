import { prisma } from "../../prisma/client";


interface CreateAvailabilityData {
  mentorId: number;
  dayOfWeek?: number; // 0-6 for recurring
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  isRecurring?: boolean;
  specificDate?: Date; // For one-time availability
}

interface UpdateAvailabilityData {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  specificDate?: Date;
}

export const availabilityService = {
  /**
   * Create a new availability slot for a mentor
   */
  async createAvailability(data: CreateAvailabilityData) {
    const {
      mentorId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring = true,
      specificDate,
    } = data;

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new Error("Invalid time format. Use HH:mm format (e.g., 09:00)");
    }

    // Validate that startTime is before endTime
    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    // Validate recurring vs specific date
    if (isRecurring && dayOfWeek === undefined) {
      throw new Error("dayOfWeek is required for recurring availability");
    }

    if (!isRecurring && !specificDate) {
      throw new Error(
        "specificDate is required for non-recurring availability"
      );
    }

    if (isRecurring && (dayOfWeek! < 0 || dayOfWeek! > 6)) {
      throw new Error("dayOfWeek must be between 0 (Sunday) and 6 (Saturday)");
    }

    // Verify mentor exists
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
    });

    if (!mentor) {
      throw new Error("Mentor not found");
    }

    return prisma.availability.create({
      data: {
        mentorId,
        dayOfWeek: isRecurring ? dayOfWeek! : 0,
        startTime,
        endTime,
        isRecurring,
        specificDate,
      },
    });
  },

  /**
   * Get all availabilities for a mentor
   */
  async getAvailabilitiesForMentor(mentorId: number) {
    return prisma.availability.findMany({
      where: { mentorId },
      orderBy: [{ isRecurring: "desc" }, { dayOfWeek: "asc" }],
    });
  },

  /**
   * Get a single availability by ID
   */
  async getAvailabilityById(id: number) {
    const availability = await prisma.availability.findUnique({
      where: { id },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!availability) {
      throw new Error("Availability not found");
    }

    return availability;
  },

  /**
   * Update an availability
   */
  async updateAvailability(
    id: number,
    mentorId: number,
    data: UpdateAvailabilityData
  ) {
    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      throw new Error("Availability not found");
    }

    if (availability.mentorId !== mentorId) {
      throw new Error("Not authorized to update this availability");
    }

    // Validate time format if provided
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (data.startTime && !timeRegex.test(data.startTime)) {
      throw new Error("Invalid startTime format. Use HH:mm format");
    }
    if (data.endTime && !timeRegex.test(data.endTime)) {
      throw new Error("Invalid endTime format. Use HH:mm format");
    }

    // Validate time order if both are provided
    const newStartTime = data.startTime ?? availability.startTime;
    const newEndTime = data.endTime ?? availability.endTime;
    if (newStartTime >= newEndTime) {
      throw new Error("Start time must be before end time");
    }

    // Validate dayOfWeek if provided
    if (
      data.dayOfWeek !== undefined &&
      (data.dayOfWeek < 0 || data.dayOfWeek > 6)
    ) {
      throw new Error("dayOfWeek must be between 0 (Sunday) and 6 (Saturday)");
    }

    return prisma.availability.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete an availability
   */
  async deleteAvailability(id: number, mentorId: number) {
    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      throw new Error("Availability not found");
    }

    if (availability.mentorId !== mentorId) {
      throw new Error("Not authorized to delete this availability");
    }

    await prisma.availability.delete({
      where: { id },
    });

    return { success: true, message: "Availability deleted" };
  },

  /**
   * Get recurring availabilities by day of week
   */
  async getRecurringAvailabilities(mentorId: number, dayOfWeek?: number) {
    const where: any = {
      mentorId,
      isRecurring: true,
    };

    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    return prisma.availability.findMany({
      where,
      orderBy: { dayOfWeek: "asc" },
    });
  },

  /**
   * Get specific date availabilities
   */
  async getSpecificDateAvailabilities(mentorId: number, date?: Date) {
    const where: any = {
      mentorId,
      isRecurring: false,
    };

    if (date) {
      // Get availabilities for this specific date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.specificDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return prisma.availability.findMany({
      where,
      orderBy: { specificDate: "asc" },
    });
  },

  /**
   * Bulk create recurring weekly schedule for a mentor
   */
  async createWeeklySchedule(
    mentorId: number,
    schedule: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>
  ) {
    // Verify mentor exists
    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
    });

    if (!mentor) {
      throw new Error("Mentor not found");
    }

    // Validate all entries
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    for (const slot of schedule) {
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new Error(`Invalid dayOfWeek: ${slot.dayOfWeek}`);
      }
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        throw new Error(`Invalid time format in schedule`);
      }
      if (slot.startTime >= slot.endTime) {
        throw new Error(
          `Start time must be before end time for day ${slot.dayOfWeek}`
        );
      }
    }

    // Create all availabilities
    const created = await prisma.availability.createMany({
      data: schedule.map((slot) => ({
        mentorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isRecurring: true,
      })),
    });

    return {
      count: created.count,
      message: `Created ${created.count} availability slots`,
    };
  },
};
