import { MenteeProfile } from "../../domain/mentee/MenteeProfile";
import { MenteeProfileRepository } from "../../domain/mentee/MenteeProfileRepository";

export class ReadAllMenteesUseCase {
  constructor(private menteeProfileRepo: MenteeProfileRepository) {}

  async execute(): Promise<MenteeProfile[]> {
    return this.menteeProfileRepo.findAll();
  }
}
