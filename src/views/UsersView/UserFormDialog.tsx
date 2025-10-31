import { FormLayout, InputField, SelectField } from '@/components/form';
import { Button } from '@/components/ui/button';
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ModalTrigger
} from '@/components/ui/credenza';
import useZero from '@/hooks/useZero';
import { zodResolver } from '@hookform/resolvers/zod';
import get from 'lodash/get';
import { LoaderCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Roles } from 'shared/db/queries';
import { rolesEnum } from 'shared/db/schema';
import { User } from 'shared/db/zero-schema.gen';
import * as z from 'zod';

const userSchema = z
	.object({
		id: z.string().optional(),
		firstName: z.string({ error: 'Please enter a valid first name' }),
		lastName: z.string().optional(),
		email: z.email({ error: 'Please enter a valid email address' }),
		password: z.string().optional(),
		role: z.enum(rolesEnum.enumValues).default('coordinator').optional(),
		phoneNumber: z
			.string()
			.refine(
				value => /^[6-9]\d{9}$/.test(value),
				'Please enter a valid indian mobile number'
			)
	})
	.check(ctx => {
		if (
			ctx.value.id === undefined &&
			(!ctx.value.password || ctx.value.password.length < 10)
		) {
			ctx.issues.push({
				code: 'custom',
				message: 'Password must be at least 10 characters long',
				path: ['password'],
				input: ctx.value.password
			});
		}
	});

type UserFormData = z.infer<typeof userSchema>;

export default function UserFormModal({
	user,
	open,
	onOpenChange,
	children
}: {
	user?: User;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}) {
	const zero = useZero();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Format user data for form
	const defaultValues = useMemo(() => {
		if (!user)
			return {
				role: Roles.COORDINATOR
			};

		return {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName ?? undefined,
			email: user.email,
			phoneNumber: user.phoneNumber,
			role: user.role ?? Roles.COORDINATOR
		};
	}, [user]);

	const form = useForm<UserFormData>({
		resolver: zodResolver(userSchema),
		defaultValues
	});

	// Form submission handler
	const handleFormSubmit = async (data: UserFormData) => {
		setIsSubmitting(true);

		try {
			// Prepare data based on create or update flow
			if (!user) {
				// Create user
				await zero.mutate.users.create({
					...data,
					role: (data.role as Roles) ?? Roles.COORDINATOR,
					password: data.password!
				}).server;
			} else {
				// Update user
				await zero.mutate.users.update({
					id: user.id,
					...data,
					lastName: data.lastName === '' ? null : data.lastName
				}).server;
			}

			// Close dialog on success
			setIsSubmitting(false);
			if (!user) {
				// Reset form values after creation
				form.reset();
			}
			if (onOpenChange) {
				onOpenChange(false);
			} else {
				setIsModalOpen(false);
			}
		} catch (e) {
			console.error(e);
			setIsSubmitting(false);
			form.setError('root.submissionError', {
				type: e instanceof Error ? 'submitError' : 'unknownError',
				message:
					e instanceof Error
						? e.message
						: (get(e, 'details') ?? 'Something went wrong')
			});
		}
	};

	if (!children && !(open !== undefined && onOpenChange)) {
		throw new Error(
			'UserFormModal must have children or pass open and onOpenChange props'
		);
	}

	// Prepare role options
	const roleOptions = rolesEnum.enumValues.map(role => ({
		value: role,
		label: role.charAt(0).toUpperCase() + role.slice(1)
	}));

	return (
		<Modal
			open={open ?? isModalOpen}
			onOpenChange={onOpenChange ?? setIsModalOpen}
		>
			<ModalTrigger asChild>{children}</ModalTrigger>
			<ModalContent className='sm:max-w-[425px]' aria-describedby={undefined}>
				<ModalHeader>
					<ModalTitle>{!user ? 'Create User' : 'Update User'}</ModalTitle>
				</ModalHeader>
				<FormLayout<UserFormData>
					form={form}
					onSubmit={form.handleSubmit(handleFormSubmit)}
					className='flex flex-col flex-1'
				>
					<ModalBody className='space-y-4'>
						<InputField name='firstName' label='First Name' isRequired />
						<InputField name='lastName' label='Last Name' />
						<InputField
							name='email'
							label='Email'
							type='email'
							disabled={!!user}
							isRequired
						/>
						<InputField name='phoneNumber' label='Phone Number' isRequired />
						<SelectField
							name='role'
							label='Role'
							options={roleOptions}
							isRequired
						/>
						{!user && (
							<InputField
								name='password'
								label='Password'
								type='password'
								isRequired
							/>
						)}
					</ModalBody>
					<ModalFooter>
						<Button type='submit' disabled={isSubmitting}>
							{isSubmitting && <LoaderCircle className='animate-spin mr-2' />}
							Save changes
						</Button>
					</ModalFooter>
				</FormLayout>
			</ModalContent>
		</Modal>
	);
}
