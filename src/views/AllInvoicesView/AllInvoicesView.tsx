import DataTableWrapper from '@/components/data-table-wrapper';
import { Button } from '@/components/ui/button';
import { env } from '@/env.client';
import { useApp } from '@/hooks/useApp';
import useZero from '@/hooks/useZero';
import LoadingScreen from '@/views/general/LoadingScreen';
import { useAuth } from '@clerk/clerk-react';
import { useQuery } from '@rocicorp/zero/react';
import { useState } from 'react';
import { Roles, queries } from 'shared/db/queries';
import { toast } from 'sonner';

import { columns } from './columns';
import { columnsConfig } from './filters';
import { InvoiceWithRelations } from './types';

export default function AllInvoicesView() {
	'use no memo';
	const { user } = useApp();
	const z = useZero();
	const { getToken } = useAuth();
	const [isGenerating, setIsGenerating] = useState(false);
	const [isApproving, setIsApproving] = useState(false);

	const [invoices, status] = useQuery(
		queries.allInvoicesWithRelations({
			sub: user.id,
			meta: { role: (user.role as Roles) ?? undefined }
		})
	);

	if (status.type !== 'complete') {
		return <LoadingScreen />;
	}

	if (!invoices) {
		return (
			<div className='flex h-screen w-full items-center justify-center'>
				<p className='text-gray-500 dark:text-gray-400'>
					Unable to load invoices
				</p>
			</div>
		);
	}

	const handleApproveAllUnapproved = () => {
		const unapprovedInvoices = invoices.filter(
			invoice => !invoice.approved && !invoice.paid
		);

		if (unapprovedInvoices.length === 0) {
			toast.info('No unapproved invoices to approve');
			return;
		}

		setIsApproving(true);
		let errorOccurred = false;

		for (const invoice of unapprovedInvoices) {
			z.mutate.invoices.toggleApproved(invoice.id).client.catch((e: Error) => {
				errorOccurred = true;
				toast.error('Error approving invoice', {
					description: e.message || 'Something went wrong'
				});
			});
		}

		if (!errorOccurred) {
			toast.success(`Approved ${unapprovedInvoices.length} invoice(s)`);
		}
		setIsApproving(false);
	};

	const handleGenerateAllInvoices = async () => {
		try {
			setIsGenerating(true);
			const token = await getToken();
			const res = await fetch(`${env.VITE_API_SERVER}/generate-invoices`, {
				method: 'POST',
				headers: {
					Authorization: token ? `Bearer ${token}` : ''
				}
			});
			if (!res.ok) {
				const body: unknown = await res.json().catch(() => ({}));
				const rawMessage =
					typeof body === 'object' && body && 'message' in body
						? (body as { message?: unknown }).message
						: undefined;
				const message = typeof rawMessage === 'string' ? rawMessage : '';
				throw new Error(message || 'Failed to generate invoices');
			}
			toast.success('Invoice generation triggered for all classes');
		} catch (e) {
			toast.error('Error generating invoices', {
				description: (e as Error).message ?? 'Something went wrong'
			});
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<DataTableWrapper
			data={invoices as InvoiceWithRelations[]}
			columns={columns}
			columnsConfig={columnsConfig}
			additionalActions={
				user.role === Roles.ADMIN || user.role === Roles.FACILITATOR
					? [
							<Button
								key='approve-all'
								className='h-7'
								variant='outline'
								onClick={handleApproveAllUnapproved}
								disabled={isApproving}
							>
								{isApproving ? 'Approving…' : 'Approve All Unapproved'}
							</Button>,
							<Button
								key='generate-all-invoices'
								className='h-7'
								// eslint-disable-next-line @typescript-eslint/no-misused-promises
								onClick={handleGenerateAllInvoices}
								disabled={isGenerating}
							>
								{isGenerating ? 'Generating…' : 'Generate All Invoices'}
							</Button>
						]
					: [
							<Button
								key='generate-all-invoices'
								className='h-7'
								// eslint-disable-next-line @typescript-eslint/no-misused-promises
								onClick={handleGenerateAllInvoices}
								disabled={isGenerating}
							>
								{isGenerating ? 'Generating…' : 'Generate All Invoices'}
							</Button>
						]
			}
		/>
	);
}
