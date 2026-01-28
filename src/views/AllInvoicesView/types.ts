import { QueryRowType } from '@rocicorp/zero';
import { queries } from 'shared/db/queries';

export type InvoiceWithRelations = QueryRowType<
	typeof queries.allInvoicesWithRelations
>;
