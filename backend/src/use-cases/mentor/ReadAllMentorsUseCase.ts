import { MentorProfile } from "../../domain/mentor/MentorProfile";
import { MentorProfileRepository } from "../../domain/mentor/MentorProfileRepository";

export class ReadAllMentorsUseCase {
  constructor(private mentorProfileRepo: MentorProfileRepository) {}

  async execute(): Promise<MentorProfile[]> {
    console.log("ReadAllMentorsUseCase.execute called");
    const mentorProfiles: MentorProfile[] =
      await this.mentorProfileRepo.findAllMentorProfiles();
    console.log("Retrieved mentor profiles:", mentorProfiles);
    return mentorProfiles;
  }
}
