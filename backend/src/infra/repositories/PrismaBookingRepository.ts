import { BookingStatus, Prisma } from "@prisma/client";
import type { BookingCreatedRecord, BookingRepository } from "../../domain/booking/BookingRepository";
import { PrismaClientGetway } from "../PrismaClientGetway";

const bookingInclude = {
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
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			avatarUrl: true,
		},
	},
	timeSlot: true,
	review: true,
} as const;

type BookingWithRelations = Prisma.BookingGetPayload<{
	include: typeof bookingInclude;
}>;

export class PrismaBookingRepository implements BookingRepository {
	async findById(bookingId: string): Promise<BookingCreatedRecord | null> {
		const booking = await PrismaClientGetway().booking.findUnique({
			where: { id: bookingId },
			include: bookingInclude,
		});

		return booking ? this.toBookingCreatedRecord(booking) : null;
	}

	async findForMentee(
		menteeId: string,
		filters?: { status?: BookingStatus; startDate?: Date; endDate?: Date },
	): Promise<BookingCreatedRecord[]> {
		const bookings = await PrismaClientGetway().booking.findMany({
			where: {
				menteeId,
				...(filters?.status ? { status: filters.status } : {}),
				...(filters?.startDate || filters?.endDate
					? {
							timeSlot: {
								...(filters.startDate ? { startTime: { gte: filters.startDate } } : {}),
								...(filters.endDate ? { endTime: { lte: filters.endDate } } : {}),
							},
						}
					: {}),
			},
			include: bookingInclude,
			orderBy: { createdAt: "desc" },
		});

		return bookings.map((booking) => this.toBookingCreatedRecord(booking));
	}

	async findForMentor(
		mentorId: string,
		filters?: { status?: BookingStatus; startDate?: Date; endDate?: Date },
	): Promise<BookingCreatedRecord[]> {
		const bookings = await PrismaClientGetway().booking.findMany({
			where: {
				mentorId,
				...(filters?.status ? { status: filters.status } : {}),
				...(filters?.startDate || filters?.endDate
					? {
							timeSlot: {
								...(filters.startDate ? { startTime: { gte: filters.startDate } } : {}),
								...(filters.endDate ? { endTime: { lte: filters.endDate } } : {}),
							},
						}
					: {}),
			},
			include: bookingInclude,
			orderBy: { createdAt: "desc" },
		});

		return bookings.map((booking) => this.toBookingCreatedRecord(booking));
	}

	async findActiveOverlap(mentorId: string, startTime: Date, endTime: Date): Promise<{ id: string } | null> {
		return PrismaClientGetway().booking.findFirst({
			where: {
				mentorId,
				status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
				timeSlot: {
					startTime: { lt: endTime },
					endTime: { gt: startTime },
				},
			},
			select: { id: true },
		});
	}

	async create(input: {
		mentorId: string;
		menteeId: string;
		timeSlotId: string;
		notes?: string;
		hourlyRate: number;
		duration: number;
		totalAmount: number;
		currency: string;
		status: BookingStatus;
	}): Promise<BookingCreatedRecord> {
		const booking = await PrismaClientGetway().booking.create({
			data: {
				mentorId: input.mentorId,
				menteeId: input.menteeId,
				timeSlotId: input.timeSlotId,
				notes: input.notes,
				status: input.status,
				hourlyRate: new Prisma.Decimal(input.hourlyRate),
				duration: input.duration,
				totalAmount: new Prisma.Decimal(input.totalAmount),
				currency: input.currency,
			},
			include: bookingInclude,
		});

		return this.toBookingCreatedRecord(booking);
	}

	async updateStatus(
		bookingId: string,
		status: BookingStatus,
		timestampField?: "confirmedAt" | "completedAt" | "cancelledAt",
	): Promise<BookingCreatedRecord> {
		const booking = await PrismaClientGetway().booking.update({
			where: { id: bookingId },
			data: {
				status,
				...(timestampField ? { [timestampField]: new Date() } : {}),
			},
			include: bookingInclude,
		});

		return this.toBookingCreatedRecord(booking);
	}

	async updateMeetingLink(bookingId: string, meetingLink: string): Promise<BookingCreatedRecord> {
		const booking = await PrismaClientGetway().booking.update({
			where: { id: bookingId },
			data: { meetingLink },
			include: bookingInclude,
		});

		return this.toBookingCreatedRecord(booking);
	}

	private toBookingCreatedRecord(booking: BookingWithRelations): BookingCreatedRecord {
		return {
			id: booking.id,
			mentorId: booking.mentorId,
			menteeId: booking.menteeId,
			timeSlotId: booking.timeSlotId,
			notes: booking.notes,
			status: booking.status,
			hourlyRate: booking.hourlyRate.toNumber(),
			duration: booking.duration,
			totalAmount: booking.totalAmount.toNumber(),
			currency: booking.currency,
			meetingLink: booking.meetingLink,
			createdAt: booking.createdAt,
			updatedAt: booking.updatedAt,
			confirmedAt: booking.confirmedAt,
			completedAt: booking.completedAt,
			cancelledAt: booking.cancelledAt,
			mentor: {
				id: booking.mentor.id,
				title: booking.mentor.title,
				user: {
					firstName: booking.mentor.user.firstName,
					lastName: booking.mentor.user.lastName,
					email: booking.mentor.user.email,
					avatarUrl: booking.mentor.user.avatarUrl ?? null,
				},
			},
			mentee: {
				id: booking.mentee.id,
				firstName: booking.mentee.firstName,
				lastName: booking.mentee.lastName,
				email: booking.mentee.email,
				avatarUrl: booking.mentee.avatarUrl ?? null,
			},
			timeSlot: {
				id: booking.timeSlot.id,
				mentorId: booking.timeSlot.mentorId,
				startTime: booking.timeSlot.startTime,
				endTime: booking.timeSlot.endTime,
				status: booking.timeSlot.status,
			},
			review: booking.review
				? {
						id: booking.review.id,
						rating: booking.review.rating,
						comment: booking.review.comment,
					}
				: undefined,
		};
	}
}
