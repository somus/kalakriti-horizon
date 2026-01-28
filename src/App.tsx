import { ErrorBoundaryFallback } from '@/components/global-error-boundaey';
import LoadingScreen from '@/views/general/LoadingScreen';
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Roles } from 'shared/db/queries';

import ProtectedRoute from './layout/ProtectedRoute';

const MainLayout = lazy(() => import('@/layout/MainLayout'));
const DefaultView = lazy(() => import('@/views/DefaultView'));
const UsersView = lazy(() => import('@/views/UsersView/UsersView'));
const ClassesView = lazy(() => import('@/views/ClassesView/ClassesView'));
const ClassLayout = lazy(() => import('@/layout/ClassLayout'));
const ClassView = lazy(() => import('@/views/ClassView/ClassView'));
const DashboardView = lazy(() => import('@/views/DashboardView'));
const ParticipantsView = lazy(
	() => import('@/views/ParticipantsView/ParticipantsView')
);
const SessionsView = lazy(() => import('@/views/SessionsView/SessionsView'));
const InvoicesView = lazy(() => import('@/views/InvoicesView/InvoicesView'));
const AllInvoicesView = lazy(
	() => import('@/views/AllInvoicesView/AllInvoicesView')
);

function App() {
	return (
		<BrowserRouter>
			<ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
				<Routes>
					<Route
						element={
							<Suspense fallback={<LoadingScreen />}>
								<MainLayout />
							</Suspense>
						}
					>
						<Route
							path='*'
							element={
								<Suspense fallback={<LoadingScreen />}>
									<DefaultView />
								</Suspense>
							}
						/>

						<Route
							path='/invoices'
							element={
								<ProtectedRoute
									allowedRoles={[Roles.ADMIN, Roles.FACILITATOR, Roles.FINANCE]}
								>
									<Suspense fallback={<LoadingScreen />}>
										<AllInvoicesView />
									</Suspense>
								</ProtectedRoute>
							}
						/>

						<Route
							path='/'
							element={
								<Suspense fallback={<LoadingScreen />}>
									<DashboardView />
								</Suspense>
							}
						/>

						{/* Admin Routes */}
						<Route element={<ProtectedRoute allowedRoles={[Roles.ADMIN]} />}>
							<Route path='/users'>
								<Route
									index
									element={
										<Suspense fallback={<LoadingScreen />}>
											<UsersView />
										</Suspense>
									}
								/>
							</Route>
						</Route>

						{/* Class Routes */}
						<Route path='/classes'>
							<Route
								index
								element={
									<ProtectedRoute
										allowedRoles={[
											Roles.ADMIN,
											Roles.FACILITATOR,
											Roles.FINANCE
										]}
									>
										<Suspense fallback={<LoadingScreen />}>
											<ClassesView />
										</Suspense>
									</ProtectedRoute>
								}
							/>
							<Route path=':classId' element={<ClassLayout />}>
								<Route
									index
									element={
										<Suspense fallback={<LoadingScreen />}>
											<ClassView />
										</Suspense>
									}
								/>
								<Route
									path='participants'
									element={
										<Suspense fallback={<LoadingScreen />}>
											<ParticipantsView />
										</Suspense>
									}
								/>
								<Route
									path='sessions'
									element={
										<Suspense fallback={<LoadingScreen />}>
											<SessionsView />
										</Suspense>
									}
								/>
								<Route
									path='invoices'
									element={
										<ProtectedRoute
											allowedRoles={[
												Roles.ADMIN,
												Roles.FACILITATOR,
												Roles.FINANCE,
												Roles.TRAINER
											]}
										>
											<Suspense fallback={<LoadingScreen />}>
												<InvoicesView />
											</Suspense>
										</ProtectedRoute>
									}
								/>
							</Route>
						</Route>
					</Route>
				</Routes>
			</ErrorBoundary>
		</BrowserRouter>
	);
}

export default App;
