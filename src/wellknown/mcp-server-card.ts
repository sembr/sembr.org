import type { APIRoute } from 'astro';
import { mcpServerCard } from '../lib/discovery';

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(JSON.stringify(mcpServerCard(), null, 2) + '\n', {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
			'Access-Control-Allow-Origin': '*',
		},
	});
