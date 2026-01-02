import { Transaction } from '@rocicorp/zero';

import { Roles } from './queries';
import { Schema } from './zero-schema.gen';

export interface AuthData {
	sub: string; // assuming sub is the user identifier
	meta: {
		role?: Roles;
	};
}

function assertIsLoggedIn(authData: AuthData | undefined) {
	if (!authData) {
		throw new Error('Unauthorized');
	}
}

export function assertIsAdmin(authData: AuthData | undefined) {
	assertIsLoggedIn(authData);
	if (authData?.meta.role !== Roles.ADMIN) {
		throw new Error('Unauthorized');
	}
}

export function assertIsAdminOrFinance(authData: AuthData | undefined) {
	assertIsLoggedIn(authData);
	if (
		authData?.meta.role !== Roles.ADMIN &&
		authData?.meta.role !== Roles.FINANCE
	) {
		throw new Error('Unauthorized');
	}
}

export function assertIsAdminOrFacilitator(authData: AuthData | undefined) {
	assertIsLoggedIn(authData);
	if (
		authData?.meta.role !== Roles.ADMIN &&
		authData?.meta.role !== Roles.FACILITATOR
	) {
		throw new Error('Unauthorized');
	}
}

export async function assertIsAdminOrFacilitatorOrTrainerOfClass(
	tx: Transaction<Schema>,
	authData: AuthData | undefined,
	classId: string
) {
	assertIsLoggedIn(authData);
	const isAdmin = authData?.meta.role === Roles.ADMIN;
	const isFacilitator = authData?.meta.role === Roles.FACILITATOR;
	const currentClass = await tx.query.classes.where('id', classId).one().run();
	const isTrainer = currentClass?.trainerId === authData?.sub;
	if (!isAdmin && !isFacilitator && !isTrainer) {
		throw new Error('Unauthorized');
	}
}

export async function assertIsAdminOrFacilitatorOrTrainerOfSession(
	tx: Transaction<Schema>,
	authData: AuthData | undefined,
	sessionId: string
) {
	assertIsLoggedIn(authData);
	const isAdmin = authData?.meta.role === Roles.ADMIN;
	const isFacilitator = authData?.meta.role === Roles.FACILITATOR;
	const session = await tx.query.sessions
		.where('id', sessionId)
		.related('class')
		.one()
		.run();
	const isTrainer = session?.class?.trainerId === authData?.sub;
	if (!isAdmin && !isFacilitator && !isTrainer) {
		throw new Error('Unauthorized');
	}
}

export async function assertIsAdminOrFacilitatorOrCoordinatorOfClass(
	tx: Transaction<Schema>,
	authData: AuthData | undefined,
	classId: string
) {
	assertIsLoggedIn(authData);
	const isAdmin = authData?.meta.role === Roles.ADMIN;
	const isFacilitator = authData?.meta.role === Roles.FACILITATOR;
	const center = await tx.query.classes
		.related('coordinators')
		.where('id', classId)
		.one()
		.run();
	const isCoordinator = center?.coordinators?.some(
		coordinator => coordinator.coordinatorId === authData?.sub
	);
	if (!isAdmin && !isFacilitator && !isCoordinator) {
		throw new Error('Unauthorized');
	}
}
