import DataTableWrapper from '@/components/data-table-wrapper';
import { Button } from '@/components/ui/button';
import { useApp } from '@/hooks/useApp';
import LoadingScreen from '@/views/general/LoadingScreen';
import { QueryRowType } from '@rocicorp/zero';
import { useQuery } from '@rocicorp/zero/react';
import { Roles, queries } from 'shared/db/queries';

import ClassFormDialog from './ClassFormDialog';
import { columns } from './columns';
import { columnsConfig } from './filters';

export type ClassType = QueryRowType<typeof queries.classesWithRelations>;

export default function ClassesView() {
	'use no memo';
	const { user } = useApp();
	const [classes, status] = useQuery(
		queries.classesWithRelations({
			sub: user.id,
			meta: { role: (user.role as Roles) ?? undefined }
		})
	);

	if (status.type !== 'complete') {
		return <LoadingScreen />;
	}

	if (!classes) {
		return (
			<div className='flex h-screen w-full items-center justify-center'>
				<p className='text-gray-500 dark:text-gray-400'>
					<p>Unable to load classes</p>
				</p>
			</div>
		);
	}

	return (
		<DataTableWrapper
			data={classes as ClassType[]}
			columns={columns}
			columnsConfig={columnsConfig}
			getRowLink={row => `/classes/${row.original.id}`}
			additionalActions={
				user.role === Roles.ADMIN
					? [
							<ClassFormDialog key='create-class'>
								<Button className='h-7'>Create Class</Button>
							</ClassFormDialog>
						]
					: []
			}
		/>
	);
}
