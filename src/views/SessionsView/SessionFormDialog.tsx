import { FormLayout } from '@/components/form';
import { FileUploader } from '@/components/form/ImageUploadField';
import { MultiSelectField } from '@/components/form/MultiSelectField';
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
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';
import { Option } from '@/components/ui/input-multiselect';
import { env } from '@/env.client';
import useZero from '@/hooks/useZero';
import { ClassOutletContext } from '@/layout/ClassLayout';
import { useAuth } from '@clerk/clerk-react';
import { zodResolver } from '@hookform/resolvers/zod';
import kebabCase from 'lodash/kebabCase';
import { LoaderCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useOutletContext } from 'react-router';
import { Session } from 'shared/db/zero-schema.gen';
import * as z from 'zod';

const sessionSchema = z.object({
	participantIds: z.array(z.cuid2()).min(1),
	photo: z.string({ error: 'Photo is required' }).check(ctx => {
		if (
			ctx.value &&
			ctx.value !== '' &&
			!ctx.value.startsWith(`${env.VITE_ASSET_FOLDER}/`)
		) {
			ctx.issues.push({
				code: 'custom',
				message: 'Invalid photo',
				input: ctx.value
			});
		}
	})
});

type SessionFormData = z.infer<typeof sessionSchema>;

export default function SessionFormModal({
	session,
	open,
	onOpenChange,
	children
}: {
	session?: Session;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}) {
	const { getToken } = useAuth();
	const zero = useZero();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { class: currentClass } = useOutletContext<ClassOutletContext>();

	if (!children && !(open !== undefined && onOpenChange)) {
		throw new Error(
			'SessionFormModal must have children or pass open and onOpenChange props'
		);
	}

	const participantOptions: Option[] = [...currentClass.participants]
		.sort((a, b) => a.name.localeCompare(b.name))
		.map(participant => ({
			value: participant.id,
			label: participant.name
		}));

	// Get session default values
	const defaultValues = useMemo(() => {
		return {};
	}, []);

	const form = useForm<SessionFormData>({
		resolver: zodResolver(sessionSchema),
		defaultValues
	});

	const handleFormSubmit = async (data: SessionFormData) => {
		setIsSubmitting(true);

		try {
			await zero.mutate.sessions.create({
				photo: data.photo,
				participantIds: data.participantIds,
				classId: currentClass.id
			}).client;

			// Close dialog on success
			setIsSubmitting(false);
			// Reset form values after creation
			form.reset();

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
				message: e instanceof Error ? e.message : 'Something went wrong'
			});
		}
	};

	return (
		<Modal
			open={open ?? isModalOpen}
			onOpenChange={onOpenChange ?? setIsModalOpen}
			modal={false}
		>
			<ModalTrigger asChild>{children}</ModalTrigger>
			<ModalContent className='sm:max-w-[445px]' aria-describedby={undefined}>
				<ModalHeader>
					<ModalTitle>
						{!session ? 'Create Session' : 'Update Session'}
					</ModalTitle>
				</ModalHeader>
				<FormLayout<SessionFormData>
					form={form}
					onSubmit={form.handleSubmit(handleFormSubmit)}
					className='flex flex-col flex-1'
				>
					<ModalBody className='space-y-4'>
						<MultiSelectField
							name='participantIds'
							label='Participants'
							options={participantOptions}
							placeholder='Select participants'
						/>
						<FormField
							control={form.control}
							name='photo'
							render={({ field }) => (
								<FormItem className='flex flex-col'>
									<FormLabel>Photo</FormLabel>
									<FormControl>
										{!field.value || field.value === '' ? (
											<FileUploader
												onUploadSuccess={result => {
													if (result.successful?.length === 1) {
														form.setValue(
															'photo',
															`${env.VITE_ASSET_FOLDER}/${kebabCase(result.successful[0].name)}`
														);
													}
												}}
												getToken={getToken}
												enableCamera={false}
											/>
										) : (
											<img
												src={`${import.meta.env.DEV ? 'https://horizon.proudindian.ngo' : ''}/cdn-cgi/image/height=500,quality=75/${env.VITE_IMAGE_CDN}/${field.value}`}
												className='object-contain cursor-pointer'
											/>
										)}
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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
