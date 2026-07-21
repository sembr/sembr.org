import type { Definition, Html, Root, RootContent, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const RFC_2119_KEYWORDS = [
	'MUST NOT',
	'SHALL NOT',
	'SHOULD NOT',
	'RECOMMENDED',
	'REQUIRED',
	'OPTIONAL',
	'SHOULD',
	'SHALL',
	'MUST',
	'MAY',
] as const;

const RFC_2119_PATTERN = new RegExp(`\\b(${RFC_2119_KEYWORDS.join('|')})\\b`, 'g');

const EM_DASH = '\u2014';
const EM_DASH_PATTERN = /---/g;

const MULTILINE_PRE_PATTERN = /^<pre>([\s\S]*?)<\/pre>\s*$/;

// https://creativecommons.org/2020/03/18/the-unicode-standard-now-includes-cc-license-symbols/
const CC_MARK = '\u{1F16D}';
const CC_LICENSE_SYMBOLS: Record<string, string> = {
	by: '\u{1F16F}',
	sa: '\u{1F10E}',
	nc: '\u{1F10F}',
	nd: '\u{229C}',
};

function ccSymbolsForLicenseUrl(rawUrl: string): string | null {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		return null;
	}
	if (url.hostname !== 'creativecommons.org') {
		return null;
	}
	const [root, id] = url.pathname.split('/').filter(Boolean);
	if (root !== 'licenses' || !id) {
		return null;
	}
	const tokens = id.split('-').map((token) => CC_LICENSE_SYMBOLS[token]);
	if (tokens.length === 0 || tokens.some((token) => !token)) {
		return null;
	}
	return `${CC_MARK}${tokens.join('')}`;
}

export const remarkSembr: Plugin<[], Root> = () => {
	return (tree) => {
		// Collect link definitions for resolving Creative Commons references.
		const definitions = new Map<string, string>();
		visit(tree, 'definition', (node: Definition) => {
			definitions.set(node.identifier, node.url);
		});

		// Mark multiline <pre> blocks as SemBr examples for whitespace styling.
		visit(tree, 'html', (node) => {
			const match = node.value.match(MULTILINE_PRE_PATTERN);
			if (
				match &&
				!match[1].includes('<code') &&
				match[1].trim().includes('\n')
			) {
				node.value = node.value.replace('<pre>', '<pre class="sembr">');
			}
		});

		// FAQ comparison table: accessible support indicators and styled "None".
		visit(tree, 'tableCell', (node) => {
			if (node.children.length !== 1 || node.children[0]?.type !== 'text') {
				return;
			}
			const value = node.children[0].value;
			if (value === 'Supported') {
				node.children = [
					{
						type: 'html',
						value:
							'<mark data-supported="true" title="Supported" aria-label="Supported">✓</mark>',
					},
				];
			} else if (value === 'Not supported') {
				node.children = [
					{
						type: 'html',
						value:
							'<mark data-supported="false" title="Not supported" aria-label="Not supported">✗</mark>',
					},
				];
			} else if (value === 'None') {
				node.children = [
					{
						type: 'html',
						value: '<em data-supported="false">None</em>',
					},
				];
			}
		});

		// Keep "Line Breaks" on one line in the title via a non-breaking space.
		visit(tree, 'heading', (node) => {
			if (
				node.depth === 1 &&
				node.children.length === 1 &&
				node.children[0]?.type === 'text' &&
				node.children[0].value === 'Semantic Line Breaks'
			) {
				node.children = [{ type: 'text', value: 'Semantic Line\u00a0Breaks' }];
			}
		});

		// Highlight RFC 2119 keywords and normalize --- to an em dash.
		visit(tree, 'text', (node, index, parent) => {
			if (!parent || typeof index !== 'number') {
				return;
			}

			const value = node.value.replace(EM_DASH_PATTERN, EM_DASH);
			const matches = [...value.matchAll(RFC_2119_PATTERN)];

			if (matches.length === 0) {
				if (value !== node.value) {
					node.value = value;
				}
				return;
			}

			const nodes: RootContent[] = [];
			let cursor = 0;

			for (const match of matches) {
				const start = match.index ?? 0;
				const keyword = match[0];

				if (start > cursor) {
					const text: Text = {
						type: 'text',
						value: value.slice(cursor, start),
					};
					nodes.push(text);
				}

				const html: Html = { type: 'html', value: `<mark>${keyword}</mark>` };
				nodes.push(html);
				cursor = start + keyword.length;
			}

			if (cursor < value.length) {
				const text: Text = { type: 'text', value: value.slice(cursor) };
				nodes.push(text);
			}

			parent.children.splice(index, 1, ...(nodes as typeof parent.children));
		});

		// Prefix Creative Commons license links with Unicode license symbols.
		visit(tree, ['link', 'linkReference'], (node, index, parent) => {
			if (!parent || typeof index !== 'number') {
				return;
			}
			const url =
				node.type === 'link'
					? node.url
					: node.type === 'linkReference'
						? definitions.get(node.identifier)
						: undefined;
			if (!url) {
				return;
			}
			const symbols = ccSymbolsForLicenseUrl(url);
			if (!symbols) {
				return;
			}
			const prev = parent.children[index - 1];
			if (
				(prev?.type === 'text' && prev.value.trimEnd().endsWith(symbols)) ||
				(prev?.type === 'html' && prev.value.includes('class="cc-symbols"'))
			) {
				return;
			}
			const prefix: Html = {
				type: 'html',
				value: `<span class="cc-symbols">${symbols}</span>\u00a0`,
			};
			parent.children.splice(index, 0, prefix);
			return index + 2;
		});
	};
};
