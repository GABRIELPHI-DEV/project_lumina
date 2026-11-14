(function(){
'use strict';
var path=location.pathname.toLowerCase();
var isWrite=/write\.html$/.test(path), isDemo=/demo\.html$/.test(path);
document.body.classList.add(isWrite?'lumina-writing':isDemo?'lumina-demo':'lumina-refined');
function download(name,type,content){
 var blob=new Blob([content],{type:type});
 var url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.hidden=true;document.body.appendChild(a);a.click();a.remove();
 setTimeout(function(){URL.revokeObjectURL(url);},1500);
}
function safeName(s){return (s||'Minha-historia').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').slice(0,48)||'Minha-historia';}
function makeButton(label,action,primary){
 var b=document.createElement('button');b.type='button';b.className='lumina-action'+(primary?' is-primary':'');b.textContent=label;b.addEventListener('click',action);return b;
}
function attachWriteTools(){
 var manuscript=document.getElementById('manuscript'),title=document.getElementById('story-title'),chapter=document.getElementById('chapter-title');
 if(!manuscript)return;
 var host=document.querySelector('.top-actions');if(!host)return;
 var bar=document.createElement('span');bar.className='lumina-actionbar';bar.setAttribute('aria-label','Ferramentas do manuscrito');
 bar.appendChild(makeButton('Exportar .txt',function(){
  var text=(title.innerText.trim()||'Minha História')+'\n'+(chapter.innerText.trim())+'\n\n'+manuscript.innerText;
  download(safeName(title.innerText)+'.txt','text/plain;charset=utf-8',text);
 }));
 bar.appendChild(makeButton('Backup .json',function(){
  try{var saved=JSON.parse(localStorage.getItem('lumina-draft-v1')||'{}');saved.exportedAt=new Date().toISOString();download(safeName(title.innerText)+'-backup.json','application/json;charset=utf-8',JSON.stringify(saved,null,2));}
  catch(e){alert('Não foi possível preparar o backup neste navegador.');}
 }));
 host.appendChild(bar);
 manuscript.setAttribute('spellcheck','true');
 var save=document.getElementById('save-state');if(save)save.setAttribute('aria-live','polite');
}
function attachDemoTools(){
 var editors=[
  {id:'manuscript',status:'save-status',store:'lumina-demo-editor-v2',name:'Lumina'},
  {id:'nocturne-manuscript',status:'save-status-noc',store:'lumina-demo-nocturne-v2',name:'Nocturne'}
 ];
 editors.forEach(function(cfg){
  var editor=document.getElementById(cfg.id),status=document.getElementById(cfg.status);if(!editor)return;
  try{var old=localStorage.getItem(cfg.store);if(old){var parsed=JSON.parse(old);if(parsed&&typeof parsed.html==='string')editor.innerHTML=parsed.html;}}catch(e){}
  editor.setAttribute('spellcheck','true');
  if(status)status.setAttribute('aria-live','polite');
  var top=editor.closest('.manuscript-col')?.querySelector('.manuscript-topbar')||editor.parentElement;
  var bar=document.createElement('div');bar.className='lumina-actionbar';bar.style.margin='8px 0 12px';
  function saveNow(){
   try{localStorage.setItem(cfg.store,JSON.stringify({html:editor.innerHTML,updatedAt:new Date().toISOString()}));if(status)status.textContent='Salvo neste dispositivo';}
   catch(e){if(status)status.textContent='Armazenamento indisponível';}
  }
  bar.appendChild(makeButton('Salvar agora',saveNow,true));
  bar.appendChild(makeButton('Exportar .txt',function(){download(safeName(cfg.name)+'-manuscrito.txt','text/plain;charset=utf-8',editor.innerText);}));
  bar.appendChild(makeButton('Backup .json',function(){saveNow();var value=localStorage.getItem(cfg.store)||'{}';download(safeName(cfg.name)+'-backup.json','application/json;charset=utf-8',value);}));
  if(top)top.appendChild(bar);
  var timer=null;
  editor.addEventListener('input',function(){if(status)status.textContent='Salvando…';clearTimeout(timer);timer=setTimeout(saveNow,650);});
  editor.addEventListener('blur',saveNow);
 });
}
if(isWrite)attachWriteTools();
if(isDemo)attachDemoTools();
document.addEventListener('keydown',function(e){
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){
  e.preventDefault();
  var active=document.activeElement,editor=active&&active.closest&&active.closest('[contenteditable="true"]');
  if(!editor&&isWrite)editor=document.getElementById('manuscript');
  if(!editor&&isDemo){var screen=document.querySelector('.screen.is-active');editor=screen&&screen.querySelector('[contenteditable="true"]');}
  if(editor)editor.dispatchEvent(new Event('input',{bubbles:true}));
  if(isWrite){var state=document.getElementById('save-state');if(state)state.scrollIntoView({block:'nearest'});}
 }
});
})();