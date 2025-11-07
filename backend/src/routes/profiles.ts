import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthedRequest } from "../middleware/auth";


const prisma = new PrismaClient();
const router = Router();

router.post("/mentor", requireAuth, async ( req: AuthedRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({error: "Unauthorized"});
    
    const user = await prisma.user.findUnique({ where: {id: userId}});
    if(user?.role !== "MENTOR") {
        return res.status(403).json({error: "Only mentors can create mentor profiles"});
    }

    const exists = await prisma.mentorProfile.findUnique({ where: {userId} });
    if(exists) {
        return res.status(409).json({ error: "Mentor profile already exists" });
    }

    const {bio, title, yearsExperience, hourlyRate, currency } = req.body;

    const profile = await prisma.mentorProfile.create( {
        data: {
            userId,
            bio, 
            title,
            yearsExperience: parseInt(yearsExperience) || 0,
            hourlyRate: parseFloat(hourlyRate) || 0,
            currency: currency || "USD"
        }
    });
    return res.status(201).json({ profile });
})

router.post("/mentee", requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.user?.id;
    if(!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where : { id: userId} });
    if (user?.role !== "MENTEE") {
        return res.status(403).json({ error: "Only mentees can create mentee profiles" })
    }

    const exists = await prisma.menteeProfile.findUnique({ where: {userId} });
    if(exists) {
        return res.status(409).json({ error: "Mentee profile already exists" });
    }

    const { bio, goals } = req.body;

    const profile = await prisma.menteeProfile.create( {
        data: {
            userId,
            bio,
            goals
        }
    })

    return res.status(201).json({ profile });
})

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
    const userId = req.user?.id;
    if(!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
        where: {id: userId},
        include: {
            menteeProfile: true,
            mentorProfile: true
        }
    });

    return res.json({user});
})

export default router;