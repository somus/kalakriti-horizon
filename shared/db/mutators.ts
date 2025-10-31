// mutators.ts
import { ClerkClient } from '@clerk/backend';
import { CustomMutatorDefs } from '@rocicorp/zero';

import { createClassMutators } from './mutators/classes.ts';
import { createInvoiceMutators } from './mutators/invoices.ts';
import { createParticipantMutators } from './mutators/participants.ts';
import { createSessionMutators } from './mutators/sessions.ts';
import { createUserMutators } from './mutators/users.ts';
import { AuthData } from './permissions';

export function createMutators(
	authData: AuthData | undefined,
	clerkClient?: ClerkClient
) {
	return {
		users: createUserMutators(authData, clerkClient),
		classes: createClassMutators(authData),
		participants: createParticipantMutators(authData),
		sessions: createSessionMutators(authData),
		invoices: createInvoiceMutators(authData)
	} as const satisfies CustomMutatorDefs;
}
