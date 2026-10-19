import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';

export const prerender = true;

export async function getStaticPaths() {
	const skills = await getCollection('skills');
	return skills.map((entry) => ({ params: { name: entry.id } }));
}

export const GET: APIRoute = async ({ params }) => {
	if (typeof params.name !== 'string') {
		return new Response('Not Found', { status: 404 });
	}

	const entry = await getEntry('skills', params.name);
	if (!entry) {
		return new Response('Not Found', { status: 404 });
	}
	// These are the bytes that the index's digest covers.
	const archive = Uint8Array.from(atob(entry.data.archive), (c) => c.charCodeAt(0));
	return new Response(archive, {
		headers: {
			'Content-Type': 'application/gzip',
			'Cache-Control': 'public, max-age=300',
		},
	});
};
