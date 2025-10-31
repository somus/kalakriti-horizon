import DataTableWrapper from '@/components/data-table-wrapper';
import { Button } from '@/components/ui/button';
import { useApp } from '@/hooks/useApp';
import { ClassOutletContext } from '@/layout/ClassLayout';
import { useOutletContext } from 'react-router';
import { Roles } from 'shared/db/queries';
import { Participant, SessionParticipant } from 'shared/db/zero-schema.gen';

import ParticipantFormDialog from './ParticipantFormDialog';
import { columns } from './columns';
import { columnsConfig } from './filters';

export type ParticipantType = Participant & {
	participatedSessions: SessionParticipant[];
};

export default function ParticipantsView() {
	'use no memo';
	const {
		user: { role }
	} = useApp();
	const { class: currentClass } = useOutletContext<ClassOutletContext>();

	if (!currentClass) {
		return (
			<div className='flex h-screen w-full items-center justify-center'>
				<p className='text-gray-500 dark:text-gray-400'>
					<p>Unable to load participants</p>
				</p>
			</div>
		);
	}

	const disableEditing =
		role === Roles.GUARDIAN ||
		role === Roles.TRAINER ||
		role === Roles.FINANCE ||
		(currentClass.sessions.length > 0 && role === Roles.COORDINATOR);

	return (
		<div className='relative flex flex-1'>
			<DataTableWrapper
				data={currentClass.participants as ParticipantType[]}
				columns={columns.filter(
					column => !disableEditing || column.id !== 'actions'
				)}
				columnsConfig={columnsConfig}
				additionalActions={[
					<ParticipantFormDialog key='create-participant'>
						<Button className='h-7' disabled={disableEditing}>
							Create Participant
						</Button>
					</ParticipantFormDialog>
				]}
			/>
		</div>
	);
}
