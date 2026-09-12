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
