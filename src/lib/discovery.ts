export const SITE_ORIGIN = 'https://sembr.org';

export const DISCOVERY_PATHS = {
	apiCatalog: '/.well-known/api-catalog',
	openApi: '/.well-known/openapi.json',
	mcpServerCard: '/.well-known/mcp/server-card.json',
	agentSkillsIndex: '/.well-known/agent-skills/index.json',
	llmsTxt: '/llms.txt',
	health: '/health',
	sitemap: '/sitemap-index.xml',
} as const;

export function discoveryLinkHeader(): string {
	return [
		`</${DISCOVERY_PATHS.sitemap.slice(1)}>; rel="sitemap"`,
		`</${DISCOVERY_PATHS.apiCatalog.slice(1)}>; rel="api-catalog"`,
		`</${DISCOVERY_PATHS.openApi.slice(1)}>; rel="service-desc"; type="application/vnd.oai.openapi+json"`,
		`</${DISCOVERY_PATHS.llmsTxt.slice(1)}>; rel="describedby"; type="text/markdown"`,
		`</${DISCOVERY_PATHS.mcpServerCard.slice(1)}>; rel="describedby"; type="application/json"`,
	].join(', ');
}

export function apiCatalogLinkset() {
	const origin = SITE_ORIGIN;

	return {
		linkset: [
			{
				anchor: `${origin}/`,
				'service-desc': [
					{
						href: `${origin}${DISCOVERY_PATHS.openApi}`,
						type: 'application/vnd.oai.openapi+json',
					},
				],
				'service-doc': [
					{
						href: `${origin}${DISCOVERY_PATHS.llmsTxt}`,
						type: 'text/markdown',
					},
					{
						href: `${origin}/`,
						type: 'text/html',
					},
				],
				status: [
					{
						href: `${origin}${DISCOVERY_PATHS.health}`,
						type: 'application/json',
					},
				],
			},
			{
				anchor: `${origin}/.well-known/agent-skills/`,
				'service-desc': [
					{
						href: `${origin}${DISCOVERY_PATHS.openApi}#/paths/~1.well-known~1agent-skills~1index.json/get`,
						type: 'application/vnd.oai.openapi+json',
					},
				],
				'service-doc': [
					{
						href: `${origin}${DISCOVERY_PATHS.agentSkillsIndex}`,
						type: 'application/json',
					},
				],
				status: [
					{
						href: `${origin}${DISCOVERY_PATHS.health}`,
						type: 'application/json',
					},
				],
			},
		],
	};
}

export function openApiDocument() {
	const origin = SITE_ORIGIN;

	return {
		openapi: '3.1.0',
		info: {
			title: 'SemBr.org Content API',
			version: '1.0.0',
			description:
				'Machine-readable access to the Semantic Line Breaks specification and published agent skills.',
		},
		servers: [{ url: origin }],
		paths: {
			'/': {
				get: {
					summary: 'SemBr specification',
					description:
						'Returns the SemBr specification. Use Accept: text/markdown for the source document or Accept: text/html for the rendered page.',
					parameters: [
						{
							name: 'Accept',
							in: 'header',
							schema: {
								type: 'string',
								enum: ['text/markdown', 'text/html'],
							},
						},
					],
					responses: {
						'200': {
							description: 'SemBr specification document',
							content: {
								'text/markdown': {},
								'text/html': {},
							},
						},
					},
				},
			},
			'/llms.txt': {
				get: {
					summary: 'SemBr specification (llms.txt)',
					description: 'Returns the SemBr specification as Markdown.',
					responses: {
						'200': {
							description: 'SemBr specification',
							content: {
								'text/markdown': {},
							},
						},
					},
				},
			},
			'/.well-known/agent-skills/index.json': {
				get: {
					summary: 'Agent skills index',
					description: 'Lists SemBr agent skills available for discovery.',
					responses: {
						'200': {
							description: 'Agent skills discovery document',
							content: {
								'application/json': {},
							},
						},
					},
				},
			},
			'/.well-known/agent-skills/{name}/SKILL.md': {
				get: {
					summary: 'Agent skill document',
					parameters: [
						{
							name: 'name',
							in: 'path',
							required: true,
							schema: { type: 'string' },
						},
					],
					responses: {
						'200': {
							description: 'Agent skill Markdown document',
							content: {
								'text/markdown': {},
							},
						},
						'404': {
							description: 'Skill not found',
						},
					},
				},
			},
			'/health': {
				get: {
					summary: 'Service health',
					responses: {
						'200': {
							description: 'Health status',
							content: {
								'application/json': {},
							},
						},
					},
				},
			},
		},
	};
}

export function mcpServerCard() {
	return {
		protocolVersion: '2025-11-25',
		serverInfo: {
			name: 'sembr.org',
			version: '0.0.1',
			description:
				'Semantic Line Breaks specification, llms.txt, and published agent skills exposed via WebMCP on the homepage.',
		},
		transport: {
			type: 'webmcp',
			endpoint: `${SITE_ORIGIN}/`,
		},
		capabilities: {
			tools: true,
			resources: false,
			prompts: false,
		},
		authentication: {
			required: false,
		},
		tools: [
			{
				name: 'get_specification',
				description: 'Fetch the SemBr specification as Markdown from /llms.txt.',
			},
			{
				name: 'list_agent_skills',
				description: 'List published SemBr agent skills from the well-known index.',
			},
			{
				name: 'get_agent_skill',
				description: 'Fetch a specific SemBr agent skill by name.',
			},
		],
	};
}
