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
import { useQuery } from '@rocicorp/zero/react';
import { LoaderCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { queries } from 'shared/db/queries';
import { Class } from 'shared/db/zero-schema.gen';
import * as z from 'zod';

const classSchema = z.object({
	name: z.string({ error: 'Name is required' }),
	description: z.string().optional(),
	coordinatorId: z.string(),
	trainerId: z.string(),
	guardianId: z.string(),
	trainerCostPerSession: z.number().min(1)
});

type ClassFormData = z.infer<typeof classSchema>;

export default function ClassFormModal({
	currentClass,
	open,
	onOpenChange,
	children
}: {
	currentClass?: Class;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}) {
	const zero = useZero();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [guardians] = useQuery(queries.allGuardians());
	const [coordinators] = useQuery(queries.allCoordinators());
	const [trainers] = useQuery(queries.allTrainers());

	if (!children && !(open !== undefined && onOpenChange)) {
		throw new Error(
			'ClassFormModal must have children or pass open and onOpenChange props'
		);
	}

	const guardianOptions = guardians
		.sort((a, b) => a.firstName.localeCompare(b.firstName))
		.map(guardian => ({
			value: guardian.id,
			label: `${guardian.firstName} ${guardian.lastName ?? ''}`
		}));
	const coordinatorOptions = coordinators
		.sort((a, b) => a.firstName.localeCompare(b.firstName))
		.map(coordinator => ({
			value: coordinator.id,
			label: `${coordinator.firstName} ${coordinator.lastName ?? ''}`
		}));
	const trainerOptions = trainers
		.sort((a, b) => a.firstName.localeCompare(b.firstName))
		.map(trainer => ({
			value: trainer.id,
			label: `${trainer.firstName} ${trainer.lastName ?? ''}`
		}));

	// Get class default values
	const defaultValues = useMemo(() => {
		if (!currentClass) return {};

		return {
			name: currentClass.name,
			description: currentClass.description ?? undefined,
			coordinatorId: currentClass.coordinatorId ?? undefined,
			trainerId: currentClass.trainerId ?? undefined,
			guardianId: currentClass.guardianId ?? undefined,
			trainerCostPerSession: currentClass.trainerCostPerSession
		};
	}, [currentClass]);

	const form = useForm<ClassFormData>({
		resolver: zodResolver(classSchema),
		defaultValues
	});

	const handleFormSubmit = async (data: ClassFormData) => {
		setIsSubmitting(true);

		try {
			if (!currentClass) {
				// Create the class in db
				await zero.mutate.classes.create(data).client;
			} else {
				// Update class
				await zero.mutate.classes.update({ id: currentClass.id, ...data })
					.client;
			}

			// Close dialog on success
			setIsSubmitting(false);
			if (!currentClass) {
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
		>
			<ModalTrigger asChild>{children}</ModalTrigger>
			<ModalContent className='sm:max-w-[425px]' aria-describedby={undefined}>
				<ModalHeader>
					<ModalTitle>
						{!currentClass ? 'Create Class' : 'Update Class'}
					</ModalTitle>
				</ModalHeader>
				<FormLayout<ClassFormData>
					form={form}
					onSubmit={form.handleSubmit(handleFormSubmit)}
					className='flex flex-col flex-1'
				>
					<ModalBody className='space-y-4'>
						<InputField name='name' label='Name' isRequired />
						<InputField name='description' label='Description' />
						<SelectField
							name='guardianId'
							label='Guardian'
							options={guardianOptions}
							isRequired
						/>
						<SelectField
							name='coordinatorId'
							label='Coordinator'
							options={coordinatorOptions}
							isRequired
						/>
						<SelectField
							name='trainerId'
							label='Trainer'
							options={trainerOptions}
							isRequired
						/>
						<InputField
							name='trainerCostPerSession'
							label='Trainer Cost Per Session'
							isRequired
							type='number'
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
