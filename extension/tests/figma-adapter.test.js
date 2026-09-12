const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

function host(){
  const messages=[],listeners={},events={};let tick,focused=[];
  const page={id:'1:1',name:'Checkout',type:'PAGE',selection:[],children:[],on:(name,fn)=>listeners[name]=fn,off:name=>delete listeners[name]};
  const node={id:'2:1',name:'Mobile',type:'FRAME',parent:page,characters:'PRIVATE TEXT NEVER EXPORT',removed:false};
  page.children=[node];page.selection=[node];
  const figma={root:{name:'Contract test'},currentPage:page,ui:{postMessage:m=>messages.push(m)},showUI(){},on:(name,fn)=>events[name]=fn,
    getNodeByIdAsync:async id=>id===page.id?page:id===node.id?node:null,setCurrentPageAsync:async p=>{figma.currentPage=p;},viewport:{scrollAndZoomIntoView:nodes=>focused=nodes}};
  const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../figma-adapter/code.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2019,module:ts.ModuleKind.None}}).outputText;
  vm.runInNewContext(code,{figma,__html__:'',setInterval:fn=>tick=fn,Date,Math,Error});
  return {figma,page,node,messages,listeners,events,tick:()=>tick(),focused:()=>focused};
}
test('Figma adapter is opt-in, ignores collaborator activity and never exports text values',async()=>{
  const h=host();h.tick();assert.equal(h.messages.length,0);
  await h.figma.ui.onmessage({type:'enable'});
  const event=origin=>({nodeChanges:[{id:h.node.id,node:h.node,type:'PROPERTY_CHANGE',properties:['itemSpacing'],origin}]});
  h.listeners.nodechange(event('REMOTE'));h.tick();assert.equal(h.messages.at(-1).snapshot.changes.length,0);
  h.listeners.nodechange(event('LOCAL'));h.tick();assert.equal(h.messages.at(-1).snapshot.changes.length,1);
  assert.equal(JSON.stringify(h.messages).includes('PRIVATE TEXT'),false);
  const count=h.messages.length;await h.figma.ui.onmessage({type:'disable'});h.tick();assert.equal(h.messages.length,count);
});
test('Figma restore selects verified nodes and reports missing or wrong-session anchors honestly',async()=>{
  const h=host();await h.figma.ui.onmessage({type:'enable'});const sessionId=h.messages.at(-1).snapshot.sessionId;
  const command={id:'restore-1',sessionId,anchors:[{id:h.node.id,pageId:h.page.id}]};
  await h.figma.ui.onmessage({type:'restore',command});assert.equal(h.messages.at(-1).ok,true);assert.equal(h.focused()[0],h.node);assert.equal(h.page.selection[0],h.node);
  await h.figma.ui.onmessage({type:'restore',command:{...command,sessionId:'wrong'}});assert.equal(h.messages.at(-1).ok,false);
  await h.figma.ui.onmessage({type:'restore',command:{...command,anchors:[{id:'deleted',pageId:h.page.id}]}});assert.equal(h.messages.at(-1).ok,false);
});
