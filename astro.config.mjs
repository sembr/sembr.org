// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { remarkSembr } from './src/lib/remark-sembr.ts';


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
	integrations: [sitemap()],
});
