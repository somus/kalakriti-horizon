import { createColumnConfigHelper } from '@/components/data-table-filter/core/filters';
import { formatDate } from 'date-fns';
import { CalendarIcon, HashIcon } from 'lucide-react';

import { Session } from './SessionsView';

const dtf = createColumnConfigHelper<Session>();

export const columnsConfig = [
	dtf
		.text()
		.id('date')
		.accessor(row => row.createdAt && formatDate(row.createdAt, 'dd LLL yyyy'))
		.displayName('Date')
		.icon(CalendarIcon)
		.build(),
	dtf
		.option()
		.accessor(row => row.participants.length)
		.id('participants')
		.displayName('Participants')
		.icon(HashIcon)
		.options([
			{ label: 'Male', value: 'male' },
			{ label: 'Female', value: 'female' }
		])
		.build()
] as const;
