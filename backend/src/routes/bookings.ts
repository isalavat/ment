import type { BookingStatus } from "@prisma/client";
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { PrismaAvailabilityRepository } from "../infra/repositories/PrismaAvailabilityRepository";
import { PrismaBookingRepository } from "../infra/repositories/PrismaBookingRepository";
import { PrismaMentorRepository } from "../infra/repositories/PrismaMentorProfileRepository";
import { PrismaTimeSlotRepository } from "../infra/repositories/PrismaTimeSlotRepository";
import { PrismaUserRepository } from "../infra/repositories/PrismaUserRepository";
import { PrismaTransaction } from "../infra/transaction/PrismaTransaction";
import { requireAuth } from "../middleware/auth";
import { CancelBookingByMenteeUseCase } from "../use-cases/booking/CancelBookingByMenteeUseCase";
import { CancelBookingByMentorUseCase } from "../use-cases/booking/CancelBookingByMentorUseCase";
import { CompleteBookingUseCase } from "../use-cases/booking/CompleteBookingUseCase";
import { ConfirmBookingUseCase } from "../use-cases/booking/ConfirmBookingUseCase";
import { CreateBookingUseCase } from "../use-cases/booking/CreateBookingUseCase";
import { GetBookingByIdUseCase } from "../use-cases/booking/GetBookingByIdUseCase";
import { GetBookingsForMenteeUseCase } from "../use-cases/booking/GetBookingsForMenteeUseCase";
import { GetBookingsForMentorUseCase } from "../use-cases/booking/GetBookingsForMentorUseCase";
import { UpdateMeetingLinkUseCase } from "../use-cases/booking/UpdateMeetingLinkUseCase";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /bookings - Create a new booking (mentee only)
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { menteeId, mentorId, timeSlotId, startTime, endTime, notes } =
      req.body;

    // Verify the mentee profile belongs to the authenticated user
    // TODO: Add proper authorization check

    if (!mentorId || (!timeSlotId && (!startTime || !endTime))) {
      return res.status(400).json({
        error:
          "mentorId and either timeSlotId or startTime/endTime are required",
      });
    }

    if (startTime && Number.isNaN(new Date(startTime).getTime())) {
      return res.status(400).json({ error: "Invalid startTime" });
    }

    if (endTime && Number.isNaN(new Date(endTime).getTime())) {
      return res.status(400).json({ error: "Invalid endTime" });
    }

    const useCase = new CreateBookingUseCase(
      new PrismaTransaction(),
      new PrismaMentorRepository(),
      new PrismaUserRepository(),
      new PrismaAvailabilityRepository(),
      new PrismaTimeSlotRepository(),
      new PrismaBookingRepository(),
    );

    const booking = await useCase.execute({
      menteeId,
      mentorId,
      timeSlotId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
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
router.get(
  "/mentee/:menteeId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const menteeId = req.params.menteeId;
      const status = req.query.status as BookingStatus | undefined;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      // TODO: Add authorization check - user should only access their own bookings

      const bookings = await new GetBookingsForMenteeUseCase(
        new PrismaBookingRepository(),
      ).execute({
        menteeId,
        status,
        startDate,
        endDate,
      });

      res.json(bookings);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /bookings/mentor/:mentorId - Get all bookings for a mentor
 */
router.get(
  "/mentor/:mentorId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.mentorId;
      const status = req.query.status as BookingStatus | undefined;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      // TODO: Add authorization check - user should only access their own bookings

      const bookings = await new GetBookingsForMentorUseCase(
        new PrismaBookingRepository(),
      ).execute({
        mentorId,
        status,
        startDate,
        endDate,
      });

      res.json(bookings);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /bookings/:id - Get a single booking by ID
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingId = req.params.id;

    // TODO: Add authorization check - only mentee or mentor involved should access

    const booking = await new GetBookingByIdUseCase(
      new PrismaBookingRepository(),
    ).execute(bookingId);
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /bookings/:id/confirm - Confirm a booking (mentor only)
 */
router.patch(
  "/:id/confirm",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookingId = req.params.id;
      const { mentorId } = req.body;

      // TODO: Add proper authorization check

      const booking = await new ConfirmBookingUseCase(
        new PrismaBookingRepository(),
      ).execute(bookingId, mentorId);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /bookings/:id/cancel-mentee - Cancel booking by mentee
 */
router.patch(
  "/:id/cancel-mentee",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookingId = req.params.id;
      const { menteeId } = req.body;

      // TODO: Add proper authorization check

      const booking = await new CancelBookingByMenteeUseCase(
        new PrismaTransaction(),
        new PrismaBookingRepository(),
        new PrismaTimeSlotRepository(),
      ).execute(bookingId, menteeId);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /bookings/:id/cancel-mentor - Cancel booking by mentor
 */
router.patch(
  "/:id/cancel-mentor",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookingId = req.params.id;
      const { mentorId } = req.body;

      // TODO: Add proper authorization check

      const booking = await new CancelBookingByMentorUseCase(
        new PrismaTransaction(),
        new PrismaBookingRepository(),
        new PrismaTimeSlotRepository(),
      ).execute(bookingId, mentorId);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /bookings/:id/complete - Mark booking as completed
 */
router.patch(
  "/:id/complete",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookingId = req.params.id;

      // TODO: Add proper authorization check - should be after session time has passed

      const booking = await new CompleteBookingUseCase(
        new PrismaBookingRepository(),
      ).execute(bookingId);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /bookings/:id/meeting-link - Update meeting link (mentor only)
 */
router.patch(
  "/:id/meeting-link",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookingId = req.params.id;
      const { mentorId, meetingLink } = req.body;

      if (!meetingLink) {
        return res.status(400).json({ error: "meetingLink is required" });
      }

      // TODO: Add proper authorization check

      const booking = await new UpdateMeetingLinkUseCase(
        new PrismaBookingRepository(),
      ).execute(bookingId, mentorId, meetingLink);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
