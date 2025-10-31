import { FormLayout } from '@/components/form';
import { FileUploader } from '@/components/form/ImageUploadField';
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
import { env } from '@/env.client';
import useZero from '@/hooks/useZero';
import { useAuth } from '@clerk/clerk-react';
import { zodResolver } from '@hookform/resolvers/zod';
import kebabCase from 'lodash/kebabCase';
import { LoaderCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Invoice } from 'shared/db/zero-schema.gen';
import * as z from 'zod';

const paymentScreenshotSchema = z.object({
	paymentScreenshot: z.string({ error: 'Photo is required' }).check(ctx => {
		if (!ctx.value || ctx.value === '') {
			ctx.issues.push({
				code: 'custom',
				message: 'Photo is required',
				input: ctx.value
			});
		} else if (!ctx.value.startsWith(`${env.VITE_ASSET_FOLDER}/`)) {
			ctx.issues.push({
				code: 'custom',
				message: 'Invalid photo path',
				input: ctx.value
			});
		}
	})
});

type PaymentScreenshotFormData = z.infer<typeof paymentScreenshotSchema>;

export default function PaymentScreenshotFormDialog({
	invoice,
	open,
	onOpenChange,
	children
}: {
	invoice: Invoice;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children?: React.ReactNode;
}) {
	const { getToken } = useAuth();
	const zero = useZero();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!children && !(open !== undefined && onOpenChange)) {
		throw new Error(
			'PaymentScreenshotFormModal must have children or pass open and onOpenChange props'
		);
	}

	// Get inventory default values
	const defaultValues = useMemo(() => {
		return {
			paymentScreenshot: invoice.paymentScreenshot ?? undefined
		};
	}, [invoice]);

	const form = useForm<PaymentScreenshotFormData>({
		resolver: zodResolver(paymentScreenshotSchema),
		defaultValues
	});

	const handleFormSubmit = async (data: PaymentScreenshotFormData) => {
		setIsSubmitting(true);

		try {
			const oldPhotoPath = invoice.paymentScreenshot;
			// Update inventory
			await zero.mutate.invoices
				.markPaid({
					id: invoice.id,
					paymentScreenshot: data.paymentScreenshot
				})
				.client.then(async () => {
					if (oldPhotoPath !== data.paymentScreenshot) {
						// Delete the old photo from R2 bucket
						const token = await getToken();
						await fetch(`${env.VITE_API_SERVER}/deleteAsset`, {
							method: 'DELETE',
							headers: {
								accept: 'application/json',
								Authorization: `Bearer ${token}`
							},
							body: JSON.stringify({
								filePath: oldPhotoPath
							})
						});
					}
				});

			// Close dialog on success
			setIsSubmitting(false);
			if (onOpenChange) {
				onOpenChange(false);
			} else {
				setIsModalOpen(false);
			}
		} catch (e) {
			console.error(e);
			setIsSubmitting(false);
			form.setError('root.scoresheetError', {
				type: e instanceof Error ? 'submitError' : 'unknownError',
				message: e instanceof Error ? e.message : 'Something went wrong'
			});
		}
	};

	return (
		<Modal
			open={open ?? isModalOpen}
			onOpenChange={onOpenChange ?? setIsModalOpen}
			// modal={false}
		>
			<ModalTrigger asChild>{children}</ModalTrigger>
			<ModalContent className='sm:max-w-[425px]' aria-describedby={undefined}>
				<ModalHeader>
					<ModalTitle>
						{!invoice.paymentScreenshot
							? 'Add Payment Screenshot'
							: 'Update Payment Screenshot'}
					</ModalTitle>
				</ModalHeader>
				<FormLayout<PaymentScreenshotFormData>
					form={form}
					onSubmit={form.handleSubmit(handleFormSubmit)}
					className='flex flex-col flex-1'
				>
					<ModalBody className='space-y-4'>
						<FormField
							control={form.control}
							name='paymentScreenshot'
							render={({ field }) => (
								<FormItem className='flex flex-col'>
									<FormLabel>Photo</FormLabel>
									<FormControl>
										{!field.value || field.value === '' ? (
											<FileUploader
												onUploadSuccess={result => {
													if (result.successful?.length === 1) {
														form.setValue(
															'paymentScreenshot',
															`${env.VITE_ASSET_FOLDER}/${kebabCase(result.successful[0].name)}`
														);
													}
												}}
												getToken={getToken}
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
