import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { availabilityService } from "../services/availabilityService";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /availability - Create a new availability slot
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      mentorId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring,
      specificDate,
    } = req.body;

    // TODO: Add authorization check - verify user owns the mentor profile

    const availability = await availabilityService.createAvailability({
      mentorId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring,
      specificDate: specificDate ? new Date(specificDate) : undefined,
    });

    res.status(201).json(availability);
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /availability/weekly - Create weekly schedule (bulk create)
 */
router.post(
  "/weekly",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mentorId, schedule } = req.body;

      if (!Array.isArray(schedule)) {
        return res.status(400).json({ error: "schedule must be an array" });
      }

      // TODO: Add authorization check

      const result = await availabilityService.createWeeklySchedule(
        mentorId,
        schedule
      );

      res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /availability/mentor/:mentorId - Get all availabilities for a mentor
 */
router.get(
  "/mentor/:mentorId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.mentorId;

      const availabilities =
        await availabilityService.getAvailabilitiesForMentor(mentorId);

      res.json(availabilities);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /availability/mentor/:mentorId/recurring - Get recurring availabilities
 */
router.get(
  "/mentor/:mentorId/recurring",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.mentorId;
      const dayOfWeek = req.query.dayOfWeek
        ? parseInt(req.query.dayOfWeek as string)
        : undefined;

      const availabilities =
        await availabilityService.getRecurringAvailabilities(
          mentorId,
          dayOfWeek
        );

      res.json(availabilities);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /availability/mentor/:mentorId/specific - Get specific date availabilities
 */
router.get(
  "/mentor/:mentorId/specific",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.mentorId;
      const date = req.query.date
        ? new Date(req.query.date as string)
        : undefined;

      const availabilities =
        await availabilityService.getSpecificDateAvailabilities(mentorId, date);

      res.json(availabilities);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /availability/:id - Get a single availability by ID
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    const availability = await availabilityService.getAvailabilityById(id);

    res.json(availability);
  } catch (error: any) {
    next(error);
  }
});

/**
 * PATCH /availability/:id - Update an availability
 */
router.patch(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const { mentorId, ...updateData } = req.body;

      // TODO: Add authorization check

      const availability = await availabilityService.updateAvailability(
        id,
        mentorId,
        updateData
      );

      res.json(availability);
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * DELETE /availability/:id - Delete an availability
 */
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const { mentorId } = req.body;

      // TODO: Add authorization check

      const result = await availabilityService.deleteAvailability(id, mentorId);

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
