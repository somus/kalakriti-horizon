import { relations } from 'drizzle-orm';
import {
	boolean,
	date,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	timestamp,
	varchar
} from 'drizzle-orm/pg-core';

export const rolesEnum = pgEnum('roles', [
	'guardian',
	'admin',
	'coordinator',
	'facilitator',
	'trainer',
	'finance'
]);
export const genderEnum = pgEnum('gender', ['male', 'female']);

export const users = pgTable('users', {
	id: varchar('id').primaryKey(),
	firstName: varchar('first_name').notNull(),
	lastName: varchar('last_name'),
	role: rolesEnum().default('coordinator').notNull(),
	phoneNumber: varchar('phone_number').notNull(),
	email: varchar('email').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
	coordinatingClasses: many(classes),
	trainingClasses: many(classes),
	guardianingClasses: many(classes)
}));

export const classes = pgTable('classes', {
	id: varchar('id').primaryKey(),
	name: varchar('name').notNull(),
	description: varchar('description'),
	guardianId: varchar('guardian_id').references(() => users.id, {
		onDelete: 'set null'
	}),
	coordinatorId: varchar('coordinator_id').references(() => users.id, {
		onDelete: 'set null'
	}),
	trainerId: varchar('trainer_id').references(() => users.id, {
		onDelete: 'set null'
	}),
	trainerCostPerSession: integer('trainer_cost_per_session').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const classesRelations = relations(classes, ({ one, many }) => ({
	coordinator: one(users, {
		fields: [classes.coordinatorId],
		references: [users.id]
	}),
	trainer: one(users, {
		fields: [classes.trainerId],
		references: [users.id]
	}),
	guardian: one(users, {
		fields: [classes.guardianId],
		references: [users.id]
	}),
	participants: many(participants),
	sessions: many(sessions),
	invoices: many(invoices)
}));

export const participants = pgTable('participants', {
	id: varchar('id').primaryKey(),
	name: varchar('name').notNull(),
	dob: date('dob').notNull(),
	age: integer('age').notNull(),
	gender: genderEnum().notNull(),
	classId: varchar('class_id')
		.notNull()
		.references(() => classes.id, {
			onDelete: 'cascade'
		}),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const participantsRelations = relations(
	participants,
	({ one, many }) => ({
		class: one(classes, {
			fields: [participants.classId],
			references: [classes.id]
		}),
		participatedSessions: many(sessionParticipants)
	})
);

export const sessions = pgTable('sessions', {
	id: varchar('id').primaryKey(),
	classId: varchar('class_id')
		.notNull()
		.references(() => classes.id, {
			onDelete: 'cascade'
		}),
	photo: varchar('photo'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
	participants: many(sessionParticipants),
	class: one(classes, {
		fields: [sessions.classId],
		references: [classes.id]
	}),
	invoice: one(invoicedSessions, {
		fields: [sessions.id],
		references: [invoicedSessions.sessionId]
	})
}));

export const sessionParticipants = pgTable(
	'session_participants',
	{
		participantId: varchar('participant_id')
			.notNull()
			.references(() => participants.id, { onDelete: 'cascade' }),
		sessionId: varchar('session_id')
			.notNull()
			.references(() => sessions.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	t => [primaryKey({ columns: [t.participantId, t.sessionId] })]
);

export const sessionParticipantsRelations = relations(
	sessionParticipants,
	({ one }) => ({
		session: one(sessions, {
			fields: [sessionParticipants.sessionId],
			references: [sessions.id]
		}),
		participant: one(participants, {
			fields: [sessionParticipants.participantId],
			references: [participants.id]
		})
	})
);

export const invoices = pgTable('invoices', {
	id: varchar('id').primaryKey(),
	classId: varchar('class_id')
		.references(() => classes.id, {
			onDelete: 'cascade'
		})
		.notNull(),
	invoicePath: varchar('invoice_path').notNull(),
	approved: boolean('approved').notNull().default(false),
	paid: boolean('paid').notNull().default(false),
	paymentScreenshot: varchar('payment_screenshot'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
	class: one(classes, {
		fields: [invoices.classId],
		references: [classes.id]
	}),
	sessions: many(invoicedSessions)
}));

export const invoicedSessions = pgTable(
	'invoiced_sessions',
	{
		invoiceId: varchar('invoice_id')
			.notNull()
			.references(() => invoices.id, { onDelete: 'cascade' }),
		sessionId: varchar('session_id')
			.notNull()
			.references(() => sessions.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	t => [primaryKey({ columns: [t.invoiceId, t.sessionId] })]
);

export const invoicedSessionsRelations = relations(
	invoicedSessions,
	({ one }) => ({
		session: one(sessions, {
			fields: [invoicedSessions.sessionId],
			references: [sessions.id]
		}),
		invoice: one(invoices, {
			fields: [invoicedSessions.invoiceId],
			references: [invoices.id]
		})
	})
);
