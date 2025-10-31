import LoadingScreen from '@/views/general/LoadingScreen';
import { UserResource } from '@clerk/types';
import { useQuery } from '@rocicorp/zero/react';
import { PropsWithChildren, createContext, useContext } from 'react';
import { queries } from 'shared/db/queries';
import { Class, User } from 'shared/db/zero-schema.gen';

interface UserType extends User {
	guardianingClasses: Class[];
	trainingClasses: Class[];
	coordinatingClasses: Class[];
}

interface AppContextProps {
	clerkUser: UserResource;
	user: UserType;
}

const AppContext = createContext<AppContextProps>({
	clerkUser: {
		id: ''
	} as UserResource,
	user: {
		id: '',
		firstName: '',
		lastName: '',
		email: '',
		phoneNumber: '',
		role: 'coordinator',
		createdAt: 0,
		updatedAt: 0,
		guardianingClasses: [],
		coordinatingClasses: [],
		trainingClasses: []
	}
});

export const AppProvider = ({
	children,
	context
}: PropsWithChildren<{ context: Omit<AppContextProps, 'user'> }>) => {
	const [user, status] = useQuery(
		queries.currentUser({
			sub: context.clerkUser.id,
			meta: context.clerkUser.publicMetadata
		})
	);

	if (status.type !== 'complete' || !user) {
		return <LoadingScreen />;
	}

	return (
		<AppContext.Provider
			value={{ ...context, user: user as unknown as UserType }}
		>
			{children}
		</AppContext.Provider>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
	return useContext(AppContext);
};
