import { Router } from "express";
import { menteeController } from "../controllers/mentee/MenteeController";
import { mentorController } from "../controllers/mentor/MentorController";
import { skillController } from "../controllers/skill/SkillController";
import { userController } from "../controllers/user/UserController";
import { requireAdmin, requireAuth } from "../middleware/auth";

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

router.use(mentorController);
router.use(menteeController);
router.use(userController);
router.use(skillController);

export default router;
