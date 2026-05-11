import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';

export const GET: APIRoute = async () => {
	const entry = await getEntry('specification', 'sembr');

	if (!entry) {
		return new Response('SemBr specification not available.', { status: 404 });
	}

	return new Response(entry.body, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
};
