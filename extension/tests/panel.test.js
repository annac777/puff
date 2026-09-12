const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function panel(href='http://127.0.0.1:4318/') {
  const html = fs.readFileSync(path.join(__dirname, '../panel.html'), 'utf8');
  const elements = new Map();
  function element() {
    return { hidden:false, children:[], value:'', checked:false, disabled:false, textContent:'', dataset:{},
      classList:{add(){},remove(){},toggle(){}}, append(){}, before(){}, after(){}, replaceChildren(){}, closest(){return this;} };
  }
  for (const match of html.matchAll(/id="([^"]+)"/g)) elements.set(match[1], element());
  const document = {body:element(),createElement:element,createTextNode:t=>({textContent:t}),addEventListener(){},getElementById(id){
    assert.ok(elements.has(id), 'Missing HTML element: '+id);return elements.get(id);
  }};
  const context = vm.createContext({document,window:{location:{href},scrollTo(){}},setInterval(){},clearInterval(){},console,URL,Date,
    fetch(){throw new Error('Unexpected network request');}});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../panel.js'),'utf8'),context);
  return {elements,context,run(code){return vm.runInContext(code,context);}};
}

test('Puff hides developer setup from the normal demo, including direct view changes',async()=>{
  const p=panel();
  assert.equal(p.elements.get('settings-toggle').hidden,true);
  assert.equal(p.elements.get('settings-view').hidden,true);
  assert.equal(p.run('document.body.dataset.view'),'quiet');
  p.run("setView('settings')");
  assert.equal(p.elements.get('settings-view').hidden,true);
  await p.elements.get('hold').onclick();
  // No consent yet, so no model call and no jump past the disclosure.
  assert.equal(p.run('document.body.dataset.view'),'quiet');
  assert.equal(p.elements.get('consent-row').hidden,false);
  // The embedded panel pairs through the background worker, so it must never ask the
  // user to resolve a setup state it gives them no control over.
  assert.equal(p.elements.get('agent-status').textContent,'');
  assert.equal(p.elements.get('settings-view').hidden,true);
});

test('Puff retains explicit standalone developer setup without automatic pairing',()=>{
  const p=panel('http://127.0.0.1:4318/?developer=1');
  assert.equal(p.elements.get('settings-toggle').hidden,false);
  assert.equal(p.elements.get('settings-view').hidden,false);
  assert.equal(p.run('document.body.dataset.view'),'settings');
  assert.equal(p.run('token'),'');
});

test('Puff navigation keeps a running job running when the user returns early', async()=>{
  const p=panel();
  p.run("job={status:'running'};syncAway();setView('away');");
  await p.elements.get('back').onclick();
  assert.equal(p.run('document.body.dataset.view'),'return');
  assert.equal(p.run('job.status'),'running');
  assert.equal(p.elements.get('away-status').textContent,'Running');
  assert.match(p.elements.get('away-note').textContent,/will not stop it/);
  assert.equal(p.elements.get('cancel-away').hidden,false);
});

test('Puff shows no invented task completion when only a place was saved',()=>{
  const p=panel();
  p.run("checkpoint={nextStep:'Review the evidence'};job=null;syncAway();");
  assert.match(p.elements.get('away-status').textContent,/no task running/);
  assert.equal(p.elements.get('away-step').textContent,'Review the evidence');
  assert.equal(p.elements.get('cancel-away').hidden,true);
});

test('Puff refuses to approve a handoff the agent never proposed',async()=>{
  const p=panel();
  p.run("currentDraft={draft:{proposedTask:{question:''}}};setView('review')");
  await p.elements.get('approve').onclick();
  assert.match(p.elements.get('error').textContent,/No task was proposed/);
  assert.equal(p.run('job'),null);
  assert.equal(p.elements.get('settings-view').hidden,true);
});

test('Puff will not start work from a too-short custom task',async()=>{
  const p=panel();
  p.run("setView('review')");
  await p.elements.get('edit-task').onclick();
  assert.equal(p.elements.get('custom-task').hidden,false);
  p.elements.get('review-question').value='fix';
  await p.elements.get('approve-custom').onclick();
  assert.match(p.elements.get('error').textContent,/few more words/);
  assert.equal(p.run('job'),null);
});

test('Puff excludes stale Figma fixtures from displayed observed context',async()=>{
  const p=panel();
  p.run("token='test';api=async()=>({provider:'test',model:'test',modelReady:true,figmaFresh:false,context:{figma:{fileName:'STALE FIXTURE'},browser:{title:'Example Domain',url:'https://example.com/'}},drafts:{},checkpoints:{},jobs:{},commands:{}})");
  await p.run('refresh()');
  assert.equal(p.elements.get('focus').textContent,'Example Domain');
  // A stale fixture must never be labelled live, and never named as Figma context.
  assert.equal(p.elements.get('fresh').textContent,'Browser only');
  assert.doesNotMatch(p.elements.get('focus').textContent,/STALE FIXTURE/);
});

test('Puff shows a recovered draft instead of stalling on the entry screen',async()=>{
  const p=panel();
  p.run("state={context:{browser:{title:'x'}}};currentDraft={draft:{proposedTask:{question:'q',label:'l'}}};consentGranted=()=>true");
  await p.run('autoDraft()');
  assert.equal(p.run('document.body.dataset.view'),'review');
});

test('Puff never presents another page\'s draft as a reading of the current page',async()=>{
  const p=panel();
  // A draft made on page A must not appear once the captured context is page B.
  p.run(`token='t';api=async()=>({provider:'x',model:'x',modelReady:true,figmaFresh:false,
    context:{figma:null,browser:{title:'Page B',url:'https://b.example/'}},
    drafts:{d1:{id:'d1',createdAt:Date.now(),userIntent:'',trace:[],
      context:{figma:null,browser:{title:'Page A',url:'https://a.example/'}},
      draft:{component:'CHECKPOINT',interpretation:'reading page A',nextStep:'n',suggestions:[],anchorIds:[],uncertainty:'',proposedTask:{label:'l',question:'q',rationale:'r'}}}},
    checkpoints:{},jobs:{},commands:{}})`);
  await p.run('refresh()');
  assert.equal(p.run('currentDraft'),null);
  assert.equal(p.elements.get('task-question').textContent,'');
  assert.equal(p.run("document.getElementById('interpretation').textContent"),'');
});

test('Puff reuses a draft that belongs to the page currently captured',async()=>{
  const p=panel();
  p.run(`token='t';api=async()=>({provider:'x',model:'x',modelReady:true,figmaFresh:false,
    context:{figma:null,browser:{title:'Page A',url:'https://a.example/'}},
    drafts:{d1:{id:'d1',createdAt:Date.now(),userIntent:'',trace:[],
      context:{figma:null,browser:{title:'Page A',url:'https://a.example/'}},
      draft:{component:'CHECKPOINT',interpretation:'reading page A',nextStep:'n',suggestions:[],anchorIds:[],uncertainty:'',proposedTask:{label:'do the thing',question:'q',rationale:'r'}}}},
    checkpoints:{},jobs:{},commands:{}})`);
  await p.run('refresh()');
  assert.equal(p.run('currentDraft&&currentDraft.id'),'d1');
  assert.equal(p.elements.get('task-question').textContent,'do the thing');
});
