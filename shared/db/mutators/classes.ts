// mutators.ts
import { createId } from '@paralleldrive/cuid2';
import { Transaction, UpdateValue } from '@rocicorp/zero';

import { AuthData, assertIsAdmin } from '../permissions.ts';
import { Schema } from '../zero-schema.gen.ts';

interface CreateClassArgs {
	name: string;
	description?: string;
	coordinatorIds: string[];
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

			for (const coordinatorId of data.coordinatorIds) {
				await tx.mutate.classCoordinators.insert({
					classId,
					coordinatorId
				});
			}
		},
		update: async (
			tx: MutatorTx,
			{
				coordinatorIds,
				...change
			}: UpdateValue<Schema['tables']['classes']> & {
				coordinatorIds?: string[];
			}
		) => {
			assertIsAdmin(authData);

			const currentClass = await tx.query.classes
				.where('id', change.id)
				.related('coordinators')
				.one()
				.run();

			if (!currentClass) {
				throw new Error('Class not found');
			}

			await tx.mutate.classes.update({
				...change,
				updatedAt: new Date().getTime()
			});

			if (coordinatorIds) {
				const currentCoordinatorIds = currentClass.coordinators.map(
					coordinator => coordinator.coordinatorId
				);

				// Determine which coordinators to remove and which to add
				const coordinatorsToRemove = currentCoordinatorIds.filter(
					id => !coordinatorIds.includes(id)
				);
				const coordinatorsToAdd = coordinatorIds.filter(
					id => !currentCoordinatorIds.includes(id)
				);

				// Remove deleted coordinators
				for (const coordinatorId of coordinatorsToRemove) {
					await tx.mutate.classCoordinators.delete({
						classId: currentClass.id,
						coordinatorId
					});
				}

				// Add new coordinators
				for (const coordinatorId of coordinatorsToAdd) {
					await tx.mutate.classCoordinators.insert({
						classId: currentClass.id,
						coordinatorId
					});
				}
			}
		},
		delete: async (tx: MutatorTx, { id }: { id: string }) => {
			assertIsAdmin(authData);
			await tx.mutate.classes.delete({ id });
		}
	} as const;
}
