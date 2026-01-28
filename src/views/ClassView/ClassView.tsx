import { ChartData, ChartPieDonut } from '@/components/pie-chart';
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { ChartConfig } from '@/components/ui/chart';
import { H3 } from '@/components/ui/typography';
import { useApp } from '@/hooks/useApp';
import { ClassOutletContext } from '@/layout/ClassLayout';
import { Link, useOutletContext } from 'react-router';
import { Roles } from 'shared/db/queries';

import { ClassType } from '../ClassesView/ClassesView';

export default function ClassView() {
	const { class: currentClass } = useOutletContext<ClassOutletContext>();

	return <ClassPage currentClass={currentClass} />;
}

export function ClassPage({ currentClass }: { currentClass: ClassType }) {
	const { user } = useApp();

	// Computed stats
	const totalParticipants = currentClass.participants.length;
	const totalSessions = currentClass.sessions.length;

	const invoices = currentClass.invoices;
	const totalInvoices = invoices.length;
	const pendingApproval = invoices.filter(i => !i.approved).length;
	const pendingPayment = invoices.filter(i => i.approved && !i.paid).length;
	const paidInvoices = invoices.filter(i => i.paid).length;

	// Trainer earnings calculation
	const totalEarnings =
		totalSessions * (currentClass.trainerCostPerSession ?? 0);
	const approvedInvoiceCount = invoices.filter(i => i.approved).length;
	const invoicedEarnings =
		approvedInvoiceCount * (currentClass.trainerCostPerSession ?? 0);
	const pendingEarnings = totalEarnings - invoicedEarnings;

	// Gender distribution
	const maleCount = currentClass.participants.filter(
		p => p.gender === 'male'
	).length;
	const femaleCount = currentClass.participants.filter(
		p => p.gender === 'female'
	).length;

	const hasFinanceAccess =
		user.role === Roles.ADMIN ||
		user.role === Roles.FACILITATOR ||
		user.role === Roles.FINANCE;
	const isTrainer = user.role === Roles.TRAINER;

	return (
		<div className='@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
			<div className='px-4 flex flex-col gap-2'>
				<div className='flex gap-2 items-baseline'>
					<H3>{currentClass.name}</H3>
					<p>{currentClass.description}</p>
				</div>
				<div className='flex gap-4 items-baseline flex-wrap'>
					<p>
						<strong>Guardian: </strong>
						{currentClass.guardian?.firstName} {currentClass.guardian?.lastName}
					</p>
					<p>
						<strong>
							Coordinator{currentClass.coordinators.length > 1 ? 's' : ''}:{' '}
						</strong>
						{currentClass.coordinators
							.map(
								coordinator =>
									`${coordinator.coordinator?.firstName} ${coordinator.coordinator?.lastName}`
							)
							.join(', ')}
					</p>
					<p>
						<strong>Trainer: </strong>
						{currentClass.trainer?.firstName} {currentClass.trainer?.lastName}
					</p>
				</div>
			</div>

			{/* Stat Cards */}
			<div className='**:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 **:data-[slot=card]:bg-linear-to-t **:data-[slot=card]:from-primary/5 **:data-[slot=card]:to-card dark:**:data-[slot=card]:bg-card'>
				<Link to={`/classes/${currentClass.id}/participants`}>
					<Card className='@container/card'>
						<CardHeader className='relative'>
							<CardDescription>Total Participants</CardDescription>
							<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
								{totalParticipants}
							</CardTitle>
						</CardHeader>
					</Card>
				</Link>

				<Link to={`/classes/${currentClass.id}/sessions`}>
					<Card className='@container/card'>
						<CardHeader className='relative'>
							<CardDescription>Total Sessions</CardDescription>
							<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
								{totalSessions}
							</CardTitle>
						</CardHeader>
					</Card>
				</Link>

				{/* Finance-related cards */}
				{hasFinanceAccess && (
					<>
						<Link to={`/classes/${currentClass.id}/invoices`}>
							<Card className='@container/card'>
								<CardHeader className='relative'>
									<CardDescription>Total Invoices</CardDescription>
									<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
										{totalInvoices}
									</CardTitle>
								</CardHeader>
							</Card>
						</Link>

						<Card className='@container/card'>
							<CardHeader className='relative'>
								<CardDescription>Pending Approval</CardDescription>
								<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
									{pendingApproval}
								</CardTitle>
							</CardHeader>
						</Card>

						<Card className='@container/card'>
							<CardHeader className='relative'>
								<CardDescription>Pending Payment</CardDescription>
								<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
									{pendingPayment}
								</CardTitle>
							</CardHeader>
						</Card>
					</>
				)}

				{/* Trainer earnings card */}
				{isTrainer && (
					<Card className='@container/card'>
						<CardHeader className='relative'>
							<CardDescription>Earnings Overview</CardDescription>
							<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
								₹{totalEarnings.toLocaleString()}
							</CardTitle>
							<p className='text-xs text-muted-foreground'>
								₹{invoicedEarnings.toLocaleString()} invoiced, ₹
								{pendingEarnings.toLocaleString()} pending
							</p>
						</CardHeader>
					</Card>
				)}
			</div>

			{/* Charts Section */}
			<div className='grid grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-3 gap-4 px-4'>
				{/* Invoice Status - Admin/Finance */}
				{hasFinanceAccess && totalInvoices > 0 && (
					<InvoiceStatusChart
						pending={pendingApproval}
						approved={pendingPayment}
						paid={paidInvoices}
					/>
				)}

				{/* Participants by Gender */}
				{totalParticipants > 0 && (
					<GenderDistributionChart male={maleCount} female={femaleCount} />
				)}
			</div>
		</div>
	);
}

// Chart Components
function InvoiceStatusChart({
	pending,
	approved,
	paid
}: {
	pending: number;
	approved: number;
	paid: number;
}) {
	const chartData: ChartData[] = [
		{ name: 'Pending', value: pending, fill: 'var(--chart-1)' },
		{ name: 'Approved', value: approved, fill: 'var(--chart-2)' },
		{ name: 'Paid', value: paid, fill: 'var(--chart-3)' }
	].filter(d => d.value > 0);

	const chartConfig: ChartConfig = {
		Pending: { label: 'Pending', color: 'var(--chart-1)' },
		Approved: { label: 'Approved', color: 'var(--chart-2)' },
		Paid: { label: 'Paid', color: 'var(--chart-3)' }
	};

	if (chartData.length === 0) return null;

	return (
		<ChartPieDonut
			title='Invoice Status'
			dataLabel='Invoices'
			chartData={chartData}
			chartConfig={chartConfig}
		/>
	);
}

function GenderDistributionChart({
	male,
	female
}: {
	male: number;
	female: number;
}) {
	const chartData: ChartData[] = [
		{ name: 'Male', value: male, fill: 'var(--chart-1)' },
		{ name: 'Female', value: female, fill: 'var(--chart-2)' }
	].filter(d => d.value > 0);

	const chartConfig: ChartConfig = {
		Male: { label: 'Male', color: 'var(--chart-1)' },
		Female: { label: 'Female', color: 'var(--chart-2)' }
	};

	if (chartData.length === 0) return null;

	return (
		<ChartPieDonut
			title='Participants by Gender'
			dataLabel='Participants'
			chartData={chartData}
			chartConfig={chartConfig}
		/>
	);
}
