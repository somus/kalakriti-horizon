import { createColumnConfigHelper } from '@/components/data-table-filter/core/filters';
import {
	Heading1Icon,
	Heading2Icon,
	IndianRupeeIcon,
	ShieldUserIcon
} from 'lucide-react';

import { ClassType } from './ClassesView';

const dtf = createColumnConfigHelper<ClassType>();

export const columnsConfig = [
	dtf
		.text()
		.id('name')
		.accessor(row => row.name)
		.displayName('Name')
		.icon(Heading1Icon)
		.build(),
	dtf
		.text()
		.id('description')
		.accessor(row => row.description)
		.displayName('Name')
		.icon(Heading2Icon)
		.build(),
	dtf
		.option()
		.accessor(row => row.coordinator)
		.id('coordinator')
		.displayName('Coordinator')
		.icon(ShieldUserIcon)
		.transformOptionFn(c => ({
			value: c.id,
			label: `${c.firstName} ${c.lastName}`
		}))
		.build(),
	dtf
		.option()
		.accessor(row => row.guardian)
		.id('guardian')
		.displayName('Guardian')
		.icon(ShieldUserIcon)
		.transformOptionFn(c => ({
			value: c.id,
			label: `${c.firstName} ${c.lastName}`
		}))
		.build(),
	dtf
		.option()
		.accessor(row => row.trainer)
		.id('trainer')
		.displayName('Trainer')
		.icon(ShieldUserIcon)
		.transformOptionFn(c => ({
			value: c.id,
			label: `${c.firstName} ${c.lastName}`
		}))
		.build(),
	dtf
		.number()
		.id('trainerCostPerSession')
		.accessor(row => row.trainerCostPerSession)
		.displayName('Trainer Cost Per Session')
		.icon(IndianRupeeIcon)
		.build(),
	dtf
		.number()
		.id('participants')
		.accessor(row => row.participants)
		.displayName('Participants')
		.icon(IndianRupeeIcon)
		.build(),
	dtf
		.number()
		.id('sessions')
		.accessor(row => row.sessions)
		.displayName('Sessions')
		.icon(IndianRupeeIcon)
		.build()
] as const;
