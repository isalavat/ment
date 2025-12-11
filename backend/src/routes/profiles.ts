import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const prisma = new PrismaClient();
const router = Router();

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
      yearsExperience: parseInt(yearsExperience) || 0,
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
      mentorProfile: true,
    },
  });

  return res.json({ user });
});

// GET all mentors with filtering
router.get("/mentors", async (req, res) => {
  try {
    const { category, skill, rating, minPrice, maxPrice, search } = req.query;

    const where: any = {};

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
            slug: category
          }
        }
      };
    }

    // Filter by skill
    if (skill) {
      where.skills = {
        some: {
          skill: {
            name: { contains: skill as string }
          }
        }
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
              { lastName: { contains: search as string } }
            ]
          }
        }
      ];
    }

    const mentors = await prisma.mentorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        avgRating: 'desc'
      }
    });

    return res.json({ mentors });
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
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
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
      ...(yearsExperience !== undefined && {yearsExperience: parseInt(yearsExperience)}),
      ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate) }),
      ...(currency !== undefined && { currency }),
    },
    });

  return res.json({ profile });

});

router.put("/mentee", requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.user?.id;
    if(!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where : { id: userId} });
    if (user?.role !== "MENTEE") {
        return res.status(403).json({ error: "Only mentees can update mentee profiles" });
    }

    const exists = await prisma.menteeProfile.findUnique({ where: {userId} });
    if(!exists) {
        return res.status(404).json({ error: "Mentee profile not found" });
    }

    const { bio, goals } = req.body;

    const profile = await prisma.menteeProfile.update({
        where: { userId },
        data: {
            ...(bio !== undefined && { bio }),
            ...(goals !== undefined && { goals })
        }
    });

    return res.json({ profile });
});

export default router;
