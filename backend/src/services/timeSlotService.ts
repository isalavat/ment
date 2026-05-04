import { BookingStatus, type Prisma, SlotStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";

interface GenerateTimeSlotsOptions {
	mentorId: string;
	startDate: Date;
	endDate: Date;
	slotDuration?: number; // in minutes, default 60
}

interface ComputedBookableOptions {
	mentorId: string;
	startDate: Date;
	endDate: Date;
	stepMinutes?: number;
	durationMinutes?: number;
}

export const timeSlotService = {
	/**
	 * Generate time slots from availability for a date range
	 */
	async generateTimeSlots(options: GenerateTimeSlotsOptions) {
		const { mentorId, startDate, endDate, slotDuration = 60 } = options;

		// Validate dates
		if (startDate >= endDate) {
			throw new Error("Start date must be before end date");
		}

		// Get all availabilities for the mentor
		const availabilities = await prisma.availability.findMany({
			where: { mentorId },
		});

		if (availabilities.length === 0) {
			return { count: 0, message: "No availabilities found for this mentor" };
		}

		const slotsToCreate: Array<{
			mentorId: string;
			startTime: Date;
			endTime: Date;
			status: SlotStatus;
		}> = [];

		// Iterate through each day in the range
		const currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			const dayOfWeek = currentDate.getDay();

			// Check for specific date availability first
			const specificAvailability = availabilities.find(
				(avail) =>
					!avail.isRecurring && avail.specificDate && avail.specificDate.toDateString() === currentDate.toDateString(),
			);

			if (specificAvailability) {
				// Use specific date availability
				const slots = this.generateSlotsForDay(
					currentDate,
					specificAvailability.startTime,
					specificAvailability.endTime,
					mentorId,
					slotDuration,
				);
				slotsToCreate.push(...slots);
			} else {
				// Use recurring availability
				const recurringAvailabilities = availabilities.filter(
					(avail) => avail.isRecurring && avail.dayOfWeek === dayOfWeek,
				);

				for (const availability of recurringAvailabilities) {
					const slots = this.generateSlotsForDay(
						currentDate,
						availability.startTime,
						availability.endTime,
						mentorId,
						slotDuration,
					);
					slotsToCreate.push(...slots);
				}
			}

			// Move to next day
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Remove slots that already exist or overlap with existing bookings
		const existingSlots = await prisma.timeSlot.findMany({
			where: {
				mentorId,
				startTime: {
					gte: startDate,
					lte: endDate,
				},
			},
		});

		// Filter out slots that already exist
		const newSlots = slotsToCreate.filter((newSlot) => {
			return !existingSlots.some((existing) => existing.startTime.getTime() === newSlot.startTime.getTime());
		});

		if (newSlots.length === 0) {
			return { count: 0, message: "No new slots to create" };
		}

		// Create slots in database
		const result = await prisma.timeSlot.createMany({
			data: newSlots,
			skipDuplicates: true,
		});

		return {
			count: result.count,
			message: `Created ${result.count} time slots`,
		};
	},

	/**
	 * Helper function to generate slots for a specific day
	 */
	generateSlotsForDay(
		date: Date,
		startTimeStr: string,
		endTimeStr: string,
		mentorId: string,
		slotDuration: number,
	): Array<{
		mentorId: string;
		startTime: Date;
		endTime: Date;
		status: SlotStatus;
	}> {
		const slots: Array<{
			mentorId: string;
			startTime: Date;
			endTime: Date;
			status: SlotStatus;
		}> = [];

		// Parse start and end times
		const [startHour, startMin] = startTimeStr.split(":").map(Number);
		const [endHour, endMin] = endTimeStr.split(":").map(Number);

		// Create start and end DateTime objects
		const slotStart = new Date(date);
		slotStart.setHours(startHour, startMin, 0, 0);

		const dayEnd = new Date(date);
		dayEnd.setHours(endHour, endMin, 0, 0);

		// Generate slots
		while (slotStart < dayEnd) {
			const slotEnd = new Date(slotStart);
			slotEnd.setMinutes(slotStart.getMinutes() + slotDuration);

			// Don't create slot if it extends beyond the availability end time
			if (slotEnd <= dayEnd) {
				slots.push({
					mentorId,
					startTime: new Date(slotStart),
					endTime: new Date(slotEnd),
					status: SlotStatus.AVAILABLE,
				});
			}

			// Move to next slot
			slotStart.setMinutes(slotStart.getMinutes() + slotDuration);
		}

		return slots;
	},

	/**
	 * Compute bookable slots directly from availability rules and current conflicts.
	 */
	async getComputedBookableSlots(options: ComputedBookableOptions) {
		const { mentorId, startDate, endDate, stepMinutes = 15, durationMinutes = 60 } = options;

		if (startDate >= endDate) {
			throw new Error("Start date must be before end date");
		}

		if (stepMinutes <= 0 || durationMinutes <= 0) {
			throw new Error("stepMinutes and durationMinutes must be positive");
		}

		const availabilities = await prisma.availability.findMany({
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

		if (availabilities.length === 0) {
			return [];
		}

		const [blockedTimeSlots, activeBookings] = await Promise.all([
			prisma.timeSlot.findMany({
				where: {
					mentorId,
					status: { in: [SlotStatus.BOOKED, SlotStatus.UNAVAILABLE] },
					startTime: { lt: endDate },
					endTime: { gt: startDate },
				},
				select: {
					startTime: true,
					endTime: true,
				},
			}),
			prisma.booking.findMany({
				where: {
					mentorId,
					status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
					timeSlot: {
						startTime: { lt: endDate },
						endTime: { gt: startDate },
					},
				},
				select: {
					timeSlot: {
						select: {
							startTime: true,
							endTime: true,
						},
					},
				},
			}),
		]);

		const blockedIntervals = [
			...blockedTimeSlots.map((slot) => ({
				startTime: slot.startTime,
				endTime: slot.endTime,
			})),
			...activeBookings.map((booking) => ({
				startTime: booking.timeSlot.startTime,
				endTime: booking.timeSlot.endTime,
			})),
		];

		const results: Array<{
			id: string;
			mentorId: string;
			startTime: Date;
			endTime: Date;
			status: SlotStatus;
		}> = [];
		const dedupe = new Set<string>();

		const cursorDay = new Date(startDate);
		cursorDay.setHours(0, 0, 0, 0);
		const endDay = new Date(endDate);
		endDay.setHours(0, 0, 0, 0);

		while (cursorDay <= endDay) {
			const dayOfWeek = cursorDay.getDay();
			const dayKey = cursorDay.toDateString();

			const dayAvailabilities = availabilities.filter((availability) => {
				if (availability.isRecurring) {
					return availability.dayOfWeek === dayOfWeek;
				}

				return availability.specificDate?.toDateString() === dayKey;
			});

			for (const availability of dayAvailabilities) {
				const [startHour, startMinute] = availability.startTime.split(":").map(Number);
				const [endHour, endMinute] = availability.endTime.split(":").map(Number);

				const windowStart = new Date(cursorDay);
				windowStart.setHours(startHour, startMinute, 0, 0);

				const windowEnd = new Date(cursorDay);
				windowEnd.setHours(endHour, endMinute, 0, 0);

				for (
					let slotStartMs = windowStart.getTime();
					slotStartMs + durationMinutes * 60_000 <= windowEnd.getTime();
					slotStartMs += stepMinutes * 60_000
				) {
					const slotStart = new Date(slotStartMs);
					const slotEnd = new Date(slotStartMs + durationMinutes * 60_000);

					if (slotStart < startDate || slotEnd > endDate) {
						continue;
					}

					const hasOverlap = blockedIntervals.some(
						(interval) => interval.startTime < slotEnd && interval.endTime > slotStart,
					);

					if (hasOverlap) {
						continue;
					}

					const key = `${slotStart.toISOString()}|${slotEnd.toISOString()}`;
					if (dedupe.has(key)) {
						continue;
					}
					dedupe.add(key);

					results.push({
						id: `computed-${mentorId}-${slotStart.toISOString()}-${durationMinutes}`,
						mentorId,
						startTime: slotStart,
						endTime: slotEnd,
						status: SlotStatus.AVAILABLE,
					});
				}
			}

			cursorDay.setDate(cursorDay.getDate() + 1);
		}

		return results.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
	},

	/**
	 * Get available time slots for a mentor
	 */
	async getAvailableSlots(mentorId: string, startDate?: Date, endDate?: Date) {
		const where: Prisma.TimeSlotWhereInput = {
			mentorId,
			status: SlotStatus.AVAILABLE,
		};

		if (startDate || endDate) {
			where.startTime = {};
			if (startDate) {
				where.startTime.gte = startDate;
			}
			if (endDate) {
				where.startTime.lte = endDate;
			}
		}

		return prisma.timeSlot.findMany({
			where,
			orderBy: { startTime: "asc" },
		});
	},

	/**
	 * Get all time slots for a mentor (any status)
	 */
	async getAllSlotsForMentor(mentorId: string, startDate?: Date, endDate?: Date, status?: SlotStatus) {
		const where: Prisma.TimeSlotWhereInput = { mentorId };

		if (status) {
			where.status = status;
		}

		if (startDate || endDate) {
			where.startTime = {};
			if (startDate) {
				where.startTime.gte = startDate;
			}
			if (endDate) {
				where.startTime.lte = endDate;
			}
		}

		return prisma.timeSlot.findMany({
			where,
			include: {
				booking: {
					include: {
						mentee: {
							select: {
								firstName: true,
								lastName: true,
								email: true,
							},
						},
					},
				},
			},
			orderBy: { startTime: "asc" },
		});
	},

	/**
	 * Update time slot status
	 */
	async updateSlotStatus(slotId: string, status: SlotStatus, mentorId: string) {
		const slot = await prisma.timeSlot.findUnique({
			where: { id: slotId },
			include: { booking: true },
		});

		if (!slot) {
			throw new Error("Time slot not found");
		}

		if (slot.mentorId !== mentorId) {
			throw new Error("Not authorized to update this time slot");
		}

		// Cannot change status if slot is booked
		if (slot.booking && status !== SlotStatus.BOOKED) {
			throw new Error("Cannot change status of a booked slot");
		}

		return prisma.timeSlot.update({
			where: { id: slotId },
			data: { status },
		});
	},

	/**
	 * Delete a time slot (only if not booked)
	 */
	async deleteSlot(slotId: string, mentorId: string) {
		const slot = await prisma.timeSlot.findUnique({
			where: { id: slotId },
			include: { booking: true },
		});

		if (!slot) {
			throw new Error("Time slot not found");
		}

		if (slot.mentorId !== mentorId) {
			throw new Error("Not authorized to delete this time slot");
		}

		if (slot.booking) {
			throw new Error("Cannot delete a booked time slot");
		}

		await prisma.timeSlot.delete({
			where: { id: slotId },
		});

		return { success: true, message: "Time slot deleted" };
	},

	/**
	 * Bulk delete time slots for a mentor (only available ones)
	 */
	async bulkDeleteSlots(mentorId: string, startDate: Date, endDate: Date) {
		const result = await prisma.timeSlot.deleteMany({
			where: {
				mentorId,
				status: SlotStatus.AVAILABLE,
				startTime: {
					gte: startDate,
					lte: endDate,
				},
			},
		});

		return {
			count: result.count,
			message: `Deleted ${result.count} available time slots`,
		};
	},

	/**
	 * Get time slot by ID
	 */
	async getSlotById(slotId: string) {
		const slot = await prisma.timeSlot.findUnique({
			where: { id: slotId },
			include: {
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
			},
		});

		if (!slot) {
			throw new Error("Time slot not found");
		}

		return slot;
	},
};
