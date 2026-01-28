import { createColumnConfigHelper } from '@/components/data-table-filter/core/filters';
import { formatDate } from 'date-fns';
import {
	CalendarIcon,
	CheckIcon,
	HashIcon,
	ListCheckIcon,
	SchoolIcon,
	UserIcon,
	XIcon
} from 'lucide-react';

import { InvoiceWithRelations } from './types';

const dtf = createColumnConfigHelper<InvoiceWithRelations>();

export const columnsConfig = [
	dtf
		.text()
		.id('className')
		.accessor(row => row.class?.name ?? '')
		.displayName('Class')
		.icon(SchoolIcon)
		.build(),
	dtf
		.text()
		.id('trainer')
		.accessor(row =>
			row.class?.trainer
				? `${row.class.trainer.firstName} ${row.class.trainer.lastName}`
				: ''
		)
		.displayName('Trainer')
		.icon(UserIcon)
		.build(),
	dtf
		.number()
		.id('sessionCount')
		.accessor(row => row.sessions?.length ?? 0)
		.displayName('Sessions')
		.icon(HashIcon)
		.build(),
	dtf
		.text()
		.id('date')
		.accessor(row => row.createdAt && formatDate(row.createdAt, 'dd LLL yyyy'))
		.displayName('Date')
		.icon(CalendarIcon)
		.build(),
	dtf
		.option()
		.id('approved')
		.accessor(row => (row.approved ?? false).toString())
		.displayName('Approved')
		.icon(ListCheckIcon)
		.options([
			{
				label: 'Yes',
				value: 'true',
				icon: <CheckIcon className='text-green-500' />
			},
			{
				label: 'No',
				value: 'false',
				icon: <XIcon className='text-destructive' />
			}
		])
		.build(),
	dtf
		.option()
		.id('paid')
		.accessor(row => (row.paid ?? false).toString())
		.displayName('Paid')
		.icon(ListCheckIcon)
		.options([
			{
				label: 'Yes',
				value: 'true',
				icon: <CheckIcon className='text-green-500' />
			},
			{
				label: 'No',
				value: 'false',
				icon: <XIcon className='text-destructive' />
			}
		])
		.build()
] as const;
