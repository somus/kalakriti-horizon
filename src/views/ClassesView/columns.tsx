import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropDrawer,
	DropDrawerContent,
	DropDrawerItem,
	DropDrawerTrigger
} from '@/components/ui/dropdrawer';
import useZero from '@/hooks/useZero';
import { Row, createColumnHelper } from '@tanstack/react-table';
import { Ellipsis } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import ClassFormDialog from './ClassFormDialog';
import { ClassType } from './ClassesView';

const columnHelper = createColumnHelper<ClassType>();

export const columns = [
	columnHelper.accessor(row => row.name, {
		id: 'name',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Name' />
		),
		cell: ({ row }) => <div>{row.getValue('name')}</div>
	}),
	columnHelper.accessor(row => row.description, {
		id: 'description',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Description' />
		),
		cell: ({ row }) => <div>{row.getValue('description')}</div>
	}),
	columnHelper.accessor(row => row.coordinator, {
		id: 'coordinator',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Coordinator' />
		),
		cell: ({ row }) => {
			const coordinator = row.getValue<ClassType['coordinator']>('coordinator');

			return (
				<Badge variant='outline' key={coordinator?.id}>
					{coordinator?.firstName} {coordinator?.lastName ?? ''}
				</Badge>
			);
		}
	}),
	columnHelper.accessor(row => row.guardian, {
		id: 'guardian',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Guardian' />
		),
		cell: ({ row }) => {
			const guardian = row.getValue<ClassType['guardian']>('guardian');

			return (
				<Badge variant='outline' key={guardian?.id}>
					{guardian?.firstName} {guardian?.lastName ?? ''}
				</Badge>
			);
		}
	}),
	columnHelper.accessor(row => row.trainer, {
		id: 'trainer',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Trainer' />
		),
		cell: ({ row }) => {
			const trainer = row.getValue<ClassType['trainer']>('trainer');

			return (
				<Badge variant='outline' key={trainer?.id}>
					{trainer?.firstName} {trainer?.lastName ?? ''}
				</Badge>
			);
		}
	}),
	columnHelper.accessor(row => row.trainerCostPerSession, {
		id: 'trainerCostPerSession',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Trainer Cost Per Session' />
		),
		cell: ({ row }) => <div>{row.getValue('trainerCostPerSession')}</div>
	}),
	columnHelper.accessor(row => row.participants.length, {
		id: 'participants',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Participants' />
		),
		cell: ({ row }) => <div>{row.getValue('participants')}</div>
	}),
	columnHelper.accessor(row => row.sessions.length, {
		id: 'sessions',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Sessions' />
		),
		cell: ({ row }) => <div>{row.getValue('sessions')}</div>
	}),
	{
		id: 'actions',
		cell: ({ row }: { row: Row<ClassType> }) => {
			return <Actions currentClass={row.original} />;
		},
		size: 32
	}
];

// eslint-disable-next-line react-refresh/only-export-components
const Actions = ({ currentClass }: { currentClass: ClassType }) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const z = useZero();

	return (
		<DropDrawer modal={false}>
			<DropDrawerTrigger asChild>
				<Button
					aria-label='Open menu'
					variant='ghost'
					className='flex p-0 data-[state=open]:bg-muted size-6'
					onClick={e => e.stopPropagation()}
				>
					<Ellipsis className='size-4' aria-hidden='true' />
				</Button>
			</DropDrawerTrigger>
			<DropDrawerContent align='end' onClick={e => e.stopPropagation()}>
				<DropDrawerItem onSelect={() => setIsDialogOpen(true)}>
					Edit
				</DropDrawerItem>
				<DropDrawerItem
					variant='destructive'
					onSelect={() => {
						z.mutate.classes
							.delete({
								id: currentClass.id
							})
							.client.catch((e: Error) => {
								toast.error('Error deleting class', {
									description: e.message || 'Something went wrong'
								});
							});
					}}
				>
					Delete
				</DropDrawerItem>
			</DropDrawerContent>
			{isDialogOpen && (
				<div onClick={e => e.stopPropagation()}>
					<ClassFormDialog
						currentClass={currentClass}
						open={isDialogOpen}
						onOpenChange={setIsDialogOpen}
					/>
				</div>
			)}
		</DropDrawer>
	);
};
