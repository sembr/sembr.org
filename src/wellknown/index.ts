import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async () => {
	const skills = await getCollection('skills');
	const body = {
		skills: skills.map((entry) => ({
			name: entry.data.name,
			description: entry.data.description,
			files: ['SKILL.md'],
		})),
	};
	return new Response(JSON.stringify(body, null, 2) + '\n', {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
};
