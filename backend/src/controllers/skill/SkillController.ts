import { type Response, Router } from "express";
import {
  type AuthedRequest,
  requireAdmin,
  requireAuth,
} from "../../middleware/auth";
import { PrismaSkillRepository } from "../../infra/repositories/PrismaSkillRepository";
import { PrismaTransaction } from "../../infra/transaction/PrismaTransaction";
import { ReadAllSkillsUseCase } from "../../use-cases/skill/ReadAllSkillsUseCase";
import { CreateSkillUseCase } from "../../use-cases/skill/CreateSkillUseCase";

export const skillController = Router();
skillController.use(requireAuth, requireAdmin);

skillController.get("/skills", async (_req: AuthedRequest, res: Response) => {
  const useCase = new ReadAllSkillsUseCase(new PrismaSkillRepository());
  const skills = await useCase.execute();
  return res.json({ skills: skills.map((s) => ({ id: s.id, name: s.name })) });
});

skillController.post("/skills", async (req: AuthedRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Skill name is required" });

  try {
    const useCase = new CreateSkillUseCase(
      new PrismaTransaction(),
      new PrismaSkillRepository()
    );
    const skill = await useCase.execute(name);
    return res.status(201).json({ skill: { id: skill.id, name: skill.name } });
  } catch (err: any) {
    if (err.message === "Skill already exists") {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
});
