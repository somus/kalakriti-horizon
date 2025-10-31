import { createId } from '@paralleldrive/cuid2';
import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View
} from '@react-pdf/renderer';
import { S3Client, SQL } from 'bun';
import React from 'react';

import { env } from './env.server';

interface ClassInfo {
	id: string;
	name: string;
	trainerCostPerSession: number;
	trainerFirstName: string | null;
	trainerLastName: string | null;
	trainerEmail: string | null;
	trainerPhoneNumber: string | null;
}

interface SessionRow {
	id: string;
	createdAt: Date;
}

const styles = StyleSheet.create({
	page: { padding: 32, fontSize: 10, color: '#111827' },
	headWrap: {
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB',
		paddingBottom: 12,
		marginBottom: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start'
	},
	brandWrap: { flexDirection: 'row', gap: 10, alignItems: 'center' },
	logo: { width: 96 },
	brand: { fontSize: 18, fontWeight: 700 },
	brandSub: { fontSize: 10, color: '#6B7280' },
	invoiceMeta: { textAlign: 'right' as const },
	metaLine: { fontSize: 10, marginBottom: 2 },
	section: { marginBottom: 14 },
	sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
	grid: { flexDirection: 'row', gap: 16 },
	col: { flexGrow: 1 },
	card: {
		borderWidth: 1,
		borderColor: '#E5E7EB',
		borderRadius: 4,
		padding: 10
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 4
	},
	label: { color: '#6B7280' },
	value: { fontWeight: 700 },
	table: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4 },
	thead: {
		flexDirection: 'row',
		backgroundColor: '#F9FAFB',
		borderBottomWidth: 1,
		borderBottomColor: '#E5E7EB'
	},
	th: { padding: 8, fontWeight: 700, fontSize: 10, flexGrow: 1 },
	tbodyRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6'
	},
	td: { padding: 8, fontSize: 10, flexGrow: 1 },
	amount: { textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' },
	totals: { marginTop: 8, alignSelf: 'flex-end', width: '50%' },
	divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 6 },
	footer: { marginTop: 18, fontSize: 9, color: '#6B7280' }
});

let logoCache: Uint8Array | null = null;
async function getLogo(): Promise<Uint8Array> {
	if (logoCache) return logoCache;
	const file = Bun.file(`${process.cwd()}/public/proud-indian-logo.png`);
	const arr = new Uint8Array(await file.arrayBuffer());
	logoCache = arr;
	return arr;
}

function formatINR(n: number): string {
	return `INR ${n.toLocaleString('en-IN')}`;
}

function createInvoiceDocument(
	classInfo: ClassInfo,
	sessions: SessionRow[],
	opts: { invoiceId: string; logoBytes: Uint8Array }
) {
	const sessionCount = sessions.length;
	const rate = classInfo.trainerCostPerSession;
	const subtotal = sessionCount * rate;
	const trainerName = [classInfo.trainerFirstName, classInfo.trainerLastName]
		.filter((v): v is string => Boolean(v))
		.join(' ');

	return React.createElement(
		Document,
		null,
		React.createElement(
			Page,
			{ size: 'A4', style: styles.page },
			// Header
			React.createElement(
				View,
				{ style: styles.headWrap },
				React.createElement(
					View,
					{ style: styles.brandWrap },
					React.createElement(Image, {
						style: styles.logo,
						src: `data:image/png;base64,${Buffer.from(opts.logoBytes).toString('base64')}`
					})
				),
				React.createElement(
					View,
					{ style: styles.invoiceMeta },
					React.createElement(
						Text,
						{ style: styles.metaLine },
						`Invoice #: ${opts.invoiceId}`
					),
					React.createElement(
						Text,
						{ style: styles.metaLine },
						`Date: ${new Date().toDateString()}`
					),
					React.createElement(
						Text,
						{ style: styles.metaLine },
						`Class: ${classInfo.name}`
					)
				)
			),

			// Parties
			React.createElement(
				View,
				{ style: styles.grid },
				React.createElement(
					View,
					{ style: [styles.col, styles.card] },
					React.createElement(
						Text,
						{ style: styles.sectionTitle },
						'Billed To'
					),
					React.createElement(
						View,
						{ style: styles.row },
						React.createElement(Text, { style: styles.label }, 'Trainer'),
						React.createElement(
							Text,
							{ style: styles.value },
							trainerName || 'N/A'
						)
					),
					React.createElement(
						View,
						{ style: styles.row },
						React.createElement(Text, { style: styles.label }, 'Email'),
						React.createElement(
							Text,
							{ style: styles.value },
							classInfo.trainerEmail ?? 'N/A'
						)
					),
					React.createElement(
						View,
						{ style: styles.row },
						React.createElement(Text, { style: styles.label }, 'Phone'),
						React.createElement(
							Text,
							{ style: styles.value },
							classInfo.trainerPhoneNumber ?? 'N/A'
						)
					)
				),
				React.createElement(
					View,
					{ style: [styles.col, styles.card] },
					React.createElement(
						Text,
						{ style: styles.sectionTitle },
						'Class Details'
					),
					React.createElement(
						View,
						{ style: styles.row },
						React.createElement(Text, { style: styles.label }, 'Class Name'),
						React.createElement(Text, { style: styles.value }, classInfo.name)
					),
					React.createElement(
						View,
						{ style: styles.row },
						React.createElement(
							Text,
							{ style: styles.label },
							'Rate / Session'
						),
						React.createElement(
							Text,
							{ style: [styles.value, styles.amount] },
							`₹ ${rate.toLocaleString()}`
						)
					)
				)
			),

			// Table
			React.createElement(
				View,
				{ style: [styles.section, styles.table] },
				React.createElement(
					View,
					{ style: styles.thead },
					React.createElement(
						Text,
						{ style: [styles.th, { width: '70%' }] },
						'Date'
					),
					React.createElement(
						Text,
						{ style: [styles.th, styles.amount, { width: '30%' }] },
						'Amount'
					)
				),
				...sessions.map((s, idx) =>
					React.createElement(
						View,
						{
							key: s.id,
							style: [
								{ ...styles.tbodyRow },
								idx % 2 ? { backgroundColor: '#FCFCFD' } : {}
							]
						},
						React.createElement(
							Text,
							{ style: [styles.td, { width: '70%' }] },
							new Date(s.createdAt).toDateString()
						),
						React.createElement(
							Text,
							{ style: [styles.td, styles.amount, { width: '30%' }] },
							formatINR(rate)
						)
					)
				)
			),

			// Totals
			React.createElement(
				View,
				{ style: styles.totals },
				React.createElement(
					View,
					{ style: styles.row },
					React.createElement(
						Text,
						{ style: styles.label },
						`Subtotal (${sessionCount} sessions)`
					),
					React.createElement(
						Text,
						{ style: [styles.value, styles.amount] },
						formatINR(subtotal)
					)
				)
			),

			// Footer
			React.createElement(
				View,
				{ style: styles.footer },
				React.createElement(
					Text,
					null,
					'Thank you for your contribution as a trainer.'
				)
			)
		)
	);
}

const R2 = new S3Client({
	region: 'auto',
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	accessKeyId: env.R2_ACCESS_KEY_ID,
	secretAccessKey: env.R2_SECRET_KEY_ID,
	bucket: env.R2_BUCKET_NAME
});

async function uploadPdfToR2(key: string, data: Blob): Promise<void> {
	const url = R2.presign(key, {
		method: 'PUT',
		type: 'application/pdf',
		expiresIn: 3600
	});
	await fetch(url, {
		method: 'PUT',
		headers: { 'content-type': 'application/pdf' },
		body: data
	});
}

export async function generateMissingInvoices() {
	const db = new SQL(env.ZERO_UPSTREAM_DB);
	try {
		// Find classes that have sessions without an invoice
		const missingRows: unknown = await db`
            SELECT DISTINCT s.class_id
            FROM sessions s
            LEFT JOIN invoiced_sessions inv ON inv.session_id = s.id
            WHERE inv.session_id IS NULL
        `;
		const missing: { class_id: string }[] = missingRows as unknown[] as {
			class_id: string;
		}[];

		for (const row of missing) {
			const classId = row.class_id;

			const classInfoRows: unknown = await db`
                SELECT 
                    c.id,
                    c.name,
                    c.trainer_cost_per_session as "trainerCostPerSession",
                    u.first_name as "trainerFirstName",
                    u.last_name as "trainerLastName",
                    u.email as "trainerEmail",
                    u.phone_number as "trainerPhoneNumber"
                FROM classes c
                LEFT JOIN users u ON u.id = c.trainer_id
                WHERE c.id = ${classId}
            `;
			const classInfo = (classInfoRows as unknown[] as ClassInfo[])[0];
			if (!classInfo) continue;

			const sessionsRows: unknown = await db`
                SELECT s.id, s.created_at as "createdAt"
                FROM sessions s
                LEFT JOIN invoiced_sessions inv ON inv.session_id = s.id
                WHERE s.class_id = ${classId} AND inv.session_id IS NULL
                ORDER BY s.created_at ASC
            `;
			const sessions: SessionRow[] = sessionsRows as unknown[] as SessionRow[];
			if (sessions.length === 0) continue;

			// Render PDF to buffer
			const { pdf } = await import('@react-pdf/renderer');
			const invoiceId = createId();
			const logoBytes = await getLogo();
			const docElement = createInvoiceDocument(classInfo, sessions, {
				invoiceId,
				logoBytes
			});
			const instance = pdf(docElement);
			const blob: Blob = await instance.toBlob();

			// Upload to R2
			const key = `${env.ASSET_FOLDER}/invoices/${invoiceId}.pdf`;
			await uploadPdfToR2(key, blob);

			// Create invoice + link sessions
			await db`
                INSERT INTO invoices (id, class_id, invoice_path)
                VALUES (${invoiceId}, ${classId}, ${key})
            `;
			for (const s of sessions) {
				await db`
                    INSERT INTO invoiced_sessions (invoice_id, session_id)
                    VALUES (${invoiceId}, ${s.id})
                `;
			}
		}
	} finally {
		await db.end();
	}
}

export async function generateMissingInvoicesForClass(classId: string) {
	const db = new SQL(env.ZERO_UPSTREAM_DB);
	try {
		const classInfoRows: unknown = await db`
            SELECT 
                c.id,
                c.name,
                c.trainer_cost_per_session as "trainerCostPerSession",
                u.first_name as "trainerFirstName",
                u.last_name as "trainerLastName",
                u.email as "trainerEmail",
                u.phone_number as "trainerPhoneNumber"
            FROM classes c
            LEFT JOIN users u ON u.id = c.trainer_id
            WHERE c.id = ${classId}
        `;
		const classInfo = (classInfoRows as unknown[] as ClassInfo[])[0];
		if (!classInfo) return;

		const sessionsRows: unknown = await db`
            SELECT s.id, s.created_at as "createdAt"
            FROM sessions s
            LEFT JOIN invoiced_sessions inv ON inv.session_id = s.id
            WHERE s.class_id = ${classId} AND inv.session_id IS NULL
            ORDER BY s.created_at ASC
        `;
		const sessions: SessionRow[] = sessionsRows as unknown[] as SessionRow[];
		if (sessions.length === 0) return;

		const { pdf } = await import('@react-pdf/renderer');
		const invoiceId = createId();
		const logoBytes = await getLogo();
		const docElement = createInvoiceDocument(classInfo, sessions, {
			invoiceId,
			logoBytes
		});
		const instance = pdf(docElement);
		const blob: Blob = await instance.toBlob();

		const key = `${env.ASSET_FOLDER}/invoices/${invoiceId}.pdf`;
		await uploadPdfToR2(key, blob);

		await db`
            INSERT INTO invoices (id, class_id, invoice_path)
            VALUES (${invoiceId}, ${classId}, ${key})
        `;
		for (const s of sessions) {
			await db`
                INSERT INTO invoiced_sessions (invoice_id, session_id)
                VALUES (${invoiceId}, ${s.id})
            `;
		}
	} finally {
		await db.end();
	}
}
