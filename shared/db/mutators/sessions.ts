import { createId } from '@paralleldrive/cuid2';
import { Transaction } from '@rocicorp/zero';

import {
	AuthData,
	assertIsAdminOrFacilitatorOrTrainerOfClass,
	assertIsAdminOrFacilitatorOrTrainerOfSession
} from '../permissions.ts';
import { Schema } from '../zero-schema.gen.ts';

interface CreateSessionArgs {
	participantIds: string[];
	classId: string;
	photo: string;
}

type MutatorTx = Transaction<Schema>;

export function createSessionMutators(authData: AuthData | undefined) {
	return {
		create: async (tx: MutatorTx, data: CreateSessionArgs) => {
			if (data.participantIds.length === 0) {
				throw new Error('No participant IDs provided');
			}
			await assertIsAdminOrFacilitatorOrTrainerOfClass(
				tx,
				authData,
				data.classId
			);
			const sessionId = createId();
			await tx.mutate.sessions.insert({
				id: sessionId,
				classId: data.classId,
				photo: data.photo
			});

			for (const participantId of data.participantIds) {
				await tx.mutate.sessionParticipants.insert({
					participantId,
					sessionId
				});
			}
		},
		delete: async (tx: MutatorTx, { id }: { id: string }) => {
			await assertIsAdminOrFacilitatorOrTrainerOfSession(tx, authData, id);
			await tx.mutate.sessions.delete({ id });
		}
	} as const;
}
