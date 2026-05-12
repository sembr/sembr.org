import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';

export const prerender = true;

export async function getStaticPaths() {
	const skills = await getCollection('skills');
	return skills.map((entry) => ({
		params: { name: entry.id, file: 'SKILL.md' },
	}));
}

export const GET: APIRoute = async ({ params }) => {
	const entry = await getEntry('skills', params.name as string);
	if (!entry || params.file !== 'SKILL.md') {
		return new Response('Not Found', { status: 404 });
	}
	return new Response(entry.body, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
};
