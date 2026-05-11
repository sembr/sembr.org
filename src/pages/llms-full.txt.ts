import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ url }) =>
	Response.redirect(new URL('/llms.txt', url), 301);
