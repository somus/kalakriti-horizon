import { useApp } from '@/hooks/useApp';
import LoadingScreen from '@/views/general/LoadingScreen';
import { Row } from '@rocicorp/zero';
import { useQuery } from '@rocicorp/zero/react';
import { Navigate, Outlet, useParams } from 'react-router';
import { Roles, queries } from 'shared/db/queries';
import * as z from 'zod';

export type Class = NonNullable<Row<ReturnType<typeof queries.class>>>;

export interface ClassOutletContext {
	class: Class;
}

export default function ClassLayout() {
	const params = useParams();
	const {
		user: { id, role }
	} = useApp();
	const classId = z.cuid2().parse(params.classId);
	const [currentClass, status] = useQuery(
		queries.class(
			{ sub: id, meta: { role: (role as Roles) ?? undefined } },
			classId
		)
	);

	if (!classId) {
		return <Navigate to='/' />;
	}

	if (status.type !== 'complete') {
		return <LoadingScreen />;
	}

	if (!currentClass) {
		return (
			<div className='flex h-screen w-full items-center justify-center'>
				<p className='text-gray-500 dark:text-gray-400'>
					<p>Unable to load class details</p>
				</p>
			</div>
		);
	}

	return <Outlet context={{ class: currentClass }} />;
}
