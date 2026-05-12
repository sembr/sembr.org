import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

// Agent Skills Discovery v0.2.0:
// https://github.com/cloudflare/agent-skills-discovery-rfc
const SCHEMA_URL = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

export const GET: APIRoute = async () => {
	const skills = await getCollection('skills');
	const body = {
		$schema: SCHEMA_URL,
		skills: skills.map((entry) => ({
			name: entry.data.name,
			type: 'skill-md' as const,
			description: entry.data.description,
			url: `/.well-known/agent-skills/${entry.id}/SKILL.md`,
			digest: entry.data.digest,
			// Legacy v0.1.0 field for compatibility with clients
			// that haven't adopted v0.2.0 yet 
			// (e.g., vercel-labs/skills CLI as of writing).
			// Spec-compliant v0.2.0 readers ignore unknown fields.
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
