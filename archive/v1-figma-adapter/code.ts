// Native plugin code, not a Figma MCP script. No document content is modified.
figma.showUI(__html__,{width:340,height:420,themeColors:true});
const sessionId=`figma-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let enabled=false;
let watched:PageNode|null=null;
let lastChangeAt=0;
let changes:{id:string;name:string;type:string;properties:string[];at:number;origin:string}[]=[];
let suppressUntil=0;
function nodeInfo(node:SceneNode){return {id:node.id,name:node.name.slice(0,200),type:node.type,pageId:figma.currentPage.id};}
function snapshot(){
  if(!enabled)return;
  figma.ui.postMessage({type:'snapshot',snapshot:{sessionId,fileName:figma.root.name.slice(0,200),page:{id:figma.currentPage.id,name:figma.currentPage.name.slice(0,200)},
    selection:figma.currentPage.selection.slice(0,8).map(nodeInfo),
    frames:figma.currentPage.children.filter(n=>['FRAME','COMPONENT','SECTION'].includes(n.type)).slice(0,20).map(nodeInfo),
    changes:changes.slice(-30),lastChangeAt,capturedAt:Date.now()}});
}
function onNodes(event:NodeChangeEvent){
  if(!enabled||Date.now()<suppressUntil)return;
  for(const change of event.nodeChanges){
    // Remote collaborator changes are not evidence of this user's activity.
    if(change.origin==='REMOTE')continue;
    const node=change.node;
    changes.push({id:change.id,name:node.removed?'Removed node':node.name.slice(0,200),type:change.type,properties:change.type==='PROPERTY_CHANGE'?change.properties.slice(0,12):[],at:Date.now(),origin:change.origin});
    lastChangeAt=Date.now();
  }
  changes=changes.slice(-30);
}
function watchPage(){
  if(watched)watched.off('nodechange',onNodes);
  watched=figma.currentPage;watched.on('nodechange',onNodes);changes=[];
  snapshot();
}
figma.on('selectionchange',()=>{if(enabled&&Date.now()>=suppressUntil)lastChangeAt=Date.now();});
figma.on('currentpagechange',watchPage);
watchPage();
setInterval(snapshot,5000);
figma.ui.onmessage=async(message:{type:string;command?:{id:string;sessionId:string;anchors:{id:string;pageId:string}[]}})=>{
  if(message.type==='enable'){enabled=true;snapshot();return;}
  if(message.type==='disable'){enabled=false;changes=[];return;}
  if(message.type==='restore'&&enabled&&message.command){
    const command=message.command;
    try{
      if(command.sessionId!==sessionId)throw new Error('Wrong file session');
      if(!command.anchors.length||command.anchors.length>3)throw new Error('Invalid anchors');
      if(command.anchors.some(n=>n.pageId!==command.anchors[0].pageId))throw new Error('Cross-page restore requires separate navigation');
      const page=await figma.getNodeByIdAsync(command.anchors[0].pageId);
      if(!page||page.type!=='PAGE')throw new Error('Saved page no longer exists');
      const nodes:SceneNode[]=[];
      for(const anchor of command.anchors){const node=await figma.getNodeByIdAsync(anchor.id);if(!node||node.type==='DOCUMENT'||node.type==='PAGE')throw new Error('Saved node no longer exists');let parent:BaseNode|null=node;while(parent&&parent.type!=='PAGE')parent=parent.parent;if(parent?.id!==page.id)throw new Error('Saved node moved to another page');nodes.push(node);}
      suppressUntil=Date.now()+2000;
      await figma.setCurrentPageAsync(page);figma.currentPage.selection=nodes;figma.viewport.scrollAndZoomIntoView(nodes);
      figma.ui.postMessage({type:'restore-result',id:command.id,sessionId,ok:true,message:'Selected saved nodes and focused the viewport.'});
    }catch(error){figma.ui.postMessage({type:'restore-result',id:command.id,sessionId,ok:false,message:error instanceof Error?error.message:'Restore failed'});}
  }
};
