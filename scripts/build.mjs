import { build } from 'esbuild';
import { mkdir, chmod } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/cli.ts','src/mcp.ts'],bundle:true,platform:'node',format:'esm',target:'node22',outdir:'dist',outExtension:{'.js':'.mjs'},banner:{js:'#!/usr/bin/env node\nimport { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);'},legalComments:'eof',sourcemap:false});
await build({entryPoints:['src/native-browser.ts','src/native-downloads.ts'],bundle:true,platform:'node',format:'esm',target:'node22',outdir:'dist',outExtension:{'.js':'.mjs'},legalComments:'eof',sourcemap:false});
await Promise.all(['dist/cli.mjs','dist/mcp.mjs'].map(p=>chmod(p,0o755)));
