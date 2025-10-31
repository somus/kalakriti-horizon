import {
	FormLayout,
	InputField,
	SelectField,
	SelectOption
} from '@/components/form';
import { DateField } from '@/components/form/DateField';
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
import { ClassOutletContext } from '@/layout/ClassLayout';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useOutletContext } from 'react-router';
import { genderEnum } from 'shared/db/schema';
import { Participant } from 'shared/db/zero-schema.gen';
import * as z from 'zod';

const participantSchema = z.object({
	name: z.string(),
	dob: z.date(),
	gender: z.enum(genderEnum.enumValues)
});

type ParticipantFormData = z.infer<typeof participantSchema>;

export default function ParticipantFormModal({
	participant,
	open,
	onOpenChange,
	children
}: {
	participant?: Participant;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}) {
	const zero = useZero();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { class: currentClass } = useOutletContext<ClassOutletContext>();

	if (!children && !(open !== undefined && onOpenChange)) {
		throw new Error(
			'ParticipantFormModal must have children or pass open and onOpenChange props'
		);
	}

	const genderOptions: SelectOption[] = [
		{ value: 'male', label: 'Male' },
		{ value: 'female', label: 'Female' }
	];

	// Get participant default values
	const defaultValues = useMemo(() => {
		if (!participant) {
			return {};
		}

		return {
			name: participant.name,
			dob: participant.dob ? new Date(participant.dob) : undefined,
			gender: participant.gender
		};
	}, [participant]);

	const form = useForm<ParticipantFormData>({
		resolver: zodResolver(participantSchema),
		defaultValues
	});

	const handleFormSubmit = async (data: ParticipantFormData) => {
		setIsSubmitting(true);

		try {
			if (!participant) {
				await zero.mutate.participants.create({
					name: data.name,
					// TODO: Fix timezone difference properly
					dob: data.dob.setHours(12),
					gender: data.gender,
					classId: currentClass.id
				}).client;
			} else {
				// Update participant
				await zero.mutate.participants.update({
					id: participant.id,
					name: data.name,
					dob: data.dob.setHours(12),
					gender: data.gender
				}).client;
			}

			// Close dialog on success
			setIsSubmitting(false);
			if (!participant) {
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
						{!participant ? 'Create Participant' : 'Update Participant'}
					</ModalTitle>
				</ModalHeader>
				<FormLayout<ParticipantFormData>
					form={form}
					onSubmit={form.handleSubmit(handleFormSubmit)}
					className='flex flex-col flex-1'
				>
					<ModalBody className='space-y-4'>
						<InputField name='name' label='Name' isRequired />
						<div className='flex gap-2'>
							<DateField
								name='dob'
								label='Date of Birth'
								disabledDates={{ after: new Date() }}
								isRequired
							/>
							<SelectField
								name='gender'
								label='Gender'
								options={genderOptions}
								isRequired
							/>
						</div>
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
