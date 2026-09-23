importScripts("core.js");
const STORAGE_KEY="offRampState",BASE="http://127.0.0.1:4318";
let queue=Promise.resolve();
const serialize=fn=>{const job=queue.then(fn);queue=job.catch(()=>{});return job;};
async function getState(){const data=(await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];if(data?.version===2)return {...OffRampCore.initialState(),...data};return {...OffRampCore.initialState(),...(data?.checkpoint?{checkpoint:data.checkpoint}:{}),...(data?.enabled===false?{enabled:false}:{})};}
async function saveState(state){await chrome.storage.local.set({[STORAGE_KEY]:state});const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});if(tab?.id)chrome.tabs.sendMessage(tab.id,{type:"OFF_RAMP_STATE",state,intervention:OffRampCore.interventionFor(state)}).catch(()=>{});return state;}
async function tabContext(state,tab){if(!tab||!state.enabled)return state;return {...state,currentTabTitle:(tab.title||"").slice(0,200),currentTabUrl:OffRampCore.safeUrl(tab.url),currentTabId:tab.id,blocked:OffRampCore.protectedUrl(tab.url)};}
// First run pairs itself against the loopback backend: setup is engineering work, not the user's job.
async function ensureToken(){
  const stored=(await chrome.storage.local.get("bridgeToken")).bridgeToken;
  if(/^[a-f0-9]{64}$/.test(stored||""))return stored;
  let response;
  try{response=await fetch(BASE+"/pair",{method:"POST",signal:AbortSignal.timeout(4000)});}
  catch{throw new Error("Puff's local backend is not running. Start it with npm run dev, then reopen Puff.");}
  if(!response.ok)throw new Error("The local backend refused pairing. Restart it with npm run dev.");
  const {token}=await response.json();
  if(!/^[a-f0-9]{64}$/.test(token||""))throw new Error("The local backend returned an unexpected pairing token.");
  await chrome.storage.local.set({bridgeToken:token});
  return token;
}
async function bridge(route,body){const bridgeToken=await ensureToken();const r=await fetch(BASE+route,{method:body===undefined?"GET":"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+bridgeToken},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(route==="/draft"?100_000:10_000)});const data=await r.json();if(!r.ok)throw new Error(data.error||"Bridge failed");return data;}
// Google renders Docs and Sheets to canvas, so their text is not in the page DOM. Their own
// export endpoints return it using the session the user is already signed into. Opt-in only.
function exportUrlFor(pageUrl){
  let u; try{u=new URL(pageUrl);}catch{return null;}
  if(u.hostname!=="docs.google.com")return null;
  const doc=u.pathname.match(/^\/document\/d\/([A-Za-z0-9_-]+)/);
  if(doc)return `https://docs.google.com/document/d/${doc[1]}/export?format=txt`;
  const sheet=u.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  if(sheet){
    const gid=(u.searchParams.get("gid")||u.hash.match(/gid=([0-9]+)/)?.[1]||"").match(/^[0-9]+$/)?.[0];
    return `https://docs.google.com/spreadsheets/d/${sheet[1]}/export?format=csv${gid?`&gid=${gid}`:""}`;
  }
  return null;
}
async function readDocumentText(pageUrl){
  const target=exportUrlFor(pageUrl);
  if(!target)return null;
  let response;
  try{response=await fetch(target,{credentials:"include",redirect:"follow",signal:AbortSignal.timeout(8000)});}
  catch{return null;}
  if(!response.ok)return null;
  // A signed-out session answers with the HTML sign-in page instead of the export.
  if(/text\/html/.test(response.headers.get("content-type")||""))return null;
  const text=(await response.text()).trim();
  return text?text.slice(0,8000):null;
}
// What the user is doing rarely lives in one tab. The agent reasons across the whole workspace,
// so it needs every open tab's anchor — never their contents, and never protected pages.
async function openTabs(activeTabId){
  const tabs=await chrome.tabs.query({});
  const seen=new Set();
  return tabs
    .filter(t=>t.url?.startsWith("http")&&!OffRampCore.protectedUrl(t.url))
    .map(t=>({title:(t.title||"").slice(0,150),url:OffRampCore.safeUrl(t.url),active:t.id===activeTabId}))
    .filter(t=>t.url&&!seen.has(t.url)&&seen.add(t.url))
    .slice(0,20);
}
function isPanel(sender){return sender.url?.startsWith(chrome.runtime.getURL(""));}
const routes=new Set(["/state","/browser","/draft","/checkpoint","/restore","/jobs","/cancel"]);
async function restoreTab(anchor,fileUrl){const url=OffRampCore.safeUrl(fileUrl||anchor?.url);if(!url)throw new Error("No saved browser link. Use the open Figma plugin to restore.");let tab;try{if(anchor?.tabId)tab=await chrome.tabs.get(anchor.tabId);}catch{}if(tab&&OffRampCore.safeUrl(tab.url)!==url)tab=null;if(!tab)tab=(await chrome.tabs.query({})).find(t=>OffRampCore.safeUrl(t.url)===url);if(tab){await chrome.windows.update(tab.windowId,{focused:true});await chrome.tabs.update(tab.id,{active:true});}else await chrome.tabs.create({url});}
async function start(){chrome.idle.setDetectionInterval(60);await chrome.alarms.create("evaluate-off-ramp",{periodInMinutes:0.5});const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});const state=await tabContext(await getState(),tab);state.idleState=await chrome.idle.queryState(60);await saveState(OffRampCore.evaluate(state));}
chrome.runtime.onInstalled.addListener(()=>serialize(start));chrome.runtime.onStartup.addListener(()=>serialize(start));
chrome.action?.onClicked?.addListener(tab=>{if(tab.id)chrome.tabs.sendMessage(tab.id,{type:"OFF_RAMP_EXPAND"},{frameId:0}).catch(()=>{});});
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  const perform=async()=>{
    if(message.type==="BRIDGE"){if(!isPanel(sender)||!routes.has(message.route))throw new Error("Only the extension panel may call this endpoint.");return {ok:true,data:await bridge(message.route,message.body)};}
    if(message.type==="SET_BRIDGE_TOKEN"){if(!isPanel(sender)||!/^[a-f0-9]{64}$/.test(message.token))throw new Error("Invalid pairing token");await chrome.storage.local.set({bridgeToken:message.token});return {ok:true};}
    if(message.type==="OPEN_PANEL"){
      if(!sender.tab?.id)throw new Error("Open Puff from the webpage launcher.");
      await chrome.tabs.sendMessage(sender.tab.id,{type:"OFF_RAMP_EXPAND"},{frameId:0});
      return {ok:true};
    }
    if(message.type==="MINIMIZE_PANEL")throw new Error("Minimizing is disabled in this expanded-only build.");
    if(message.type==="PANEL_VIEW"){
      if(!isPanel(sender)||!sender.tab?.id)throw new Error("Only an embedded Puff panel may control its launcher.");
      await chrome.tabs.sendMessage(sender.tab.id,{type:"OFF_RAMP_PANEL_SIZE",expanded:["review","return","settings"].includes(message.view)},{frameId:0});
      return {ok:true};
    }
    if(message.type==="CAPTURE_CONTEXT"){
      // sender.tab is the host page the panel is embedded in, so no tabs.query guesswork.
      if(!isPanel(sender)||!sender.tab?.url?.startsWith("http"))throw new Error("Open Puff from a normal web page.");
      const payload={title:(sender.tab.title||"").slice(0,200),url:sender.tab.url,tabId:sender.tab.id};
      payload.tabs=await openTabs(sender.tab.id);
      if(message.readContents===true){
        const excerpt=await readDocumentText(sender.tab.url);
        if(excerpt)payload.excerpt=excerpt;
      }
      await bridge("/browser",payload);
      return {ok:true,excerptChars:payload.excerpt?payload.excerpt.length:0,tabCount:payload.tabs.length};
    }
    if(message.type==="RESTORE_TAB"){if(!isPanel(sender))throw new Error("Open Off-Ramp to restore.");await restoreTab(message.anchor,message.fileUrl);return {ok:true};}
    return serialize(async()=>{
      let state=await getState();
      if(message.type==="ACTIVITY_DELTA"){
        const [active]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
        if(!state.enabled||!sender.tab||sender.tab.id!==active?.id||message.hidden)return {ok:true,state,intervention:OffRampCore.interventionFor(state)};
        state=await tabContext(state,active);state.blocked=state.blocked||!!message.fullscreen;
        if(!state.blocked)state=OffRampCore.mergeActivity(state,message.delta||{});
      }else if(message.type==="USER_RESPONSE"){
        if(message.action==="resume")await restoreTab(state.checkpoint);
        if(message.action==="take_break"&&isPanel(sender)&&message.anchor){state={...state,currentTabTitle:String(message.anchor.title||"").slice(0,200),currentTabUrl:OffRampCore.safeUrl(message.anchor.url),currentTabId:message.anchor.tabId??null};}
        state=OffRampCore.applyResponse(state,message.action,Date.now(),{note:message.note});
      }else if(message.type==="SET_DEMO_MODE"&&isPanel(sender)){state={...state,demoMode:!!message.enabled,thresholdSeconds:message.enabled?30:1800,activeSeconds:0,sessionInvited:false,lastEvaluatedAt:Date.now()};}
      else if(message.type==="SET_ENABLED"&&isPanel(sender)){state.enabled=!!message.enabled;}
      else if(message.type==="FORCE_MODE"&&isPanel(sender)&&state.demoMode&&OffRampCore.MODES.includes(message.mode)){state.mode=message.mode;}
      else if(message.type==="GET_STATE")state=OffRampCore.evaluate(state);
      await saveState(state);return {ok:true,state,intervention:OffRampCore.interventionFor(state)};
    });
  };
  perform().then(sendResponse).catch(error=>sendResponse({ok:false,error:error.message}));return true;
});
chrome.tabs.onActivated.addListener(({tabId})=>serialize(async()=>{let state=await getState();if(!state.enabled)return;const tab=await chrome.tabs.get(tabId);state=await tabContext(OffRampCore.recordTabSwitch(state),tab);await saveState(OffRampCore.evaluate(state));}));
chrome.tabs.onUpdated.addListener((id,info,tab)=>{if(tab.active&&(info.title||info.url))serialize(async()=>saveState(await tabContext(await getState(),tab)));});
chrome.idle.onStateChanged.addListener(idleState=>serialize(async()=>saveState(OffRampCore.evaluate({...await getState(),idleState}))));
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name==="evaluate-off-ramp")serialize(async()=>{let state=await getState();try{const bridgeState=await bridge("/state");state.designConnected=bridgeState.figmaFresh;state.designLastChangeAt=bridgeState.figmaFresh?bridgeState.context.figma.lastChangeAt:0;}catch{state.designConnected=false;}return saveState(OffRampCore.evaluate(state));});});
