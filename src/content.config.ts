import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const SPEC_URL = 'https://raw.githubusercontent.com/sembr/specification/main/README.md';
const SKILLS_REPO = 'https://raw.githubusercontent.com/sembr/skills/main/skills';

// Skills exposed under /.well-known/agent-skills/.
// Add new entries here when the sembr/skills repo grows.
const SKILL_NAMES = ['sembr-reformat'] as const;

// Convert raw HTML constructs in the spec source into plain Markdown for
// clients that consume `entry.body` directly 
// (curl, llms.txt, the negotiated `/` endpoint). 
// HTML rendering is unaffected because `render(entry)` reads
// from the already-rendered `rendered.html` stored below.
function toPlainMarkdown(body: string): string {
	return body
		.replace(/^<pre>\n([\s\S]*?)\n<\/pre>$/gm, '```\n$1\n```')
		.replace(/^<\/?dl>\s*$/gm, '')
		.replace(/^<dt>(.*?)<\/dt>\s*$/gm, '### $1')
		.replace(/^<\/?dd>\s*$/gm, '')
		.replace(/\n{3,}/g, '\n\n');
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
			const rendered = await renderMarkdown(source);
			const body = toPlainMarkdown(source);

			store.set({ id, data, body, digest, rendered });
		},
	},
});

function parseSkillFrontmatter(source: string): { name: string; description: string } {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
	if (!match) {
		throw new Error('SKILL.md is missing YAML frontmatter');
	}
	const frontmatter = match[1];
	const name = frontmatter.match(/^name:\s*(.+?)\s*$/m)?.[1];
	const description = frontmatter.match(/^description:\s*(.+?)\s*$/m)?.[1];
	if (!name || !description) {
		throw new Error('SKILL.md frontmatter must define `name` and `description`');
	}
	return { name, description };
}

const skills = defineCollection({
	schema: z.object({
		name: z.string(),
		description: z.string(),
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
				const data = await parseData({ id, data: parseSkillFrontmatter(source) });
				store.set({ id, data, body: source, digest: generateDigest(source) });
			}
		},
	},
});

export const collections = { specification, skills };
