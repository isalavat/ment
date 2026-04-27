import { prisma } from "../../prisma/client";
import type { UserRole } from "../domain/user/User";
import { BCrpytPasswordHasher } from "../infra/services/BCrpytPasswordHasher";

export type DemoUserSeed = {
	role: UserRole;
	label: string;
	email: string;
	firstName: string;
	lastName: string;
	mentorState?: "VERIFIED_PROFILE" | "PENDING_PROFILE" | "NO_PROFILE";
};

export const DEMO_USER_SEEDS: DemoUserSeed[] = [
	{
		role: "USER",
		label: "Demo Learner",
		email: "dev.user@mentorhub.local",
		firstName: "Demo",
		lastName: "Learner",
	},
	{
		role: "MENTOR",
		label: "Demo Mentor",
		email: "dev.mentor@mentorhub.local",
		firstName: "Demo",
		lastName: "Mentor",
		mentorState: "VERIFIED_PROFILE",
	},
	{
		role: "MENTOR",
		label: "Demo Pending Mentor",
		email: "dev.mentor.pending@mentorhub.local",
		firstName: "Demo",
		lastName: "Pending",
		mentorState: "PENDING_PROFILE",
	},
	{
		role: "MENTOR",
		label: "Demo Mentor No Profile",
		email: "dev.mentor.noprofile@mentorhub.local",
		firstName: "Demo",
		lastName: "NoProfile",
		mentorState: "NO_PROFILE",
	},
	{
		role: "ADMIN",
		label: "Demo Admin",
		email: "dev.admin@mentorhub.local",
		firstName: "Demo",
		lastName: "Admin",
	},
];

const DEFAULT_TEST_USERS_PASSWORD = "Test@1234";
const DEMO_MENTOR_CATEGORY_SLUG = "demo-mentoring";
const DEMO_MENTOR_SKILL_NAME = "Mentorship";

export function isDemoUserBootstrapEnabled(): boolean {
	const environment = (process.env.NODE_ENV ?? "development").toLowerCase();
	return environment === "development" || environment === "test";
}

export function getDemoUsersPassword(): string {
	return process.env.TEST_USERS_PASSWORD ?? DEFAULT_TEST_USERS_PASSWORD;
}

export async function ensureDemoUsersExist(): Promise<void> {
	if (!isDemoUserBootstrapEnabled()) {
		return;
	}

	const hasher = new BCrpytPasswordHasher();
	const passwordHash = await hasher.hash(getDemoUsersPassword());

	for (const seed of DEMO_USER_SEEDS) {
		const existing = await prisma.user.findUnique({
			where: { email: seed.email },
			select: { id: true },
		});

		const userId = existing
			? existing.id
			: (
					await prisma.user.create({
						data: {
							email: seed.email,
							firstName: seed.firstName,
							lastName: seed.lastName,
							role: seed.role,
							passwordHash: passwordHash.value,
						},
						select: { id: true },
					})
				).id;

		if (!existing) {
			console.log(`[bootstrap] Created ${seed.role} demo user: ${seed.email}`);
		}

		if (seed.role === "MENTOR") {
			await ensureDemoMentorState(userId, seed.mentorState ?? "VERIFIED_PROFILE");
		}
	}
}

async function ensureDemoMentorState(
	userId: string,
	mentorState: "VERIFIED_PROFILE" | "PENDING_PROFILE" | "NO_PROFILE",
): Promise<void> {
	if (mentorState === "NO_PROFILE") {
		await prisma.mentorProfile.deleteMany({ where: { userId } });
		return;
	}

	if (mentorState === "PENDING_PROFILE") {
		const mentorProfile = await prisma.mentorProfile.upsert({
			where: { userId },
			update: {
				verificationStatus: "PENDING",
				rejectionReason: null,
			},
			create: {
				userId,
				bio: "Mentor account pending verification for local testing.",
				title: "Mentor Candidate",
				yearsExperience: 2,
				hourlyRate: 20,
				currency: "USD",
				verificationStatus: "PENDING",
			},
			select: { id: true },
		});

		await prisma.availability.deleteMany({
			where: { mentorId: mentorProfile.id },
		});
		await prisma.mentorCategory.deleteMany({
			where: { mentorId: mentorProfile.id },
		});
		await prisma.mentorSkill.deleteMany({
			where: { mentorId: mentorProfile.id },
		});
		return;
	}

	await ensureDemoMentorProfile(userId);
}

async function ensureDemoMentorProfile(userId: string): Promise<void> {
	const category = await prisma.category.upsert({
		where: { slug: DEMO_MENTOR_CATEGORY_SLUG },
		update: {},
		create: {
			name: "Demo Mentoring",
			slug: DEMO_MENTOR_CATEGORY_SLUG,
			description: "Default category for the demo mentor account",
		},
		select: { id: true },
	});

	const skill = await prisma.skill.upsert({
		where: { name: DEMO_MENTOR_SKILL_NAME },
		update: {},
		create: { name: DEMO_MENTOR_SKILL_NAME },
		select: { id: true },
	});

	const mentorProfile = await prisma.mentorProfile.upsert({
		where: { userId },
		update: {
			verificationStatus: "VERIFIED",
			rejectionReason: null,
		},
		create: {
			userId,
			bio: "Experienced mentor account used for local testing.",
			title: "Senior Mentor",
			yearsExperience: 8,
			hourlyRate: 45,
			currency: "USD",
			verificationStatus: "VERIFIED",
		},
		select: { id: true },
	});

	await prisma.mentorCategory.upsert({
		where: {
			mentorId_categoryId: {
				mentorId: mentorProfile.id,
				categoryId: category.id,
			},
		},
		update: {},
		create: {
			mentorId: mentorProfile.id,
			categoryId: category.id,
		},
	});

	await prisma.mentorSkill.upsert({
		where: {
			mentorId_skillId: {
				mentorId: mentorProfile.id,
				skillId: skill.id,
			},
		},
		update: {},
		create: {
			mentorId: mentorProfile.id,
			skillId: skill.id,
		},
	});

	const existingAvailability = await prisma.availability.findFirst({
		where: { mentorId: mentorProfile.id },
		select: { id: true },
	});

	if (!existingAvailability) {
		await prisma.availability.create({
			data: {
				mentorId: mentorProfile.id,
				dayOfWeek: 1,
				startTime: "09:00",
				endTime: "17:00",
				isRecurring: true,
			},
		});
	}

	await ensureDemoBookableTimeSlots(mentorProfile.id);
}

async function ensureDemoBookableTimeSlots(mentorId: string): Promise<void> {
	// Keep one mentor always bookable by ensuring a few future AVAILABLE slots exist.
	const slotDefinitions = [
		{ dayOffset: 1, hour: 10 },
		{ dayOffset: 2, hour: 14 },
		{ dayOffset: 3, hour: 16 },
	];

	for (const definition of slotDefinitions) {
		const startTime = new Date();
		startTime.setDate(startTime.getDate() + definition.dayOffset);
		startTime.setHours(definition.hour, 0, 0, 0);

		const endTime = new Date(startTime);
		endTime.setHours(endTime.getHours() + 1);

		const existing = await prisma.timeSlot.findFirst({
			where: {
				mentorId,
				startTime,
				endTime,
			},
			select: { id: true },
		});

		if (existing) {
			continue;
		}

		await prisma.timeSlot.create({
			data: {
				mentorId,
				startTime,
				endTime,
				status: "AVAILABLE",
			},
		});
	}
}
