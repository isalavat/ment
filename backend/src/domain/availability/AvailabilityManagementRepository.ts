import type { Prisma } from "@prisma/client";

export type AvailabilityDetailsRecord = {
  id: string;
  mentorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  mentor?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
};

export type CreateAvailabilityRecord = {
  mentorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: Date;
};

export type CreateWeeklyAvailabilityRecord = {
  mentorId: string;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
};

export interface AvailabilityManagementRepository {
  create(data: CreateAvailabilityRecord): Promise<AvailabilityDetailsRecord>;
  createWeekly(
    data: CreateWeeklyAvailabilityRecord,
  ): Promise<{ count: number }>;
  findById(id: string): Promise<AvailabilityDetailsRecord | null>;
  findByIdWithMentor(id: string): Promise<AvailabilityDetailsRecord | null>;
  findForMentor(mentorId: string): Promise<AvailabilityDetailsRecord[]>;
  findRecurringForMentor(
    mentorId: string,
    dayOfWeek?: number,
  ): Promise<AvailabilityDetailsRecord[]>;
  findSpecificDateForMentor(
    mentorId: string,
    date?: Date,
  ): Promise<AvailabilityDetailsRecord[]>;
  update(
    id: string,
    data: Prisma.AvailabilityUpdateInput,
  ): Promise<AvailabilityDetailsRecord>;
  delete(id: string): Promise<void>;
}
