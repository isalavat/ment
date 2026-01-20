import { MentorProfile } from "./MentorProfile";

export interface MentorProfileRepository {
  findAllMentorProfiles(): Promise<MentorProfile[]>;
}
