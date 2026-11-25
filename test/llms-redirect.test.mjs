import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { unstable_dev } from 'wrangler';

test('/llms-full.txt redirects permanently to the specification', async (t) => {
	const worker = await unstable_dev('dist/server/entry.mjs', {
		config: 'dist/server/wrangler.json',
		local: true,
		persist: false,
	});
	t.after(() => worker.stop());

	const origin = `http://${worker.address}:${worker.port}`;
	const response = await worker.fetch(`${origin}/llms-full.txt`, { redirect: 'manual' });
	assert.equal(response.status, 301);
	const location = new URL(response.headers.get('location'), origin);
	assert.equal(location.href, `${origin}/llms.txt`);

	const followed = await worker.fetch(location, { redirect: 'manual' });
	assert.equal(followed.status, 200);
	const specification = await readFile('dist/client/llms.txt');
	assert.ok(specification.length > 0);
	assert.deepEqual(Buffer.from(await followed.arrayBuffer()), specification);
});
