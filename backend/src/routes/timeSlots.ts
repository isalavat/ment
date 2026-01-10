import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { timeSlotService } from "../services/timeSlotService";
import { SlotStatus } from "@prisma/client";

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

      const result = await timeSlotService.generateTimeSlots({
        mentorId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        slotDuration: slotDuration ? parseInt(slotDuration) : undefined,
      });

      res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  }
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

      const slots = await timeSlotService.getAvailableSlots(
        mentorId,
        startDate,
        endDate
      );

      res.json(slots);
    } catch (error: any) {
      next(error);
    }
  }
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

      const slots = await timeSlotService.getAllSlotsForMentor(
        mentorId,
        startDate,
        endDate,
        status
      );

      res.json(slots);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /time-slots/:id - Get a single time slot by ID
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slotId = req.params.id;

    const slot = await timeSlotService.getSlotById(slotId);

    res.json(slot);
  } catch (error: any) {
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
          error: `Invalid status. Must be one of: ${Object.values(
            SlotStatus
          ).join(", ")}`,
        });
      }

      // TODO: Add authorization check

      const slot = await timeSlotService.updateSlotStatus(
        slotId,
        status,
        mentorId
      );

      res.json(slot);
    } catch (error: any) {
      next(error);
    }
  }
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

      const result = await timeSlotService.deleteSlot(slotId, mentorId);

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
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

      const result = await timeSlotService.bulkDeleteSlots(
        mentorId,
        new Date(startDate),
        new Date(endDate)
      );

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
