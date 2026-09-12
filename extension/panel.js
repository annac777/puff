const $=id=>document.getElementById(id);
const inExtension=typeof chrome!=='undefined'&&!!chrome.runtime?.id;
let token='',state=null,currentDraft=null,checkpoint=null,job=null,polling=false,startedNew=false;
if(inExtension)document.body.classList.add('extension');
const floating=inExtension&&window.parent!==window;
// Engineering setup is opt-in and never part of the embedded user flow.
const developerMode=!floating&&new URL(window.location?.href||'http://localhost/').searchParams.get('developer')==='1';
$('settings-toggle').hidden=!developerMode;
if(floating){document.body.classList.add('floating');}
const contextDetails=document.createElement('details'),contextSummary=document.createElement('summary'),contextPreview=document.createElement('pre');
contextSummary.textContent='Exactly what was sent to the model';contextDetails.append(contextSummary,contextPreview);$('browser').after(contextDetails);
const CONSENT_KEY='puffModelConsent',CONTENTS_KEY='puffContentConsent';
function consentGranted(){try{return localStorage.getItem(CONSENT_KEY)==='1';}catch{return false;}}
function rememberConsent(value){try{localStorage.setItem(CONSENT_KEY,value?'1':'0');}catch{}}
// Reading document text is a separate, narrower permission and is never implied by the first one.
function contentsGranted(){try{return localStorage.getItem(CONTENTS_KEY)==='1';}catch{return false;}}
function setReady(){$('consent-row').hidden=consentGranted();$('contents-row').hidden=consentGranted()&&contentsGranted();}
async function captureContext(){
  if(!inExtension)return null;
  try{return await chrome.runtime.sendMessage({type:'CAPTURE_CONTEXT',readContents:contentsGranted()});}catch{return null;}
}
// A record belongs to the current workspace only if its own anchor still matches what is captured.
function sameContext(record){
  if(!state)return false;
  const now=state.context||{},was=record?.context||{};
  const liveFigma=state.figmaFresh?now.figma?.sessionId:null;
  if(was.figma?.sessionId&&liveFigma)return was.figma.sessionId===liveFigma;
  if(was.browser?.url&&now.browser?.url)return was.browser.url===now.browser.url;
  return false;
}
function clearDraft(){currentDraft=null;checkpoint=null;job=null;$('draft-card').hidden=true;$('saved').hidden=true;$('work').hidden=true;$('anchors').replaceChildren();$('interpretation').textContent='';text('task-question','');text('task-why','');}
function showError(e){$('error').hidden=false;$('error').textContent=e.message||String(e);}
async function api(route,body){
  if(inExtension){const r=await chrome.runtime.sendMessage({type:'BRIDGE',route,body});if(!r?.ok)throw new Error(r?.error||'Bridge unavailable');return r.data;}
  const r=await fetch(route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j.error||'Request failed');return j;
}
function button(id,fn){$(id).onclick=async()=>{const b=$(id);b.disabled=true;$('error').hidden=true;try{await fn();}catch(e){showError(e);}finally{b.disabled=false;}};}
function text(id,value){$(id).textContent=value||'';}
function renderDraft(record){currentDraft=record;$('draft-card').hidden=false;text('component',record.draft.component==='COMPARE'?'Compare saved anchors':record.draft.component==='CLARIFY'?'Clarify your intention':'Checkpoint draft');$('interpretation').replaceChildren(document.createTextNode("It seems like you're "),Object.assign(document.createElement('em'),{textContent:record.draft.interpretation.replace(/\.$/,'')}),document.createTextNode('.'));text('uncertainty',record.draft.uncertainty);$('next').value=record.userIntent||record.draft.nextStep;
 const nodes=[...(record.context.figma?.selection||[]),...(record.context.figma?.frames||[])];$('anchors').replaceChildren();
 for(const id of record.draft.anchorIds){const node=nodes.find(n=>n.id===id);if(node){const el=document.createElement('div');el.className='anchor';el.textContent=node.name;$('anchors').append(el);}}
 // With no Figma session the chips show the tabs Puff actually read, so its reasoning is inspectable.
 if(!$('anchors').children.length){for(const tab of (record.context.browser?.tabs||[]).slice(0,4)){const el=document.createElement('div');el.className='anchor';if(tab.active)el.classList.add('active');el.textContent=tab.title.replace(/\s*[–—|·-]\s*(Google (Docs|Sheets|文档|表格)|Figma).*$/,'').slice(0,34);el.title=tab.url;$('anchors').append(el);}}
 $('suggestions').replaceChildren();for(const value of record.draft.suggestions){const b=document.createElement('button');b.textContent=value;b.onclick=()=>{$('next').value=value;};$('suggestions').append(b);}text('trace',record.trace.map(t=>t.tool+' → '+t.status).join(' · '));
 // The agent proposes the task, so approving it needs no typing. The text stays editable.
 const task=record.draft.proposedTask;$('review-question').value=task.question;text('task-question',task.label);text('task-why',task.rationale);
 $('custom-task').hidden=true;
}
function renderCheckpoint(c){checkpoint=c;$('show-saved').hidden=false;text('away-step',c.nextStep);$('saved').hidden=false;text('saved-step',c.nextStep);if(currentDraft?.id===c.draftId){$('next').value=c.nextStep;$('draft-card').hidden=true;}}
async function refresh(){if(polling||!(inExtension||token))return;polling=true;try{
 state=await api('/state');text('connection',state.provider+' · '+state.model+' · '+(state.modelReady?'model configured':'model key missing')+' · local backend');
 contextPreview.textContent=JSON.stringify({...state.context,figma:state.figmaFresh?state.context.figma:null},null,2);
 const figma=state.figmaFresh?state.context.figma:null;text('fresh',figma?'Live':state.context.browser?'Browser only':'Not connected');text('focus',figma?figma.fileName+' / '+figma.page.name:state.context.browser?.title||'No workspace captured');text('facts',figma?'Selected: '+(figma.selection.map(n=>n.name).join(', ')||'nothing'):'Browser title and link only. Page contents are not read.');
 $('changes').replaceChildren();for(const change of (figma?.changes||[]).slice(-5)){const li=document.createElement('li');li.textContent=change.name+' · '+change.type.toLowerCase().replaceAll('_',' ')+' '+change.properties.join(', ');$('changes').append(li);}text('browser',figma?'Selected: '+(figma.selection.map(n=>n.name).join(', ')||'nothing'):state.context.browser?'Title and link only — page contents are not read.':'Open Puff on the page you are working in.');
 setReady();
 if(inExtension){try{const r=await chrome.runtime.sendMessage({type:'GET_STATE'});renderActivity(r?.state);}catch{}}
 // A draft describes the page it was made from. Showing it anywhere else presents a stale
 // conclusion as a fresh reading of the current context, so it must be re-anchored or dropped.
 if(currentDraft&&!sameContext(currentDraft))clearDraft();
 if(!currentDraft&&!startedNew){const latest=Object.values(state.drafts).filter(sameContext).sort((a,b)=>b.createdAt-a.createdAt)[0];if(latest&&Date.now()-latest.createdAt<600000)renderDraft(latest);}
 if(!checkpoint&&!startedNew){const latest=Object.values(state.checkpoints).filter(sameContext).sort((a,b)=>b.savedAt-a.savedAt)[0];if(latest)renderCheckpoint(latest);}
 const latestJob=Object.values(state.jobs).filter(j=>!checkpoint||j.checkpointId===checkpoint.id).sort((a,b)=>b.createdAt-a.createdAt)[0];
 if(latestJob&&checkpoint){job=latestJob;$('work').hidden=false;text('job-title',job.question);text('job-status',job.status+(job.error?' — '+job.error:''));$('cancel').hidden=job.status!=='running';text('result',job.result?.summary||'');text('job-trace',job.trace.map(t=>t.tool+' → '+t.status).join(' · '));$('sources').replaceChildren();for(const source of job.result?.sources||[]){const li=document.createElement('li'),a=document.createElement('a');a.textContent=source.title;a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);$('sources').append(li);}}
 syncAway();
 const command=Object.values(state.commands).filter(c=>checkpoint?.context.figma?.sessionId===c.sessionId).sort((a,b)=>b.createdAt-a.createdAt)[0];if(command)text('restore-status',command.status==='pending'?(Date.now()-command.createdAt>30_000?'Restore expired. Reconnect the plugin and try again.':'Waiting for Figma to confirm navigation…'):command.status+' · '+command.message);
 }catch(e){showError(e);}finally{polling=false;}}
button('connect',async()=>{token=$('token').value.trim();if(!inExtension&&!token){const r=await fetch('/pair',{method:'POST'});token=(await r.json()).token;$('token').value=token;}if(inExtension){const r=await chrome.runtime.sendMessage({type:'SET_BRIDGE_TOKEN',token});if(!r?.ok)throw new Error(r?.error||'Pairing failed');const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});if(tab?.url?.startsWith('http'))await api('/browser',{title:(tab.title||'').slice(0,200),url:tab.url,tabId:tab.id});}await refresh();$('settings').open=false;setView('review');});
button('reveal',async()=>{$('token').type=$('token').type==='password'?'text':'password';});
async function runDraft(){
 if(!$('consent').checked)throw new Error('Approve model sharing first.');
 text('agent-status','Agent is reading your context…');
 try{const r=await api('/draft',{intent:$('intent').value.trim(),consent:true});renderDraft(r);job=null;$('work').hidden=true;$('draft').hidden=true;text('agent-status','');}
 catch(e){text('agent-status','Agent request failed. No simulated answer.');$('draft').hidden=false;throw e;}
}
button('draft',runDraft);
// Only a context that actually exists is worth spending a model call on.
function hasContext(){return !!(state&&(state.context?.browser||state.figmaFresh));}
async function autoDraft(){
 if(!consentGranted()||!hasContext())return;
 // A draft recovered from local state is still a handoff worth showing, not a reason to stall.
 if(currentDraft){setView('review');return;}
 $('consent').checked=true;
 setView('scanning');
 try{await runDraft();setView('review');}catch(e){setView('quiet');showError(e);}
}
$('consent').onchange=async()=>{rememberConsent($('consent').checked);if($('consent').checked){text('quiet-status','');await autoDraft();}};
async function saveCheckpoint(){if(!currentDraft)throw new Error('Generate a draft first');const c=await api('/checkpoint',{draftId:currentDraft.id,nextStep:$('next').value});renderCheckpoint(c);text('agent-status','Checkpoint saved locally.');if(inExtension){const anchor=c.context.figma?.fileUrl?{title:c.context.figma.fileName,url:c.context.figma.fileUrl}:c.context.browser;await chrome.runtime.sendMessage({type:'USER_RESPONSE',action:'take_break',note:c.nextStep,anchor});}syncAway();return c;}
button('save',async()=>{await saveCheckpoint();job=null;syncAway();setView('away');});
button('later',async()=>{$('draft-card').hidden=true;text('agent-status','Keep working. No task has started.');setView('quiet');if(inExtension)await chrome.runtime.sendMessage({type:'USER_RESPONSE',action:'later'});});
button('restore',async()=>{if(!checkpoint)return;const result=await api('/restore',{checkpointId:checkpoint.id});text('restore-status',result.status==='pending'?'Waiting for Figma confirmation…':'Opening your saved work…');if(inExtension){const r=await chrome.runtime.sendMessage({type:'RESTORE_TAB',anchor:checkpoint.context.browser,fileUrl:checkpoint.context.figma?.fileUrl});if(!r?.ok)throw new Error(r?.error||'Tab restore failed');if(result.status!=='pending')text('restore-status','Saved browser page opened.');}else if(result.browser?.url){const opened=window.open(result.browser.url,'_blank','noopener');text('restore-status','Saved link requested. If blocked, allow a new tab.');}await refresh();});
button('cancel',async()=>{if(job)await api('/cancel',{id:job.id});await refresh();});
async function init(){if(inExtension){const stored=await chrome.storage.local.get('bridgeToken');token=stored.bridgeToken||'';$('token').value=token;const r=await chrome.runtime.sendMessage({type:'GET_STATE'});if(r?.state){text('policy',r.state.reason+' · '+Math.floor(r.state.activeSeconds/60)+' estimated active min');$('monitor').checked=r.state.enabled;$('demo').checked=r.state.demoMode;}await captureContext();}else{$('settings').open=true;$('monitor').disabled=true;$('demo').disabled=true;text('policy','Activity controls are available in the Chrome extension.');}$('consent').checked=consentGranted();$('read-contents').checked=contentsGranted();setReady();await refresh();}
$('read-contents').onchange=async()=>{
 try{localStorage.setItem(CONTENTS_KEY,$('read-contents').checked?'1':'0');}catch{}
 const r=await captureContext();
 text('quiet-status',$('read-contents').checked?(r?.excerptChars?`Read ${r.excerptChars} characters from this document.`:'No readable document text here. Puff still has the title and link.'):'Document text will not be read.');
 await refresh();
};
$('demo').onchange=async()=>{if(inExtension)await chrome.runtime.sendMessage({type:'SET_DEMO_MODE',enabled:$('demo').checked});};
$('monitor').onchange=async()=>{if(inExtension)await chrome.runtime.sendMessage({type:'SET_ENABLED',enabled:$('monitor').checked});};

function setView(view){
 if(view==='settings'&&!developerMode)view='quiet';
 document.body.dataset.view=view;
 for(const name of ['quiet','scanning','settings','review','away','return'])$(name+'-view').hidden=name!==view;
 text('view-name',({quiet:'',scanning:'Reading context',settings:'Developer setup',review:'Handoff review',away:'Holding your place',return:'Return receipt'})[view]);
 window.scrollTo(0,0);
 if(view==='away')startAwayClock(); else clearInterval(awayTimer);
 if(floating)chrome.runtime.sendMessage({type:'PANEL_VIEW',view}).catch(()=>{});
}
let awayTimer=null,awaySince=0;
function syncAway(){
 const status=job?.status;
 $('away-task').hidden=!checkpoint&&!status;
 // Small label = state word; body = the actual task, matching the ported design.
 text('away-status',status?({running:'Running',completed:'Done',failed:'Failed',canceled:'Canceled',interrupted:'Interrupted'})[status]||status:'Place saved · no task running');
 $('away-note').textContent=status?({running:'Coming back early will not stop it.',completed:'Your results are ready.',failed:'No fabricated result was substituted.',canceled:'Nothing was run.',interrupted:'It has not been retried.'})[status]||'':'Puff is holding your place only.';
 $('run-dot').classList.toggle('idle',status!=='running');
 $('cancel-away').hidden=status!=='running';
 if(checkpoint)text('away-step',status==='running'?job.question:checkpoint.nextStep);
}
function startAwayClock(){
 awaySince=Date.now();clearInterval(awayTimer);
 const tick=()=>{const s=Math.floor((Date.now()-awaySince)/1000);text('away-elapsed','Away for '+(s>=60?Math.floor(s/60)+'m '+(s%60)+'s':s+'s'));};
 tick();awayTimer=setInterval(tick,1000);
}
button('edit-task',async()=>{$('custom-task').hidden=false;$('review-question').value='';$('review-question').focus();});
button('custom-back',async()=>{$('custom-task').hidden=true;$('review-question').value='';});
// The local activity estimate drives the same pill Hyeji's design shows, using measured seconds.
function renderActivity(s){
 if(!s||!s.enabled){$('work-pill').hidden=true;return;}
 const secs=Math.floor(s.sessionSeconds||0);
 if(secs<60){$('work-pill').hidden=true;}
 else{
  const h=Math.floor(secs/3600),m=Math.floor(secs%3600/60);
  text('work-time','Working for '+(h?h+'h '+m+'m':m+'m'));
  $('work-pill').hidden=false;
 }
 // gentle_nudge is the policy's own invitation moment, not a timer going off.
 const nudging=s.mode==='gentle_nudge'&&!currentDraft;
 $('work-pill').classList.toggle('warn',nudging);
 text('quiet-title',nudging?'Wanna take a break?':'Hold your thoughts?');
 text('quiet-sub',nudging?"I'll hold your place while you step away.":'I can keep your context safe while you step away.');
 $('hold').textContent=nudging?'Take a break':'Hold this thought';
}
button('approve-custom',async()=>{const q=$('review-question').value.trim();if(q.length<5)throw new Error('Tell Puff what to do in a few more words.');await startHandoff(q);});
button('settings-toggle',async()=>{setView('settings');$('settings').open=true;});
button('minimize',async()=>{if(floating){const r=await chrome.runtime.sendMessage({type:'MINIMIZE_PANEL'});if(!r?.ok)throw new Error(r?.error||'Could not minimize Puff.');}});
button('settings-done',async()=>setView('quiet'));
button('hold',async()=>{
 await captureContext();
 await refresh();
 if(!consentGranted()){$('consent-row').hidden=false;text('quiet-status','Approve the line above so Puff may read this page\'s title and link.');return;}
 if(currentDraft){setView('review');return;}
 await autoDraft();
});
button('not-now',async()=>{text('quiet-status','No task started. Puff will wait.');if(inExtension)await chrome.runtime.sendMessage({type:'USER_RESPONSE',action:'later'});});
button('show-saved',async()=>{await refresh();setView('return');});
async function startHandoff(question){
 await saveCheckpoint();
 try{job=await api('/jobs',{checkpointId:checkpoint.id,question,consent:true});await refresh();setView('away');}
 catch(e){setView('away');throw e;}
}
button('approve',async()=>{const q=currentDraft?.draft?.proposedTask?.question||'';if(q.length<5)throw new Error('No task was proposed. Tell Puff what to do instead.');await startHandoff(q);});
button('back',async()=>{setView('return');await refresh();});
button('cancel-away',async()=>{if(job)await api('/cancel',{id:job.id});await refresh();});
button('return-quiet',async()=>setView('quiet'));
button('start-over',async()=>{
 startedNew=true;currentDraft=null;checkpoint=null;job=null;
 $('draft-card').hidden=true;$('saved').hidden=true;$('work').hidden=true;
 for(const id of ['intent','next','review-question'])$(id).value='';
 text('task-question','');text('task-why','');
 $('consent').checked=consentGranted();$('draft').hidden=false;text('agent-status','');text('restore-status','');
 setView('review');
});
setView(developerMode?'settings':'quiet');
// The confirm screen advertises space / N, so those keys must actually work.
document.addEventListener('keydown',event=>{
 if(document.body.dataset.view!=='review'||!$('custom-task').hidden)return;
 const typing=['TEXTAREA','INPUT'].includes(event.target?.tagName);
 if(typing||event.metaKey||event.ctrlKey||event.altKey)return;
 if(event.code==='Space'||event.code==='Enter'){event.preventDefault();$('approve').click();}
 else if(event.key==='n'||event.key==='N'||event.code==='Escape'){event.preventDefault();$('save').click();}
});
init().catch(showError);setInterval(refresh,3000);
