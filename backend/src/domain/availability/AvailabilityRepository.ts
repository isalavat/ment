export type AvailabilityRecord = {
	isRecurring: boolean;
	dayOfWeek: number | null;
	specificDate: Date | null;
	startTime: string;
	endTime: string;
};

export interface AvailabilityRepository {
	findForMentorInRange(mentorId: string, startDate: Date, endDate: Date): Promise<AvailabilityRecord[]>;
}
