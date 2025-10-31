import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Button } from '@/components/ui/button';
import {
	DropDrawer,
	DropDrawerContent,
	DropDrawerItem,
	DropDrawerTrigger
} from '@/components/ui/dropdrawer';
import { useApp } from '@/hooks/useApp';
import useZero from '@/hooks/useZero';
import { cn } from '@/lib/utils';
import { Row, createColumnHelper } from '@tanstack/react-table';
import { Ellipsis } from 'lucide-react';
import { useState } from 'react';
import { Roles } from 'shared/db/queries';
import { toast } from 'sonner';

import UserFormDialog from './UserFormDialog';
import { User } from './UsersView';

const columnHelper = createColumnHelper<User>();

export const ROLE_STYLES_MAP = {
	[Roles.ADMIN]: 'bg-red-500 border-red-500',
	[Roles.COORDINATOR]: 'bg-teal-500 border-teal-500',
	[Roles.GUARDIAN]: 'bg-blue-500 border-blue-500',
	[Roles.TRAINER]: 'bg-yellow-500 border-yellow-500',
	[Roles.FACILITATOR]: 'bg-purple-500 border-purple-500',
	[Roles.FINANCE]: 'bg-green-500 border-green-500'
} as const;

export const columns = [
	columnHelper.accessor(row => row.firstName, {
		id: 'firstName',
		header: ({ column }) => (
			<DataTableColumnHeader
				className='ml-2'
				column={column}
				title='First Name'
			/>
		),
		cell: ({ row }) => <div className='pl-4'>{row.getValue('firstName')}</div>,
		meta: {
			displayName: 'First Name'
		}
	}),
	columnHelper.accessor(row => row.lastName, {
		id: 'lastName',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Last Name' />
		),
		cell: ({ row }) => <div>{row.getValue('lastName')}</div>,
		meta: {
			displayName: 'Last Name'
		}
	}),
	columnHelper.accessor(row => row.role, {
		id: 'role',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Role' />
		),
		cell: ({ row }) => {
			const role = row.getValue<User['role']>('role');

			if (!role) return null;

			return (
				<div className='flex gap-1'>
					<div
						className={cn(
							'flex items-center gap-1 py-1 px-2 rounded-full text-[11px] tracking-[-0.01em] shadow-xs',
							ROLE_STYLES_MAP[role],
							'border-none text-white font-medium capitalize'
						)}
					>
						{role}
					</div>
				</div>
			);
		},
		meta: {
			displayName: 'Role'
		}
	}),
	columnHelper.accessor(row => row.email, {
		id: 'email',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Email' />
		),
		cell: ({ row }) => <div>{row.getValue('email')}</div>,
		meta: {
			displayName: 'Email'
		}
	}),
	columnHelper.accessor(row => row.phoneNumber, {
		id: 'phoneNumber',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Phone Number' />
		),
		cell: ({ row }) => <div>{row.getValue('phoneNumber')}</div>,
		meta: {
			displayName: 'Phone Number'
		}
	}),
	{
		id: 'actions',
		cell: ({ row }: { row: Row<User> }) => {
			return <Actions user={row.original} />;
		},
		size: 32
	}
];

// eslint-disable-next-line react-refresh/only-export-components
const Actions = ({ user }: { user: User }) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const z = useZero();
	const {
		user: { role }
	} = useApp();

	if (role !== 'admin') {
		return null;
	}

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
				<DropDrawerItem onSelect={() => setIsDialogOpen(true)}>
					Edit
				</DropDrawerItem>
				<DropDrawerItem
					variant='destructive'
					onSelect={() => {
						z.mutate.users
							.delete({
								id: user.id
							})
							.server.catch((e: Error) => {
								toast.error('Error deleting user', {
									description: e.message || 'Something went wrong'
								});
							});
					}}
				>
					Delete
				</DropDrawerItem>
			</DropDrawerContent>
			{isDialogOpen && (
				<UserFormDialog
					user={user}
					open={isDialogOpen}
					onOpenChange={setIsDialogOpen}
				/>
			)}
		</DropDrawer>
	);
};
