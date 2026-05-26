import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
	mentorProfile: {
		findUnique: vi.fn(),
	},
	user: {
		findUnique: vi.fn(),
	},
	$transaction: vi.fn(),
}));

vi.mock("../../prisma/client", () => ({
	prisma: prismaMock,
}));

import { bookingService } from "./bookingService";

describe("bookingService.createBooking", () => {
	const txMock = {
		timeSlot: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			updateMany: vi.fn(),
		},
		booking: {
			create: vi.fn(),
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();

		prismaMock.mentorProfile.findUnique.mockResolvedValue({
			id: "mentor-1",
			hourlyRate: {
				toNumber: () => 120,
			},
			currency: "USD",
		});

		prismaMock.user.findUnique.mockResolvedValue({ id: "mentee-1" });

		prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => unknown) => cb(txMock));

		txMock.timeSlot.updateMany.mockResolvedValue({ count: 1 });
		txMock.booking.create.mockResolvedValue({
			id: "booking-1",
			mentorId: "mentor-1",
			menteeId: "mentee-1",
			timeSlotId: "slot-1",
			status: "PENDING",
		});
	});

	it("creates booking when timeSlotId is provided", async () => {
		txMock.timeSlot.findUnique.mockResolvedValue({
			id: "slot-1",
			mentorId: "mentor-1",
			startTime: new Date("2026-05-01T10:00:00.000Z"),
			endTime: new Date("2026-05-01T11:00:00.000Z"),
		});

		const result = await bookingService.createBooking({
			menteeId: "mentee-1",
			mentorId: "mentor-1",
			timeSlotId: "slot-1",
			notes: "Looking forward",
		});

		expect(result.id).toBe("booking-1");
		expect(txMock.timeSlot.findUnique).toHaveBeenCalledWith({
			where: { id: "slot-1" },
		});
		expect(txMock.timeSlot.updateMany).toHaveBeenCalledWith({
			where: { id: "slot-1", status: "AVAILABLE" },
			data: { status: "BOOKED" },
		});
	});

	it("creates booking when startTime/endTime are provided", async () => {
		const startTime = new Date("2026-05-02T08:00:00.000Z");
		const endTime = new Date("2026-05-02T09:00:00.000Z");

		txMock.timeSlot.findFirst.mockResolvedValue({
			id: "slot-2",
			mentorId: "mentor-1",
			startTime,
			endTime,
		});

		await bookingService.createBooking({
			menteeId: "mentee-1",
			mentorId: "mentor-1",
			startTime,
			endTime,
		});

		expect(txMock.timeSlot.findFirst).toHaveBeenCalledWith({
			where: {
				mentorId: "mentor-1",
				startTime,
				endTime,
			},
		});
		expect(txMock.timeSlot.updateMany).toHaveBeenCalledWith({
			where: { id: "slot-2", status: "AVAILABLE" },
			data: { status: "BOOKED" },
		});
		expect(txMock.booking.create).toHaveBeenCalled();
	});

	it("rejects when concurrent claim fails", async () => {
		txMock.timeSlot.findUnique.mockResolvedValue({
			id: "slot-3",
			mentorId: "mentor-1",
			startTime: new Date("2026-05-03T08:00:00.000Z"),
			endTime: new Date("2026-05-03T09:00:00.000Z"),
		});

		txMock.timeSlot.updateMany.mockResolvedValue({ count: 0 });

		await expect(
			bookingService.createBooking({
				menteeId: "mentee-1",
				mentorId: "mentor-1",
				timeSlotId: "slot-3",
			}),
		).rejects.toThrow("Time slot is not available");

		expect(txMock.booking.create).not.toHaveBeenCalled();
	});
});
