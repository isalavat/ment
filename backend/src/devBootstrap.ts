/**
 * Dev/test bootstrap — runs only when NODE_ENV !== "production".
 *
 * Creates five well-known demo users idempotently so developers can
 * immediately log in without manual setup.
 *
 * - dev.user@mentorhub.local         → USER
 * - dev.mentor@mentorhub.local       → MENTOR VERIFIED (bookable)
 * - dev.mentor.pending@mentorhub.local → MENTOR PENDING profile
 * - dev.mentor.noprofile@mentorhub.local → MENTOR, no profile
 * - dev.admin@mentorhub.local        → ADMIN
 *
 * Password for all accounts comes from TEST_USERS_PASSWORD env var
 * (falls back to "DevPass123!" so the app still starts without config).
 */

import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client";

const SALT_ROUNDS = 10; // lower than prod for faster startup

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function hashPassword(plain: string): Promise<string> {
	return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Returns a date `daysFromNow` days in the future at the given hour (local). */
function futureDate(daysFromNow: number, hour = 10, minute = 0): Date {
	const d = new Date();
	d.setDate(d.getDate() + daysFromNow);
	d.setHours(hour, minute, 0, 0);
	return d;
}

// ---------------------------------------------------------------------------
// Bootstrap entry point
// ---------------------------------------------------------------------------

export async function bootstrapDevUsers(): Promise<void> {
	if (process.env.NODE_ENV === "production") return;

	const password = process.env.TEST_USERS_PASSWORD ?? "DevPass123!";
	const hash = await hashPassword(password);

	console.log("[devBootstrap] Ensuring demo users exist…");

	// NOTE: always update passwordHash so the known dev password is enforced
	// even if the users were created previously with a different password.

	// ── 1. Plain user ──────────────────────────────────────────────────────
	await prisma.user.upsert({
		where: { email: "dev.user@mentorhub.local" },
		update: { passwordHash: hash },
		create: {
			email: "dev.user@mentorhub.local",
			passwordHash: hash,
			role: "USER",
			firstName: "Dev",
			lastName: "User",
		},
	});

	// ── 2. Admin ───────────────────────────────────────────────────────────
	await prisma.user.upsert({
		where: { email: "dev.admin@mentorhub.local" },
		update: { passwordHash: hash },
		create: {
			email: "dev.admin@mentorhub.local",
			passwordHash: hash,
			role: "ADMIN",
			firstName: "Dev",
			lastName: "Admin",
		},
	});

	// ── 3. Mentor — no profile ─────────────────────────────────────────────
	await prisma.user.upsert({
		where: { email: "dev.mentor.noprofile@mentorhub.local" },
		update: { passwordHash: hash },
		create: {
			email: "dev.mentor.noprofile@mentorhub.local",
			passwordHash: hash,
			role: "MENTOR",
			firstName: "Dev",
			lastName: "NoProfile",
		},
	});

	// ── 4. Mentor — PENDING profile ────────────────────────────────────────
	{
		const pendingUser = await prisma.user.upsert({
			where: { email: "dev.mentor.pending@mentorhub.local" },
			update: { passwordHash: hash },
			create: {
				email: "dev.mentor.pending@mentorhub.local",
				passwordHash: hash,
				role: "MENTOR",
				firstName: "Dev",
				lastName: "Pending",
			},
		});

		const existing = await prisma.mentorProfile.findUnique({
			where: { userId: pendingUser.id },
		});
		if (!existing) {
			await prisma.mentorProfile.create({
				data: {
					userId: pendingUser.id,
					bio: "Pending mentor for dev testing.",
					title: "Pending Dev Mentor",
					yearsExperience: 2,
					hourlyRate: 50,
					currency: "USD",
					verificationStatus: "PENDING",
				},
			});
		}
	}

	// ── 5. Mentor — VERIFIED / fully bookable ─────────────────────────────
	{
		const verifiedUser = await prisma.user.upsert({
			where: { email: "dev.mentor@mentorhub.local" },
			update: { passwordHash: hash },
			create: {
				email: "dev.mentor@mentorhub.local",
				passwordHash: hash,
				role: "MENTOR",
				firstName: "Dev",
				lastName: "Mentor",
			},
		});

		// Ensure a mentor profile exists and is VERIFIED
		let mentorProfile = await prisma.mentorProfile.findUnique({
			where: { userId: verifiedUser.id },
		});
		if (!mentorProfile) {
			mentorProfile = await prisma.mentorProfile.create({
				data: {
					userId: verifiedUser.id,
					bio: "Experienced full-stack developer available for dev testing.",
					title: "Senior Software Engineer",
					yearsExperience: 8,
					hourlyRate: 120,
					currency: "USD",
					verificationStatus: "VERIFIED",
				},
			});
		} else if (mentorProfile.verificationStatus !== "VERIFIED") {
			mentorProfile = await prisma.mentorProfile.update({
				where: { id: mentorProfile.id },
				data: { verificationStatus: "VERIFIED" },
			});
		}

		const mentorId = mentorProfile.id;

		// ── Skill: TypeScript ──────────────────────────────────────────────
		const skill = await prisma.skill.upsert({
			where: { name: "TypeScript" },
			update: {},
			create: { name: "TypeScript" },
		});
		const existingSkill = await prisma.mentorSkill.findUnique({
			where: { mentorId_skillId: { mentorId, skillId: skill.id } },
		});
		if (!existingSkill) {
			await prisma.mentorSkill.create({
				data: { mentorId, skillId: skill.id },
			});
		}

		// ── Category: Software Development ────────────────────────────────
		const category = await prisma.category.upsert({
			where: { slug: "software" },
			update: {},
			create: {
				name: "Software Development",
				slug: "software",
				description: "Web development, mobile apps, software engineering",
			},
		});
		const existingCat = await prisma.mentorCategory.findUnique({
			where: { mentorId_categoryId: { mentorId, categoryId: category.id } },
		});
		if (!existingCat) {
			await prisma.mentorCategory.create({
				data: { mentorId, categoryId: category.id },
			});
		}

		// ── Availability record (recurring Mon–Fri) ────────────────────────
		const existingAvail = await prisma.availability.findFirst({
			where: { mentorId, isRecurring: true },
		});
		if (!existingAvail) {
			for (const dayOfWeek of [1, 2, 3, 4, 5]) {
				await prisma.availability.create({
					data: {
						mentorId,
						dayOfWeek,
						startTime: "09:00",
						endTime: "17:00",
						isRecurring: true,
					},
				});
			}
		}

		// ── Concrete future TimeSlots (next 7 days, 2 slots/day) ──────────
		// Check if we already have enough future available slots.
		const existingSlots = await prisma.timeSlot.findMany({
			where: {
				mentorId,
				status: "AVAILABLE",
				startTime: { gt: new Date() },
			},
		});

		if (existingSlots.length < 5) {
			// Create 2 x 60-min slots for each of the next 7 days
			for (let day = 1; day <= 7; day++) {
				const morningStart = futureDate(day, 10, 0);
				const morningEnd = futureDate(day, 11, 0);
				const afternoonStart = futureDate(day, 14, 0);
				const afternoonEnd = futureDate(day, 15, 0);

				// Avoid duplicating exact slots
				const morningExists = await prisma.timeSlot.findFirst({
					where: { mentorId, startTime: morningStart },
				});
				if (!morningExists) {
					await prisma.timeSlot.create({
						data: {
							mentorId,
							startTime: morningStart,
							endTime: morningEnd,
							status: "AVAILABLE",
						},
					});
				}

				const afternoonExists = await prisma.timeSlot.findFirst({
					where: { mentorId, startTime: afternoonStart },
				});
				if (!afternoonExists) {
					await prisma.timeSlot.create({
						data: {
							mentorId,
							startTime: afternoonStart,
							endTime: afternoonEnd,
							status: "AVAILABLE",
						},
					});
				}
			}
		}
	}

	console.log(
		"[devBootstrap] Demo users ready. Password: " +
			(process.env.TEST_USERS_PASSWORD ? "(from TEST_USERS_PASSWORD)" : "DevPass123! (default)"),
	);
}
