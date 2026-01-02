import { createId } from '@paralleldrive/cuid2';
import { Transaction } from '@rocicorp/zero';

import {
	AuthData,
	assertIsAdmin,
	assertIsAdminOrFacilitator,
	assertIsAdminOrFinance
} from '../permissions.ts';
import { Schema } from '../zero-schema.gen.ts';

type MutatorTx = Transaction<Schema>;

export function createInvoiceMutators(authData: AuthData | undefined) {
	return {
		generateInvoice: async (tx: MutatorTx, classId: string) => {
			assertIsAdminOrFinance(authData);

			const sessions = await tx.query.sessions
				.where('classId', classId)
				.related('invoice')
				.run();
			const sessionsWithoutInvoice = sessions.filter(
				session => !session.invoice
			);

			if (sessionsWithoutInvoice.length === 0) {
				throw new Error('No sessions without invoice');
			}

			const invoiceId = createId();
			await tx.mutate.invoices.insert({
				id: invoiceId,
				classId,
				invoicePath: 'test-pdf.pdf'
			});
			for (const session of sessionsWithoutInvoice) {
				await tx.mutate.invoicedSessions.insert({
					invoiceId,
					sessionId: session.id
				});
			}
		},
		toggleApproved: async (tx: MutatorTx, id: string) => {
			assertIsAdminOrFacilitator(authData);

			const invoice = await tx.query.invoices.where('id', id).one().run();
			if (!invoice) {
				throw new Error('Invoice not found');
			}

			await tx.mutate.invoices.update({
				id,
				approved: !invoice.approved,
				updatedAt: new Date().getTime()
			});
		},
		markPaid: async (
			tx: MutatorTx,
			data: { id: string; paymentScreenshot: string }
		) => {
			assertIsAdmin(authData);

			const invoice = await tx.query.invoices.where('id', data.id).one().run();
			if (!invoice) {
				throw new Error('Invoice not found');
			}

			await tx.mutate.invoices.update({
				id: data.id,
				paymentScreenshot: data.paymentScreenshot,
				paid: true,
				updatedAt: new Date().getTime()
			});
		},
		delete: async (tx: MutatorTx, { id }: { id: string }) => {
			assertIsAdmin(authData);
			await tx.mutate.invoices.delete({ id });
		}
	} as const;
}
