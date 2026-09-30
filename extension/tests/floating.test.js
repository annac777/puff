const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
test('Puff opens expanded automatically and ignores old collapse messages',()=>{
  let root,listener;
  const requests=[];
  function node(){
    const classes=new Set(),children=[];
    return {children,dataset:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c);}},
      appendChild(n){children.push(n);},addEventListener(){},querySelector(){return {addEventListener(){}};}};
  }
  const document={getElementById:()=>root,createElement:node,addEventListener(){},documentElement:{appendChild(n){root=n;}}};
  const window={addEventListener(){}};window.top=window;
  const chrome={runtime:{id:'fixture',getURL:p=>'chrome-extension://fixture/'+p,onMessage:{addListener(fn){listener=fn;}},sendMessage:async m=>{requests.push(m);return {ok:false};}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../content.js'),'utf8'),{window,document,chrome,setInterval(){},clearInterval(){},Date,Promise});
  listener({type:'OFF_RAMP_STATE',state:{enabled:true,blocked:false,mode:'quiet'}});
  assert.equal(root.children.length,1);
  const frame=root.children[0];
  assert.match(frame.src,/app\/index\.html\?floating=1$/);
  assert.equal(root.classList.contains('or-expanded'),true);
  listener({type:'OFF_RAMP_COLLAPSE'});
  assert.equal(root.classList.contains('or-expanded'),true);
  listener({type:'OFF_RAMP_EXPAND'});
  assert.equal(root.children.length,1);
  assert.equal(root.children[0],frame);
  assert.equal(requests.some(r=>r.action==='cancel'),false);
});

test('Puff stays tucked away while it is only watching, and shows itself when it has something to say',()=>{
  let root,listener,frameListener;
  const posted=[];
  function node(){
    const classes=new Set(),children=[];
    return {children,dataset:{},style:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c);}},
      appendChild(n){children.push(n);},addEventListener(){},contentWindow:{postMessage:m=>posted.push(m)},querySelector(){return {addEventListener(){}};}};
  }
  const document={getElementById:()=>root,createElement:node,addEventListener(){},documentElement:{appendChild(n){root=n;}}};
  const window={addEventListener(type,fn){if(type==='message')frameListener=fn;}};window.top=window;
  const chrome={runtime:{id:'fixture',getURL:p=>'chrome-extension://fixture/'+p,onMessage:{addListener(fn){listener=fn;}},sendMessage:async()=>({ok:false})}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../content.js'),'utf8'),{window,document,chrome,setInterval(){},clearInterval(){},Date,Promise});

  listener({type:'OFF_RAMP_STATE',state:{enabled:true,blocked:false,mode:'quiet'}});
  assert.equal(root.classList.contains('or-tucked'),true,'hidden while merely watching');

  listener({type:'OFF_RAMP_STATE',state:{enabled:true,blocked:false,mode:'gentle_nudge'}});
  assert.equal(root.classList.contains('or-tucked'),false,'visible when inviting a break');

  listener({type:'OFF_RAMP_STATE',state:{enabled:true,blocked:false,mode:'on_break'}});
  assert.equal(root.classList.contains('or-tucked'),false,'visible while a place is held');

  // Back to watching, then opened from the toolbar: it shows and asks the panel to open.
  listener({type:'OFF_RAMP_STATE',state:{enabled:true,blocked:false,mode:'quiet'}});
  assert.equal(root.classList.contains('or-tucked'),true);
  listener({type:'OFF_RAMP_EXPAND'});
  assert.equal(root.classList.contains('or-tucked'),false);
  assert.equal(posted.at(-1).type,'PUFF_OPEN');

  // Closing the panel puts it away again.
  const frame=root.children[0];
  frameListener({source:frame.contentWindow,data:{type:'PUFF_FRAME',expanded:false}});
  assert.equal(root.classList.contains('or-tucked'),true);
});
