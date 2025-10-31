import DataTableWrapper from '@/components/data-table-wrapper';
import { Button } from '@/components/ui/button';
import { env } from '@/env.client';
import { useApp } from '@/hooks/useApp';
import useZero from '@/hooks/useZero';
import { ClassOutletContext } from '@/layout/ClassLayout';
import { useAuth } from '@clerk/clerk-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { Roles } from 'shared/db/queries';
import { Invoice } from 'shared/db/zero-schema.gen';
import { toast } from 'sonner';

import { columns } from './columns';
import { columnsConfig } from './filters';

export default function InvoicesView() {
	'use no memo';
	useZero();
	const { class: currentClass } = useOutletContext<ClassOutletContext>();
	const {
		user: { role }
	} = useApp();
	const { getToken } = useAuth();
	const [isGenerating, setIsGenerating] = useState(false);

	if (!currentClass) {
		return (
			<div className='flex h-screen w-full items-center justify-center'>
				<p className='text-gray-500 dark:text-gray-400'>
					<p>Unable to load invoices</p>
				</p>
			</div>
		);
	}

	return (
		<DataTableWrapper
			data={currentClass.invoices as Invoice[]}
			columns={columns.filter(
				column =>
					[Roles.ADMIN, Roles.FINANCE, Roles.FACILITATOR].includes(
						role as Roles
					) || column.id !== 'actions'
			)}
			columnsConfig={columnsConfig}
			additionalActions={
				role !== Roles.ADMIN && role !== Roles.FINANCE
					? []
					: [
							<Button
								key='generate-invoices'
								className='h-7'
								// eslint-disable-next-line @typescript-eslint/no-misused-promises
								onClick={async () => {
									try {
										setIsGenerating(true);
										const token = await getToken();
										const res = await fetch(
											`${env.VITE_API_SERVER}/generate-invoices/${currentClass.id}`,
											{
												method: 'POST',
												headers: {
													Authorization: token ? `Bearer ${token}` : ''
												}
											}
										);
										if (!res.ok) {
											const body: unknown = await res.json().catch(() => ({}));
											const rawMessage =
												typeof body === 'object' && body && 'message' in body
													? (body as { message?: unknown }).message
													: undefined;
											const message =
												typeof rawMessage === 'string' ? rawMessage : '';
											throw new Error(message || 'Failed to generate invoices');
										}
										toast.success('Invoices generation triggered');
									} catch (e) {
										toast.error('Error generating invoice', {
											description:
												(e as Error).message ?? 'Something went wrong'
										});
									} finally {
										setIsGenerating(false);
									}
								}}
								disabled={isGenerating}
							>
								{isGenerating ? 'Generating…' : 'Generate Invoices'}
							</Button>
						]
			}
		/>
	);
}
