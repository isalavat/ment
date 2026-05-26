import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { PrismaAvailabilityManagementRepository } from "../infra/repositories/PrismaAvailabilityManagementRepository";
import { PrismaMentorRepository } from "../infra/repositories/PrismaMentorProfileRepository";
import { AvailabilitySlotSyncPrismaService } from "../infra/services/AvailabilitySlotSyncPrismaService";
import { requireAuth } from "../middleware/auth";
import { CreateAvailabilityUseCase } from "../use-cases/availability/CreateAvailabilityUseCase";
import { CreateWeeklyScheduleUseCase } from "../use-cases/availability/CreateWeeklyScheduleUseCase";
import { DeleteAvailabilityUseCase } from "../use-cases/availability/DeleteAvailabilityUseCase";
import { GetAvailabilitiesForMentorUseCase } from "../use-cases/availability/GetAvailabilitiesForMentorUseCase";
import { GetAvailabilityByIdUseCase } from "../use-cases/availability/GetAvailabilityByIdUseCase";
import { GetRecurringAvailabilitiesUseCase } from "../use-cases/availability/GetRecurringAvailabilitiesUseCase";
import { GetSpecificDateAvailabilitiesUseCase } from "../use-cases/availability/GetSpecificDateAvailabilitiesUseCase";
import { UpdateAvailabilityUseCase } from "../use-cases/availability/UpdateAvailabilityUseCase";

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

    const availability = await new CreateAvailabilityUseCase(
      new PrismaMentorRepository(),
      new PrismaAvailabilityManagementRepository(),
      new AvailabilitySlotSyncPrismaService(),
    ).execute({
      mentorId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring,
      specificDate: specificDate ? new Date(specificDate) : undefined,
    });

    res.status(201).json(availability);
  } catch (error) {
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

      const result = await new CreateWeeklyScheduleUseCase(
        new PrismaMentorRepository(),
        new PrismaAvailabilityManagementRepository(),
        new AvailabilitySlotSyncPrismaService(),
      ).execute({ mentorId, schedule });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /availability/mentor/:mentorId - Get all availabilities for a mentor
 */
router.get(
  "/mentor/:mentorId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mentorId = req.params.mentorId;

      const availabilities = await new GetAvailabilitiesForMentorUseCase(
        new PrismaAvailabilityManagementRepository(),
      ).execute(mentorId);

      res.json(availabilities);
    } catch (error) {
      next(error);
    }
  },
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
        ? parseInt(req.query.dayOfWeek as string, 10)
        : undefined;

      const availabilities = await new GetRecurringAvailabilitiesUseCase(
        new PrismaAvailabilityManagementRepository(),
      ).execute(mentorId, dayOfWeek);

      res.json(availabilities);
    } catch (error) {
      next(error);
    }
  },
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

      const availabilities = await new GetSpecificDateAvailabilitiesUseCase(
        new PrismaAvailabilityManagementRepository(),
      ).execute(mentorId, date);

      res.json(availabilities);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /availability/:id - Get a single availability by ID
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    const availability = await new GetAvailabilityByIdUseCase(
      new PrismaAvailabilityManagementRepository(),
    ).execute(id);

    res.json(availability);
  } catch (error) {
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

      const availability = await new UpdateAvailabilityUseCase(
        new PrismaAvailabilityManagementRepository(),
        new AvailabilitySlotSyncPrismaService(),
      ).execute({
        id,
        mentorId,
        data: {
          ...updateData,
          specificDate: updateData.specificDate
            ? new Date(updateData.specificDate)
            : updateData.specificDate,
        },
      });

      res.json(availability);
    } catch (error) {
      next(error);
    }
  },
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

      const result = await new DeleteAvailabilityUseCase(
        new PrismaAvailabilityManagementRepository(),
        new AvailabilitySlotSyncPrismaService(),
      ).execute(id, mentorId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
