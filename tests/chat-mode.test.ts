import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Jobs } from '../src/jobs.js';
import { Store } from '../src/store.js';
import type { Observation } from '../src/types.js';

const binding={browser:'native-chrome',tab:'one',conversation:'https://chatgpt.com/c/chat-test'};
const rejects=(p:Promise<unknown>,code:string)=>assert.rejects(p,(e:any)=>e.code===code);
function setup(){let now=100_000;const store=new Store(mkdtempSync(join(tmpdir(),'cwc-chat-')));return {jobs:new Jobs(store,()=>now),store,tick:()=>{now+=15_000;}};}

test('GPT-6 chat completes with independently recorded effort and continues in the same mode',async()=>{
 const s=setup();const j=await s.jobs.prepare({kind:'collaborate',prompt:'Analyze the fixture'});assert.equal(j.mode,'chat');
 await s.jobs.bind(j.id,binding,[]);const r=await s.jobs.reserve(j.id,{binding,model:'GPT-6',mode:'chat',effort:'高',attachmentsReady:true});
 const evidence={binding,nonce:r.nonce,turn:'new',visiblePrompt:j.prompt,model:'GPT-6',mode:'chat' as const,effort:'高'};
 await rejects(s.jobs.submission(j.id,{...evidence,effort:'中'}),'EFFORT_MISMATCH');
 await rejects(s.jobs.submission(j.id,{...evidence,effort:undefined}),'EFFORT_MISMATCH');
 await s.jobs.submission(j.id,{...evidence,effort:'High'});
 const observation:Observation={binding,turn:'new',phase:'complete',text:'The current fixture has a verified boundary defect.',model:'GPT-6',mode:'chat',effort:'high',generating:false};
 await rejects(s.jobs.observe(j.id,{...observation,mode:'pro'}),'MODE_MISMATCH');
 await rejects(s.jobs.observe(j.id,{...observation,effort:'中'}),'EFFORT_MISMATCH');
 await s.jobs.observe(j.id,observation);s.tick();await s.jobs.observe(j.id,observation);
 const result=await s.jobs.result(j.id);assert.equal(result.actualModel,'GPT-6');assert.equal(result.actualMode,'chat');assert.equal(result.actualEffort,'high');
 const receipt=JSON.parse(readFileSync(result.receiptPath,'utf8'));assert.equal(receipt.effort,'high');assert.equal(receipt.mode,'chat');
 const follow=await s.jobs.prepare({kind:'collaborate',prompt:'Review the correction',parent:j.id});assert.equal(follow.mode,'chat');assert.deepEqual(follow.binding,binding);
 await s.jobs.bind(follow.id,binding,['new']);await rejects(s.jobs.reserve(follow.id,{binding,model:'Pro',mode:'pro',attachmentsReady:true}),'MODE_MISMATCH');
});

test('persisted legacy Pro tasks retain Pro mode instead of silently becoming GPT-6 chat',async()=>{
 const s=setup();const j=await s.jobs.prepare({kind:'collaborate',prompt:'Legacy task'});await s.jobs.bind(j.id,binding,[]);
 const r=await s.jobs.reserve(j.id,{binding,model:'Visible Pro',mode:'pro',attachmentsReady:true});
 await s.jobs.submission(j.id,{binding,nonce:r.nonce,turn:'old-pro-turn',visiblePrompt:j.prompt,model:'Visible Pro'});
 await s.store.transact(db=>{delete db.jobs[j.id]!.mode;delete db.jobs[j.id]!.expectedMode;delete db.jobs[j.id]!.actualMode;});
 const restarted=new Jobs(new Store(s.store.home));assert.equal((await restarted.status(j.id)).mode,'pro');
 await rejects(restarted.observe(j.id,{binding,turn:'old-pro-turn',phase:'thinking',model:'Visible Pro',mode:'chat',generating:true}),'MODE_MISMATCH');
 assert.equal((await restarted.observe(j.id,{binding,turn:'old-pro-turn',phase:'thinking',model:'Visible Pro',mode:'pro',generating:true})).status,'running');
});

test('explicit capability modes cannot switch between chat, Pro, research and images',async()=>{
 const s=setup();await rejects(s.jobs.prepare({kind:'research',mode:'chat',prompt:'Research'}),'MODE_MISMATCH');
 const j=await s.jobs.prepare({kind:'collaborate',mode:'chat',prompt:'GPT-6 only'});await s.jobs.bind(j.id,binding,[]);
 await rejects(s.jobs.reserve(j.id,{binding,model:'Visible Pro',mode:'pro',attachmentsReady:true}),'MODE_MISMATCH');
});
