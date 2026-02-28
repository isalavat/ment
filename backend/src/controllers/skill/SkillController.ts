import { type Response, Router } from "express";
import { PrismaSkillRepository } from "../../infra/repositories/PrismaSkillRepository";
import { PrismaTransaction } from "../../infra/transaction/PrismaTransaction";
import { BadRequestError } from "../../lib/error";
import { type AuthedRequest, requireAdmin, requireAuth } from "../../middleware/auth";
import { CreateSkillUseCase } from "../../use-cases/skill/CreateSkillUseCase";
import { ReadAllSkillsUseCase } from "../../use-cases/skill/ReadAllSkillsUseCase";

export const skillController = Router();
skillController.use(requireAuth, requireAdmin);

skillController.get("/skills", async (_req: AuthedRequest, res: Response) => {
	const useCase = new ReadAllSkillsUseCase(new PrismaSkillRepository());
	const skills = await useCase.execute();
	return res.json({ skills: skills.map((s) => ({ id: s.id, name: s.name })) });
});

skillController.post("/skills", async (req: AuthedRequest, res: Response) => {
	const { name } = req.body;
	if (!name) throw new BadRequestError("Skill name is required");

	const useCase = new CreateSkillUseCase(new PrismaTransaction(), new PrismaSkillRepository());
	const skill = await useCase.execute(name);
	return res.status(201).json({ skill: { id: skill.id, name: skill.name } });
});
