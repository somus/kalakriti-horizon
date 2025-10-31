import { createColumnConfigHelper } from '@/components/data-table-filter/core/filters';
import { formatDate } from 'date-fns';
import { CalendarIcon, CheckIcon, ListCheckIcon, XIcon } from 'lucide-react';
import { Invoice } from 'shared/db/zero-schema.gen';

const dtf = createColumnConfigHelper<Invoice>();

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
		.id('approved')
		.accessor(row => (row.approved ?? false).toString())
		.displayName('Had Breakfast?')
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
		.displayName('Had Lunch?')
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
