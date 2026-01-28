import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog';
import {
	DropDrawer,
	DropDrawerContent,
	DropDrawerItem,
	DropDrawerTrigger
} from '@/components/ui/dropdrawer';
import { env } from '@/env.client';
import { useApp } from '@/hooks/useApp';
import useZero from '@/hooks/useZero';
import PaymentScreenshotFormDialog from '@/views/InvoicesView/PaymentScreenshotFormDialog';
import { Row, createColumnHelper } from '@tanstack/react-table';
import { formatDate } from 'date-fns';
import { CheckIcon, Ellipsis, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Roles } from 'shared/db/queries';
import { Invoice } from 'shared/db/zero-schema.gen';
import { toast } from 'sonner';

import { InvoiceWithRelations } from './types';

const columnHelper = createColumnHelper<InvoiceWithRelations>();

export const columns = [
	columnHelper.accessor(row => row.class?.name, {
		id: 'className',
		header: ({ column }) => (
			<DataTableColumnHeader className='ml-2' column={column} title='Class' />
		),
		cell: ({ row }) => (
			<div className='pl-4'>
				<Link
					to={`/classes/${row.original.classId}`}
					className='text-primary hover:underline'
				>
					{row.original.class?.name ?? 'Unknown'}
				</Link>
			</div>
		),
		sortingFn: 'alphanumeric',
		meta: {
			displayName: 'Class'
		}
	}),
	columnHelper.accessor(
		row =>
			row.class?.trainer
				? `${row.class.trainer.firstName} ${row.class.trainer.lastName}`
				: '',
		{
			id: 'trainer',
			header: ({ column }) => (
				<DataTableColumnHeader
					className='ml-2'
					column={column}
					title='Trainer'
				/>
			),
			cell: ({ row }) => (
				<div className='pl-4'>{row.getValue('trainer') ?? 'N/A'}</div>
			),
			sortingFn: 'alphanumeric',
			meta: {
				displayName: 'Trainer'
			}
		}
	),
	columnHelper.accessor(row => row.sessions?.length ?? 0, {
		id: 'sessionCount',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Sessions' />
		),
		cell: ({ row }) => (
			<div className='text-center'>{row.getValue('sessionCount')}</div>
		),
		sortingFn: 'basic',
		meta: {
			displayName: 'Sessions'
		}
	}),
	columnHelper.accessor(row => row.createdAt, {
		id: 'date',
		header: ({ column }) => (
			<DataTableColumnHeader className='ml-2' column={column} title='Date' />
		),
		cell: ({ row }) => (
			<div className='pl-4'>
				{formatDate(row.getValue('date'), 'dd LLL yyyy')}
			</div>
		),
		sortingFn: 'alphanumeric',
		meta: {
			displayName: 'Date'
		}
	}),
	columnHelper.accessor(row => row.invoicePath, {
		id: 'invoicePath',
		header: ({ column }) => (
			<DataTableColumnHeader
				className='ml-2'
				column={column}
				title='Invoice File'
			/>
		),
		cell: ({ row }) => (
			<div className='pl-4'>
				{row.getValue<string>('invoicePath') && (
					<Button variant='link' asChild className='h-7'>
						<a
							href={`${env.VITE_IMAGE_CDN}/${row.getValue<string>('invoicePath')}`}
							rel='noreferrer'
							target='_blank'
						>
							Download
						</a>
					</Button>
				)}
			</div>
		)
	}),
	columnHelper.accessor(row => (row.approved ?? false).toString(), {
		id: 'approved',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Approved' />
		),
		cell: ({ row }) => (
			<div className='capitalize'>
				{row.getValue('approved') === 'true' ? (
					<CheckIcon className='size-5 text-green-500' />
				) : (
					<XIcon className='size-5 text-destructive' />
				)}
			</div>
		),
		meta: {
			displayName: 'Approved'
		}
	}),
	columnHelper.accessor(row => (row.paid ?? false).toString(), {
		id: 'paid',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Paid' />
		),
		cell: ({ row }) => (
			<div className='capitalize'>
				{row.getValue('paid') === 'true' ? (
					<CheckIcon className='size-5 text-green-500' />
				) : (
					<XIcon className='size-5 text-destructive' />
				)}
			</div>
		),
		meta: {
			displayName: 'Paid'
		}
	}),
	columnHelper.accessor(row => row.paymentScreenshot, {
		id: 'paymentScreenshot',
		header: ({ column }) => (
			<DataTableColumnHeader
				className='ml-2'
				column={column}
				title='Payment Screenshot'
			/>
		),
		cell: ({ row }) => (
			<div className='pl-4'>
				{row.getValue<string>('paymentScreenshot') && (
					<Dialog>
						<DialogTrigger asChild>
							<img
								src={`${import.meta.env.DEV ? 'https://horizon.proudindian.ngo' : ''}/cdn-cgi/image/height=80,quality=75/${env.VITE_IMAGE_CDN}/${row.getValue<string>('paymentScreenshot')}`}
								alt={`${formatDate(row.getValue('date'), 'dd LLL yyyy')} invoice payment screenshot`}
								className='h-7 object-contain cursor-pointer'
							/>
						</DialogTrigger>
						<DialogTitle className='hidden'>{`${formatDate(row.getValue('date'), 'dd LLL yyyy')} invoice payment screenshot`}</DialogTitle>
						<DialogContent
							className='max-w-7xl! border-0 bg-transparent p-0 shadow-none'
							aria-describedby={undefined}
						>
							<div className='relative h-[calc(100vh-220px)] w-full overflow-clip rounded-md bg-transparent'>
								<img
									src={`${import.meta.env.DEV ? 'https://horizon.proudindian.ngo' : ''}/cdn-cgi/image/height=800,quality=75/${env.VITE_IMAGE_CDN}/${row.getValue<string>('paymentScreenshot')}`}
									alt={`${formatDate(row.getValue('date'), 'dd LLL yyyy')} invoice payment screenshot`}
									className='h-full w-full object-contain'
								/>
							</div>
						</DialogContent>
					</Dialog>
				)}
			</div>
		)
	}),
	{
		id: 'actions',
		cell: ({ row }: { row: Row<InvoiceWithRelations> }) => {
			return <Actions invoice={row.original} />;
		},
		size: 32
	}
];

// eslint-disable-next-line react-refresh/only-export-components
const Actions = ({ invoice }: { invoice: InvoiceWithRelations }) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const {
		user: { role }
	} = useApp();
	const z = useZero();

	return (
		<DropDrawer modal={false}>
			<DropDrawerTrigger asChild>
				<Button
					aria-label='Open menu'
					variant='ghost'
					className='flex size-6 p-0 data-[state=open]:bg-muted'
				>
					<Ellipsis className='size-4' aria-hidden='true' />
				</Button>
			</DropDrawerTrigger>
			<DropDrawerContent align='end'>
				<DropDrawerItem
					onSelect={() => {
						z.mutate.invoices
							.toggleApproved(invoice.id)
							.client.catch((e: Error) => {
								toast.error('Error toggling approval for invoice', {
									description: e.message || 'Something went wrong'
								});
							});
					}}
					disabled={
						!!invoice.paid ||
						(role !== Roles.ADMIN && role !== Roles.FACILITATOR)
					}
				>
					Toggle approve
				</DropDrawerItem>
				<DropDrawerItem
					onSelect={() => setIsDialogOpen(true)}
					disabled={
						!invoice.approved ||
						(role !== Roles.ADMIN && role !== Roles.FINANCE)
					}
				>
					Upload payment screenshot
				</DropDrawerItem>
				<DropDrawerItem
					variant='destructive'
					onSelect={() => {
						z.mutate.invoices
							.delete({
								id: invoice.id
							})
							.client.catch((e: Error) => {
								toast.error('Error deleting invoice', {
									description: e.message || 'Something went wrong'
								});
							});
					}}
					disabled={role !== Roles.ADMIN}
				>
					Delete
				</DropDrawerItem>
			</DropDrawerContent>
			{isDialogOpen && (
				<div onClick={e => e.stopPropagation()}>
					<PaymentScreenshotFormDialog
						invoice={invoice as Invoice}
						open={isDialogOpen}
						onOpenChange={setIsDialogOpen}
					/>
				</div>
			)}
		</DropDrawer>
	);
};
