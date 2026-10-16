import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,lstatSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(process.argv[2]??'.');const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const pkg=read('package.json');const manifest=read('.codex-plugin/plugin.json');assert.equal(pkg.name,manifest.name);assert.equal(pkg.version,manifest.version);assert.equal(manifest.requires_local_executor,true);
const mcp=read('.mcp.json').mcpServers['codex-web-capabilities'];assert.equal(mcp.command,'node');assert.deepEqual(mcp.args,['${PLUGIN_ROOT}/dist/mcp.mjs']);
for(const p of ['dist/mcp.mjs','dist/cli.mjs','README.md','LICENSE','THIRD_PARTY_NOTICES.md','docs/reference-projects.md','docs/browser-workflow.md','docs/runtime.md','runtime/integration-policy.json'])assert(existsSync(join(root,p)),p);
const skills=readdirSync(join(root,'skills'));assert.equal(skills.length,6);
for(const skill of skills){const text=readFileSync(join(root,'skills',skill,'SKILL.md'),'utf8');assert(text.startsWith('---\n'));assert(text.includes(`name: ${skill}\n`));assert(text.includes('description: '));assert(text.includes('../../docs/'));}
for(const path of ['skills','docs','dist','runtime'])assert(!lstatSync(join(root,path)).isSymbolicLink());
assert.equal(read('runtime/integration-policy.json').commit,'f137c2f84da5df214c1e228d74f5ff43e7641c48');
console.log('Plugin manifest, MCP entrypoint, six skills, references and runtime pin validated.');
