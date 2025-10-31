// mutators.ts
import { createId } from '@paralleldrive/cuid2';
import { Transaction, UpdateValue } from '@rocicorp/zero';

import { AuthData, assertIsAdmin } from '../permissions.ts';
import { Schema } from '../zero-schema.gen.ts';

interface CreateClassArgs {
	name: string;
	description?: string;
	coordinatorId: string;
	guardianId: string;
	trainerId: string;
	trainerCostPerSession: number;
}

type MutatorTx = Transaction<Schema>;

export function createClassMutators(authData: AuthData | undefined) {
	return {
		create: async (tx: MutatorTx, data: CreateClassArgs) => {
			assertIsAdmin(authData);
			const classId = createId();
			await tx.mutate.classes.insert({ id: classId, ...data });
		},
		update: async (
			tx: MutatorTx,
			change: UpdateValue<Schema['tables']['classes']>
		) => {
			assertIsAdmin(authData);
			await tx.mutate.classes.update({
				...change,
				updatedAt: new Date().getTime()
			});
		},
		delete: async (tx: MutatorTx, { id }: { id: string }) => {
			assertIsAdmin(authData);
			await tx.mutate.classes.delete({ id });
		}
	} as const;
}
