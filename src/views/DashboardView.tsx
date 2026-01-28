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
import LoadingScreen from '@/views/general/LoadingScreen';
import { QueryRowType } from '@rocicorp/zero';
import { useQuery } from '@rocicorp/zero/react';
import { Link } from 'react-router';
import { Roles, queries } from 'shared/db/queries';

import { ClassPage } from './ClassView/ClassView';

type ClassType = QueryRowType<typeof queries.classesWithRelations>;

export default function DashboardView() {
	const { user } = useApp();
	const [classes, status] = useQuery(
		queries.classesWithRelations({
			sub: user.id,
			meta: { role: (user.role as Roles) ?? undefined }
		})
	);

	if (status.type !== 'complete') {
		return <LoadingScreen />;
	}

	// Hide widgets entirely when user has no accessible classes
	if (!classes || classes.length === 0) {
		return (
			<div className='@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
				<div className='flex h-[50vh] w-full items-center justify-center'>
					<p className='text-muted-foreground'>
						No classes available yet. Check back later!
					</p>
				</div>
			</div>
		);
	}

	// Users with all-classes access (admin, facilitator, finance) always see dashboard
	const hasAllClassesAccess =
		user.role === Roles.ADMIN ||
		user.role === Roles.FACILITATOR ||
		user.role === Roles.FINANCE;

	// Show class view for users with limited access who only have one class
	if (classes.length === 1 && !hasAllClassesAccess) {
		return <ClassPage currentClass={classes[0]} />;
	}

	// Computed stats
	const totalClasses = classes.length;
	const totalParticipants = classes.reduce(
		(sum, c) => sum + c.participants.length,
		0
	);
	const totalSessions = classes.reduce((sum, c) => sum + c.sessions.length, 0);

	const allInvoices = classes.flatMap(c => c.invoices);
	const totalInvoices = allInvoices.length;
	const pendingApproval = allInvoices.filter(i => !i.approved).length;
	const pendingPayment = allInvoices.filter(i => i.approved && !i.paid).length;
	const paidInvoices = allInvoices.filter(i => i.paid).length;

	// Trainer earnings calculation
	const totalEarnings = classes.reduce(
		(sum, c) => sum + c.sessions.length * (c.trainerCostPerSession ?? 0),
		0
	);
	const invoicedEarnings = classes.reduce((sum, c) => {
		const approvedInvoiceCount = c.invoices.filter(i => i.approved).length;
		return sum + approvedInvoiceCount * (c.trainerCostPerSession ?? 0);
	}, 0);
	const pendingEarnings = totalEarnings - invoicedEarnings;

	// Gender distribution
	const allParticipants = classes.flatMap(c => c.participants);
	const maleCount = allParticipants.filter(p => p.gender === 'male').length;
	const femaleCount = allParticipants.filter(p => p.gender === 'female').length;

	const isAdminOrFacilitator =
		user.role === Roles.ADMIN || user.role === Roles.FACILITATOR;
	const hasFinanceAccess =
		user.role === Roles.ADMIN ||
		user.role === Roles.FACILITATOR ||
		user.role === Roles.FINANCE;
	const isTrainer = user.role === Roles.TRAINER;
	const isCoordinatorTrainerOrGuardian =
		user.role === Roles.COORDINATOR ||
		user.role === Roles.TRAINER ||
		user.role === Roles.GUARDIAN;

	// Classes label based on role
	const classesLabel = isCoordinatorTrainerOrGuardian
		? 'My Classes'
		: 'Total Classes';

	return (
		<div className='@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
			<div className='px-4'>
				<H3>Dashboard</H3>
			</div>

			{/* Stat Cards */}
			<div className='**:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 **:data-[slot=card]:bg-linear-to-t **:data-[slot=card]:from-primary/5 **:data-[slot=card]:to-card dark:**:data-[slot=card]:bg-card'>
				<Link to='/classes'>
					<Card className='@container/card'>
						<CardHeader className='relative'>
							<CardDescription>{classesLabel}</CardDescription>
							<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
								{totalClasses}
							</CardTitle>
						</CardHeader>
					</Card>
				</Link>

				<Card className='@container/card'>
					<CardHeader className='relative'>
						<CardDescription>Total Participants</CardDescription>
						<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
							{totalParticipants}
						</CardTitle>
					</CardHeader>
				</Card>

				<Card className='@container/card'>
					<CardHeader className='relative'>
						<CardDescription>Total Sessions</CardDescription>
						<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
							{totalSessions}
						</CardTitle>
					</CardHeader>
				</Card>

				{/* Finance-related cards */}
				{hasFinanceAccess && (
					<>
						<Card className='@container/card'>
							<CardHeader className='relative'>
								<CardDescription>Total Invoices</CardDescription>
								<CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
									{totalInvoices}
								</CardTitle>
							</CardHeader>
						</Card>

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
				{/* Participants by Class - Admin/Facilitator */}
				{isAdminOrFacilitator && classes.length > 0 && (
					<ParticipantsByClassChart classes={classes} />
				)}

				{/* Sessions by Class - Admin/Facilitator */}
				{isAdminOrFacilitator && classes.length > 0 && (
					<SessionsByClassChart classes={classes} />
				)}

				{/* Invoice Status - Admin/Finance */}
				{hasFinanceAccess && totalInvoices > 0 && (
					<InvoiceStatusChart
						pending={pendingApproval}
						approved={pendingPayment}
						paid={paidInvoices}
					/>
				)}

				{/* Participants by Gender - Coordinator/Trainer/Guardian */}
				{isCoordinatorTrainerOrGuardian && totalParticipants > 0 && (
					<GenderDistributionChart male={maleCount} female={femaleCount} />
				)}
			</div>
		</div>
	);
}

// Chart Components
function ParticipantsByClassChart({ classes }: { classes: ClassType[] }) {
	const chartData: ChartData[] = classes
		.filter(c => c.participants.length > 0)
		.slice(0, 5) // Limit to top 5 for readability
		.map((c, i) => ({
			name: c.name,
			value: c.participants.length,
			fill: `var(--chart-${i + 1})`
		}));

	const chartConfig: ChartConfig = Object.fromEntries(
		chartData.map((d, i) => [
			d.name,
			{ label: d.name, color: `var(--chart-${i + 1})` }
		])
	);

	if (chartData.length === 0) return null;

	return (
		<ChartPieDonut
			title='Participants by Class'
			dataLabel='Participants'
			chartData={chartData}
			chartConfig={chartConfig}
		/>
	);
}

function SessionsByClassChart({ classes }: { classes: ClassType[] }) {
	const chartData: ChartData[] = classes
		.filter(c => c.sessions.length > 0)
		.slice(0, 5)
		.map((c, i) => ({
			name: c.name,
			value: c.sessions.length,
			fill: `var(--chart-${i + 1})`
		}));

	const chartConfig: ChartConfig = Object.fromEntries(
		chartData.map((d, i) => [
			d.name,
			{ label: d.name, color: `var(--chart-${i + 1})` }
		])
	);

	if (chartData.length === 0) return null;

	return (
		<ChartPieDonut
			title='Sessions by Class'
			dataLabel='Sessions'
			chartData={chartData}
			chartConfig={chartConfig}
		/>
	);
}

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
