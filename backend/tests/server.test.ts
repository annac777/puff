import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createApp} from '../server.js';import type {Context,Trace} from '../agent.js';
const fixture={sessionId:'fixture-session',fileName:'TEST FIXTURE — not a live Figma file',fileUrl:'',page:{id:'1:1',name:'Checkout'},selection:[{id:'2:1',name:'Mobile',type:'FRAME',pageId:'1:1'}],frames:[{id:'2:1',name:'Mobile',type:'FRAME',pageId:'1:1'},{id:'2:2',name:'Tablet',type:'FRAME',pageId:'1:1'}],changes:[],lastChangeAt:0,capturedAt:Date.now()};
test('bridge enforces consent, immutable checkpoints, known anchors, cancellation and restore acknowledgement',async()=>{
 let calls=0;const directory=fs.mkdtempSync(path.join(os.tmpdir(),'off-ramp-test-'));
 const app=createApp(directory,{interpret:async(context:Context,intent:string,trace:Trace[])=>{calls++;trace.push({tool:'inspect_work_context',status:'completed'});return {component:'COMPARE' as const,interpretation:'Test comparison',nextStep:intent,suggestions:[],anchorIds:['2:1','2:2'],uncertainty:'',proposedTask:{label:'run the fixture research',question:'Fixture research question',rationale:'Fixture rationale'}};},research:async(_q:string,_t:Trace[],signal:AbortSignal)=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('canceled'))))});
 await new Promise<void>(resolve=>app.server.listen(0,'127.0.0.1',resolve));const address=app.server.address() as {port:number};const base=`http://127.0.0.1:${address.port}`;
 const request=async(route:string,body?:unknown,auth=true,origin?:string)=>{const r=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${app.token}`}:{ }),...(origin?{Origin:origin}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json() as any};};
 try{
 assert.equal((await request('/state',undefined,false)).status,401);
 assert.equal((await request('/pair',{},false,'https://evil.example')).status,403);
 assert.equal((await request('/snapshot',{sessionId:'invalid'})).status,400);
 assert.equal((await request('/snapshot',fixture)).status,200);
 assert.equal((await request('/draft',{intent:'Compare'})).status,400);assert.equal(calls,0);
 const draft=(await request('/draft',{intent:'Compare mobile with tablet',consent:true})).body;assert.equal(calls,1);
 const saved=(await request('/checkpoint',{draftId:draft.id,nextStep:'My corrected intention'})).body;assert.equal(saved.nextStep,'My corrected intention');assert.equal(saved.anchors.length,2);
 const duplicate=(await request('/checkpoint',{draftId:draft.id,nextStep:'Overwrite'})).body;assert.equal(duplicate.nextStep,'My corrected intention');
 const restore=(await request('/restore',{checkpointId:saved.id})).body;assert.equal(restore.status,'pending');
 assert.equal((await request('/command-result',{id:restore.id,sessionId:'wrong',ok:true})).status,400);
 await request('/command-result',{id:restore.id,sessionId:fixture.sessionId,ok:true,message:'selected'});
 assert.equal(app.data.commands[restore.id].status,'restored');
 assert.equal((await request('/command-result',{id:restore.id,sessionId:fixture.sessionId,ok:false})).status,400);
 assert.equal((await request('/jobs',{checkpointId:saved.id,question:'Test public question'})).status,400);
 const job=(await request('/jobs',{checkpointId:saved.id,question:'Test public question',consent:true})).body;
 assert.equal((await request('/jobs',{checkpointId:saved.id,question:'Test public question',consent:true})).body.id,job.id);
 await request('/cancel',{id:job.id});assert.equal(app.data.jobs[job.id].status,'canceled');
 await request('/disconnect-figma',{sessionId:fixture.sessionId});assert.equal((await request('/restore',{checkpointId:saved.id})).status,400);
 // Location parameters survive; credentials and tracking do not.
 await request('/browser',{title:'Sheet',url:'https://docs.google.com/spreadsheets/d/AB/edit?gid=1707700656&access_token=secret#gid=1707700656'});
 const sheetUrl=(await request('/state')).body.context.browser.url;
 assert.match(sheetUrl,/[?&]gid=1707700656/);
 assert.doesNotMatch(sheetUrl,/access_token/);
 await request('/browser',{title:'Figma',url:'https://www.figma.com/design/AB/Demo?node-id=12-345&t=trackme'});
 const figmaUrl=(await request('/state')).body.context.browser.url;
 assert.match(figmaUrl,/node-id=12-345/);
 assert.doesNotMatch(figmaUrl,/trackme/);
 }finally{await new Promise<void>(resolve=>app.server.close(()=>resolve()));}
});
test('interrupted jobs are not retried on restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'off-ramp-restart-'));const app=createApp(dir);app.data.jobs.a={status:'running'};fs.writeFileSync(path.join(dir,'state.json'),JSON.stringify(app.data));
 const restarted=createApp(dir);assert.equal(restarted.data.jobs.a.status,'interrupted');app.server.close();restarted.server.close();
});
