import { NavItem } from '@/components/nav-main';
import { useApp } from '@/hooks/useApp';
import { useQuery } from '@rocicorp/zero/react';
import {
	BadgeIndianRupeeIcon,
	HomeIcon,
	SchoolIcon,
	UserIcon,
	UsersIcon
} from 'lucide-react';
import { Roles, queries } from 'shared/db/queries';
import { Class } from 'shared/db/zero-schema.gen';

const homeNavItem: NavItem = {
	title: 'Dashboard',
	url: '/',
	icon: HomeIcon
};

const getAdminNavItems = (classes: Class[]): NavItem[] => [
	homeNavItem,
	{
		title: 'Users',
		url: '/users',
		icon: UsersIcon
	},
	{
		title: 'Invoices',
		url: '/invoices',
		icon: BadgeIndianRupeeIcon
	},
	{
		title: 'Classes',
		url: '/classes',
		icon: SchoolIcon,
		items: classes
			.map(cls => ({
				title: cls.name,
				url: `/classes/${cls.id}`,
				icon: SchoolIcon
			}))
			.sort((a, b) => a.title.localeCompare(b.title))
	}
];

const getSingleClassNavItemsForNonAdminUsers = (
	currentClass: Class,
	isTrainer: boolean
): NavItem[] => [
	homeNavItem,
	{
		title: 'Participants',
		url: `/classes/${currentClass.id}/participants`,
		icon: UserIcon
	},
	{
		title: 'Sessions',
		url: `/classes/${currentClass.id}/sessions`,
		icon: SchoolIcon
	},
	...(isTrainer
		? [
				{
					title: 'Invoices',
					url: `/classes/${currentClass.id}/invoices`,
					icon: BadgeIndianRupeeIcon
				}
			]
		: [])
];

const getMultipleClassNavItemsForNonAdminUsers = (
	classes: Class[],
	isTrainer: boolean
): NavItem[] => [
	homeNavItem,
	...classes.map(cls => ({
		title: cls.name,
		url: `/classes/${cls.id}`,
		icon: SchoolIcon,
		items: [
			{
				title: 'Participants',
				url: `/classes/${cls.id}/participants`
			},
			{
				title: 'Sessions',
				url: `/classes/${cls.id}/sessions`
			},
			...(isTrainer
				? [
						{
							title: 'Invoices',
							url: `/classes/${cls.id}/invoices`,
							icon: BadgeIndianRupeeIcon
						}
					]
				: [])
		]
	}))
];

export const useNavItems = () => {
	const { user } = useApp();
	const [classes] = useQuery(
		queries.classes({
			sub: user.id,
			meta: { role: (user.role as Roles) ?? undefined }
		})
	);

	if (!user) {
		return [];
	}

	if (user.role === 'admin') {
		return getAdminNavItems(classes);
	}

	if (user.role === 'facilitator' || user.role === 'finance') {
		return getAdminNavItems(classes).filter(item => item.title !== 'Users');
	}

	if (classes.length === 1) {
		const navItems = getSingleClassNavItemsForNonAdminUsers(
			classes[0],
			user.role === Roles.TRAINER
		);
		return navItems;
	}

	return getMultipleClassNavItemsForNonAdminUsers(
		classes,
		user.role === Roles.TRAINER
	);
};
