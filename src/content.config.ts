import { createHash } from 'node:crypto';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { parse as parseYaml } from 'yaml';

const SPEC_URL = 'https://raw.githubusercontent.com/sembr/specification/main/README.md';
const SKILLS_REPO = 'https://raw.githubusercontent.com/sembr/skills/main/skills';

// Skills exposed under /.well-known/agent-skills/.
// Add new entries here when the sembr/skills repo grows.
const SKILL_NAMES = ['sembr-reformat'] as const;

function sha256Digest(source: string): string {
	return `sha256:${createHash('sha256').update(source, 'utf8').digest('hex')}`;
}

// Convert raw HTML constructs in the spec source into plain Markdown for
// clients that consume `entry.body` directly 
// (curl, llms.txt, the negotiated `/` endpoint). 
// HTML rendering is unaffected because `render(entry)` reads
// from the already-rendered `rendered.html` stored below.
function toPlainMarkdown(body: string): string {
	return body
		.replace(/^<pre>\n([\s\S]*?)\n<\/pre>$/gm, '```\n$1\n```')
		.replace(/\n{3,}/g, '\n\n');
}

// Inject inline HTML into the spec source before rendering so that the FAQ
// comparison table shows accessible support indicators in HTML, while the
// plain Markdown body keeps its prose for curl/llms.txt consumers.
function preprocessForRendering(source: string): string {
	return source
		.replace(
			/\| Supported \|/g,
			'| <mark data-supported="true" title="Supported" aria-label="Supported">✓</mark> |',
		)
		.replace(
			/\| Not supported \|/g,
			'| <mark data-supported="false" title="Not supported" aria-label="Not supported">✗</mark> |',
		);
}

const specification = defineCollection({
	loader: {
		name: 'sembr-specification',
		load: async ({ store, parseData, generateDigest, renderMarkdown, logger }) => {
			logger.info(`Fetching ${SPEC_URL}`);

			const response = await fetch(SPEC_URL);

			if (!response.ok) {
				throw new Error(
					`Failed to fetch SemBr specification: ${response.status} ${response.statusText}`,
				);
			}

			const source = await response.text();
			const id = 'sembr';
			const data = await parseData({ id, data: {} });
			const digest = generateDigest(source);
			const rendered = await renderMarkdown(preprocessForRendering(source));
			const body = toPlainMarkdown(source);

			store.set({ id, data, body, digest, rendered });
		},
	},
});

function parseSkillFrontmatter(
	source: string,
	context: { id: string; url: string },
): { name: string; description: string } {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
	if (!match) {
		throw new Error(`SKILL.md is missing YAML frontmatter for "${context.id}" (${context.url})`);
	}
	let parsedFrontmatter: unknown;
	try {
		parsedFrontmatter = parseYaml(match[1]);
	} catch (error) {
		throw new Error(
			`Invalid YAML frontmatter for "${context.id}" (${context.url}): ${String(error)}`,
		);
	}
	const result = z
		.object({ name: z.string(), description: z.string() })
		.safeParse(parsedFrontmatter);
	if (!result.success) {
		throw new Error(
			`SKILL.md frontmatter for "${context.id}" (${context.url}) must define string \`name\` and \`description\` fields`,
		);
	}
	return result.data;
}

const skills = defineCollection({
	schema: z.object({
		name: z.string(),
		description: z.string(),
		digest: z.string(),
	}),
	loader: {
		name: 'sembr-skills',
		load: async ({ store, parseData, generateDigest, logger }) => {
			for (const id of SKILL_NAMES) {
				const url = `${SKILLS_REPO}/${id}/SKILL.md`;
				logger.info(`Fetching ${url}`);

				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(
						`Failed to fetch skill ${id}: ${response.status} ${response.statusText}`,
					);
				}

				const source = await response.text();
				const data = await parseData({
					id,
					data: { ...parseSkillFrontmatter(source, { id, url }), digest: sha256Digest(source) },
				});
				store.set({ id, data, body: source, digest: generateDigest(source) });
			}
		},
	},
});

export const collections = { specification, skills };
