import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { H3 } from '@/components/ui/typography';
import { Class, ClassOutletContext } from '@/layout/ClassLayout';
import { Link, useOutletContext } from 'react-router';

export default function ClassView() {
	const { class: currentClass } = useOutletContext<ClassOutletContext>();

	return <ClassPage currentClass={currentClass} />;
}

export function ClassPage({ currentClass }: { currentClass: Class }) {
	return (
		<div className='@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
			<div className='px-4 flex flex-col gap-2'>
				<div className='flex gap-2 items-baseline'>
					<H3>{currentClass.name}</H3>
					<p>{currentClass.description}</p>
				</div>
				<div className='flex gap-4 items-baseline'>
					<p>
						<strong>Guardian:</strong>
						{currentClass.guardian?.firstName} {currentClass.guardian?.lastName}
					</p>
					<p>
						<strong>Coordinator:</strong>
						{currentClass.coordinator?.firstName}{' '}
						{currentClass.coordinator?.lastName}
					</p>
					<p>
						<strong>Trainer:</strong>
						{currentClass.trainer?.firstName} {currentClass.trainer?.lastName}
					</p>
				</div>
			</div>
			<div className='**:data-[slot=card]:shadow-x @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 **:data-[slot=card]:bg-linear-to-t **:data-[slot=card]:from-primary/ **:data-[slot=card]:to-card dark:**:data-[slot=card]:bg-card'>
				<Link to={`/classes/${currentClass.id}/participants`}>
					<Card className='@container/card'>
						<CardHeader className='relative'>
							<CardDescription>Total Participants</CardDescription>
							<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
								{currentClass.participants.length}
							</CardTitle>
						</CardHeader>
					</Card>
				</Link>
				<Link to={`/classes/${currentClass.id}/sessions`}>
					<Card className='@container/card'>
						<CardHeader className='relative'>
							<CardDescription>Total Sessions</CardDescription>
							<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
								{currentClass.sessions.length}
							</CardTitle>
						</CardHeader>
					</Card>
				</Link>
				<Link to={`/classes/${currentClass.id}/invoices`}>
					<Card className='@container/card'>
						<CardHeader className='relative'>
							<CardDescription>Total Invoices</CardDescription>
							<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
								{currentClass.invoices.length}
							</CardTitle>
						</CardHeader>
					</Card>
				</Link>
			</div>
		</div>
	);
}
