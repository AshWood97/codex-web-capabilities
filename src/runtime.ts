import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, readdirSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname, delimiter } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Store } from './store.js';
import { assert } from './errors.js';
import { hash, hasSecret } from './context.js';
export const PIN='6f43747eb5585ca623c0617e729826dfd680c5b7';
const REPO='https://github.com/miuuyy/codex-chatgpt-web.git';
function paths(home:string) { const root=join(home,'runtime');return {root,source:join(root,'source'),profile:join(root,'profile'),codex:join(root,'codex-home'),launcher:join(root,'launcher-data'),journal:join(root,'transaction.json')}; }
export function runtimeEnvironment(home:string,bun='bun'):NodeJS.ProcessEnv {
  const p=paths(home);const executable=resolveExecutable(bun);
  const env:NodeJS.ProcessEnv={...process.env,CODEX_CHATGPT_WEB_HOME:p.profile,CODEX_HOME:p.codex,CODEX_WEB_GPT_LAUNCHER_DATA_DIR:p.launcher,
    CODEX_WEB_GPT_BUN:executable,CODEX_CHATGPT_WEB_BUN:executable,
    PATH:(executable.includes('/') ? dirname(executable)+delimiter : '')+(process.env.PATH??'')};
  for(const key of ['CODEX_WEB_GPT_DEV_HOME','VITE_DEV_SERVER_URL','CODEX_CHATGPT_WEB_LAUNCHER','CODEX_CHATGPT_WEB_TRUSTED_CODEX_HOMES','CODEX_CHATGPT_WEB_BROWSER_HOST_DESCRIPTOR','CODEX_WEB_GPT_LAUNCHER_CONTROL_TOKEN','ELECTRON_RUN_AS_NODE'])delete env[key];
  return env;
}
function git(source:string,args:string[]) { return execFileSync('git',['-C',source,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(); }
function verified(home:string) { const p=paths(home);assert(existsSync(join(p.source,'.git')),'RUNTIME_MISSING','Run runtime prepare first.');assert(git(p.source,['rev-parse','HEAD'])===PIN,'RUNTIME_PIN','Runtime checkout differs from the approved SHA.');assert(!git(p.source,['diff','--name-only','HEAD']),'RUNTIME_DIRTY','Tracked upstream source was modified. Review and restore it before running.');return p; }
function journal(home:string,data:Record<string,unknown>) {const p=paths(home);mkdirSync(p.root,{recursive:true,mode:0o700});const old=existsSync(p.journal)?JSON.parse(readFileSync(p.journal,'utf8')):{};const temp=p.journal+'.tmp';writeFileSync(temp,JSON.stringify({...old,...data,updated:new Date().toISOString()},null,2),{mode:0o600});renameSync(temp,p.journal);}
async function run(executable:string,args:string[],cwd:string,env:NodeJS.ProcessEnv,options:{capture?:boolean;log?:string;input?:string;allowFailure?:boolean}={}) {
  return new Promise<string>((resolveRun,reject)=>{
    const child=spawn(executable,args,{cwd,env,stdio:['pipe','pipe','pipe']});let out='';
    child.stdout.on('data',(chunk:Buffer)=>{if(options.capture)out+=chunk.toString();else process.stderr.write(chunk);if(options.log)writeFileSync(options.log,chunk,{flag:'a',mode:0o600});});
    child.stderr.on('data',(chunk:Buffer)=>process.stderr.write(chunk));
    if(options.input)child.stdin.end(options.input);else child.stdin.end();
    const interrupt=()=>child.kill('SIGINT');process.on('SIGINT',interrupt);process.on('SIGTERM',interrupt);
    child.once('error',error=>{process.off('SIGINT',interrupt);process.off('SIGTERM',interrupt);reject(error);});
    child.once('close',(code,signal)=>{process.off('SIGINT',interrupt);process.off('SIGTERM',interrupt);if(code===0||options.allowFailure)resolveRun(out);else reject(new Error(`Runtime command exited ${code??signal}. Inspect the preceding diagnostics; no fallback was attempted.`));});
  });
}
export function runtimeStatus(home:string) {
  const p=paths(home);let actual:string|undefined;try {actual=git(p.source,['rev-parse','HEAD']);}catch{}
  const record=existsSync(p.journal)?JSON.parse(readFileSync(p.journal,'utf8')):undefined;
  return {pin:PIN,installed:actual===PIN,actual,profile:p.profile,codexHome:p.codex,transaction:record,liveVerified:false,health:'run runtime doctor after launcher login and tunnel setup'};
}
async function performRuntimeCommand(operation:string,input:unknown) {
  const store=new Store();const p=paths(store.home);
  if(operation==='status')return runtimeStatus(store.home);
  if(operation==='prepare') {
    const x=z.object({bun:z.string().default('bun'),installDependencies:z.boolean().default(true)}).parse(input);
    const env=runtimeEnvironment(store.home,x.bun);
    const version=execFileSync(x.bun,['--version'],{encoding:'utf8',env}).trim();assert(version==='1.4.0','BUN_VERSION',`Pinned runtime requires Bun 1.4.0; found ${version}. Install it separately or pass its executable path.`);
    mkdirSync(p.root,{recursive:true,mode:0o700});
    if(!existsSync(p.source)) {const staging=p.source+'.staging';assert(!existsSync(staging),'STAGING_EXISTS','An interrupted download exists. Inspect source.staging before removing it.');await run('git',['clone','--no-checkout',REPO,staging],p.root,env);await run('git',['checkout','--detach',PIN],staging,env);renameSync(staging,p.source);}
    verified(store.home);
    journal(store.home,{stage:'source_verified',pin:PIN,bun:resolveExecutable(x.bun),primaryConfigModified:false,started:new Date().toISOString()});
    if(x.installDependencies) {await run(x.bun,['install','--frozen-lockfile'],p.source,env);await run(x.bun,['install','--frozen-lockfile'],join(p.source,'launcher'),env);}
    journal(store.home,{stage:x.installDependencies?'dependencies_ready':'source_verified'});
    return runtimeStatus(store.home);
  }
  const source=verified(store.home);const record=existsSync(p.journal)?JSON.parse(readFileSync(p.journal,'utf8')):{};
  const bun=z.object({bun:z.string().default(record.bun??'bun')}).passthrough().parse(input).bun;
  const env=runtimeEnvironment(store.home,bun);
  const cli=['run',join(source.source,'src/cli.ts')];
  if(operation==='launcher') {
    mkdirSync(p.codex,{recursive:true,mode:0o700});mkdirSync(p.profile,{recursive:true,mode:0o700});
    await run(bun,['run','scripts/build-browser-helper.ts'],p.source,env);
    await run(bun,['run','build'],join(p.source,'launcher'),env);
    await run(bun,['run','start'],join(p.source,'launcher'),env);
    return {status:'launcher_closed'};
  }
  if(operation==='configure') {
    const x=z.object({tunnelId:z.string().min(1),runtimeKeyFile:z.string().min(1),browserHostDescriptor:z.string().min(1),port:z.number().int().min(1024).max(65535).default(43187),codexConfig:z.string().optional(),retainedSession:z.boolean().default(true),biggerContext:z.boolean().default(false),acknowledgeUnofficial:z.literal(true)}).parse(input);
    assert(!(x.retainedSession&&x.biggerContext),'CONTEXT_CONFLICT','Retained sessions and Bigger Context are mutually exclusive.');
    assert(existsSync(x.runtimeKeyFile)&&existsSync(x.browserHostDescriptor),'SETUP_INPUT_MISSING','Provide an existing runtime-key file and the embedded launcher browser-host descriptor.');
    const config=join(p.codex,'config.toml');mkdirSync(p.codex,{recursive:true,mode:0o700});
    assert(!['configured','configuring','setup_failed'].includes(record.stage),'ALREADY_CONFIGURED','Inspect the transaction and use rollback before retrying setup; preserve its original backup.');
    // Only this isolated profile is writable. Existing primary routing and permissions are never overwritten.
    const origin=x.codexConfig??join(process.env.CODEX_HOME??join(homedir(),'.codex'),'config.toml');
    if(!existsSync(config) && existsSync(origin))writeFileSync(config,readFileSync(origin),{mode:0o600});
    const before=existsSync(config)?readFileSync(config,'utf8'):'';writeFileSync(join(p.root,'config.before.toml'),before,{mode:0o600});
    journal(store.home,{stage:'configuring',sourceConfig:origin,beforeHash:hash(before),primaryConfigModified:false});
    const args=[...cli,'setup','--full','--tunnel-id',x.tunnelId,'--runtime-key-file',resolve(x.runtimeKeyFile),'--browser-host-descriptor',resolve(x.browserHostDescriptor),'--port',String(x.port),'--subagent-protocol','native',x.retainedSession?'--retained-conversation':'--fresh-conversation',x.biggerContext?'--bigger-context':'--standard-context','--saved-chats','--no-composer-predictions','--acknowledge-unofficial'];
    try {await run(bun,args,p.source,env);journal(store.home,{stage:'configured',afterHash:hash(readFileSync(config)),retainedSession:x.retainedSession,biggerContext:x.biggerContext,subagentProtocol:'native'});}
    catch(error){journal(store.home,{stage:'setup_failed',afterHash:existsSync(config)?hash(readFileSync(config)):undefined});throw error;}
    return {status:'configured_pending_account_verification',next:'Attach the tunnel connector in ChatGPT, then runtime doctor. Native subagent protocol is required; incompatible external routes are reported, never silently replaced.',...runtimeStatus(store.home)};
  }
  if(operation==='doctor') {
    const output=await run(bun,[...cli,'doctor','--json'],p.source,env,{capture:true,allowFailure:true});
    try{return {upstream:JSON.parse(output),profile:p.profile,accountVerified:'inspect upstream checks',voice:'not_implemented'};}catch{return {output,profile:p.profile};}
  }
  if(operation==='rollback') {
    // The upstream journal performs owned-field restoration and detects conflicting user edits.
    await run(bun,[...cli,'route','disconnect'],p.source,env);
    journal(store.home,{stage:'disconnected',primaryConfigModified:false});return {status:'disconnected',dataPreserved:true,primaryConfigModified:false,profile:p.profile};
  }
  if(operation==='exec') {
    const x=z.object({root:z.string().min(1),promptFile:z.string().min(1),model:z.string().min(1),codex:z.string().default('codex')}).parse(input);
    assert(record.stage==='configured','RUNTIME_NOT_CONFIGURED','Configure the isolated runtime and complete account authorization first.');
    const prompt=readFileSync(x.promptFile,'utf8');assert(prompt.trim()&&!hasSecret(prompt),'INVALID_PROMPT','Empty or secret-bearing prompt.');
    const health=await run(bun,[...cli,'doctor','--json'],p.source,env,{capture:true,allowFailure:true});
    assert(JSON.parse(health).ok===true,'RUNTIME_UNHEALTHY','Upstream doctor did not confirm a healthy full runtime.');
    const configPath=join(p.profile,'config.json');assert(existsSync(configPath),'CONFIG_MISSING','Upstream config.json is missing.');
    const configuration=JSON.parse(readFileSync(configPath,'utf8'));
    assert(configuration.mode==='full'&&configuration.subagentProtocol==='native','FULL_MODE_REQUIRED','Only full native mode is accepted.');
    assert(configuration.autoApproveToolCalls!==true,'APPROVALS_CHANGED','Disable automatic tool approval in the runtime before executing.');
    assert(!configuration.experimentalBiggerContext||configuration.experimentalFreshConversationPerTurn,'CONTEXT_CONFLICT','Retained sessions and Bigger Context cannot coexist.');
    const runId=new Date().toISOString().replaceAll(':','-');const dir=join(p.root,'runs',runId);mkdirSync(dir,{recursive:true,mode:0o700});writeFileSync(join(dir,'doctor.json'),health,{mode:0o600});
    const runRecord={runId,pin:PIN,model:x.model,root:resolve(x.root),promptHash:hash(prompt),status:'running'};
    writeFileSync(join(dir,'run.json'),JSON.stringify(runRecord,null,2),{mode:0o600});
    try {await run(x.codex,['exec','--json','--model',x.model,'--cd',resolve(x.root),'-'],resolve(x.root),env,{input:prompt,log:join(dir,'events.jsonl')});writeFileSync(join(dir,'run.json'),JSON.stringify({...runRecord,status:'completed'},null,2),{mode:0o600});}
    catch(error){writeFileSync(join(dir,'run.json'),JSON.stringify({...runRecord,status:'interrupted_or_failed'},null,2),{mode:0o600});throw error;}
    return {status:'completed',runId,evidenceDirectory:dir,warning:'Verify events contain actual native tool executions and local test results; a completed process alone is not live acceptance.'};
  }
  throw new Error(`Unknown runtime operation ${operation}`);
}
function resolveExecutable(exe:string) { if(exe.includes('/'))return resolve(exe);const dirs=(process.env.PATH??'').split(delimiter);return dirs.map(x=>join(x,exe)).find(existsSync)??exe; }

export async function runtimeCommand(operation:string,input:unknown) {
  if(['status','doctor','launcher'].includes(operation))return performRuntimeCommand(operation,input);
  const store=new Store();const lock=store.path('runtime-operation.lock');const owner=JSON.stringify({pid:process.pid,nonce:randomUUID()});
  try {writeFileSync(lock,owner,{flag:'wx',mode:0o600});}
  catch(e) { if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;throw new Error('Another runtime operation owns runtime-operation.lock. If its process has exited, inspect the transaction journal before removing the stale lock.'); }
  try{return await performRuntimeCommand(operation,input);}
  finally{if(existsSync(lock)&&readFileSync(lock,'utf8')===owner)unlinkSync(lock);}
}
