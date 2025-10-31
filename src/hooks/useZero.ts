import { useZero as useZ } from '@rocicorp/zero/react';
import { createMutators } from 'shared/db/mutators';
import { Schema } from 'shared/db/zero-schema.gen';

export default function useZero() {
	return useZ<Schema, ReturnType<typeof createMutators>>();
}
