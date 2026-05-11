import { defineCollection } from 'astro:content';

const SPEC_URL = 'https://raw.githubusercontent.com/sembr/specification/main/README.md';

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

export const collections = { specification };
