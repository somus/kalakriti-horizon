// mutators.ts
import { createId } from '@paralleldrive/cuid2';
import { Transaction, UpdateValue } from '@rocicorp/zero';
import { differenceInYears } from 'date-fns';

import {
	AuthData,
	assertIsAdminOrFacilitatorOrCoordinatorOfClass
} from '../permissions.ts';
import { Schema } from '../zero-schema.gen.ts';

interface CreateParticipantArgs {
	name: string;
	dob: number;
	gender: 'male' | 'female';
	classId: string;
}

type MutatorTx = Transaction<Schema>;

export function createParticipantMutators(authData: AuthData | undefined) {
	return {
		create: async (tx: MutatorTx, data: CreateParticipantArgs) => {
			await assertIsAdminOrFacilitatorOrCoordinatorOfClass(
				tx,
				authData,
				data.classId
			);
			const age = differenceInYears(new Date(), data.dob);

			// Create the participant in db
			await tx.mutate.participants.insert({
				id: createId(),
				...data,
				age
			});
		},
		update: async (
			tx: MutatorTx,
			change: UpdateValue<Schema['tables']['participants']>
		) => {
			const participant = await tx.query.participants
				.where('id', change.id)
				.one()
				.run();
			if (!participant) {
				throw new Error('Participant not found');
			}
			await assertIsAdminOrFacilitatorOrCoordinatorOfClass(
				tx,
				authData,
				change.id
			);
			await tx.mutate.participants.update({
				...change,
				updatedAt: new Date().getTime()
			});
		},
		delete: async (tx: MutatorTx, { id }: { id: string }) => {
			const participant = await tx.query.participants
				.where('id', id)
				.one()
				.run();
			if (!participant) {
				throw new Error('Participant not found');
			}
			await assertIsAdminOrFacilitatorOrCoordinatorOfClass(
				tx,
				authData,
				participant?.classId
			);
			await tx.mutate.participants.delete({ id });
		}
	} as const;
}
