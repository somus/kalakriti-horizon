import DataTableWrapper from '@/components/data-table-wrapper';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '@/components/ui/tooltip';
import { useApp } from '@/hooks/useApp';
import { ClassOutletContext } from '@/layout/ClassLayout';
import { isToday } from 'date-fns';
import { useOutletContext } from 'react-router';
import { Roles } from 'shared/db/queries';
import { Participant, Session as SessionType } from 'shared/db/zero-schema.gen';

import SessionFormDialog from './SessionFormDialog';
import { columns } from './columns';
import { columnsConfig } from './filters';

export type Session = SessionType & {
	participants: { participant: Participant }[];
};

export default function SessionsView() {
	'use no memo';
	const {
		user: { role }
	} = useApp();
	const { class: currentClass } = useOutletContext<ClassOutletContext>();

	if (!currentClass) {
		return (
			<div className='flex h-screen w-full items-center justify-center'>
				<p className='text-gray-500 dark:text-gray-400'>
					<p>Unable to load sessions</p>
				</p>
			</div>
		);
	}
	const sessionExistsForToday = currentClass.sessions.some(
		session => session.createdAt && isToday(new Date(session.createdAt))
	);

	const disableEditing = role !== Roles.TRAINER && role !== Roles.ADMIN;

	return (
		<div className='relative flex flex-1'>
			<DataTableWrapper
				data={currentClass.sessions as unknown as Session[]}
				columns={columns.filter(
					column => !disableEditing || column.id !== 'actions'
				)}
				columnsConfig={columnsConfig}
				additionalActions={
					disableEditing
						? []
						: [
								<SessionFormDialog key='create-session'>
									{sessionExistsForToday ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<span>
													<Button className='h-7' disabled>
														Create Session
													</Button>
												</span>
											</TooltipTrigger>
											<TooltipContent>
												Session already exists for today. Please delete it
												before creating a new one.
											</TooltipContent>
										</Tooltip>
									) : (
										<Button className='h-7'>Create Session</Button>
									)}
								</SessionFormDialog>
							]
				}
			/>
		</div>
	);
}
