export interface AvailabilitySlotSyncService {
	reconcileForMentor(mentorId: string): Promise<void>;
}
