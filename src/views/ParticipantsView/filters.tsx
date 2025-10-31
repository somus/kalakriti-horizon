import { createColumnConfigHelper } from '@/components/data-table-filter/core/filters';
import {
	CalendarIcon,
	CircleSmallIcon,
	HashIcon,
	Heading1Icon
} from 'lucide-react';

import { ParticipantType } from './ParticipantsView';

const dtf = createColumnConfigHelper<ParticipantType>();

export const columnsConfig = [
	dtf
		.text()
		.id('name')
		.accessor(row => row.name)
		.displayName('Name')
		.icon(Heading1Icon)
		.build(),
	dtf
		.number()
		.id('age')
		.accessor(row => row.age)
		.displayName('Age')
		.icon(CalendarIcon)
		.build(),
	dtf
		.option()
		.accessor(row => row.gender)
		.id('gender')
		.displayName('Gender')
		.icon(CircleSmallIcon)
		.options([
			{ label: 'Male', value: 'male' },
			{ label: 'Female', value: 'female' }
		])
		.build(),
	dtf
		.number()
		.id('sessions')
		.accessor(row => row.participatedSessions.length)
		.displayName('Sessions')
		.icon(HashIcon)
		.build()
] as const;
