import type { Prisma } from "@prisma/client";
import type {
  AvailabilityDetailsRecord,
  AvailabilityManagementRepository,
  CreateAvailabilityRecord,
  CreateWeeklyAvailabilityRecord,
} from "../../domain/availability/AvailabilityManagementRepository";
import { PrismaClientGetway } from "../PrismaClientGetway";

const availabilityWithMentorInclude = {
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
} as const;

type AvailabilityWithMentor = Prisma.AvailabilityGetPayload<{
  include: typeof availabilityWithMentorInclude;
}>;

export class PrismaAvailabilityManagementRepository implements AvailabilityManagementRepository {
  async create(
    data: CreateAvailabilityRecord,
  ): Promise<AvailabilityDetailsRecord> {
    const availability = await PrismaClientGetway().availability.create({
      data,
    });

    return availability;
  }

  async createWeekly(
    data: CreateWeeklyAvailabilityRecord,
  ): Promise<{ count: number }> {
    const result = await PrismaClientGetway().availability.createMany({
      data: data.schedule.map((slot) => ({
        mentorId: data.mentorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isRecurring: true,
      })),
    });

    return { count: result.count };
  }

  async findById(id: string): Promise<AvailabilityDetailsRecord | null> {
    const availability = await PrismaClientGetway().availability.findUnique({
      where: { id },
    });

    return availability;
  }

  async findByIdWithMentor(
    id: string,
  ): Promise<AvailabilityDetailsRecord | null> {
    const availability = await PrismaClientGetway().availability.findUnique({
      where: { id },
      include: availabilityWithMentorInclude,
    });

    return availability ? this.toAvailabilityWithMentor(availability) : null;
  }

  async findForMentor(mentorId: string): Promise<AvailabilityDetailsRecord[]> {
    return PrismaClientGetway().availability.findMany({
      where: { mentorId },
      orderBy: [{ isRecurring: "desc" }, { dayOfWeek: "asc" }],
    });
  }

  async findRecurringForMentor(
    mentorId: string,
    dayOfWeek?: number,
  ): Promise<AvailabilityDetailsRecord[]> {
    return PrismaClientGetway().availability.findMany({
      where: {
        mentorId,
        isRecurring: true,
        ...(dayOfWeek !== undefined ? { dayOfWeek } : {}),
      },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  async findSpecificDateForMentor(
    mentorId: string,
    date?: Date,
  ): Promise<AvailabilityDetailsRecord[]> {
    if (!date) {
      return PrismaClientGetway().availability.findMany({
        where: {
          mentorId,
          isRecurring: false,
        },
        orderBy: { specificDate: "asc" },
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return PrismaClientGetway().availability.findMany({
      where: {
        mentorId,
        isRecurring: false,
        specificDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { specificDate: "asc" },
    });
  }

  async update(
    id: string,
    data: Prisma.AvailabilityUpdateInput,
  ): Promise<AvailabilityDetailsRecord> {
    return PrismaClientGetway().availability.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await PrismaClientGetway().availability.delete({
      where: { id },
    });
  }

  private toAvailabilityWithMentor(
    availability: AvailabilityWithMentor,
  ): AvailabilityDetailsRecord {
    return {
      id: availability.id,
      mentorId: availability.mentorId,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isRecurring: availability.isRecurring,
      specificDate: availability.specificDate,
      createdAt: availability.createdAt,
      updatedAt: availability.updatedAt,
      mentor: {
        user: {
          firstName: availability.mentor.user.firstName,
          lastName: availability.mentor.user.lastName,
        },
      },
    };
  }
}
