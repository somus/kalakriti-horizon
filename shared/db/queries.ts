import { syncedQuery, syncedQueryWithContext } from '@rocicorp/zero';
import z from 'zod';

import { AuthData } from './permissions';
import { builder } from './zero-schema.gen';

export enum Roles {
	ADMIN = 'admin',
	GUARDIAN = 'guardian',
	COORDINATOR = 'coordinator',
	FACILITATOR = 'facilitator',
	TRAINER = 'trainer',
	FINANCE = 'finance'
}

export const queries = {
	allUsers: syncedQuery('allUsers', z.tuple([]), () =>
		builder.users
			.related('guardianingClasses')
			.related('trainingClasses')
			.related('coordinatingClasses')
			.orderBy('createdAt', 'desc')
	),
	allGuardians: syncedQuery('allGuardians', z.tuple([]), () =>
		builder.users.where('role', Roles.GUARDIAN)
	),
	allCoordinators: syncedQuery('allCoordinators', z.tuple([]), () =>
		builder.users.where('role', Roles.COORDINATOR)
	),
	allTrainers: syncedQuery('allTrainers', z.tuple([]), () =>
		builder.users.where('role', Roles.TRAINER)
	),
	user: syncedQuery('user', z.tuple([z.string()]), ([id]) =>
		builder.users.where('id', id).one()
	),
	currentUser: syncedQueryWithContext(
		'currentUser',
		z.tuple([]),
		(ctx: AuthData) =>
			builder.users
				.where('id', ctx.sub)
				.related('guardianingClasses')
				.related('trainingClasses')
				.related('coordinatingClasses')
				.one()
	),
	classes: syncedQueryWithContext('classes', z.tuple([]), (ctx: AuthData) => {
		let query = builder.classes;
		if (ctx.meta.role === Roles.COORDINATOR) {
			query = query.whereExists('coordinators', q =>
				q.where('coordinatorId', ctx.sub)
			);
		}
		if (ctx.meta.role === Roles.GUARDIAN) {
			query = query.where('guardianId', ctx.sub);
		}
		if (ctx.meta.role === Roles.TRAINER) {
			query = query.where('trainerId', ctx.sub);
		}

		return query;
	}),
	classesWithRelations: syncedQueryWithContext(
		'classesWithRelations',
		z.tuple([]),
		(ctx: AuthData) => {
			const query = builder.classes
				.related('coordinators', q => q.related('coordinator'))
				.related('guardian')
				.related('invoices')
				.related('participants')
				.related('sessions')
				.related('trainer');
			if (ctx.meta.role === Roles.COORDINATOR) {
				query.whereExists('coordinators', q =>
					q.where('coordinatorId', ctx.sub)
				);
			}
			if (ctx.meta.role === Roles.GUARDIAN) {
				query.where('guardianId', ctx.sub);
			}
			if (ctx.meta.role === Roles.TRAINER) {
				query.where('trainerId', ctx.sub);
			}

			return query;
		}
	),
	class: syncedQueryWithContext(
		'class',
		z.tuple([z.cuid2()]),
		(ctx: AuthData, id) => {
			let query = builder.classes
				.related('coordinators', q => q.related('coordinator'))
				.related('guardian')
				.related('invoices')
				.related('participants', q => q.related('participatedSessions'))
				.related('sessions', q =>
					q.related('participants', q => q.related('participant'))
				)
				.related('trainer')
				.where('id', id);

			if (ctx.meta.role === Roles.COORDINATOR) {
				query = query.whereExists('coordinators', q =>
					q.where('coordinatorId', ctx.sub)
				);
			}

			if (ctx.meta.role === Roles.TRAINER) {
				query = query.where('trainerId', ctx.sub);
			}

			if (ctx.meta.role === Roles.GUARDIAN) {
				query = query.where('guardianId', ctx.sub);
			}

			return query.one();
		}
	),
	allInvoicesWithRelations: syncedQueryWithContext(
		'allInvoicesWithRelations',
		z.tuple([]),
		() => {
			return builder.invoices
				.related('class', q => q.related('trainer'))
				.related('sessions')
				.orderBy('createdAt', 'desc');
		}
	)
} as const;
