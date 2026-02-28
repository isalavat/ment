import type {
	MentorFilters,
	MentorProfileRepository,
	PaginatedMentors,
} from "../../domain/mentor/MentorProfileRepository";

export class ReadAllMentorsWithFiltersUseCase {
	constructor(private readonly mentorRepo: MentorProfileRepository) {}

	async execute(filters: MentorFilters): Promise<PaginatedMentors> {
		return this.mentorRepo.findAllWithFilters(filters);
	}
}
