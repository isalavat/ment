import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { mentorController } from "../controllers/mentor/MentorController";
import { menteeController } from "../controllers/mentee/MenteeController";
import { userController } from "../controllers/user/UserController";
import { skillController } from "../controllers/skill/SkillController";

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

router.use(mentorController);
router.use(menteeController);
router.use(userController);
router.use(skillController);

export default router;
