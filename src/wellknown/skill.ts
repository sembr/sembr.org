import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';

export const prerender = true;

const CONTENT_TYPES: Record<string, string> = {
	md: 'text/markdown; charset=utf-8',
	py: 'text/x-python; charset=utf-8',
	yaml: 'text/yaml; charset=utf-8',
};

export async function getStaticPaths() {
	const skills = await getCollection('skills');
	return skills.flatMap((entry) =>
		Object.keys(entry.data.files).map((file) => ({ params: { name: entry.id, file } })),
	);
}

export const GET: APIRoute = async ({ params }) => {
	if (typeof params.name !== 'string' || typeof params.file !== 'string') {
		return new Response('Not Found', { status: 404 });
	}

	const entry = await getEntry('skills', params.name);
	const content = entry?.data.files[params.file];
	if (content === undefined) {
		return new Response('Not Found', { status: 404 });
	}
	const extension = params.file.split('.').pop() ?? '';
	return new Response(content, {
		headers: {
			'Content-Type': CONTENT_TYPES[extension] ?? 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
};
