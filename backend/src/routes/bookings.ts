import type { BookingStatus } from "@prisma/client";
import { type NextFunction, type Request, type Response, Router } from "express";
import { requireAuth } from "../middleware/auth";
import { bookingService } from "../services/bookingService";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /bookings - Create a new booking (mentee only)
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { menteeId, mentorId, timeSlotId, notes } = req.body;

		// Verify the mentee profile belongs to the authenticated user
		// TODO: Add proper authorization check

		if (!mentorId || !timeSlotId) {
			return res.status(400).json({
				error: "mentorId and timeSlotId are required",
			});
		}

		const booking = await bookingService.createBooking({
			menteeId,
			mentorId,
			timeSlotId,
			notes,
		});

		res.status(201).json(booking);
	} catch (error) {
		next(error);
	}
});

/**
 * GET /bookings/mentee/:menteeId - Get all bookings for a mentee
 */
router.get("/mentee/:menteeId", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const menteeId = req.params.menteeId;
		const status = req.query.status as BookingStatus | undefined;
		const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
		const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

		// TODO: Add authorization check - user should only access their own bookings

		const bookings = await bookingService.getBookingsForMentee(menteeId, {
			status,
			startDate,
			endDate,
		});

		res.json(bookings);
	} catch (error) {
		next(error);
	}
});

/**
 * GET /bookings/mentor/:mentorId - Get all bookings for a mentor
 */
router.get("/mentor/:mentorId", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const mentorId = req.params.mentorId;
		const status = req.query.status as BookingStatus | undefined;
		const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
		const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

		// TODO: Add authorization check - user should only access their own bookings

		const bookings = await bookingService.getBookingsForMentor(mentorId, {
			status,
			startDate,
			endDate,
		});

		res.json(bookings);
	} catch (error) {
		next(error);
	}
});

/**
 * GET /bookings/:id - Get a single booking by ID
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const bookingId = req.params.id;

		// TODO: Add authorization check - only mentee or mentor involved should access

		const booking = await bookingService.getBookingById(bookingId);
		res.json(booking);
	} catch (error) {
		next(error);
	}
});

/**
 * PATCH /bookings/:id/confirm - Confirm a booking (mentor only)
 */
router.patch("/:id/confirm", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const bookingId = req.params.id;
		const { mentorId } = req.body;

		// TODO: Add proper authorization check

		const booking = await bookingService.confirmBooking(bookingId, mentorId);
		res.json(booking);
	} catch (error) {
		next(error);
	}
});

/**
 * PATCH /bookings/:id/cancel-mentee - Cancel booking by mentee
 */
router.patch("/:id/cancel-mentee", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const bookingId = req.params.id;
		const { menteeId } = req.body;

		// TODO: Add proper authorization check

		const booking = await bookingService.cancelBookingByMentee(bookingId, menteeId);
		res.json(booking);
	} catch (error) {
		next(error);
	}
});

/**
 * PATCH /bookings/:id/cancel-mentor - Cancel booking by mentor
 */
router.patch("/:id/cancel-mentor", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const bookingId = req.params.id;
		const { mentorId } = req.body;

		// TODO: Add proper authorization check

		const booking = await bookingService.cancelBookingByMentor(bookingId, mentorId);
		res.json(booking);
	} catch (error) {
		next(error);
	}
});

/**
 * PATCH /bookings/:id/complete - Mark booking as completed
 */
router.patch("/:id/complete", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const bookingId = req.params.id;

		// TODO: Add proper authorization check - should be after session time has passed

		const booking = await bookingService.completeBooking(bookingId);
		res.json(booking);
	} catch (error) {
		next(error);
	}
});

/**
 * PATCH /bookings/:id/meeting-link - Update meeting link (mentor only)
 */
router.patch("/:id/meeting-link", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const bookingId = req.params.id;
		const { mentorId, meetingLink } = req.body;

		if (!meetingLink) {
			return res.status(400).json({ error: "meetingLink is required" });
		}

		// TODO: Add proper authorization check

		const booking = await bookingService.updateMeetingLink(bookingId, mentorId, meetingLink);
		res.json(booking);
	} catch (error) {
		next(error);
	}
});

export default router;
