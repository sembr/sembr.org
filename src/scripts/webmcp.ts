type ModelContextTool = {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	execute: (args: Record<string, unknown>) => Promise<unknown>;
	annotations?: { readOnlyHint?: boolean };
};

type ModelContext = {
	registerTool: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => void;
};

declare global {
	interface Navigator {
		modelContext?: ModelContext;
	}
}

function getModelContext(): ModelContext | undefined {
	if (!('modelContext' in navigator) || !navigator.modelContext) {
		return undefined;
	}

	const { registerTool } = navigator.modelContext;
	if (typeof registerTool !== 'function') {
		return undefined;
	}

	return navigator.modelContext;
}

async function fetchText(url: string): Promise<string> {
	const response = await fetch(url, { headers: { Accept: 'text/markdown, application/json' } });
	if (!response.ok) {
		throw new Error(`Request failed (${response.status}) for ${url}`);
	}
	return response.text();
}

function registerSembrTools(modelContext: ModelContext, signal: AbortSignal): void {
	const options = { signal };

	modelContext.registerTool(
		{
			name: 'get_specification',
			description: 'Fetch the SemBr specification as Markdown from /llms.txt.',
			inputSchema: { type: 'object', properties: {} },
			annotations: { readOnlyHint: true },
			async execute() {
				return fetchText('/llms.txt');
			},
		},
		options,
	);

	modelContext.registerTool(
		{
			name: 'list_agent_skills',
			description: 'List published SemBr agent skills from the well-known index.',
			inputSchema: { type: 'object', properties: {} },
			annotations: { readOnlyHint: true },
			async execute() {
				return fetchText('/.well-known/agent-skills/index.json');
			},
		},
		options,
	);

	modelContext.registerTool(
		{
			name: 'get_agent_skill',
			description: 'Fetch a specific SemBr agent skill by name.',
			inputSchema: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						description: 'Agent skill identifier, for example "sembr-reformat".',
					},
				},
				required: ['name'],
			},
			annotations: { readOnlyHint: true },
			async execute({ name }) {
				if (typeof name !== 'string' || name.length === 0) {
					throw new Error('The "name" argument is required.');
				}
				return fetchText(`/.well-known/agent-skills/${encodeURIComponent(name)}/SKILL.md`);
			},
		},
		options,
	);
}

const controller = new AbortController();
const modelContext = getModelContext();

if (modelContext) {
	registerSembrTools(modelContext, controller.signal);
}

window.addEventListener(
	'pagehide',
	() => {
		controller.abort();
	},
	{ once: true },
);
