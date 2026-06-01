import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(JSON.stringify({ status: 'ok' }) + '\n', {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'no-cache',
		},
	});
