import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../../prisma/client";
import { type AuthedRequest, requireAuth } from "../middleware/auth";
import { mentorController } from "../controllers/mentor/MentorController";

const router = Router();

router.use("/test", mentorController);

router.post("/mentor", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "MENTOR") {
    return res
      .status(403)
      .json({ error: "Only mentors can create mentor profiles" });
  }

  const exists = await prisma.mentorProfile.findUnique({ where: { userId } });
  if (exists) {
    return res.status(409).json({ error: "Mentor profile already exists" });
  }

  const { bio, title, yearsExperience, hourlyRate, currency } = req.body;

  const profile = await prisma.mentorProfile.create({
    data: {
      userId,
      bio,
      title,
      yearsExperience: parseInt(yearsExperience, 10) || 0,
      hourlyRate: parseFloat(hourlyRate) || 0,
      currency: currency || "USD",
    },
  });
  return res.status(201).json({ profile });
});

router.post("/mentee", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "MENTEE") {
    return res
      .status(403)
      .json({ error: "Only mentees can create mentee profiles" });
  }

  const exists = await prisma.menteeProfile.findUnique({ where: { userId } });
  if (exists) {
    return res.status(409).json({ error: "Mentee profile already exists" });
  }

  const { bio, goals } = req.body;

  const profile = await prisma.menteeProfile.create({
    data: {
      userId,
      bio,
      goals,
    },
  });

  return res.status(201).json({ profile });
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      menteeProfile: true,
      mentorProfile: {
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  return res.json({ user });
});

// GET all mentors with filtering
router.get("/mentors", async (req, res) => {
  try {
    const {
      category,
      skill,
      rating,
      minPrice,
      maxPrice,
      search,
      page = "1",
      limit = "9",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.MentorProfileWhereInput = {};

    // Filter by rating
    if (rating) {
      where.avgRating = { gte: parseFloat(rating as string) };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.hourlyRate = {};
      if (minPrice) where.hourlyRate.gte = parseFloat(minPrice as string);
      if (maxPrice) where.hourlyRate.lte = parseFloat(maxPrice as string);
    }

    // Filter by category
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category as string,
          },
        },
      };
    }

    // Filter by skill
    if (skill) {
      where.skills = {
        some: {
          skill: {
            name: { contains: skill as string },
          },
        },
      };
    }

    // Search in user name or mentor title
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { bio: { contains: search as string } },
        {
          user: {
            OR: [
              { firstName: { contains: search as string } },
              { lastName: { contains: search as string } },
            ],
          },
        },
      ];
    }

    const [mentors, total] = await Promise.all([
      prisma.mentorProfile.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          skills: {
            include: {
              skill: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          avgRating: "desc",
        },
      }),
      prisma.mentorProfile.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      mentors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get mentors error:", error);
    return res.status(500).json({ error: "Failed to fetch mentors" });
  }
});

// GET single mentor by ID
router.get("/mentors/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }

    return res.json({ mentor });
  } catch (error) {
    console.error("Get mentor error:", error);
    return res.status(500).json({ error: "Failed to fetch mentor" });
  }
});

router.put("/mentor", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "MENTOR") {
    return res
      .status(403)
      .json({ error: "Only mentors can update mentor profiles" });
  }
  const { bio, title, yearsExperience, hourlyRate, currency } = req.body;

  const profile = await prisma.mentorProfile.update({
    where: { userId },
    data: {
      ...(bio !== undefined && { bio }),
      ...(title !== undefined && { title }),
      ...(yearsExperience !== undefined && {
        yearsExperience: parseInt(yearsExperience, 10),
      }),
      ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate) }),
      ...(currency !== undefined && { currency }),
    },
  });

  return res.json({ profile });
});

router.put("/mentee", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "MENTEE") {
    return res
      .status(403)
      .json({ error: "Only mentees can update mentee profiles" });
  }

  const exists = await prisma.menteeProfile.findUnique({ where: { userId } });
  if (!exists) {
    return res.status(404).json({ error: "Mentee profile not found" });
  }

  const { bio, goals } = req.body;

  const profile = await prisma.menteeProfile.update({
    where: { userId },
    data: {
      ...(bio !== undefined && { bio }),
      ...(goals !== undefined && { goals }),
    },
  });

  return res.json({ profile });
});

// GET all categories
router.get("/categories", async (_, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
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
    console.error("Get skills error:", error);
    return res.status(500).json({ error: "Failed to fetch skills" });
  }
});

// POST - Add category to mentor profile
router.post(
  "/mentor/categories",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== "MENTOR") {
      return res
        .status(403)
        .json({ error: "Only mentors can manage categories" });
    }

    const profile = await prisma.mentorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      return res.status(404).json({ error: "Mentor profile not found" });
    }

    const { categoryId } = req.body;
    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    try {
      await prisma.mentorCategory.create({
        data: {
          mentorId: profile.id,
          categoryId,
        },
      });
      return res.json({ message: "Category added successfully" });
    } catch (error) {
      console.error("Add category error:", error);
      return res.status(500).json({ error: "Failed to add category" });
    }
  }
);

// DELETE - Remove category from mentor profile
router.delete(
  "/mentor/categories/:categoryId",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== "MENTOR") {
      return res
        .status(403)
        .json({ error: "Only mentors can manage categories" });
    }

    const profile = await prisma.mentorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      return res.status(404).json({ error: "Mentor profile not found" });
    }

    const { categoryId } = req.params;

    try {
      await prisma.mentorCategory.delete({
        where: {
          mentorId_categoryId: {
            mentorId: profile.id,
            categoryId,
          },
        },
      });
      return res.json({ message: "Category removed successfully" });
    } catch (error) {
      console.error("Remove category error:", error);
      return res.status(500).json({ error: "Failed to remove category" });
    }
  }
);

// POST - Add skill to mentor profile
router.post("/mentor/skills", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "MENTOR") {
    return res.status(403).json({ error: "Only mentors can manage skills" });
  }

  const profile = await prisma.mentorProfile.findUnique({ where: { userId } });
  if (!profile) {
    return res.status(404).json({ error: "Mentor profile not found" });
  }

  const { skillId, skillName } = req.body;

  let finalSkillId = skillId;

  // If skillName is provided, create or find the skill
  if (skillName && !skillId) {
    const existingSkill = await prisma.skill.findUnique({
      where: { name: skillName },
    });
    if (existingSkill) {
      finalSkillId = existingSkill.id;
    } else {
      const newSkill = await prisma.skill.create({ data: { name: skillName } });
      finalSkillId = newSkill.id;
    }
  }

  if (!finalSkillId) {
    return res.status(400).json({ error: "Skill ID or name is required" });
  }

  // Check if already added
  const existing = await prisma.mentorSkill.findUnique({
    where: {
      mentorId_skillId: {
        mentorId: profile.id,
        skillId: finalSkillId,
      },
    },
  });

  if (existing) {
    return res.status(409).json({ error: "Skill already added" });
  }

  try {
    await prisma.mentorSkill.create({
      data: {
        mentorId: profile.id,
        skillId: finalSkillId,
      },
    });

    // Return updated profile with skills
    const updatedProfile = await prisma.mentorProfile.findUnique({
      where: { id: profile.id },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return res.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Add skill error:", error);
    return res.status(500).json({ error: "Failed to add skill" });
  }
});

// DELETE - Remove skill from mentor profile
router.delete(
  "/mentor/skills/:skillId",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== "MENTOR") {
      return res.status(403).json({ error: "Only mentors can manage skills" });
    }

    const profile = await prisma.mentorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      return res.status(404).json({ error: "Mentor profile not found" });
    }

    const { skillId } = req.params;

    try {
      await prisma.mentorSkill.delete({
        where: {
          mentorId_skillId: {
            mentorId: profile.id,
            skillId,
          },
        },
      });
      return res.json({ message: "Skill removed successfully" });
    } catch (error) {
      console.error("Remove skill error:", error);
      return res.status(500).json({ error: "Failed to remove skill" });
    }
  }
);

export default router;
