import http from 'node:http';
import { randomBytes,randomUUID,timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { z } from 'zod';
import { availableAnchors,interpret,providerConfig,research,snapshotSchema,type Context,type Trace } from './agent.js';

const root=process.cwd();
for(const file of ['.env','starter-kit/.env']) {try{loadEnvFile(path.join(root,file));}catch{}}
type RecordData={context:Context;drafts:Record<string,any>;checkpoints:Record<string,any>;jobs:Record<string,any>;commands:Record<string,any>};
export function createApp(directory:string,dependencies={interpret,research}) {
  fs.mkdirSync(directory,{recursive:true,mode:0o700});
  const tokenPath=path.join(directory,'bridge-token');
  if(!fs.existsSync(tokenPath)) fs.writeFileSync(tokenPath,randomBytes(32).toString('hex'),{mode:0o600});
  const token=fs.readFileSync(tokenPath,'utf8');
  const dataPath=path.join(directory,'state.json');
  const data:RecordData=fs.existsSync(dataPath)?JSON.parse(fs.readFileSync(dataPath,'utf8')):{context:{figma:null,browser:null},drafts:{},checkpoints:{},jobs:{},commands:{}};
  const controllers=new Map<string,AbortController>();
  for(const job of Object.values(data.jobs)) if(job.status==='running') {job.status='interrupted';job.error='Local backend restarted; this task was not automatically retried.';}
  const persist=()=>{fs.writeFileSync(dataPath+'.tmp',JSON.stringify(data),{mode:0o600});fs.renameSync(dataPath+'.tmp',dataPath);};persist();
  let drafting=false;
  const sameToken=(value:string)=>{const a=Buffer.from(value),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);};
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const origin=req.headers.origin||'';
    const allowed=!origin||origin==='null'||/^chrome-extension:\/\/[a-p]{32}$/.test(origin)||/^https:\/\/(www\.)?figma.com$/.test(origin)||/^http:\/\/(localhost|127\.0\.0\.1):4318$/.test(origin);
    const host=req.headers.host||'';
    const send=(status:number,body:unknown)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
    if(!/^(localhost|127\.0\.0\.1):\d+$/.test(host)||!allowed) return send(403,{error:'Origin or host not allowed'});
    if(origin) {res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
    res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
    const route=new URL(req.url||'/',`http://${host}`).pathname;
    if(req.method==='GET'&&['/','/panel.js','/panel.css'].includes(route)) {
      const file=route==='/'?'panel.html':route.slice(1);
      res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'"});
      return res.end(fs.readFileSync(path.join(root,'extension',file)));
    }
    // Pairing requires a same-origin page; remote origins cannot retrieve the local secret.
    if(route==='/pair'&&req.method==='POST'&&(!origin||origin===`http://${host}`)) return send(200,{token});
    if(!sameToken((req.headers.authorization||'').replace(/^Bearer /,''))) return send(401,{error:'Pair this client with the local backend first.'});
    try {
      let body:any={};
      if(req.method==='POST') {let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>50_000)throw new Error('Request too large');}body=JSON.parse(raw||'{}');}
      if(req.method==='GET'&&route==='/state') {
        const cfg=providerConfig();
        return send(200,{...data,provider:cfg.provider,model:cfg.model,modelReady:!!cfg.key,exaReady:!!process.env.EXA_API_KEY,figmaFresh:!!data.context.figma&&Date.now()-data.context.figma.capturedAt<45_000,drafting});
      }
      if(req.method!=='POST')return send(404,{error:'Not found'});
      if(route==='/snapshot') {
        const snap=snapshotSchema.parse(body);snap.capturedAt=Date.now();
        if(snap.fileUrl && !/^https:\/\/(www\.)?figma.com\/(design|file)\/[a-zA-Z0-9]+(?:\/|\?|$)/.test(snap.fileUrl)) throw new Error('Use a Figma design/file URL.');
        data.context.figma=snap;persist();return send(200,{ok:true});
      }
      if(route==='/disconnect-figma') {if(data.context.figma?.sessionId===body.sessionId)data.context.figma=null;persist();return send(200,{ok:true});}
      if(route==='/browser') {
        const input=z.object({title:z.string().max(200),url:z.string().url().max(2000),tabId:z.number().optional()}).parse(body);
        const u=new URL(input.url);if(!['http:','https:'].includes(u.protocol))throw new Error('Unsupported URL');u.search='';u.hash='';u.username='';u.password='';
        data.context.browser={...input,url:u.href};persist();return send(200,{ok:true});
      }
      if(route==='/draft') {
        const input=z.object({consent:z.literal(true),intent:z.string().max(500).default('')}).parse(body);
        if(drafting) return send(409,{error:'Agent is already preparing a checkpoint.'});
        const context=structuredClone(data.context);
        if(context.figma&&Date.now()-context.figma.capturedAt>45_000)context.figma=null;
        if(!context.figma&&!context.browser)throw new Error('No fresh context. Connect the Figma adapter or capture a browser tab.');
        drafting=true;
        try {
          const trace:Trace[]=[];const draft=await dependencies.interpret(context,input.intent,trace,AbortSignal.timeout(90_000));
          const id=randomUUID();data.drafts[id]={id,createdAt:Date.now(),context,draft,trace,userIntent:input.intent};persist();return send(200,data.drafts[id]);
        }finally{drafting=false;}
      }
      if(route==='/checkpoint') {
        const input=z.object({draftId:z.string(),nextStep:z.string().trim().min(1).max(500)}).parse(body);
        const proposal=data.drafts[input.draftId];if(!proposal||Date.now()-proposal.createdAt>10*60_000)throw new Error('Draft missing or expired; generate another checkpoint.');
        const existing=Object.values(data.checkpoints).find(c=>c.draftId===input.draftId);
        if(existing)return send(200,existing);
        const id=randomUUID();const anchors=availableAnchors(proposal.context).filter(n=>proposal.draft.anchorIds.includes(n.id));
        data.checkpoints[id]={id,draftId:input.draftId,savedAt:Date.now(),nextStep:input.nextStep,context:proposal.context,anchors,interpretation:proposal.draft.interpretation};persist();return send(200,data.checkpoints[id]);
      }
      if(route==='/restore') {
        const checkpoint=data.checkpoints[body.checkpointId];if(!checkpoint)throw new Error('Checkpoint missing');
        const figma=checkpoint.context.figma;
        if(!figma||!checkpoint.anchors.length)return send(200,{status:'browser-only',browser:checkpoint.context.browser});
        if(!data.context.figma||data.context.figma.sessionId!==figma.sessionId||Date.now()-data.context.figma.capturedAt>45_000)throw new Error('Figma adapter is not active in the original file session. Reopen that file/plugin; use the saved file link meanwhile.');
        const id=randomUUID();data.commands[id]={id,sessionId:figma.sessionId,anchors:checkpoint.anchors,status:'pending',createdAt:Date.now(),nextStep:checkpoint.nextStep};persist();return send(200,data.commands[id]);
      }
      if(route==='/commands')return send(200,{commands:Object.values(data.commands).filter(c=>c.sessionId===body.sessionId&&c.status==='pending'&&Date.now()-c.createdAt<30_000)});
      if(route==='/command-result') {
        const c=data.commands[body.id];if(!c||c.sessionId!==body.sessionId)throw new Error('Unknown restore command');
        if(c.status!=='pending'||Date.now()-c.createdAt>30_000)throw new Error('Restore command expired or already acknowledged');
        c.status=body.ok===true?'restored':'failed';c.message=String(body.message||'').slice(0,500);persist();return send(200,{ok:true});
      }
      if(route==='/jobs') {
        const input=z.object({checkpointId:z.string(),question:z.string().trim().min(5).max(300),consent:z.literal(true)}).parse(body);
        if(!data.checkpoints[input.checkpointId])throw new Error('Save a checkpoint first');
        const existing=Object.values(data.jobs).find(j=>j.checkpointId===input.checkpointId&&j.question===input.question);
        if(existing)return send(200,existing);
        if([...controllers.values()].length>=1)return send(409,{error:'One break-time job at a time.'});
        const id=randomUUID(),controller=new AbortController();controllers.set(id,controller);
        const job=data.jobs[id]={id,checkpointId:input.checkpointId,question:input.question,status:'running',trace:[] as Trace[],createdAt:Date.now()};persist();
        void dependencies.research(input.question,job.trace,AbortSignal.any([controller.signal,AbortSignal.timeout(120_000)])).then(result=>{
          if(data.jobs[id].status==='running')Object.assign(data.jobs[id],{status:'completed',result});
        }).catch(()=>{if(data.jobs[id].status==='running')Object.assign(data.jobs[id],{status:'failed',error:'Research failed or exceeded its time budget. No fabricated result was substituted.'});}).finally(()=>{controllers.delete(id);persist();});
        return send(202,job);
      }
      if(route==='/cancel') {const job=data.jobs[body.id];if(!job)throw new Error('Unknown job');if(job.status==='running'){job.status='canceled';controllers.get(body.id)?.abort();persist();}return send(200,job);}
      return send(404,{error:'Not found'});
    }catch(error){const message=error instanceof z.ZodError?'Invalid request fields':error instanceof Error?error.message:'Request failed';send(400,{error:message.replace(/(?:sk-|key-)[A-Za-z0-9_-]+/g,'[redacted]').slice(0,350)});}
  });
  return {server,token,data};
}
if(process.argv[1]?.endsWith('server.ts')) {
  const {server}=createApp(path.join(root,'.off-ramp'));
  server.listen(4318,'127.0.0.1',()=>{const cfg=providerConfig();console.log(`Off-Ramp: http://127.0.0.1:4318 — ${cfg.provider} / ${cfg.model}. Local only. Laptop must stay awake.`);});
}
