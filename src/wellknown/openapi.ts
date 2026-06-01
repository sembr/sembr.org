import type { APIRoute } from 'astro';
import { openApiDocument } from '../lib/discovery';

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(JSON.stringify(openApiDocument(), null, 2) + '\n', {
		headers: {
			'Content-Type': 'application/vnd.oai.openapi+json; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
