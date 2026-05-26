import { SlotStatus } from "@prisma/client";
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { PrismaTimeSlotManagementRepository } from "../infra/repositories/PrismaTimeSlotManagementRepository";
import { TimeSlotGenerationPrismaService } from "../infra/services/TimeSlotGenerationPrismaService";
import { requireAuth } from "../middleware/auth";
import { BulkDeleteTimeSlotsUseCase } from "../use-cases/time-slot/BulkDeleteTimeSlotsUseCase";
import { DeleteTimeSlotUseCase } from "../use-cases/time-slot/DeleteTimeSlotUseCase";
import { GenerateTimeSlotsUseCase } from "../use-cases/time-slot/GenerateTimeSlotsUseCase";
import { GetAllSlotsForMentorUseCase } from "../use-cases/time-slot/GetAllSlotsForMentorUseCase";
import { GetAvailableSlotsUseCase } from "../use-cases/time-slot/GetAvailableSlotsUseCase";
import { GetComputedBookableSlotsUseCase } from "../use-cases/time-slot/GetComputedBookableSlotsUseCase";
import { GetTimeSlotByIdUseCase } from "../use-cases/time-slot/GetTimeSlotByIdUseCase";
import { UpdateTimeSlotStatusUseCase } from "../use-cases/time-slot/UpdateTimeSlotStatusUseCase";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /time-slots/generate - Generate time slots from availability
 */
router.post(
  "/generate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mentorId, startDate, endDate, slotDuration } = req.body;

      if (!mentorId || !startDate || !endDate) {
        return res.status(400).json({
          error: "mentorId, startDate, and endDate are required",
        });
      }

      // TODO: Add authorization check - verify user is the mentor

      const result = await new GenerateTimeSlotsUseCase(
        new TimeSlotGenerationPrismaService(),
      ).execute({
        mentorId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        slotDuration: slotDuration ? parseInt(slotDuration, 10) : undefined,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /time-slots/mentor/:mentorId/available - Get available slots for a mentor
 */
router.get(
  "/mentor/:mentorId/available",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.mentorId;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const slots = await new GetAvailableSlotsUseCase(
        new PrismaTimeSlotManagementRepository(),
      ).execute(mentorId, startDate, endDate);

      res.json(slots);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /time-slots/mentor/:mentorId/bookable - Compute bookable slots from availability
 */
router.get(
  "/mentor/:mentorId/bookable",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.mentorId;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date();
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : (() => {
            const date = new Date();
            date.setDate(date.getDate() + 14);
            return date;
          })();
      const stepMinutes = req.query.stepMinutes
        ? parseInt(req.query.stepMinutes as string, 10)
        : 15;
      const durationMinutes = req.query.durationMinutes
        ? parseInt(req.query.durationMinutes as string, 10)
        : 60;

      const slots = await new GetComputedBookableSlotsUseCase(
        new TimeSlotGenerationPrismaService(),
      ).execute({
        mentorId,
        startDate,
        endDate,
        stepMinutes,
        durationMinutes,
      });

      res.json(slots);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /time-slots/mentor/:mentorId - Get all slots for a mentor
 */
router.get(
  "/mentor/:mentorId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.mentorId;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;
      const status = req.query.status as SlotStatus | undefined;

      // TODO: Add authorization check for non-public data

      const slots = await new GetAllSlotsForMentorUseCase(
        new PrismaTimeSlotManagementRepository(),
      ).execute(mentorId, startDate, endDate, status);

      res.json(slots);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /time-slots/:id - Get a single time slot by ID
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slotId = req.params.id;

    const slot = await new GetTimeSlotByIdUseCase(
      new PrismaTimeSlotManagementRepository(),
    ).execute(slotId);

    res.json(slot);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /time-slots/:id/status - Update time slot status
 */
router.patch(
  "/:id/status",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slotId = req.params.id;
      const { status, mentorId } = req.body;

      if (!status) {
        return res.status(400).json({ error: "status is required" });
      }

      // Validate status value
      if (!Object.values(SlotStatus).includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${Object.values(SlotStatus).join(", ")}`,
        });
      }

      // TODO: Add authorization check

      const slot = await new UpdateTimeSlotStatusUseCase(
        new PrismaTimeSlotManagementRepository(),
      ).execute(slotId, status, mentorId);

      res.json(slot);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /time-slots/:id - Delete a time slot
 */
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slotId = req.params.id;
      const { mentorId } = req.body;

      // TODO: Add authorization check

      const result = await new DeleteTimeSlotUseCase(
        new PrismaTimeSlotManagementRepository(),
      ).execute(slotId, mentorId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /time-slots/bulk - Bulk delete available slots in a date range
 */
router.delete(
  "/bulk",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mentorId, startDate, endDate } = req.body;

      if (!mentorId || !startDate || !endDate) {
        return res.status(400).json({
          error: "mentorId, startDate, and endDate are required",
        });
      }

      // TODO: Add authorization check

      const result = await new BulkDeleteTimeSlotsUseCase(
        new PrismaTimeSlotManagementRepository(),
      ).execute(mentorId, new Date(startDate), new Date(endDate));

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
