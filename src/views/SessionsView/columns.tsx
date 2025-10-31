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
import { Row, createColumnHelper } from '@tanstack/react-table';
import { formatDate, isToday } from 'date-fns';
import { Ellipsis } from 'lucide-react';
import { Roles } from 'shared/db/queries';
import { toast } from 'sonner';

import { Session } from './SessionsView';

const columnHelper = createColumnHelper<Session>();

export const columns = [
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
	columnHelper.accessor(row => row.photo, {
		id: 'photo',
		header: ({ column }) => (
			<DataTableColumnHeader className='ml-2' column={column} title='Photo' />
		),
		cell: ({ row }) => (
			<div className='pl-4'>
				{row.getValue<string>('photo') && (
					<Dialog>
						<DialogTrigger asChild>
							<img
								src={`${import.meta.env.DEV ? 'https://horizon.proudindian.ngo' : ''}/cdn-cgi/image/height=80,quality=75/${env.VITE_IMAGE_CDN}/${row.getValue<string>('photo')}`}
								alt={`${formatDate(row.getValue('date'), 'dd LLL yyyy')} Session Photo`}
								className='h-7 object-contain cursor-pointer'
							/>
						</DialogTrigger>
						<DialogTitle className='hidden'>{`${formatDate(row.getValue('date'), 'dd LLL yyyy')} Session Photo`}</DialogTitle>
						<DialogContent
							className='max-w-7xl! border-0 bg-transparent p-0 shadow-none'
							aria-describedby={undefined}
						>
							<div className='relative h-[calc(100vh-220px)] w-full overflow-clip rounded-md bg-transparent'>
								<img
									src={`${import.meta.env.DEV ? 'https://horizon.proudindian.ngo' : ''}/cdn-cgi/image/height=800,quality=75/${env.VITE_IMAGE_CDN}/${row.getValue<string>('photo')}`}
									alt={`${formatDate(row.getValue('date'), 'dd LLL yyyy')} Session Photo`}
									className='h-full w-full object-contain'
								/>
							</div>
						</DialogContent>
					</Dialog>
				)}
			</div>
		)
	}),
	columnHelper.accessor(row => row.participants.length, {
		id: 'participants',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Participants' />
		),
		cell: ({ row }) => {
			const participants = row.original.participants.map(
				participant => participant.participant
			);
			return (
				<Dialog>
					<DialogTrigger asChild>
						<Button
							variant='ghost'
							className='h-auto p-0 font-normal hover:underline'
						>
							{row.getValue('participants')}
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogTitle>
							{formatDate(row.getValue('date'), 'dd LLL yyyy')} Session
							Participants
						</DialogTitle>
						<div className='max-h-96 overflow-y-auto'>
							{participants.length > 0 ? (
								<ul className='space-y-2'>
									{participants.map((participant, index) => (
										<li key={participant.id || index} className='text-sm'>
											{participant.name}
										</li>
									))}
								</ul>
							) : (
								<p className='text-sm text-muted-foreground'>No participants</p>
							)}
						</div>
					</DialogContent>
				</Dialog>
			);
		},
		meta: {
			displayName: 'Participants'
		}
	}),
	{
		id: 'actions',
		cell: ({ row }: { row: Row<Session> }) => {
			return <Actions session={row.original} />;
		},
		size: 32
	}
];

// eslint-disable-next-line react-refresh/only-export-components
const Actions = ({ session }: { session: Session }) => {
	const z = useZero();
	const {
		user: { role }
	} = useApp();

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
					variant='destructive'
					onSelect={() => {
						z.mutate.sessions
							.delete({
								id: session.id
							})
							.client.catch((e: Error) => {
								toast.error('Error deleting session', {
									description: e.message || 'Something went wrong'
								});
							});
					}}
					disabled={
						!isToday(new Date(session.createdAt!)) && role !== Roles.ADMIN
					}
				>
					Delete
				</DropDrawerItem>
			</DropDrawerContent>
		</DropDrawer>
	);
};
