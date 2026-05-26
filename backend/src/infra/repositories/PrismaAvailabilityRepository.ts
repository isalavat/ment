import type { AvailabilityRecord, AvailabilityRepository } from "../../domain/availability/AvailabilityRepository";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class PrismaAvailabilityRepository implements AvailabilityRepository {
	async findForMentorInRange(mentorId: string, startDate: Date, endDate: Date): Promise<AvailabilityRecord[]> {
		return PrismaClientGetway().availability.findMany({
			where: {
				mentorId,
				OR: [
					{ isRecurring: true },
					{
						isRecurring: false,
						specificDate: {
							gte: startDate,
							lte: endDate,
						},
					},
				],
			},
		});
	}
}
