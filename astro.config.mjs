// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { remarkSembr } from './src/lib/remark-sembr.ts';

/**
 * Exposes Agent Skills at the RFC 8615 well-known endpoint
 * so users can run `npx skills add https://sembr.org`. 
 * See https://github.com/vercel-labs/skills.
 *
 * @type {import('astro').AstroIntegration}
 */
const wellKnownSkills = {
	name: 'well-known-skills',
	hooks: {
		'astro:config:setup': ({ injectRoute }) => {
			injectRoute({
				pattern: '/.well-known/agent-skills/index.json',
				entrypoint: './src/wellknown/index.ts',
			});
			injectRoute({
				pattern: '/.well-known/agent-skills/[name]/[file]',
				entrypoint: './src/wellknown/skill.ts',
			});
		},
	},
};


// https://astro.build/config
export default defineConfig({
	site: 'https://sembr.org',
	adapter: cloudflare(),
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Creative Commons Symbols',
			cssVariable: '--font-creative-commons-symbols',
			fallbacks: ['Georgia', 'serif'],
			optimizedFallbacks: false,
			styles: ['normal'],
			display: 'auto',
			options: {
				variants: [
					{
						weight: 400,
						style: 'normal',
						src: ['./src/assets/CreativeCommonsSymbols.woff2'],
						unicodeRange: ['U+229C', 'U+1F10D-1F10F', 'U+1F16D-1F16F'],
					},
				],
			},
		},
	],
	build: {
		inlineStylesheets: 'auto',
	},
	markdown: {
		remarkPlugins: [remarkSembr],
		syntaxHighlight: false,
	},
	security: {
		csp: true
	},
	integrations: [sitemap(), wellKnownSkills],
});
