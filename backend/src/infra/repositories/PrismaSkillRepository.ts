import { Skill } from "../../domain/skill/Skill";
import type { SkillRepository } from "../../domain/skill/SkillRepository";
import { PrismaClientGetway } from "../PrismaClientGetway";

export class PrismaSkillRepository implements SkillRepository {
	async findAll(): Promise<Skill[]> {
		const skills = await PrismaClientGetway().skill.findMany({
			orderBy: { name: "asc" },
		});
		return skills.map((s) => Skill.create(s.id, s.name));
	}

	async findByName(name: string): Promise<Skill | null> {
		const skill = await PrismaClientGetway().skill.findUnique({
			where: { name },
		});
		return skill ? Skill.create(skill.id, skill.name) : null;
	}

	async create(name: string): Promise<Skill> {
		const skill = await PrismaClientGetway().skill.create({ data: { name } });
		return Skill.create(skill.id, skill.name);
	}
}
