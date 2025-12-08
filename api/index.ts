import { createClerkClient } from '@clerk/backend';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import { ReadonlyJSONValue, withValidation } from '@rocicorp/zero';
import {
	PostgresJSConnection,
	PushProcessor,
	ZQLDatabase,
	handleGetQueriesRequest
} from '@rocicorp/zero/pg';
import * as Sentry from '@sentry/bun';
import { createMutators } from '@shared/db/mutators';
import { AuthData } from '@shared/db/permissions';
import { Roles, queries } from '@shared/db/queries';
import { schema } from '@shared/db/zero-schema.gen';
import { S3Client } from 'bun';
import { CronJob } from 'cron';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import kebabCase from 'lodash/kebabCase';
import postgres from 'postgres';
import { z } from 'zod';

import { env } from './env.server';
import {
	generateMissingInvoices,
	generateMissingInvoicesForClass
} from './invoices';

//
// Sentry initialization (unchanged)
//
if (env.SENTRY_DSN) {
	Sentry.init({
		dsn: env.SENTRY_DSN,
		// Tracing
		tracesSampleRate: 1.0,
		// Send structured logs to Sentry
		enableLogs: true,
		integrations: [
			// send console.log, console.error, and console.warn calls as logs to Sentry
			Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn'] })
		]
	});
}

const fileSchema = z.object({
	filename: z.string().min(1),
	contentType: z.string().min(1)
});

const R2 = new S3Client({
	region: 'auto',
	endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	accessKeyId: env.R2_ACCESS_KEY_ID,
	secretAccessKey: env.R2_SECRET_KEY_ID,
	bucket: env.R2_BUCKET_NAME
});

const processor = new PushProcessor(
	new ZQLDatabase(
		new PostgresJSConnection(postgres(env.ZERO_UPSTREAM_DB)),
		schema
	)
);

const app = new Hono().basePath('/api');
const clerkClient = createClerkClient({
	secretKey: env.CLERK_SECRET_KEY
});

app.use('*', cors());
app.use('*', clerkMiddleware());

app.get('/', c => {
	return c.json({
		message: 'OK'
	});
});

app.post('/push', async c => {
	const auth = getAuth(c);
	if (!auth?.userId) {
		return c.json({
			message: 'You are not logged in.'
		});
	}

	try {
		const user = await clerkClient.users.getUser(auth.userId);

		const result = await processor.process(
			createMutators(
				{
					sub: auth.userId,
					meta: {
						role: user.publicMetadata.role as AuthData['meta']['role']
					}
				},
				clerkClient
			),
			c.req.raw
		);
		return c.json(result);
	} catch (e) {
		return Error.isError(e) ? c.json(e) : c.json({ message: e });
	}
});

app.post('/get-queries', async c => {
	const auth = getAuth(c);
	if (!auth?.userId) {
		return c.json({
			message: 'You are not logged in.'
		});
	}
	try {
		const user = await clerkClient.users.getUser(auth.userId);
		return c.json(
			await handleGetQueriesRequest(
				(name, args) =>
					getQuery(
						{
							sub: auth.userId,
							meta: {
								role: user.publicMetadata.role as AuthData['meta']['role']
							}
						},
						name,
						args
					),
				schema,
				c.req.raw
			)
		);
	} catch (e) {
		return Error.isError(e) ? c.json(e) : c.json({ message: e });
	}
});

// Build a map of queries with validation by name.
const validated = Object.fromEntries(
	Object.values(queries).map(q => [q.queryName, withValidation(q)])
);

function getQuery(
	context: AuthData,
	name: string,
	args: readonly ReadonlyJSONValue[]
) {
	const q = validated[name];
	if (!q) {
		throw new Error(`No such query: ${name}`);
	}
	return {
		// First param is the context for contextful queries.
		// `args` are validated using the `parser` you provided with
		// the query definition.
		query: q(context, ...args)
	};
}

app.post('/getSignedURL', async c => {
	const auth = getAuth(c);
	if (!auth?.userId) {
		return c.json({
			message: 'You are not logged in.'
		});
	}

	try {
		const body: unknown = await c.req.json();
		const { filename, contentType } = fileSchema.parse(body);

		const signedUrl = R2.presign(`${env.ASSET_FOLDER}/${kebabCase(filename)}`, {
			expiresIn: 3600, // 1 hour
			method: 'PUT',
			type: contentType
		});

		c.header('Access-Control-Allow-Origin', '*');
		return c.json({
			url: signedUrl,
			method: 'PUT'
		});
	} catch (e) {
		return Error.isError(e) ? c.json(e) : c.json({ message: e });
	}
});

app.post('/generate-invoices', async c => {
	const auth = getAuth(c);
	if (!auth?.userId) {
		return c.json({ message: 'You are not logged in.' }, 401);
	}
	try {
		const user = await clerkClient.users.getUser(auth.userId);
		const role = user.publicMetadata.role as AuthData['meta']['role'];
		if (!(role === Roles.ADMIN || role === Roles.FINANCE)) {
			return c.json({ message: 'Forbidden' }, 403);
		}
		await generateMissingInvoices();
		return c.json({ ok: true });
	} catch (e) {
		// Log full error for debugging (e.g., ERR_POSTGRES_SYNTAX_ERROR)
		console.error('Error in /generate-invoices:', e);
		return Error.isError(e) ? c.json(e, 500) : c.json({ message: e }, 500);
	}
});

app.post('/generate-invoices/:classId', async c => {
	const auth = getAuth(c);
	if (!auth?.userId) {
		return c.json({ message: 'You are not logged in.' }, 401);
	}
	try {
		const user = await clerkClient.users.getUser(auth.userId);
		const role = user.publicMetadata.role as AuthData['meta']['role'];
		if (!(role === Roles.ADMIN || role === Roles.FINANCE)) {
			return c.json({ message: 'Forbidden' }, 403);
		}
		const classId = c.req.param('classId');
		await generateMissingInvoicesForClass(classId);
		return c.json({ ok: true });
	} catch (e) {
		// Log full error for debugging (e.g., ERR_POSTGRES_SYNTAX_ERROR)
		console.error('Error in /generate-invoices/:classId:', e);
		return Error.isError(e) ? c.json(e, 500) : c.json({ message: e }, 500);
	}
});

app.delete('/deleteAsset', async c => {
	const auth = getAuth(c);
	if (!auth?.userId) {
		return c.json({
			message: 'You are not logged in.'
		});
	}

	try {
		const body: unknown = await c.req.json();
		const { filePath } = z
			.object({
				filePath: z.string().min(1)
			})
			.parse(body);

		await R2.delete(filePath);
		return c.json({
			deleted: true,
			message: 'Asset deleted successfully'
		});
	} catch (e) {
		return Error.isError(e)
			? c.json(e)
			: c.json({ deleted: false, message: e });
	}
});

export default {
	fetch: app.fetch,
	port: env.PORT
};

//
// CRON: replace fallback hourly cron with proper `cron` package job and Sentry instrumentation.
//
// Behavior:
//  - Uses CronJob (cron npm package) to schedule at 00:00 on the 25th of every month.
//  - If available, instruments the CronJob constructor with `Sentry.cron.instrumentCron`
//    so Sentry will emit automatic check-ins.
//  - Wraps the job body with `Sentry.withMonitor` if available to upsert monitor config
//    and ensure proper check-in lifecycle (start/end).
//  - Captures exceptions to Sentry and logs locally.
//
// Notes:
//  - This code intentionally overwrites the previous setInterval fallback: do not rely on the old hourly check.
//  - Ensure `cron` (npm) is installed and `@sentry/bun` is at a version that contains cron instrumentation (>= 7.92.0).
//

const CRON_EXPRESSION = '0 0 25 * *'; // minute hour day month day-of-week -> 00:00 on 25th every month
const MONITOR_SLUG = 'monthly-generate-invoices';

async function runGenerateMissingInvoicesWithSentry() {
	// Run the job and report errors to Sentry. We intentionally avoid passing a typed
	// monitor config object to `withMonitor` to keep TypeScript happy and simple.
	// If `withMonitor` exists we use it without the third parameter (the monitor config).
	if (typeof Sentry.withMonitor === 'function') {
		// `withMonitor` will call the function and register/update the Monitor configuration.
		try {
			await Sentry.withMonitor(MONITOR_SLUG, async () => {
				await generateMissingInvoices();
			});
		} catch (err: unknown) {
			// Normalize the thrown value to an Error before sending to Sentry.
			const errorToReport = err instanceof Error ? err : new Error(String(err));
			if (typeof Sentry.captureException === 'function') {
				Sentry.captureException(errorToReport);
			}
			console.error(
				'[cron] Error in withMonitor generateMissingInvoices:',
				err
			);
			throw err;
		}
	} else {
		// Fallback: directly run the job and capture exceptions.
		try {
			await generateMissingInvoices();
		} catch (err: unknown) {
			const errorToReport = err instanceof Error ? err : new Error(String(err));
			if (typeof Sentry.captureException === 'function') {
				Sentry.captureException(errorToReport);
			}
			console.error('[cron] Error running generateMissingInvoices:', err);
			throw err;
		}
	}
}

// Instantiate CronJob and instrument via Sentry if available.
(function createAndStartCron() {
	try {
		const CronConstructor =
			typeof Sentry.cron?.instrumentCron === 'function'
				? Sentry.cron.instrumentCron(CronJob, MONITOR_SLUG)
				: CronJob;

		// cron package usage:
		// new CronJob(cronTime, onTick, onComplete?, start?, timeZone?, context?, runOnInit?)
		// We'll set start=true to begin scheduling immediately.
		const job = new CronConstructor(
			CRON_EXPRESSION,
			// onTick
			async () => {
				try {
					console.log('[cron] Cron tick — running generateMissingInvoices');
					await runGenerateMissingInvoicesWithSentry();
					console.log('[cron] Cron tick — completed generateMissingInvoices');
				} catch (e: unknown) {
					// Errors are already captured inside runGenerateMissingInvoicesWithSentry,
					// but log an additional message in case of instrumentation failures.
					console.error('[cron] Cron tick encountered an error:', e);
				}
			},
			// onComplete
			null,
			// start immediately
			true,
			// timeZone: undefined -> use server local time; optionally use env.CRON_TIMEZONE
			env.CRON_TIMEZONE ?? undefined
		);

		// If CronConstructor returned an object with start() instead of starting immediately,
		// ensure it is started. Some instrumentations might return a wrapper; attempt to call start().
		// This is defensive: starting an already started job is usually a no-op.
		try {
			const maybeStarter = job as unknown as { start?: () => void };
			if (maybeStarter.start && typeof maybeStarter.start === 'function') {
				// If the constructor's `start` param already started the job, calling `start` again is safe.
				maybeStarter.start();
			}
		} catch (startErr) {
			// Non-fatal: log and continue.
			console.warn(
				'[cron] Cron job start/ensure-start encountered an error:',
				startErr
			);
		}

		console.log(
			`[cron] Scheduled job '${MONITOR_SLUG}' with cron expression '${CRON_EXPRESSION}'.`
		);
	} catch (err: unknown) {
		console.error('[cron] Failed to create/start cron job:', err);
		const errorToReport = err instanceof Error ? err : new Error(String(err));
		if (typeof Sentry.captureException === 'function') {
			Sentry.captureException(errorToReport);
		}
	}
})();
