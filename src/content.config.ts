import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { parse as parseYaml } from 'yaml';
import { sha256Digest, skillArchive } from './lib/archive.ts';

const SPEC_URL = 'https://raw.githubusercontent.com/sembr/specification/main/README.md';
// Set SEMBR_SKILLS_REF to build from another branch of sembr/skills.
const SKILLS_REF = process.env.SEMBR_SKILLS_REF ?? 'main';
const SKILLS_REPO = `https://raw.githubusercontent.com/sembr/skills/${SKILLS_REF}/skills`;

// Skills exposed under /.well-known/agent-skills/, with every file each one installs.
// Add new entries here when the sembr/skills repo grows.
const SKILLS = {
	'sembr-reformat': ['SKILL.md', 'agents/openai.yaml', 'scripts/check.py'],
} as const;

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
		// The skill's `.tar.gz` archive, base64-encoded, and its SHA-256 digest.
		// The loader runs in Node, which has the zlib and crypto modules;
		// the prerendered routes run in workerd, which doesn't.
		archive: z.string(),
		digest: z.string(),
		// Each file's contents, by its path in the skill directory.
		files: z.record(z.string(), z.string()),
	}),
	loader: {
		name: 'sembr-skills',
		load: async ({ store, parseData, generateDigest, logger }) => {
			for (const [id, paths] of Object.entries(SKILLS)) {
				const files: Record<string, string> = {};
				for (const path of paths) {
					const url = `${SKILLS_REPO}/${id}/${path}`;
					logger.info(`Fetching ${url}`);

					const response = await fetch(url);
					if (!response.ok) {
						throw new Error(
							`Failed to fetch ${path} for skill ${id}: ${response.status} ${response.statusText}`,
						);
					}
					files[path] = await response.text();
				}

				const source = files['SKILL.md'];
				const url = `${SKILLS_REPO}/${id}/SKILL.md`;
				const archive = skillArchive(files);
				const data = await parseData({
					id,
					data: {
						...parseSkillFrontmatter(source, { id, url }),
						archive: Buffer.from(archive).toString('base64'),
						digest: sha256Digest(archive),
						files,
					},
				});
				store.set({ id, data, body: source, digest: generateDigest(JSON.stringify(files)) });
			}
		},
	},
});

export const collections = { specification, skills };
