// Copies the API contract from the BE repo checked out next to this one.
//   npm run sync:api-types            write src/lib/api-types.ts
//   npm run sync:api-types -- --check exit 1 if the copy is out of date (used by CI)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SOURCE = '../frequency-be/src/api-types.ts';
const TARGET = 'src/lib/api-types.ts';
const HEADER = '// Generated from frequency-be/src/api-types.ts by `npm run sync:api-types`. Do not edit here.\n\n';

if (!existsSync(SOURCE)) {
    console.error(`[sync-api-types] ${SOURCE} not found: check out frequency-be next to this repo`);
    process.exit(1);
}

const expected = HEADER + readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n');
const current = existsSync(TARGET) ? readFileSync(TARGET, 'utf8').replace(/\r\n/g, '\n') : '';

if (process.argv.includes('--check')) {
    if (current !== expected) {
        console.error(`[sync-api-types] ${TARGET} differs from the BE contract: run npm run sync:api-types and commit it`);
        process.exit(1);
    }
    console.log('[sync-api-types] up to date');
} else {
    writeFileSync(TARGET, expected);
    console.log(`[sync-api-types] wrote ${TARGET}`);
}
