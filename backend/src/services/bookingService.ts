import { BookingStatus, type Prisma, SlotStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { BadRequestError, ConflictError } from "../lib/error";

interface CreateBookingData {
	menteeId: string;
	mentorId: string;
	timeSlotId?: string;
	startTime?: Date;
	endTime?: Date;
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
		const { menteeId, mentorId, timeSlotId, startTime, endTime, notes } = data;

		if (!timeSlotId && (!startTime || !endTime)) {
			throw new BadRequestError("Either timeSlotId or startTime/endTime is required");
		}

		if (startTime && endTime && startTime >= endTime) {
			throw new BadRequestError("startTime must be before endTime");
		}

		// Get mentor profile for pricing
		const mentorProfile = await prisma.mentorProfile.findUnique({
			where: { id: mentorId },
		});

		if (!mentorProfile) {
			throw new BadRequestError("Mentor profile not found");
		}

		// Verify the user exists
		const menteeUser = await prisma.user.findUnique({
			where: { id: menteeId },
		});
		if (!menteeUser) throw new BadRequestError("User not found");

		// Create booking and update slot status in a transaction
		const booking = await prisma.$transaction(async (tx) => {
			let timeSlot = timeSlotId
				? await tx.timeSlot.findUnique({
						where: { id: timeSlotId },
					})
				: await tx.timeSlot.findFirst({
						where: {
							mentorId,
							startTime: startTime as Date,
							endTime: endTime as Date,
						},
					});

			if (!timeSlot && startTime && endTime) {
				const dayStart = new Date(startTime);
				dayStart.setHours(0, 0, 0, 0);
				const dayEnd = new Date(dayStart);
				dayEnd.setDate(dayEnd.getDate() + 1);

				const availabilities = await tx.availability.findMany({
					where: {
						mentorId,
						OR: [
							{ isRecurring: true, dayOfWeek: startTime.getDay() },
							{
								isRecurring: false,
								specificDate: {
									gte: dayStart,
									lt: dayEnd,
								},
							},
						],
					},
				});

				const requestedDay = startTime.toDateString();
				const withinAvailability = availabilities.some((availability) => {
					if (!availability.isRecurring && availability.specificDate?.toDateString() !== requestedDay) {
						return false;
					}

					const [startHour, startMinute] = availability.startTime.split(":").map(Number);
					const [endHour, endMinute] = availability.endTime.split(":").map(Number);

					const windowStart = new Date(startTime);
					windowStart.setHours(startHour, startMinute, 0, 0);

					const windowEnd = new Date(startTime);
					windowEnd.setHours(endHour, endMinute, 0, 0);

					return startTime >= windowStart && endTime <= windowEnd;
				});

				if (!withinAvailability) {
					throw new BadRequestError("Selected time is outside mentor availability");
				}

				const [blockedSlot, activeBooking] = await Promise.all([
					tx.timeSlot.findFirst({
						where: {
							mentorId,
							status: { in: [SlotStatus.BOOKED, SlotStatus.UNAVAILABLE] },
							startTime: { lt: endTime },
							endTime: { gt: startTime },
						},
						select: { id: true },
					}),
					tx.booking.findFirst({
						where: {
							mentorId,
							status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
							timeSlot: {
								startTime: { lt: endTime },
								endTime: { gt: startTime },
							},
						},
						select: { id: true },
					}),
				]);

				if (blockedSlot || activeBooking) {
					throw new ConflictError("Time slot is not available");
				}

				timeSlot = await tx.timeSlot.create({
					data: {
						mentorId,
						startTime,
						endTime,
						status: SlotStatus.AVAILABLE,
					},
				});
			}

			if (!timeSlot) {
				throw new BadRequestError("Time slot not found");
			}

			if (timeSlot.mentorId !== mentorId) {
				throw new BadRequestError("Time slot does not belong to this mentor");
			}

			const claimedSlot = await tx.timeSlot.updateMany({
				where: {
					id: timeSlot.id,
					status: SlotStatus.AVAILABLE,
				},
				data: { status: SlotStatus.BOOKED },
			});

			if (claimedSlot.count !== 1) {
				throw new ConflictError("Time slot is not available");
			}

			const duration = Math.round((timeSlot.endTime.getTime() - timeSlot.startTime.getTime()) / (1000 * 60));
			const totalAmount = mentorProfile.hourlyRate.toNumber() * (duration / 60);

			// Create booking
			return tx.booking.create({
				data: {
					mentorId,
					menteeId,
					timeSlotId: timeSlot.id,
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
						select: {
							firstName: true,
							lastName: true,
							email: true,
							avatarUrl: true,
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
	async confirmBooking(bookingId: string, mentorId: string) {
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
					select: {
						firstName: true,
						lastName: true,
						email: true,
						avatarUrl: true,
					},
				},
				timeSlot: true,
			},
		});
	},

	/**
	 * Cancel booking by mentee
	 */
	async cancelBookingByMentee(bookingId: string, menteeId: string) {
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
			booking.status === BookingStatus.CANCELLED_BY_USER ||
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
					status: BookingStatus.CANCELLED_BY_USER,
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
						select: {
							firstName: true,
							lastName: true,
							email: true,
							avatarUrl: true,
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
	async cancelBookingByMentor(bookingId: string, mentorId: string) {
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
			booking.status === BookingStatus.CANCELLED_BY_USER ||
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
						select: {
							firstName: true,
							lastName: true,
							email: true,
							avatarUrl: true,
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
	async completeBooking(bookingId: string) {
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
					select: {
						firstName: true,
						lastName: true,
						email: true,
						avatarUrl: true,
					},
				},
				timeSlot: true,
			},
		});
	},

	/**
	 * Get bookings for a mentee
	 */
	async getBookingsForMentee(menteeId: string, filters?: BookingFilters) {
		const where: Prisma.BookingWhereInput = { menteeId };

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
	async getBookingsForMentor(mentorId: string, filters?: BookingFilters) {
		const where: Prisma.BookingWhereInput = { mentorId };

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
					select: {
						firstName: true,
						lastName: true,
						email: true,
						avatarUrl: true,
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
	async getBookingById(bookingId: string) {
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
					select: {
						firstName: true,
						lastName: true,
						email: true,
						avatarUrl: true,
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
	async updateMeetingLink(bookingId: string, mentorId: string, meetingLink: string) {
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
					select: {
						firstName: true,
						lastName: true,
						email: true,
						avatarUrl: true,
					},
				},
				timeSlot: true,
			},
		});
	},
};
