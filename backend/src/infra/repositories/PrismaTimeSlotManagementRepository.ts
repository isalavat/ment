import type { SlotStatus } from "@prisma/client";
import type {
	TimeSlotDetailsRecord,
	TimeSlotManagementRepository,
} from "../../domain/timeSlot/TimeSlotManagementRepository";
import { PrismaClientGetway } from "../PrismaClientGetway";

type SlotWithInclude =
	Awaited<ReturnType<typeof PrismaClientGetway>> extends infer _
		? {
				id: string;
				mentorId: string;
				startTime: Date;
				endTime: Date;
				status: SlotStatus;
				booking: {
					mentee: {
						firstName: string;
						lastName: string;
						email: string;
						avatarUrl: string | null;
					};
				} | null;
			}
		: never;

const slotInclude = {
	booking: {
		include: {
			mentee: {
				select: {
					firstName: true,
					lastName: true,
					email: true,
					avatarUrl: true,
				},
			},
		},
	},
} as const;

export class PrismaTimeSlotManagementRepository implements TimeSlotManagementRepository {
	async findAvailableForMentor(mentorId: string, startDate?: Date, endDate?: Date): Promise<TimeSlotDetailsRecord[]> {
		const slots = await PrismaClientGetway().timeSlot.findMany({
			where: {
				mentorId,
				status: "AVAILABLE",
				...(startDate || endDate
					? {
							startTime: {
								...(startDate ? { gte: startDate } : {}),
								...(endDate ? { lte: endDate } : {}),
							},
						}
					: {}),
			},
			orderBy: { startTime: "asc" },
			include: slotInclude,
		});

		return slots.map((slot) => this.toTimeSlotDetailsRecord(slot));
	}

	async findAllForMentor(
		mentorId: string,
		startDate?: Date,
		endDate?: Date,
		status?: SlotStatus,
	): Promise<TimeSlotDetailsRecord[]> {
		const slots = await PrismaClientGetway().timeSlot.findMany({
			where: {
				mentorId,
				...(status ? { status } : {}),
				...(startDate || endDate
					? {
							startTime: {
								...(startDate ? { gte: startDate } : {}),
								...(endDate ? { lte: endDate } : {}),
							},
						}
					: {}),
			},
			include: slotInclude,
			orderBy: { startTime: "asc" },
		});

		return slots.map((slot) => this.toTimeSlotDetailsRecord(slot));
	}

	async findById(slotId: string): Promise<TimeSlotDetailsRecord | null> {
		const slot = await PrismaClientGetway().timeSlot.findUnique({
			where: { id: slotId },
			include: slotInclude,
		});

		return slot ? this.toTimeSlotDetailsRecord(slot) : null;
	}

	async updateStatus(slotId: string, status: SlotStatus): Promise<TimeSlotDetailsRecord> {
		const slot = await PrismaClientGetway().timeSlot.update({
			where: { id: slotId },
			data: { status },
			include: slotInclude,
		});

		return this.toTimeSlotDetailsRecord(slot);
	}

	async delete(slotId: string): Promise<void> {
		await PrismaClientGetway().timeSlot.delete({
			where: { id: slotId },
		});
	}

	async deleteAvailableForMentorInRange(mentorId: string, startDate: Date, endDate: Date): Promise<{ count: number }> {
		const result = await PrismaClientGetway().timeSlot.deleteMany({
			where: {
				mentorId,
				status: "AVAILABLE",
				startTime: {
					gte: startDate,
					lte: endDate,
				},
			},
		});

		return { count: result.count };
	}

	private toTimeSlotDetailsRecord(slot: SlotWithInclude): TimeSlotDetailsRecord {
		return {
			id: slot.id,
			mentorId: slot.mentorId,
			startTime: slot.startTime,
			endTime: slot.endTime,
			status: slot.status,
			booking: slot.booking
				? {
						mentee: {
							firstName: slot.booking.mentee.firstName,
							lastName: slot.booking.mentee.lastName,
							email: slot.booking.mentee.email,
							avatarUrl: slot.booking.mentee.avatarUrl,
						},
					}
				: undefined,
		};
	}
}
