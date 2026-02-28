import type { Skill } from "../../domain/skill/Skill";
import type { SkillRepository } from "../../domain/skill/SkillRepository";
import type { Transaction } from "../../Transaction";
import { ConflictError } from "../../lib/error";

export class CreateSkillUseCase {
  constructor(
    private readonly transaction: Transaction,
    private readonly skillRepository: SkillRepository
  ) {}

  async execute(name: string): Promise<Skill> {
    return this.transaction.run(async () => {
      const existing = await this.skillRepository.findByName(name);
      if (existing) throw new ConflictError("Skill already exists");
      return this.skillRepository.create(name);
    });
  }
}
