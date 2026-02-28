import { MentorProfile } from "../../domain/mentor/MentorProfile";
import { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";

export class ReadMentorByIdUseCase {
  constructor(private mentorProfileRepo: MentorProfileRepository) {}

  async execute(id: string): Promise<MentorProfile | null> {
    return this.mentorProfileRepo.findById(id);
  }
}
