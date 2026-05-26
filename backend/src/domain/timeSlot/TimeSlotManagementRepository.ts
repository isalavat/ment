import type { SlotStatus } from "@prisma/client";

export type TimeSlotDetailsRecord = {
	id: string;
	mentorId: string;
	startTime: Date;
	endTime: Date;
	status: SlotStatus;
	booking?: {
		mentee: {
			firstName: string;
			lastName: string;
			email: string;
			avatarUrl?: string | null;
		};
	};
};

export interface TimeSlotManagementRepository {
	findAvailableForMentor(mentorId: string, startDate?: Date, endDate?: Date): Promise<TimeSlotDetailsRecord[]>;
	findAllForMentor(
		mentorId: string,
		startDate?: Date,
		endDate?: Date,
		status?: SlotStatus,
	): Promise<TimeSlotDetailsRecord[]>;
	findById(slotId: string): Promise<TimeSlotDetailsRecord | null>;
	updateStatus(slotId: string, status: SlotStatus): Promise<TimeSlotDetailsRecord>;
	delete(slotId: string): Promise<void>;
	deleteAvailableForMentorInRange(mentorId: string, startDate: Date, endDate: Date): Promise<{ count: number }>;
}
