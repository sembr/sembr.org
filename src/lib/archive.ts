import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const BLOCK = 512;
const encoder = new TextEncoder();

function field(header: Uint8Array, offset: number, length: number, value: string) {
	const bytes = encoder.encode(value);
	if (bytes.length > length) {
		throw new Error(`Tar header field is too long: ${value}`);
	}
	header.set(bytes, offset);
}

function octal(value: number, length: number): string {
	return value.toString(8).padStart(length - 1, '0') + '\0';
}

function header(path: string, size: number, mode: number): Uint8Array {
	const block = new Uint8Array(BLOCK);
	field(block, 0, 100, path);
	field(block, 100, 8, octal(mode, 8));
	field(block, 108, 8, octal(0, 8)); // uid
	field(block, 116, 8, octal(0, 8)); // gid
	field(block, 124, 12, octal(size, 12));
	field(block, 136, 12, octal(0, 12)); // mtime
	field(block, 148, 8, '        '); // checksum placeholder
	field(block, 156, 1, '0'); // regular file
	field(block, 257, 6, 'ustar\0');
	field(block, 263, 2, '00');
	const checksum = block.reduce((sum, byte) => sum + byte, 0);
	field(block, 148, 8, checksum.toString(8).padStart(6, '0') + '\0 ');
	return block;
}

/**
 * Builds a gzip-compressed tar archive of a skill's files,
 * with `SKILL.md` and the other files at the archive root.
 *
 * The output is deterministic:
 * files are sorted by path, and timestamps and owners are zero,
 * so the same files always produce the same bytes and digest.
 * Files that start with `#!` are executable.
 */
export function skillArchive(files: Record<string, string>): Uint8Array {
	const parts: Uint8Array[] = [];
	for (const path of Object.keys(files).sort()) {
		const content = encoder.encode(files[path]);
		const mode = files[path].startsWith('#!') ? 0o755 : 0o644;
		parts.push(header(path, content.length, mode), content);
		const padding = (BLOCK - (content.length % BLOCK)) % BLOCK;
		parts.push(new Uint8Array(padding));
	}
	parts.push(new Uint8Array(BLOCK * 2)); // end-of-archive marker
	const tar = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
	let offset = 0;
	for (const part of parts) {
		tar.set(part, offset);
		offset += part.length;
	}
	return new Uint8Array(gzipSync(tar, { level: 9 }));
}

export function sha256Digest(bytes: Uint8Array | string): string {
	return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}
