import type { Skill } from "../../domain/skill/Skill";
import type { SkillRepository } from "../../domain/skill/SkillRepository";

export class ReadAllSkillsUseCase {
  constructor(private readonly skillRepository: SkillRepository) {}

  async execute(): Promise<Skill[]> {
    return this.skillRepository.findAll();
  }
}
