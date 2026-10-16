import {readFileSync,writeFileSync,readdirSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
const lines=['# Third-party notices','','Codex Web Capabilities is MIT licensed.','The optional upstream runtime is installed separately, preserving its own LICENSE and dependency notices. No upstream project source files were copied into this plugin. Design references and exact inspected revisions are in docs/reference-projects.md.','','## Referenced projects',''];
for(const row of JSON.parse(readFileSync('runtime/reference-lock.json','utf8')))lines.push(`- ${row.repo} @ ${row.sha} — ${row.license.spdx_id}. https://github.com/${row.repo}/tree/${row.sha}`);
lines.push('','openai/tunnel-client is an indirect optional runtime dependency pinned by upstream to release v0.0.16 (Apache-2.0). No tunnel binary is bundled.','Oracle cookie-based download code and all projects without a verified license are excluded.','','## JavaScript production dependency licenses','','The self-contained dist bundles include portions of these locked production dependencies. This inventory is conservative and also includes production packages whose code may be tree-shaken.');
const missing=[];
for(const [path,entry]of Object.entries(lock.packages).sort()){
 if(!path||entry.dev||!existsSync(join(path,'package.json')))continue;
 const pkg=JSON.parse(readFileSync(join(path,'package.json'),'utf8'));const files=readdirSync(path).filter(f=>/^(licen[sc]e|copying|notice)(\..*)?$/i.test(f));
 lines.push('',`### ${pkg.name} ${pkg.version}`,`License: ${typeof pkg.license==='string'?pkg.license:JSON.stringify(pkg.license)}`,'');
 if(!files.length){missing.push(pkg.name);continue;}
 for(const file of files)lines.push(`Source: ${pkg.name}/${file}`,'',readFileSync(join(path,file),'utf8'));
}
if(missing.length)throw new Error('License texts missing: '+missing.join(', '));
writeFileSync('THIRD_PARTY_NOTICES.md',lines.join('\n')+'\n');
console.log('Third-party license inventory generated.');
