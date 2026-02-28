import type { Skill } from "./Skill";

export interface SkillRepository {
	findAll(): Promise<Skill[]>;
	findByName(name: string): Promise<Skill | null>;
	create(name: string): Promise<Skill>;
}
