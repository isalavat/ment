import type { Skill } from "../../domain/skill/Skill";
import type { SkillRepository } from "../../domain/skill/SkillRepository";

export class CreateSkillUseCase {
  constructor(private readonly skillRepository: SkillRepository) {}

  async execute(name: string): Promise<Skill> {
    const existing = await this.skillRepository.findByName(name);
    if (existing) throw new Error("Skill already exists");
    return this.skillRepository.create(name);
  }
}
