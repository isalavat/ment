import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";
import logger from "../lib/logger";

const prisma = new PrismaClient();
const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// GET all users with pagination and filtering
router.get("/users", async (req: AuthedRequest, res) => {
  try {
    const { role, page = "1", limit = "20", search } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (role && ["MENTEE", "MENTOR", "ADMIN"].includes(role as string)) {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search as string } },
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } }
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
              avgRating: true
            }
          },
          menteeProfile: {
            select: {
              id: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count({ where })
    ]);

    return res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error(`Admin get users error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// GET single user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mentorProfile: {
          include: {
            categories: true,
            skills: true
          }
        },
        menteeProfile: true
      }
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
        avatarUrl: avatarUrl || null
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createdAt: true
      }
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
    const userId = parseInt(req.params.id);
    const { email, password, role, firstName, lastName, avatarUrl } = req.body;
    
    const updateData: any = {};
    
    if (email) {
      // Check if new email is already taken by another user
      const exists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
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
        updatedAt: true
      }
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
    const userId = parseInt(req.params.id);
    
    // Prevent self-deletion
    if (req.user?.id === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { id: userId }
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
    const userId = parseInt(req.params.id);
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
    const existing = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (existing) {
      return res.status(409).json({ error: "Mentor profile already exists" });
    }

    const profile = await prisma.mentorProfile.create({
      data: {
        userId,
        bio,
        title,
        yearsExperience: parseInt(yearsExperience),
        hourlyRate: parseFloat(hourlyRate),
        currency: currency || "USD"
      }
    });

    logger.info(`Admin created mentor profile for user ID: ${userId}`);
    return res.status(201).json({ profile });
  } catch (error) {
    logger.error(`Admin create mentor profile error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// POST create mentee profile for a user
router.post("/users/:id/mentee-profile", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
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
    const existing = await prisma.menteeProfile.findUnique({ where: { userId } });
    if (existing) {
      return res.status(409).json({ error: "Mentee profile already exists" });
    }

    const profile = await prisma.menteeProfile.create({
      data: {
        userId,
        bio: bio || null,
        goals: goals || null
      }
    });

    logger.info(`Admin created mentee profile for user ID: ${userId}`);
    return res.status(201).json({ profile });
  } catch (error) {
    logger.error(`Admin create mentee profile error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
