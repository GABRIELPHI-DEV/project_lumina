(function(){
'use strict';
var path=location.pathname.toLowerCase();
var isWrite=/write\\.html$/.test(path),isDemo=/demo\\.html$/.test(path);
document.body.classList.add(isWrite?'lumina-writing':isDemo?'lumina-demo':'lumina-refined');

function download(name,type,content){
 var blob=new Blob([content],{type:type}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.hidden=true;document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(url);},1500);
}
function safeName(s){
 return (s||'Minha-historia').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')
  .replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').slice(0,48)||'Minha-historia';
}
function makeButton(label,action,primary){
 var b=document.createElement('button');b.type='button';b.className='lumina-action'+(primary?' is-primary':'');
 b.textContent=label;b.addEventListener('click',action);return b;
}
function readFile(file,done){
 var reader=new FileReader();
 reader.onload=function(){try{done(JSON.parse(String(reader.result||'')));}catch(e){alert('Este arquivo não é um backup JSON válido do Lumina.');}};
 reader.onerror=function(){alert('Não foi possível ler o arquivo selecionado.');};
 reader.readAsText(file);
}
function backupInput(onBackup){
 var input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;
 input.addEventListener('change',function(){var file=input.files&&input.files[0];if(file)readFile(file,onBackup);input.value='';});
 return input;
}
function cleanHtml(value){
 var parsed=new DOMParser().parseFromString(String(value||''),'text/html');
 var allowed={P:1,BR:1,STRONG:1,B:1,EM:1,I:1,U:1,BLOCKQUOTE:1,H2:1,H3:1,UL:1,OL:1,LI:1};
 function copy(node){
  if(node.nodeType===3)return document.createTextNode(node.nodeValue||'');
  if(node.nodeType!==1)return document.createDocumentFragment();
  if(!allowed[node.tagName]){var fragment=document.createDocumentFragment();Array.prototype.forEach.call(node.childNodes,function(child){fragment.appendChild(copy(child));});return fragment;}
  var el=document.createElement(node.tagName.toLowerCase());
  Array.prototype.forEach.call(node.childNodes,function(child){el.appendChild(copy(child));});
  return el;
 }
 var out=document.createElement('div');
 Array.prototype.forEach.call(parsed.body.childNodes,function(node){out.appendChild(copy(node));});
 return out.innerHTML;
}
function attachWriteTools(){
 var manuscript=document.getElementById('manuscript'),title=document.getElementById('story-title'),
  chapter=document.getElementById('chapter-title'),host=document.querySelector('.top-actions');
 if(!manuscript||!host||host.querySelector('[data-lumina-tools]'))return;
 var bar=document.createElement('span');bar.className='lumina-actionbar';bar.dataset.luminaTools='true';
 bar.setAttribute('aria-label','Ferramentas do manuscrito');
 function snapshot(){
  return {format:'lumina-backup',version:2,exportedAt:new Date().toISOString(),
   story:title.textContent.trim(),chapter:chapter.textContent.trim(),html:manuscript.innerHTML,text:manuscript.innerText||''};
 }
 bar.appendChild(makeButton('Exportar .txt',function(){
  var data=snapshot();download(safeName(data.story)+'.txt', 'text/plain;charset=utf-8',
   data.story+'\\n'+data.chapter+'\\n\\n'+data.text);
 }));
 bar.appendChild(makeButton('Backup .json',function(){
  var data=snapshot();download(safeName(data.story)+'-backup.json','application/json;charset=utf-8',JSON.stringify(data,null,2));
 }));
 var picker=backupInput(function(data){
  if(!data||data.format!=='lumina-backup'||![1,2].includes(data.version)||typeof data.html!=='string'){
   alert('Backup incompatível. Selecione um arquivo de backup exportado pelo Lumina.');return;
  }
  if(!confirm('Importar este backup substituirá o manuscrito aberto. Deseja continuar?'))return;
  title.textContent=String(data.story||'Minha História').slice(0,120);
  chapter.textContent=String(data.chapter||'').slice(0,120);
  manuscript.innerHTML=cleanHtml(data.html);
  manuscript.dispatchEvent(new Event('input',{bubbles:true}));
  title.dispatchEvent(new Event('input',{bubbles:true}));
  chapter.dispatchEvent(new Event('input',{bubbles:true}));
 });
 document.body.appendChild(picker);
 bar.appendChild(makeButton('Importar backup',function(){picker.click();}));
 host.appendChild(bar);
 manuscript.setAttribute('spellcheck','true');
 var status=document.querySelector('#save-state');if(status)status.setAttribute('aria-live','polite');
}
function attachDemoTools(){
 var editors=[
  {id:'manuscript',status:'save-status',store:'lumina-demo-editor-v2',name:'Lumina'},
  {id:'nocturne-manuscript',status:'save-status-noc',store:'lumina-demo-nocturne-v2',name:'Nocturne'}
 ];
 editors.forEach(function(cfg){
  var editor=document.getElementById(cfg.id),status=document.getElementById(cfg.status);if(!editor)return;
  try{var old=localStorage.getItem(cfg.store);if(old){var parsed=JSON.parse(old);if(parsed&&typeof parsed.html==='string')editor.innerHTML=cleanHtml(parsed.html);}}catch(e){}
  editor.setAttribute('spellcheck','true');if(status)status.setAttribute('aria-live','polite');
  var top=editor.closest('.manuscript-col')?.querySelector('.manuscript-topbar')||editor.parentElement;
  if(!top||top.querySelector('[data-lumina-tools]'))return;
  var bar=document.createElement('div');bar.className='lumina-actionbar';bar.dataset.luminaTools='true';bar.style.margin='8px 0 12px';
  function saveNow(){
   try{localStorage.setItem(cfg.store,JSON.stringify({version:2,html:editor.innerHTML,updatedAt:new Date().toISOString()}));
    if(status)status.textContent='Salvo neste dispositivo';}
   catch(e){if(status)status.textContent='Armazenamento indisponível';}
  }
  function exportText(){download(safeName(cfg.name)+'-manuscrito.txt','text/plain;charset=utf-8',editor.innerText||'');}
  function exportJson(){saveNow();download(safeName(cfg.name)+'-backup.json','application/json;charset=utf-8',JSON.stringify({
   format:'lumina-demo-backup',version:2,editor:cfg.id,exportedAt:new Date().toISOString(),html:editor.innerHTML
  },null,2));}
  var picker=backupInput(function(data){
   if(!data||data.format!=='lumina-demo-backup'||data.version!==2||typeof data.html!=='string'){
    alert('Backup incompatível com este editor.');return;
   }
   if(!confirm('Importar este backup substituirá o texto atual. Deseja continuar?'))return;
   editor.innerHTML=cleanHtml(data.html);saveNow();editor.dispatchEvent(new Event('input',{bubbles:true}));
  });
  document.body.appendChild(picker);
  bar.appendChild(makeButton('Salvar agora',saveNow,true));
  bar.appendChild(makeButton('Exportar .txt',exportText));
  bar.appendChild(makeButton('Backup .json',exportJson));
  bar.appendChild(makeButton('Importar backup',function(){picker.click();}));
  top.appendChild(bar);
  var timer=null;
  editor.addEventListener('input',function(){if(status)status.textContent='Salvando…';clearTimeout(timer);timer=setTimeout(saveNow,650);});
  editor.addEventListener('blur',saveNow);
  window.addEventListener('pagehide',saveNow);
 });
}
if(isWrite)attachWriteTools();
if(isDemo)attachDemoTools();
document.addEventListener('keydown',function(e){
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){
  e.preventDefault();var active=document.activeElement,editor=active&&active.closest&&active.closest('[contenteditable="true"]');
  if(!editor&&isWrite)editor=document.getElementById('manuscript');
  if(!editor&&isDemo){var screen=document.querySelector('.screen.is-active');editor=screen&&screen.querySelector('[contenteditable="true"]');}
  if(editor)editor.dispatchEvent(new Event('input',{bubbles:true}));
  if(isWrite){var state=document.getElementById('save-state');if(state)state.scrollIntoView({block:'nearest'});}
 }
});
})();