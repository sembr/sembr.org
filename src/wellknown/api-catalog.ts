import type { APIRoute } from 'astro';
import { apiCatalogLinkset } from '../lib/discovery';

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(JSON.stringify(apiCatalogLinkset(), null, 2) + '\n', {
		headers: {
			'Content-Type':
				'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
			'Cache-Control': 'public, max-age=300',
		},
	});
