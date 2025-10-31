import DataTableWrapper from '@/components/data-table-wrapper';
import { Button } from '@/components/ui/button';
import { useApp } from '@/hooks/useApp';
import LoadingScreen from '@/views/general/LoadingScreen';
import { QueryRowType } from '@rocicorp/zero';
import { useQuery } from '@rocicorp/zero/react';
import { queries } from 'shared/db/queries';

import UserFormDialog from './UserFormDialog';
import { columns } from './columns';
import { columnsConfig } from './filters';

export type User = QueryRowType<typeof queries.allUsers>;

export default function UsersView() {
	'use no memo';
	const [users, status] = useQuery(queries.allUsers());
	// const [prepareDownload, setPrepareDownload] = useState(false);
	const {
		user: { role }
	} = useApp();
	const isAdmin = role === 'admin';

	if (status.type !== 'complete') {
		return <LoadingScreen />;
	}

	if (!users) {
		return (
			<div className='flex h-screen w-full items-center justify-center'>
				<p className='text-gray-500 dark:text-gray-400'>
					<p>Unable to load users</p>
				</p>
			</div>
		);
	}

	return (
		<div className='relative flex flex-1'>
			<DataTableWrapper
				data={users as User[]}
				columns={columns}
				columnsConfig={columnsConfig}
				additionalActions={
					isAdmin
						? [
								<UserFormDialog key='create-user'>
									<Button className='h-7'>Create User</Button>
								</UserFormDialog>
							]
						: []
				}
			/>
		</div>
	);
}
