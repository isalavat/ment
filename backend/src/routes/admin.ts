import type { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { prisma } from "../../prisma/client";
import logger from "../lib/logger";
import {
  type AuthedRequest,
  requireAdmin,
  requireAuth,
} from "../middleware/auth";

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// GET all users with pagination and filtering
router.get("/users", async (req: AuthedRequest, res) => {
  try {
    const { role, page = "1", limit = "20", search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {};

    if (role && ["MENTEE", "MENTOR", "ADMIN"].includes(role as UserRole)) {
      where.role = role as UserRole;
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string } },
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
          mentorProfile: {
            select: {
              id: true,
              title: true,
              hourlyRate: true,
              avgRating: true,
            },
          },
          menteeProfile: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error(`Admin get users error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// GET single user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mentorProfile: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            skills: {
              include: {
                skill: true,
              },
            },
          },
        },
        menteeProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    logger.error(`Admin get user error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// POST create new user
router.post("/users", async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, avatarUrl } = req.body;

    // Validation
    if (!email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["MENTEE", "MENTOR", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if email exists
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        firstName,
        lastName,
        avatarUrl: avatarUrl || null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    logger.info(`Admin created user: ${user.email} (${user.role})`);
    return res.status(201).json({ user });
  } catch (error) {
    logger.error(`Admin create user error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// PUT update user
router.put("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, password, role, firstName, lastName, avatarUrl } = req.body;

    const updateData: Prisma.UserUpdateInput = {};

    if (email) {
      // Check if new email is already taken by another user
      const exists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });
      if (exists) {
        return res.status(409).json({ error: "Email already in use" });
      }
      updateData.email = email;
    }

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    if (role && ["MENTEE", "MENTOR", "ADMIN"].includes(role)) {
      updateData.role = role;
    }

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Admin updated user: ${user.email}`);
    return res.json({ user });
  } catch (error) {
    logger.error(`Admin update user error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE user
router.delete("/users/:id", async (req: AuthedRequest, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (req.user?.id === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info(`Admin deleted user ID: ${userId}`);
    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error(`Admin delete user error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// POST create mentor profile for a user
router.post("/users/:id/mentor-profile", async (req, res) => {
  try {
    const userId = req.params.id;
    const { bio, title, yearsExperience, hourlyRate, currency } = req.body;

    // Check user exists and has MENTOR role
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role !== "MENTOR") {
      return res.status(400).json({ error: "User must have MENTOR role" });
    }

    // Check if profile already exists
    const existing = await prisma.mentorProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      return res.status(409).json({ error: "Mentor profile already exists" });
    }

    const profile = await prisma.mentorProfile.create({
      data: {
        userId,
        bio,
        title,
        yearsExperience: parseInt(yearsExperience, 10),
        hourlyRate: parseFloat(hourlyRate),
        currency: currency || "USD",
      },
    });

    logger.info(`Admin created mentor profile for user ID: ${userId}`);
    return res.status(201).json({ profile });
  } catch (error) {
    logger.error(
      `Admin create mentor profile error: ${(error as Error).message}`
    );
    return res.status(500).json({ error: (error as Error).message });
  }
});

// POST create mentee profile for a user
router.post("/users/:id/mentee-profile", async (req, res) => {
  try {
    const userId = req.params.id;
    const { bio, goals } = req.body;

    // Check user exists and has MENTEE role
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role !== "MENTEE") {
      return res.status(400).json({ error: "User must have MENTEE role" });
    }

    // Check if profile already exists
    const existing = await prisma.menteeProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      return res.status(409).json({ error: "Mentee profile already exists" });
    }

    const profile = await prisma.menteeProfile.create({
      data: {
        userId,
        bio: bio || null,
        goals: goals || null,
      },
    });

    logger.info(`Admin created mentee profile for user ID: ${userId}`);
    return res.status(201).json({ profile });
  } catch (error) {
    logger.error(
      `Admin create mentee profile error: ${(error as Error).message}`
    );
    return res.status(500).json({ error: (error as Error).message });
  }
});

// PUT update mentor profile
router.put("/users/:id/mentor-profile", async (req, res) => {
  try {
    const userId = req.params.id;
    const { bio, title, yearsExperience, hourlyRate, currency } = req.body;

    // Check if profile exists
    const existing = await prisma.mentorProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Mentor profile not found" });
    }

    const updateData: Prisma.MentorProfileUpdateInput = {};
    if (bio !== undefined) updateData.bio = bio;
    if (title !== undefined) updateData.title = title;
    if (yearsExperience !== undefined)
      updateData.yearsExperience = parseInt(yearsExperience, 10);
    if (hourlyRate !== undefined)
      updateData.hourlyRate = parseFloat(hourlyRate);
    if (currency !== undefined) updateData.currency = currency;

    const profile = await prisma.mentorProfile.update({
      where: { userId },
      data: updateData,
    });

    logger.info(`Admin updated mentor profile for user ID: ${userId}`);
    return res.json({ profile });
  } catch (error) {
    logger.error(
      `Admin update mentor profile error: ${(error as Error).message}`
    );
    return res.status(500).json({ error: (error as Error).message });
  }
});

// PUT update mentee profile
router.put("/users/:id/mentee-profile", async (req, res) => {
  try {
    const userId = req.params.id;
    const { bio, goals } = req.body;

    // Check if profile exists
    const existing = await prisma.menteeProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Mentee profile not found" });
    }

    const updateData: Prisma.MenteeProfileUpdateInput = {};
    if (bio !== undefined) updateData.bio = bio;
    if (goals !== undefined) updateData.goals = goals;

    const profile = await prisma.menteeProfile.update({
      where: { userId },
      data: updateData,
    });

    logger.info(`Admin updated mentee profile for user ID: ${userId}`);
    return res.json({ profile });
  } catch (error) {
    logger.error(
      `Admin update mentee profile error: ${(error as Error).message}`
    );
    return res.status(500).json({ error: (error as Error).message });
  }
});

// GET all skills
router.get("/skills", async (_, res) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
    });
    return res.json({ skills });
  } catch (error) {
    logger.error(`Admin get skills error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// POST create new skill
router.post("/skills", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Skill name is required" });
    }

    // Check if skill already exists
    const existing = await prisma.skill.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: "Skill already exists" });
    }

    const skill = await prisma.skill.create({
      data: { name },
    });

    logger.info(`Admin created skill: ${skill.name}`);
    return res.status(201).json({ skill });
  } catch (error) {
    logger.error(`Admin create skill error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// POST add skill to mentor profile
router.post("/users/:id/mentor-profile/skills", async (req, res) => {
  try {
    const userId = req.params.id;
    const { skillId, skillName } = req.body;

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId },
    });

    if (!mentorProfile) {
      return res.status(404).json({ error: "Mentor profile not found" });
    }

    let finalSkillId = skillId;

    // If skillName is provided, create skill if it doesn't exist
    if (skillName) {
      let skill = await prisma.skill.findUnique({ where: { name: skillName } });
      if (!skill) {
        skill = await prisma.skill.create({ data: { name: skillName } });
      }
      finalSkillId = skill.id;
    }

    if (!finalSkillId) {
      return res
        .status(400)
        .json({ error: "Either skillId or skillName is required" });
    }

    // Check if already added
    const existing = await prisma.mentorSkill.findUnique({
      where: {
        mentorId_skillId: {
          mentorId: mentorProfile.id,
          skillId: finalSkillId,
        },
      },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: "Skill already added to this mentor" });
    }

    // Add skill to mentor
    await prisma.mentorSkill.create({
      data: {
        mentorId: mentorProfile.id,
        skillId: finalSkillId,
      },
    });

    // Return updated profile with skills
    const updatedProfile = await prisma.mentorProfile.findUnique({
      where: { id: mentorProfile.id },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    logger.info(`Admin added skill to mentor profile user ID: ${userId}`);
    return res.json({ profile: updatedProfile });
  } catch (error) {
    logger.error(
      `Admin add skill to mentor error: ${(error as Error).message}`
    );
    return res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE remove skill from mentor profile
router.delete("/users/:id/mentor-profile/skills/:skillId", async (req, res) => {
  try {
    const userId = req.params.id;
    const skillId = req.params.skillId;

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId },
    });

    if (!mentorProfile) {
      return res.status(404).json({ error: "Mentor profile not found" });
    }

    // Remove skill from mentor
    await prisma.mentorSkill.delete({
      where: {
        mentorId_skillId: {
          mentorId: mentorProfile.id,
          skillId: skillId,
        },
      },
    });

    logger.info(`Admin removed skill from mentor profile user ID: ${userId}`);
    return res.json({ message: "Skill removed successfully" });
  } catch (error) {
    logger.error(
      `Admin remove skill from mentor error: ${(error as Error).message}`
    );
    return res.status(500).json({ error: (error as Error).message });
  }
});

// POST add category to mentor profile
router.post("/users/:id/mentor-profile/categories", async (req, res) => {
  try {
    const userId = req.params.id;
    const { categoryId } = req.body;

    console.log("=== ADD CATEGORY REQUEST ===");
    console.log("User ID:", userId);
    console.log("Category ID:", categoryId);
    console.log("Request body:", req.body);

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    // Get mentor profile
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId },
    });

    if (!mentorProfile) {
      return res.status(404).json({ error: "Mentor profile not found" });
    }

    // Check if already added
    const existing = await prisma.mentorCategory.findUnique({
      where: {
        mentorId_categoryId: {
          mentorId: mentorProfile.id,
          categoryId: categoryId,
        },
      },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: "Category already added to this mentor" });
    }

    // Add category to mentor
    const created = await prisma.mentorCategory.create({
      data: {
        mentorId: mentorProfile.id,
        categoryId: categoryId,
      },
    });

    logger.info(
      `Created MentorCategory: mentorId=${created.mentorId}, categoryId=${created.categoryId}`
    );

    // Return updated profile with categories
    const updatedProfile = await prisma.mentorProfile.findUnique({
      where: { id: mentorProfile.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    logger.info(
      `Admin added category to mentor profile user ID: ${userId}, categories count: ${updatedProfile?.categories?.length}`
    );
    console.log(
      "Updated profile categories:",
      JSON.stringify(updatedProfile?.categories, null, 2)
    );
    return res.json({ profile: updatedProfile });
  } catch (error) {
    logger.error(
      `Admin add category to mentor error: ${(error as Error).message}`
    );
    return res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE remove category from mentor profile
router.delete(
  "/users/:id/mentor-profile/categories/:categoryId",
  async (req, res) => {
    try {
      const userId = req.params.id;
      const categoryId = req.params.categoryId;

      // Get mentor profile
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId },
      });

      if (!mentorProfile) {
        return res.status(404).json({ error: "Mentor profile not found" });
      }

      // Remove category from mentor
      await prisma.mentorCategory.delete({
        where: {
          mentorId_categoryId: {
            mentorId: mentorProfile.id,
            categoryId: categoryId,
          },
        },
      });

      logger.info(
        `Admin removed category from mentor profile user ID: ${userId}`
      );
      return res.json({ message: "Category removed successfully" });
    } catch (error) {
      logger.error(
        `Admin remove category from mentor error: ${(error as Error).message}`
      );
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

export default router;
