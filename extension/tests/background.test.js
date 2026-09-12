const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const core=require('../core.js');
function worker(initial){
  const storage={offRampState:initial,bridgeToken:'a'.repeat(64)},listeners={},updated=[];
  const event=name=>({addListener:fn=>listeners[name]=fn});
  const active={id:7,windowId:1,url:'https://example.org/work',title:'Work'};
  const chrome={storage:{local:{get:async key=>({[key]:storage[key]}),set:async value=>Object.assign(storage,value)}},runtime:{getURL:p=>'chrome-extension://fixture/'+p,onInstalled:event('installed'),onStartup:event('startup'),onMessage:event('message')},tabs:{query:async()=>[active],get:async()=>active,sendMessage:async()=>{},update:async(...args)=>updated.push(args),create:async tab=>updated.push(tab),onActivated:event('activated'),onUpdated:event('updated')},windows:{update:async()=>{}},idle:{onStateChanged:event('idle'),setDetectionInterval(){},queryState:async()=>'active'},alarms:{onAlarm:event('alarm'),create:async()=>{}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../background.js'),'utf8'),{chrome,importScripts(){},OffRampCore:core,URL,Date,Promise,AbortSignal});
  return {storage,updated,send:(message,sender={url:'chrome-extension://fixture/panel.html'})=>new Promise(resolve=>listeners.message(message,sender,resolve))};
}
test('MV3 bridge keeps tokens private and rejects webpage requests',async()=>{
  const w=worker(core.initialState());const result=await w.send({type:'GET_STATE'});
  assert.equal(JSON.stringify(result).includes('a'.repeat(64)),false);
  assert.equal((await w.send({type:'BRIDGE',route:'/state'},{url:'https://example.org/'})).ok,false);
});
test('MV3 preserves old checkpoints and ignores disabled or background activity',async()=>{
  const old={title:'Saved work',url:'https://example.org/work',note:'Keep me'};const w=worker({version:1,checkpoint:old,enabled:false});
  assert.equal((await w.send({type:'GET_STATE'})).state.checkpoint.note,'Keep me');
  let result=await w.send({type:'ACTIVITY_DELTA',delta:{clicks:20}},{tab:{id:7}});assert.equal(result.state.clicks,0);
  await w.send({type:'SET_ENABLED',enabled:true});
  result=await w.send({type:'ACTIVITY_DELTA',delta:{clicks:20}},{tab:{id:99}});assert.equal(result.state.clicks,0);
  result=await w.send({type:'ACTIVITY_DELTA',delta:{clicks:2}},{tab:{id:7}});assert.equal(result.state.clicks,2);
});
test('MV3 restore focuses a saved existing tab instead of fabricating success',async()=>{
  const w=worker(core.initialState());const result=await w.send({type:'RESTORE_TAB',anchor:{url:'https://example.org/work',tabId:7}});
  assert.equal(result.ok,true);assert.equal(w.updated[0][0],7);assert.equal(w.updated[0][1].active,true);
  assert.equal((await w.send({type:'RESTORE_TAB',anchor:{url:'javascript:alert(1)'}})).ok,false);
});
