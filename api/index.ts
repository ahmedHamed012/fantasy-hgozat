/**
 * Vercel serverless entry point.
 *
 * Vercel's @vercel/node runtime accepts an Express app as the default export
 * and invokes it as the request handler for every route (see vercel.json
 * rewrites). No `listen()` is called — the platform manages the lifecycle.
 * `vercel.json` bundles src/views + src/public via `includeFiles`, and the
 * function runs with cwd = project root, so the app resolves them correctly.
 */
import { createApp } from '../src/app';

const app = createApp();

export default app;
