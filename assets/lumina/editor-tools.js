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

function attachDemoLibrary(){
 var grid=document.querySelector('#screen-dashboard .story-grid');if(!grid)return;
 var sample=grid.querySelector('#story-card-1'),sampleNoc=grid.querySelector('#story-card-noc');
 if(sample)sample.dataset.storyId='coroa';if(sampleNoc)sampleNoc.dataset.storyId='nocturne';
 var libraryKey='lumina-library-v1',activeKey='lumina-active-story-v1';
 var editors={editor:{id:'manuscript',status:'save-status',screen:'editor'},nocturne:{id:'nocturne-manuscript',status:'save-status-noc',screen:'nocturne'}};
 var active='coroa';
 function readLibrary(){try{var x=JSON.parse(localStorage.getItem(libraryKey)||'{}');return x&&typeof x==='object'?x:{};}catch(e){return {};}}
 function writeLibrary(data){try{localStorage.setItem(libraryKey,JSON.stringify(data));return true;}catch(e){return false;}}
 function config(){return active==='nocturne'?editors.nocturne:editors.editor;}
 function editor(){return document.getElementById(config().id);}
 function meta(){var s=document.getElementById('screen-'+config().screen);return s&&s.querySelector('.manuscript-topbar .titles');}
 function saveActive(){
  var ed=editor(),m=meta();if(!ed||!m)return;
  var d=readLibrary(),t=m.querySelector('p'),h=m.querySelector('h2');
  d[active]={id:active,title:t?t.textContent.trim():'Minha história',chapter:h?h.textContent.trim():'',
   html:ed.innerHTML,updatedAt:new Date().toISOString(),mode:active==='nocturne'?'nocturne':'editor'};
  if(!writeLibrary(d)){var st=document.getElementById(config().status);if(st)st.textContent='Falha ao salvar biblioteca';}
 }
 function loadStory(id){
  saveActive();active=id;try{localStorage.setItem(activeKey,id);}catch(e){}
  var d=readLibrary()[id],ed=editor(),m=meta();if(!d||!ed||!m)return;
  var t=m.querySelector('p'),h=m.querySelector('h2');if(t)t.textContent=d.title||'Minha história';if(h)h.textContent=d.chapter||'Capítulo 1';
  ed.innerHTML=cleanHtml(d.html||'');ed.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function cardFor(s){
  var card=document.createElement('article');card.className='story-card lumina-library-card';card.tabIndex=0;
  card.setAttribute('role','button');card.dataset.storyId=s.id;card.dataset.nav=s.mode==='nocturne'?'nocturne':'editor';
  var cover=document.createElement('div');cover.className='story-cover';
  var art=document.createElement('div');art.className='lumina-library-cover';art.textContent=s.mode==='nocturne'?'◐':'✦';cover.appendChild(art);
  var body=document.createElement('div');body.className='story-body';
  var title=document.createElement('p');title.className='story-title';title.textContent=s.title||'Sem título';
  var genre=document.createElement('p');genre.className='story-genre';genre.textContent=s.mode==='nocturne'?'Dark Romance':'Minha história';
  var metaText=document.createElement('p');metaText.className='story-meta';metaText.textContent='Salva neste dispositivo · '+new Date(s.updatedAt||Date.now()).toLocaleDateString('pt-BR');
  var open=document.createElement('span');open.className='story-open';open.textContent='Abrir história';
  body.append(title,genre,metaText,open);card.append(cover,body);return card;
 }
 function render(){grid.querySelectorAll('.lumina-library-card').forEach(function(n){n.remove();});
  var d=readLibrary();Object.keys(d).filter(function(id){return id.indexOf('story-')===0;}).forEach(function(id){grid.insertBefore(cardFor(d[id]),grid.querySelector('.add-card'));});
 }
 function createStory(){
  var title=prompt('Qual será o título da sua história?');if(title===null)return;title=title.trim().slice(0,90);
  if(!title){alert('Digite um título para criar sua história.');return;}
  var mode=confirm('Criar no universo Lumina Nocturne?\\n\\nOK: Nocturne (dark romance)\\nCancelar: Lumina (fantasia)')?'nocturne':'editor';
  var id='story-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),d=readLibrary();
  d[id]={id:id,title:title,chapter:'Capítulo 1',html:'<p>Comece a escrever sua história…</p>',updatedAt:new Date().toISOString(),mode:mode};
  if(!writeLibrary(d)){alert('O navegador não conseguiu guardar a nova história. Verifique o espaço disponível.');return;}
  render();loadStory(id);var nav=mode==='nocturne'?'nocturne':'editor',link=document.querySelector('[data-nav="'+nav+'"]');
  if(link)link.click();else{var now=document.querySelector('.screen.is-active'),target=document.getElementById('screen-'+nav);if(now)now.classList.remove('is-active');if(target)target.classList.add('is-active');}
 }
 var add=grid.querySelector('.add-card');if(add){add.setAttribute('role','button');add.tabIndex=0;add.setAttribute('aria-label','Criar nova história');
  add.addEventListener('click',createStory);add.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();createStory();}});
 }
 grid.addEventListener('click',function(e){var c=e.target.closest('[data-story-id]');if(c)loadStory(c.dataset.storyId);});
 grid.addEventListener('keydown',function(e){var c=e.target.closest('[data-story-id]');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();loadStory(c.dataset.storyId);}});
 Object.keys(editors).forEach(function(k){var ed=document.getElementById(editors[k].id);if(ed)ed.addEventListener('input',function(){saveActive();});});
 var stored='coroa';try{stored=localStorage.getItem(activeKey)||'coroa';}catch(e){}
 if(stored==='nocturne')active='nocturne';else if(stored.indexOf('story-')===0&&readLibrary()[stored])active=stored;
 var remembered=readLibrary()[active];
 if(remembered){
  var target=editor(),targetMeta=meta();
  if(target&&targetMeta){var titleEl=targetMeta.querySelector('p'),chapterEl=targetMeta.querySelector('h2');
   if(titleEl)titleEl.textContent=remembered.title||'Minha história';
   if(chapterEl)chapterEl.textContent=remembered.chapter||'Capítulo 1';
   target.innerHTML=cleanHtml(remembered.html||'');
  }
 }
 render();window.addEventListener('pagehide',saveActive);
}

if(isWrite)attachWriteTools();
if(isDemo)attachDemoLibrary();
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