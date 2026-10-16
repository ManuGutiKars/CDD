// Forja de Héroes · creador de personajes D&D 2024
// Datos en data/*.json · reglas en js/reglas.js · conjuros en js/conjuros.js
'use strict';
(()=>{
const R=Reglas;
let D;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
const pick=a=>a[Math.floor(Math.random()*a.length)];
function lsGet(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
async function cargar(r){const x=await fetch(r);if(!x.ok)throw new Error(r+' ('+x.status+')');return x.json()}

const STEPS=[['clase','Clase'],['trasfondo','Trasfondo'],['especie','Especie'],['caract','Características'],['habil','Habilidades'],['dotes','Dotes'],['equipo','Equipo'],['conjuros','Conjuros'],['ficha','Ficha']];
const ALIGN=['Sin definir','Legal bueno','Neutral bueno','Caótico bueno','Legal neutral','Neutral','Caótico neutral','Legal malvado','Neutral malvado','Caótico malvado'];
const NAMES=['Tilda Ramasco','Brannoc Peñagris','Ysolde Varamar','Kael Orrin','Mirabel Junco','Durgan Hierrofuerte','Sel Ashvari','Rook Malacuerna','Iriel Lunaverde','Osk Trueno','Nym Calderilla','Vexa Carmesí','Aldric Sauce','Fen Escarcha'];

function blank(){return {v:1,id:uid(),name:'',player:'',align:'Sin definir',lang:'Común y dos idiomas a elegir',notes:'',
  cls:'guerrero',lvl:1,sub:'',land:'arid',order:'',bg:'soldado',species:'humano',spSub:'',size:'Mediano',feat2:'duro',
  method:'array',arr:{str:15,dex:14,con:13,int:8,wis:12,cha:10},pb:{str:8,dex:8,con:8,int:8,wis:8,cha:8},roll:{sets:[],asg:{}},man:{str:10,dex:10,con:10,int:10,wis:10,cha:10},rolls:'',
  bgMode:'21',p2:'',p1:'',sk:{},ex:{},feats:{},eqCls:'A',eqBg:'A',armor:'auto',shield:true,spells:{picks:[],book:[],disc:[]}}}
function dado(n){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return 1+a[0]%n}catch(e){return 1+Math.floor(Math.random()*n)}}
function rollSort(){const r=ch.roll;if(!r||!r.sets.length)return;const idx=r.sets.map((t,i)=>[t[0]+t[1]+t[2],i]).sort((x,y)=>y[0]-x[0]).map(x=>x[1]);r.asg={};D.clases[ch.cls].ord.forEach((ab,i)=>r.asg[ab]=idx[i])}
let advMode='n',rollLog=[];
function tirarD20(label,bon){
  const a=dado(20),c=dado(20);let u=a,det=String(a);
  if(advMode==='v'){u=Math.max(a,c);det=`${a} · ${c} con ventaja`}else if(advMode==='d'){u=Math.min(a,c);det=`${a} · ${c} con desventaja`}
  mostrarTirada({label,total:u+bon,det:`d20 (${det})${bon?' '+R.sg(bon):''}`,crit:u===20?'nat':u===1?'pif':''});
}
function tirarExpr(label,expr){
  const m=String(expr).replace(/−/g,'-').match(/(\d*)d(\d+)\s*(?:([+-])\s*(\d+))?/);if(!m)return;
  const n=+(m[1]||1),f=+m[2],mod=m[3]?(m[3]==='-'?-1:1)*+m[4]:0,ds=Array.from({length:n},()=>dado(f));
  mostrarTirada({label,total:ds.reduce((s,x)=>s+x,0)+mod,det:`${n}d${f} (${ds.join(' + ')})${mod?' '+R.sg(mod):''}`,crit:''});
}
function mostrarTirada(t){
  rollLog.unshift(t);rollLog=rollLog.slice(0,12);pintarLog();
  let p=$('#dicepop');if(!p){p=document.createElement('div');p.id='dicepop';p.setAttribute('role','status');document.body.appendChild(p)}
  p.className='show '+t.crit;p.innerHTML=`<span class="dl">${esc(t.label)}</span><span class="dv">${t.total}</span><span class="dd">${esc(t.det)}${t.crit==='nat'?' · ¡20 natural!':t.crit==='pif'?' · 1 natural':''}</span>`;
  clearTimeout(mostrarTirada.t);mostrarTirada.t=setTimeout(()=>p.classList.remove('show'),3500);
}
function pintarLog(){const l=$('#dlog');if(l)l.innerHTML=rollLog.length?rollLog.map(t=>`<li class="${t.crit}"><b>${t.total}</b><span>${esc(t.label)}</span><span class="muted small">${esc(t.det)}</span></li>`).join(''):'<li class="muted">Pulsa cualquier característica, salvación, habilidad, ataque o dado.</li>'}
function diceTray(){return `<div class="sec dtray"><h3>Tiradas</h3>
  <div class="row-c"><div class="seg" role="group" aria-label="Modo de tirada">${[['n','Normal'],['v','Ventaja'],['d','Desventaja']].map(([k,l])=>`<button data-act="adv" data-k="${k}" aria-pressed="${advMode===k}">${l}</button>`).join('')}</div>
  <label class="muted small" for="dcount">Cantidad</label><select id="dcount">${[1,2,3,4,5,6,8,10].map(n=>`<option>${n}</option>`).join('')}</select>
  <label class="muted small" for="dmod">Mod.</label><input type="number" id="dmod" value="0" min="-20" max="30" style="width:4.5em"></div>
  <div class="dbtns">${[4,6,8,10,12,20,100].map(f=>`<button class="btn small" data-act="rdie" data-k="${f}">d${f}</button>`).join('')}<button class="btn small" data-act="rclear">Limpiar</button></div>
  <ul id="dlog" class="dlog"></ul></div>`}
function suggestArr(c){const o=D.clases[c.cls].ord;c.arr={};o.forEach((a,i)=>c.arr[a]=R.ARRAY[i])}
function sample(){
  const c=blank();Object.assign(c,{name:'Ysolde Varamar',align:'Neutral bueno',lang:'Común, Élfico, Dracónico',notes:'Personaje de ejemplo. Archivista de la Torre de Candlekeep que salió a buscar un grimorio perdido.',
    cls:'mago',lvl:5,sub:'evocador',bg:'sabio',species:'elfo',spSub:'alto',p2:'int',p1:'con',
    sk:{cls:['investigation','insight'],sp:['perception']},ex:{c0:['arcana']},feats:{asi4:{id:'mejora',ab:['int','dex']}},
    spells:{picks:['luz','mano-de-mago','rayo-de-escarcha','prestidigitacion','armadura-de-mago','escudo','detectar-magia','proyectil-magico','paso-brumoso','telarana','bola-de-fuego','contraconjuro','dormir'],
      book:['armadura-de-mago','escudo','detectar-magia','proyectil-magico','paso-brumoso','telarana','bola-de-fuego','contraconjuro','dormir','grasa','manos-ardientes','rayo-abrasador','esfera-de-fuego','rayo-lightning-bolt']}});
  suggestArr(c);return c;
}

let ch,roster,step,panel=null,toastT,delArm=null,DL=null;
try{window.claude&&window.claude.use&&window.claude.use('downloads').then(d=>{DL=d;if(panel)renderPanel()},()=>{})}catch(e){}
const fname=s=>(String(s||'personaje').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w -]+/g,'').trim().replace(/\s+/g,'-')||'personaje');
async function descargar(filename,data){
  if(!DL){
    if(!window.claude){ // web normal (por ejemplo, alojada en Vercel): descarga directa del navegador
      try{const type=filename.endsWith('.json')?'application/json':'text/plain';const url=URL.createObjectURL(new Blob([data],{type:type+';charset=utf-8'}));
        const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Descargado: '+filename)}
      catch(e){toast('No se pudo descargar. Usa Copiar.')}
      return}
    toast('Las descargas no están disponibles aquí. Usa Copiar.');return}
  try{await DL.save({filename,data});toast('Descargado: '+filename)}
  catch(e){const c=e&&e.code;if(c==='declined')return;if(c==='rate_limited'){toast('Ya hay una descarga pendiente de confirmar');return}toast('No se pudo descargar ('+(c||'error')+'). Usa Copiar.')}
}
const PHB="Player's Handbook";
const BOOKS=[[PHB,'Manual del Jugador'],['Eberron: Forge of the Artificer','Eberron'],['Heroes of Faerûn','Faerûn'],['Ravenloft: The Horrors Within','Ravenloft'],['Lorwyn: First Light','Lorwyn'],['D&D Beyond Drops','D&D Beyond']];
const bookKey=src=>!src?PHB:String(src).startsWith('D&D Beyond')?'D&D Beyond Drops':src;
const bookShort=src=>(BOOKS.find(b=>b[0]===bookKey(src))||[0,src])[1];
let books=new Set((()=>{const v=lsGet('forja-libros');return Array.isArray(v)?v:BOOKS.map(b=>b[0])})());
const okB=(x,cur)=>cur||books.has(bookKey(x.src));
const tagB=x=>bookKey(x.src)===PHB?'':' · '+bookShort(x.src);
function grouped(entries,cur){
  const g={};entries.filter(([k,v])=>okB(v,k===cur)).forEach(([k,v])=>{const b=bookShort(v.src);(g[b]=g[b]||[]).push([k,v])});
  return Object.entries(g).map(([b,arr])=>`<optgroup label="${esc(b)}">${arr.map(([k,v])=>`<option value="${esc(k)}" ${k===cur?'selected':''}>${esc(v.n)}</option>`).join('')}</optgroup>`).join('');
}
const srcLine=x=>`<span>Libro <b>${esc(bookShort(x.src))}</b></span>`;

/* ---------- Render principal ---------- */
function saveCurrent(){
  if(!ch)return;ch.upd=Date.now();const c=JSON.parse(JSON.stringify(ch));
  const i=roster.findIndex(r=>r.id===ch.id);if(i>=0)roster[i]=c;else roster.unshift(c);
  lsSet('forja-personajes',roster);
}
function stInicio(el){
  const list=[...roster].sort((a,b)=>(b.upd||0)-(a.upd||0));
  el.innerHTML=`<div class="panel home"><div class="st-h"><h2>Mis personajes</h2><span class="hint">Se guardan solos en este navegador</span></div>
  <button class="btn primary big" data-act="new" id="b-new-home">+ Crear personaje nuevo</button>
  ${list.length?`<div class="roster">${list.map(r=>`<div class="it"><div class="nm2"><b>${esc(r.name||'Sin nombre')}</b><span>${esc(D.clases[r.cls]?.n||'')} ${r.lvl}${r.sub&&r.lvl>=3?' · '+esc(((D.subclases.subclases[r.cls]||[]).find(s=>s.id===r.sub)||{}).n||''):''} · ${esc(D.origen.especies[r.species]?.n||'')} · ${esc(D.origen.trasfondos[r.bg]?.n||'')}</span></div><button class="btn small primary" data-act="load" data-k="${r.id}">Abrir</button><button class="btn small" data-act="del" data-k="${r.id}">${delArm===r.id?'¿Borrar?':'Borrar'}</button></div>`).join('')}</div>`
  :`<p class="muted">Aún no tienes personajes. Pulsa “Crear personaje nuevo” para empezar, o importa uno desde Exportar.</p>`}</div>`;
}
function render(){
  const home=step==='inicio'||!ch;
  $('.stepbar').hidden=home;$('.nameb').style.visibility=home?'hidden':'visible';
  if(home){step='inicio';stInicio($('#stage'));$('#mini').hidden=true;$('.layout').classList.add('wide');renderPanel();return}
  R.normalize(ch);const S=R.sheet(ch);
  $('#f-name').value!==ch.name&&document.activeElement!==$('#f-name')&&($('#f-name').value=ch.name);
  $('#steps').innerHTML=STEPS.map(([k,n],i)=>`<button class="stp" data-act="step" data-k="${k}" aria-current="${step===k?'step':'false'}"><span class="si">${i+1}</span>${n}</button>`).join('');
  const el=$('#stage');
  ({clase:stClase,trasfondo:stTrasfondo,especie:stEspecie,caract:stCaract,habil:stHabil,dotes:stDotes,equipo:stEquipo,conjuros:stConjuros,ficha:stFicha})[step](el,S);
  $('#mini').hidden=step==='ficha';if(step!=='ficha')renderMini(S);
  $('.layout').classList.toggle('wide',step==='ficha'||step==='conjuros');
  renderPanel();
  saveCurrent();
}
const sel=(id,opts,val,attrs='')=>`<select id="${id}" ${attrs}>${opts.map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
const chip=(act,k,on,txt,dis,extra='')=>`<button class="chip" data-act="${act}" data-k="${k}" ${extra} aria-pressed="${on}" ${dis?'disabled':''}>${txt}</button>`;
const head=(n,t,hint)=>`<div class="st-h"><span class="st-n">${n}</span><h2>${t}</h2>${hint?`<span class="hint">${hint}</span>`:''}</div>`;

function featureTimeline(S){
  const c=S.c,s=R.subOf(ch),rows=[];
  for(let l=1;l<=20;l++){const cf=c.f.filter(f=>f[0]===l),sf=s?s.f.filter(f=>f[0]===l):[];if(!cf.length&&!sf.length)continue;
    rows.push(`<div class="tl ${l>ch.lvl?'later':''}"><span class="tl-l">${l}</span><div>${cf.map(f=>`<p><b>${esc(f[1])}.</b> ${esc(f[2])}</p>`).join('')}${sf.map(f=>`<p class="tl-sub"><b>${esc(f[1])}</b> <span class="tg s">${esc(s.n)}</span> ${esc(f[2])}</p>`).join('')}</div></div>`)}
  return rows.join('');
}
function stClase(el,S){
  const c=S.c,LBL=D.subclases.etiquetas,subs=D.subclases.subclases[ch.cls],s=R.subOf(ch);
  let h=`<div class="panel">${head(1,'Clase y nivel','Define tu papel, tus puntos de golpe y tus rasgos')}
  <div class="cgrid">${Object.entries(D.clases).filter(([k,v])=>okB(v,k===ch.cls)).map(([k,v])=>`<button class="ccard" data-act="cls" data-k="${k}" aria-pressed="${k===ch.cls}"><b>${v.n}</b><span>d${v.hd} · ${v.pri.map(a=>R.AB[a]).join('/')}${v.cast?' · conjuros':''}${tagB(v)}</span></button>`).join('')}</div>
  <div class="row">
    <div class="fld"><label for="f-lvl">Nivel</label><div class="lvl"><button data-act="lv" data-d="-1" ${ch.lvl<=1?'disabled':''} aria-label="Bajar nivel">−</button>${sel('f-lvl',Array.from({length:20},(_,i)=>[i+1,i+1]),ch.lvl,'data-f="lvl" data-num="1"')}<button data-act="lv" data-d="1" ${ch.lvl>=20?'disabled':''} aria-label="Subir nivel">+</button></div></div>
    <div class="fld"><label for="f-sub">${LBL[ch.cls]}${ch.lvl<3?' (desde nivel 3)':''}</label>${sel('f-sub',[['','Sin elegir'],...subs.filter(x=>okB(x,x.id===ch.sub)).map(x=>[x.id,x.n+tagB(x)])],ch.sub,'data-f="sub"')}</div>
    ${s&&s.land?`<div class="fld"><label for="f-land">Tierra</label>${sel('f-land',Object.entries(D.subclases.tierras),ch.land||'arid','data-f="land"')}</div>`:''}
    ${ch.cls==='clerigo'?`<div class="fld"><label for="f-order">Orden divina</label>${sel('f-order',[['','Sin elegir'],['protector','Protector'],['taumaturgo','Taumaturgo']],ch.order,'data-f="order"')}</div>`:''}
    ${ch.cls==='druida'?`<div class="fld"><label for="f-order">Orden primigenia</label>${sel('f-order',[['','Sin elegir'],['mago','Mago'],['guardian','Guardián']],ch.order,'data-f="order"')}</div>`:''}
  </div>
  <div class="info"><div class="kv"><span>Dado de golpe <b>d${c.hd}</b></span><span>Salvaciones <b>${c.sv.map(a=>R.AB[a]).join(', ')}</b></span><span>Bonif. competencia <b>+${S.pb}</b></span>${S.spell?`<span>Conjuros con <b>${R.ABF[S.spell.ab]}</b></span>`:''}</div>
  <div class="kv"><span>Armadura <b>${c.arm}</b></span><span>Armas <b>${c.wpn}</b></span>${c.tool?`<span>Herramientas <b>${c.tool}</b></span>`:''}</div>
  ${S.prog.length?`<div class="kv">${S.prog.map(([k,v])=>`<span>${esc(k)} <b>${esc(v)}</b></span>`).join('')}</div>`:''}</div></div>
  <div class="panel">${head('','Rasgos por nivel',`Hasta nivel ${ch.lvl} en claro; lo que viene, atenuado`)}<div class="timeline">${featureTimeline(S)}</div></div>`;
  el.innerHTML=h;
}
function stTrasfondo(el,S){
  const bg=S.bg,fid=(bg.fOpts&&bg.fOpts.includes(ch.bgFeat))?ch.bgFeat:bg.f,f=D.origen.dotes[fid];
  el.innerHTML=`<div class="panel">${head(2,'Trasfondo','Da las mejoras de característica, la dote de origen, 2 habilidades y equipo')}
  <div class="row"><div class="fld"><label for="f-bg">Trasfondo</label><select id="f-bg" data-f="bg">${grouped(Object.entries(D.origen.trasfondos),ch.bg)}</select></div>
  <div class="fld"><label for="f-align">Alineamiento</label>${sel('f-align',ALIGN.map(a=>[a,a]),ch.align,'data-f="align"')}</div></div>
  <div class="info"><div class="kv">${srcLine(bg)}<span>Características <b>${bg.ab.map(a=>R.ABF[a]).join(', ')}</b></span><span>Habilidades <b>${bg.sk.map(k=>R.SKN[k]).join(', ')}</b></span><span>Herramienta <b>${esc(bg.tool)}</b></span></div>
  ${bg.fOpts?`<div class="row-c"><label class="sub-label" for="f-bgfeat">Dote de origen</label>${sel('f-bgfeat',bg.fOpts.map(k=>[k,D.origen.dotes[k].n]),fid,'data-f="bgFeat"')}</div>`:''}
  <div><b>Dote de origen: ${esc(f.n)}.</b> ${esc(f.d)}</div>
  <div class="muted">Equipo: ${bg.eq.map(([n,q])=>(q>1?q+' × ':'')+n).join(', ')} y ${bg.po} po (o 50 po en su lugar).</div></div>
  <div class="sub-label">Mejoras de característica</div>
  <div class="seg" role="group"><button data-act="bgmode" data-k="21" aria-pressed="${ch.bgMode!=='111'}">+2 y +1</button><button data-act="bgmode" data-k="111" aria-pressed="${ch.bgMode==='111'}">+1 a las tres</button></div>
  ${ch.bgMode!=='111'?`<div class="row-c"><span class="muted w2">+2</span><div class="chips">${bg.ab.map(x=>chip('p2',x,ch.p2===x,R.ABF[x])).join('')}</div></div>
  <div class="row-c"><span class="muted w2">+1</span><div class="chips">${bg.ab.map(x=>chip('p1',x,ch.p1===x,R.ABF[x],ch.p2===x)).join('')}</div></div>`:''}
  </div>`;
}
function stEspecie(el,S){
  const sp=S.sp;
  el.innerHTML=`<div class="panel">${head(3,'Especie')}
  <div class="row"><div class="fld"><label for="f-sp">Especie</label><select id="f-sp" data-f="species">${grouped(Object.entries(D.origen.especies),ch.species)}</select></div>
  ${sp.sub?`<div class="fld"><label for="f-spsub">${sp.sub.l}</label>${sel('f-spsub',sp.sub.o.map(o=>[o.id,o.n]),ch.spSub,'data-f="spSub"')}</div>`:''}
  ${sp.size==='choice'?`<div class="fld"><label for="f-size">Tamaño</label>${sel('f-size',[['Mediano','Mediano'],['Pequeño','Pequeño']],ch.size,'data-f="size"')}</div>`:''}
  ${sp.feat?`<div class="fld"><label for="f-feat2">Dote de origen adicional</label><select id="f-feat2" data-f="feat2">${grouped(Object.entries(D.origen.dotes).filter(([,d])=>d.cat==='origen'),ch.feat2)}</select></div>`:''}</div>
  <div class="info"><div class="kv"><span>Tamaño <b>${sp.size==='choice'?'Mediano o Pequeño':sp.size}</b></span><span>Velocidad <b>${R.m((S.spSub&&S.spSub.spd)||sp.spd)}</b></span>${S.dv?`<span>Visión en la oscuridad <b>${R.m(S.dv)}</b></span>`:''}</div>
  ${S.spSub?`<div><b>${esc(S.spSub.n)}.</b> ${esc(S.spSub.d)}</div>`:''}
  ${sp.tr.map(t=>`<div><b>${esc(t[0])}.</b> ${esc(t[1])}</div>`).join('')}</div>
  <div class="row"><div class="fld grow"><label for="f-lang">Idiomas</label><input type="text" id="f-lang" data-t="lang" maxlength="120" value="${esc(ch.lang)}"></div></div></div>`;
}
function stCaract(el,S){
  const c=S.c,b=R.base(ch),r=ch.roll=ch.roll||{sets:[],asg:{}};
  const spent=R.ABS.reduce((s,[k])=>s+R.PBC[ch.pb[k]],0);
  const tot3=t=>t[0]+t[1]+t[2];
  let h=`<div class="panel">${head(4,'Características','Las mejoras del trasfondo y las dotes se suman solas')}
  <div class="row-c"><div class="seg" role="group" aria-label="Método">${[['array','Conjunto estándar'],['pb','Compra de puntos'],['roll','Tirar dados'],['man','Manual']].map(([k,l])=>`<button data-act="method" data-k="${k}" aria-pressed="${ch.method===k}">${l}</button>`).join('')}</div>
  ${ch.method==='array'?`<button class="btn small" data-act="suggest">Ordenar para ${c.n.toLowerCase()}</button>`:''}
  ${ch.method==='pb'?`<span class="muted">Puntos gastados <b class="ink">${spent} / 27</b></span>`:''}</div>`;
  if(ch.method==='roll'){
    if(!r.sets.length)h+=`<div class="rollbox empty"><p>Se tiran <b>4d6</b> seis veces y en cada tirada se descarta el dado más bajo. Luego asignas cada resultado a una característica.</p><button class="btn pri" id="b-roll" data-act="roll">🎲 Tirar las características</button></div>`;
    else h+=`<div class="rollbox"><div class="rsets">${r.sets.map((t,i)=>`<div class="rset"><span class="rn">Tirada ${i+1}</span><span class="dice">${t.map((v,j)=>`<span class="die ${j===3?'drop':''}">${v}</span>`).join('')}</span><span class="rt">${tot3(t)}</span><span class="ra">${esc(R.ABS.filter(([a])=>+r.asg[a]===i).map(([,ab])=>ab).join('')||'—')}</span></div>`).join('')}</div>
    <div class="row-c"><span class="muted">Suma <b class="ink">${r.sets.reduce((s,t)=>s+tot3(t),0)}</b></span><button class="btn small" data-act="roll">Volver a tirar</button><button class="btn small" data-act="rsort">Ordenar para ${c.n.toLowerCase()}</button><button class="btn small" data-act="r2man">Editar a mano</button></div></div>`;
  }
  if(ch.method==='man')h+=`<p class="muted">Escribe las puntuaciones que hayas sacado con tus propios dados o las que te indique tu DM (de 3 a 20).</p>`;
  h+=`<div class="tbl-wrap"><table class="abt"><thead><tr><th>Característica</th><th>Base</th><th>Trasfondo</th><th>Otros</th><th>Total</th><th>Mod.</th></tr></thead><tbody>`;
  R.ABS.forEach(([k,ab,full])=>{
    let ctl;
    if(ch.method==='array')ctl=sel('ar-'+k,R.ARRAY.map(v=>[v,v]),b[k],`data-f="arr" data-k="${k}" aria-label="${full}"`);
    else if(ch.method==='pb'){const v=ch.pb[k],up=v<15&&spent-R.PBC[v]+R.PBC[v+1]<=27;ctl=`<span class="pbctl"><button data-act="pb" data-k="${k}" data-d="-1" ${v<=8?'disabled':''} aria-label="Bajar ${full}">−</button><output>${v}</output><button data-act="pb" data-k="${k}" data-d="1" ${up?'':'disabled'} aria-label="Subir ${full}">+</button></span>`}
    else if(ch.method==='roll')ctl=r.sets.length?sel('rl-'+k,r.sets.map((t,i)=>[i,`${tot3(t)} (tirada ${i+1})`]),r.asg[k],`data-f="rasg" data-k="${k}" aria-label="${full}"`):'<span class="muted">—</span>';
    else ctl=`<input type="number" id="mn-${k}" min="3" max="20" data-f="man" data-k="${k}" value="${b[k]}" aria-label="${full}">`;
    const other=S.sc[k]-Math.min(20,(+b[k]||0)+S.bon[k]);
    h+=`<tr class="${c.pri.includes(k)?'pri':''}"><td class="ab">${ab}<small>${full}</small></td><td>${ctl}</td><td class="bon">${S.bon[k]?'+'+S.bon[k]:''}</td><td class="bon">${other>0?'+'+other:''}</td><td class="tot">${S.sc[k]}</td><td class="mod">${R.sg(S.mo[k])}</td></tr>`;
  });
  h+=`</tbody></table></div><p class="muted">“Otros” incluye mejoras de característica, dotes y rasgos de nivel 20. Máximo 20 salvo rasgos que digan lo contrario.</p></div>`;
  el.innerHTML=h;
}
function stHabil(el,S){
  const fixed=R.fixedSkills(ch),pools=R.skillPools(ch),eps=R.expertisePools(ch);
  const others=excl=>{const t=new Set(fixed);pools.forEach(p=>{if(p.key!==excl)(ch.sk[p.key]||[]).forEach(k=>t.add(k))});return t};
  let h=`<div class="panel">${head(5,'Habilidades','Las doradas vienen fijadas')}
  <div class="pool"><div class="ph"><span>Fijas · ${esc(S.bg.n)}${fixed.size>2?' y subclase':''}</span></div><div class="chips">${[...fixed].map(k=>`<span class="chip fixed">${R.SKN[k]}</span>`).join('')}</div></div>`;
  pools.forEach(p=>{const selv=ch.sk[p.key]||[],full=selv.length>=p.n,tk=others(p.key);
    h+=`<div class="pool"><div class="ph"><span>${esc(p.label)}</span><span class="cnt ${full?'ok':''}">${selv.length} / ${p.n}</span></div><div class="chips">${p.from.map(k=>{const on=selv.includes(k);return chip('sk',k,on,R.SKN[k],!on&&(tk.has(k)||full),`data-p="${p.key}"`)}).join('')}</div></div>`});
  if(eps.length){const used=new Set(Object.values(ch.ex).flat());
    eps.forEach(p=>{const selv=ch.ex[p.key]||[],full=selv.length>=p.n,from=(p.from||R.ALLSK).filter(k=>S.prof.has(k));
      h+=`<div class="pool"><div class="ph"><span>Pericia · ${esc(p.label)}</span><span class="cnt ${full?'ok':''}">${selv.length} / ${p.n}</span></div><div class="chips">${from.map(k=>{const on=selv.includes(k);return chip('ex',k,on,R.SKN[k],!on&&(full||used.has(k)),`data-p="${p.key}"`)}).join('')||'<span class="muted">Primero elige habilidades con competencia.</span>'}</div></div>`})}
  h+=`<div class="tbl-wrap"><table class="skt"><tbody>${R.SK.map(([k,n,a])=>`<tr class="${S.ex.has(k)?'on ex':S.prof.has(k)?'on':''}"><td><span class="dot2"></span></td><td>${n} <span class="muted small">${R.AB[a]}</span></td><td class="num">${R.sg(S.skills[k])}</td></tr>`).join('')}</tbody></table></div>
  ${S.jack?'<p class="muted">Aprendiz de todo: sumas la mitad del BC a las habilidades sin competencia.</p>':''}</div>`;
  el.innerHTML=h;
}
function stDotes(el,S){
  const slots=R.featSlots(ch),taken=R.featsTaken(ch);
  let h=`<div class="panel">${head(6,'Dotes','Mejoras de característica, estilos de combate y dones épicos')}
  <div class="sub-label">Dotes de origen</div><div class="feats">${taken.filter(f=>f.key==='bg'||f.key==='hum').map(f=>{const d=D.origen.dotes[f.id];return `<div class="feat"><b>${esc(d.n)}</b> <span class="tg s">${esc(f.src)}</span><br>${esc(d.d)}</div>`}).join('')}</div>`;
  if(!slots.length)h+=`<p class="muted">A nivel 4 (y en otros niveles según tu clase) ganarás una mejora de característica o una dote general.</p>`;
  slots.forEach(s=>{
    const v=ch.feats[s.key],d=D.origen.dotes[v.id];
    const usedElse=new Set(taken.filter(f=>f.key!==s.key).map(f=>f.id));
    const opts=Object.entries(D.origen.dotes).filter(([k,x])=>s.cats.includes(x.cat)&&okB(x,k===v.id)&&(k==='mejora'||k===v.id||!usedElse.has(k)));
    const groups={general:'Generales',estilo:'Estilos de combate',epica:'Dones épicos'};
    const selH=`<select id="ft-${s.key}" data-f="feat" data-k="${s.key}">${s.cats.map(cat=>`<optgroup label="${groups[cat]}">${opts.filter(([,x])=>x.cat===cat).map(([k,x])=>`<option value="${k}" ${k===v.id?'selected':''}>${esc(x.n+tagB(x))}</option>`).join('')}</optgroup>`).join('')}</select>`;
    let abH='';
    if(d.asi)abH=`<div class="row-c"><span class="muted">+1</span>${sel('fa0-'+s.key,R.ABS.map(([k,,f])=>[k,f]),v.ab[0],`data-f="featab" data-k="${s.key}" data-i="0"`)}<span class="muted">+1</span>${sel('fa1-'+s.key,R.ABS.map(([k,,f])=>[k,f]),v.ab[1],`data-f="featab" data-k="${s.key}" data-i="1"`)}<span class="muted small">Elige la misma dos veces para +2</span></div>`;
    else if(d.ab)abH=`<div class="row-c"><span class="muted">+1 a</span><div class="chips">${d.ab.map(a=>chip('featab1',a,v.ab[0]===a,R.ABF[a],false,`data-s="${s.key}"`)).join('')}</div></div>`;
    h+=`<div class="slotc"><div class="slot-h"><span class="sub-label">${esc(s.label)}</span>${selH}</div><p class="muted">${esc(d.d)}</p>${abH}</div>`;
  });
  el.innerHTML=h+'</div>';
}
function stEquipo(el,S){
  const c=S.c,bg=S.bg,g=S.g,P=D.equipo.paquetes;
  const itemsTxt=items=>items.map(([n,q])=>(q>1?q+' × ':'')+esc(n)).join(', ');
  let h=`<div class="panel">${head(7,'Equipo inicial','Elige el lote de tu clase y de tu trasfondo')}
  <div class="sub-label">${esc(c.n)}</div><div class="opts">${c.eq.map(o=>`<button class="opt" data-act="eqcls" data-k="${o.id}" aria-pressed="${ch.eqCls===o.id}"><b>Opción ${o.id}</b><span>${o.items.length?itemsTxt(o.items)+' y '+o.po+' po':'Solo oro: '+o.po+' po'}</span></button>`).join('')}</div>
  <div class="sub-label">${esc(bg.n)}</div><div class="opts"><button class="opt" data-act="eqbg" data-k="A" aria-pressed="${ch.eqBg==='A'}"><b>Opción A</b><span>${itemsTxt(bg.eq)} y ${bg.po} po</span></button><button class="opt" data-act="eqbg" data-k="B" aria-pressed="${ch.eqBg==='B'}"><b>Opción B</b><span>50 po</span></button></div>
  <div class="row">
   <div class="fld"><label for="f-armor">Armadura puesta</label>${sel('f-armor',[['auto','Automática (la mejor con competencia)'],...g.armors.map(a=>[a.n,a.n+(g.ap.has(a.cat)?'':' (sin competencia)')]),['none','Sin armadura']],ch.armor||'auto','data-f="armor"')}</div>
   ${g.hasShield?`<label class="check"><input type="checkbox" id="f-shield" data-f="shield" ${ch.shield!==false?'checked':''}> Usar escudo${g.ap.has('escudo')?'':' (sin competencia)'}</label>`:''}
  </div>
  <div class="info"><div class="kv"><span>CA <b>${S.ac}</b> (${esc(S.acn)})</span><span>Oro <b>${g.inv.po} po</b></span>${g.armor&&g.armor.sig?'<span>Desventaja en <b>Sigilo</b></span>':''}${g.armor&&g.armor.str>S.sc.str?`<span class="bad">Necesitas FUE ${g.armor.str}: −3 m de velocidad</span>`:''}</div></div>
  <div class="sub-label">Ataques</div>${attacksTable(S)}
  <div class="sub-label">Inventario</div><ul class="inv">${g.inv.items.map(it=>`<li><span>${it.q>1?it.q+' × ':''}${esc(it.n)}${P[it.n]?`<span class="muted small"> · ${P[it.n].join(', ')}</span>`:''}</span><span class="muted small">${it.src}</span></li>`).join('')}</ul></div>`;
  el.innerHTML=h;
}
function attacksTable(S){
  return `<div class="tbl-wrap"><table class="atk"><thead><tr><th>Arma</th><th>Ataque</th><th>Daño</th><th>Propiedades</th></tr></thead><tbody>${S.atks.map(a=>`<tr><td><b>${esc(a.n)}</b>${a.prof?'':' <span class="bad small">sin competencia</span>'}</td><td class="num"><button type="button" class="rbtn" data-act="r20" data-k="Ataque · ${esc(a.n)}" data-b="${a.hit}" title="Tirar ataque">${R.sg(a.hit)}</button></td><td><button type="button" class="rbtn" data-act="rdmg" data-k="Daño · ${esc(a.n)}" data-e="${esc(a.dmg)}" title="Tirar daño">${esc(a.dmg)}</button> ${esc(a.dt)}</td><td class="muted small">${esc([...a.p,a.m?'Maestría: '+a.m:''].filter(Boolean).join(' · '))}</td></tr>`).join('')}</tbody></table></div>`;
}
function stConjuros(el,S){
  el.innerHTML=`<div class="panel">${head(8,'Conjuros','Las cantidades dependen de tu clase y nivel')}<div id="spbox"></div></div>`;
  Conjuros.render(ch,$('#spbox'),S);
}
function abCards(S){return `<div class="abil">${R.ABS.map(([k,ab,f])=>`<button type="button" class="ab-card ${S.c.pri.includes(k)?'pri':''}" data-act="r20" data-k="Prueba de ${f}" data-b="${S.mo[k]}" title="Tirar prueba de ${f}"><span class="l">${ab}</span><span class="m">${R.sg(S.mo[k])}</span><span class="s">${S.sc[k]}</span></button>`).join('')}</div>`}
function statRow(S){return `<div class="stats">
  <div class="stat"><span class="k">Clase de armadura</span><span class="v">${S.ac}</span><span class="x">${esc(S.acn)}</span></div>
  <div class="stat hp"><span class="k">Puntos de golpe</span><span class="v">${S.hp}</span><span class="x">Dados ${S.hd}</span></div>
  <div class="stat roll" role="button" tabindex="0" data-act="r20" data-k="Iniciativa" data-b="${S.init}" title="Tirar iniciativa"><span class="k">Iniciativa 🎲</span><span class="v">${R.sg(S.init)}</span><span class="x">DES${S.feats.some(f=>f.id==='alerta')?' + Alerta':''}</span></div>
  <div class="stat"><span class="k">Velocidad</span><span class="v">${R.m(S.spd)}</span><span class="x">${S.spd} pies</span></div>
  <div class="stat"><span class="k">Bonif. competencia</span><span class="v">+${S.pb}</span><span class="x">Nivel ${S.L}</span></div>
  <div class="stat"><span class="k">Percepción pasiva</span><span class="v">${S.pp}</span><span class="x">Tamaño ${esc(S.size)}</span></div></div>`}
function subtitle(S){return `Nivel ${S.L} · <b>${S.c.n}</b>${S.sub?' ('+esc(S.sub.n)+')':''} · <b>${esc(S.sp.n)}${S.spSub&&ch.species!=='draconido'&&ch.species!=='goliat'?' ('+esc(S.spSub.n)+')':''}</b> · <b>${esc(S.bg.n)}</b>${ch.align!=='Sin definir'?' · '+esc(ch.align):''}`}
function renderMini(S){
  $('#mini').innerHTML=`<div class="mini-h"><h2>${esc(ch.name||'Sin nombre')}</h2><div class="sub">${subtitle(S)}</div></div>${abCards(S)}${statRow(S)}
  ${S.spell?`<div class="spell"><div><span class="k">CD de conjuros</span><span class="v">${S.spell.dc}</span></div><div><span class="k">Ataque de conjuro</span><span class="v">${R.sg(S.spell.atk)}</span></div></div>`:''}
  <button class="btn" data-act="step" data-k="ficha">Ver ficha completa</button>`;
}
function stFicha(el,S){
  const sm=Conjuros.summary(ch);
  el.innerHTML=`<article class="sheet"><header class="sh-head"><h2>${esc(ch.name||'Sin nombre')}</h2><div class="sub">${subtitle(S)}${ch.player?' · Jugador: '+esc(ch.player):''}</div></header><div class="sh-body">
  ${abCards(S)}${statRow(S)}
  ${diceTray()}
  ${S.spell?`<div class="spell"><div><span class="k">Lanzamiento</span><span class="v">${R.ABF[S.spell.ab]}</span></div><div><span class="k">CD de salvación</span><span class="v">${S.spell.dc}</span></div><div class="roll" role="button" tabindex="0" data-act="r20" data-k="Ataque de conjuro" data-b="${S.spell.atk}"><span class="k">Ataque de conjuro 🎲</span><span class="v">${R.sg(S.spell.atk)}</span></div>${sm?`<div><span class="k">Espacios</span><span class="v sm">${esc(sm.slots)}</span></div>`:''}</div>`:''}
  <div class="cols"><div class="colstack">
    <div class="sec"><h3>Tiradas de salvación</h3><ul class="plist">${R.ABS.map(([k,,f])=>`<li class="${S.sv.has(k)?'on':''} roll" role="button" tabindex="0" data-act="r20" data-k="Salvación de ${f}" data-b="${S.saves[k]}"><span class="dot2"></span><span class="b">${R.sg(S.saves[k])}</span><span>${f}</span><span></span></li>`).join('')}</ul>${S.aura?`<p class="muted small">Incluye Aura de protección (+${S.aura}).</p>`:''}</div>
    <div class="sec"><h3>Competencias</h3><div class="prof"><div><b>Armadura:</b> ${esc(S.c.arm)}</div><div><b>Armas:</b> ${esc(S.c.wpn)}</div>${S.tools.length?`<div><b>Herramientas:</b> ${esc(S.tools.join('; '))}</div>`:''}<div><b>Idiomas:</b> ${esc(ch.lang||'—')}</div>${S.dv?`<div><b>Sentidos:</b> Visión en la oscuridad ${R.m(S.dv)}</div>`:''}</div></div>
    ${S.prog.length?`<div class="sec"><h3>Recursos de clase</h3><div class="prof">${S.prog.map(([k,v])=>`<div><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</div></div>`:''}
  </div>
  <div class="sec" style="min-width:0"><h3>Habilidades</h3><ul class="plist">${R.SK.map(([k,n,a])=>`<li class="${S.ex.has(k)?'on ex':S.prof.has(k)?'on':''} roll" role="button" tabindex="0" data-act="r20" data-k="${esc(n)}" data-b="${S.skills[k]}"><span class="dot2"></span><span class="b">${R.sg(S.skills[k])}</span><span>${n}</span><span class="a">${R.AB[a]}</span></li>`).join('')}</ul></div></div>
  <div class="sec"><h3>Ataques</h3>${attacksTable(S)}</div>
  ${sm?`<div class="sec"><h3>Conjuros</h3><div class="prof">${sm.lines.map(([l,ns])=>`<div><b>${l}:</b> ${esc(ns.join(', '))}</div>`).join('')||'<div class="muted">Sin conjuros elegidos.</div>'}${sm.book.length?`<div><b>En el libro, sin preparar:</b> ${esc(sm.book.join(', '))}</div>`:''}</div><p class="muted small">★ siempre preparado por tu subclase.</p></div>`:''}
  <div class="sec"><h3>Rasgos de clase y subclase</h3><div class="feats">${S.feat.map(f=>`<div class="feat"><b>${esc(f.n)}</b> <span class="tg s">${esc(f.src)} ${f.l}</span><br>${esc(f.d)}</div>`).join('')}</div></div>
  <div class="sec"><h3>Rasgos de especie · ${esc(S.sp.n)}</h3><div class="feats">${S.spSub?`<div class="feat"><b>${esc(S.spSub.n)}.</b> ${esc(S.spSub.d)}</div>`:''}${S.sp.tr.map(t=>`<div class="feat"><b>${esc(t[0])}.</b> ${esc(t[1])}</div>`).join('')}</div></div>
  <div class="sec"><h3>Dotes</h3><div class="feats">${S.feats.map(f=>{const d=D.origen.dotes[f.id];return `<div class="feat"><b>${esc(d.n)}</b> <span class="tg s">${esc(f.src)}</span><br>${esc(d.d)}</div>`}).join('')}</div></div>
  <div class="sec"><h3>Equipo</h3><p>${S.g.inv.items.map(it=>(it.q>1?it.q+' × ':'')+esc(it.n)).join(', ')}. <b>${S.g.inv.po} po.</b></p></div>
  <div class="sec"><h3>Notas</h3><textarea id="f-notes" data-t="notes" rows="4" placeholder="Historia, rasgos de personalidad, aliados…">${esc(ch.notes)}</textarea>
  <div class="row"><div class="fld"><label for="f-player">Jugador</label><input type="text" id="f-player" data-t="player" maxlength="40" value="${esc(ch.player)}"></div></div></div>
  </div></article>`;
  pintarLog();
}

/* ---------- Personajes y exportar ---------- */
function renderPanel(){
  const p=$('#panel');p.hidden=!panel;if(!panel)return;
  if(panel==='libros'){
    p.innerHTML=`<div class="pn-h"><h2>Libros</h2><button class="btn small" data-act="panel" data-k="">Cerrar</button></div>
    <p class="muted small">Elige de qué libros quieres ver clases, subclases, especies, trasfondos y dotes. Lo que ya tenga tu personaje se mantiene aunque desactives su libro.</p>
    <div class="books">${BOOKS.map(([k,n])=>`<label class="check"><input type="checkbox" id="bk-${n.replace(/[^a-z]/gi,'')}" data-f="book" value="${esc(k)}" ${books.has(k)?'checked':''}> ${esc(n)}</label>`).join('')}</div>`;
    return;
  }
  if(panel==='roster'){
    p.innerHTML=`<div class="pn-h"><h2>Mis personajes</h2><button class="btn small" data-act="panel" data-k="">Cerrar</button></div>`+(roster.length?`<div class="roster">${roster.map(r=>`<div class="it ${r.id===ch.id?'cur':''}"><div class="nm2"><b>${esc(r.name||'Sin nombre')}</b><span>${esc(D.clases[r.cls]?.n||'')} ${r.lvl} · ${esc(D.origen.especies[r.species]?.n||'')} · ${esc(D.origen.trasfondos[r.bg]?.n||'')}</span></div><button class="btn small" data-act="load" data-k="${r.id}">Abrir</button><button class="btn small" data-act="del" data-k="${r.id}">${delArm===r.id?'¿Borrar?':'Borrar'}</button></div>`).join('')}</div>`:'<p class="muted">Aún no has guardado ningún personaje. Pulsa Guardar para añadir el actual. Se guardan en este navegador.</p>');
  }else{
    p.innerHTML=`<div class="pn-h"><h2>Exportar e importar</h2><button class="btn small" data-act="panel" data-k="">Cerrar</button></div>
    ${(DL||!window.claude)?`<div class="row-c">${ch?`<button class="btn primary" data-act="dljson" id="b-djson">Descargar personaje (.json)</button><button class="btn" data-act="dltext" id="b-dtext">Descargar ficha (.txt)</button>`:''}${roster.length?`<button class="btn" data-act="dlall" id="b-dall">Descargar todos los guardados (.json)</button>`:''}</div>`:''}
    ${ch?`<div class="row-c"><button class="btn" data-act="copytext" id="b-ctext">Copiar ficha en texto</button><button class="btn" data-act="copyjson" id="b-cjson">Copiar JSON del personaje</button></div>`:''}
    <p class="muted small">${(DL||!window.claude)?'Al descargar, tu navegador te pedirá confirmación. ':''}El JSON guarda todas tus elecciones y se puede volver a importar aquí.</p>
    <label class="sub-label" for="imp">Importar: pega aquí un JSON o elige un archivo</label>
    <textarea id="imp" rows="4" placeholder='{"name":"…","cls":"…"}'></textarea>
    <div class="row-c"><button class="btn primary" data-act="import">Importar</button><input type="file" id="impfile" accept=".json,application/json" aria-label="Elegir archivo JSON"></div>`;
  }
}
function sheetText(){
  const S=R.sheet(ch),sm=Conjuros.summary(ch),L=[];
  L.push(`${ch.name||'Sin nombre'} — Nivel ${S.L} ${S.c.n}${S.sub?' ('+S.sub.n+')':''}, ${S.sp.n}${S.spSub?' ('+S.spSub.n+')':''}, ${S.bg.n}${ch.align!=='Sin definir'?', '+ch.align:''}`);
  L.push(R.ABS.map(([k,ab])=>`${ab} ${S.sc[k]} (${R.sg(S.mo[k])})`).join(' · '));
  L.push(`CA ${S.ac} (${S.acn}) · PG ${S.hp} · Iniciativa ${R.sg(S.init)} · Velocidad ${R.m(S.spd)} · BC +${S.pb} · Dados de golpe ${S.hd} · Percepción pasiva ${S.pp}`);
  L.push('Salvaciones: '+R.ABS.map(([k,ab])=>`${ab} ${R.sg(S.saves[k])}${S.sv.has(k)?'*':''}`).join(', '));
  L.push('Habilidades: '+R.SK.filter(([k])=>S.prof.has(k)).map(([k,n])=>`${n}${S.ex.has(k)?' (pericia)':''} ${R.sg(S.skills[k])}`).join(', '));
  L.push('Ataques: '+S.atks.map(a=>`${a.n} ${R.sg(a.hit)} (${a.dmg} ${a.dt})`).join('; '));
  if(S.spell){L.push(`Conjuros (${R.ABF[S.spell.ab]}): CD ${S.spell.dc}, ataque ${R.sg(S.spell.atk)}${sm?' · '+sm.slots:''}`);if(sm)sm.lines.forEach(([l,ns])=>L.push(`  ${l}: ${ns.join(', ')}`))}
  L.push('Rasgos: '+S.feat.map(f=>f.n).join(', '));
  L.push('Especie: '+[S.spSub?S.spSub.n:null,...S.sp.tr.map(t=>t[0])].filter(Boolean).join(', '));
  L.push('Dotes: '+S.feats.map(f=>D.origen.dotes[f.id].n).join(', '));
  L.push(`Equipo: ${S.g.inv.items.map(it=>(it.q>1?it.q+' × ':'')+it.n).join(', ')}. ${S.g.inv.po} po.`);
  L.push(`Idiomas: ${ch.lang}`);
  if(ch.notes.trim())L.push('Notas: '+ch.notes.trim());
  return L.join('\n');
}
function copy(t,ok){
  const fb=()=>{const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let r=false;try{r=document.execCommand('copy')}catch(e){}ta.remove();toast(r?ok:'No se pudo copiar automáticamente')};
  try{navigator.clipboard.writeText(t).then(()=>toast(ok),fb)}catch(e){fb()}
}
function importJSON(txt){
  let o;try{o=JSON.parse(txt)}catch(e){toast('El texto no es un JSON válido');return}
  if(Array.isArray(o)){const ok=o.filter(x=>x&&D.clases[x.cls]&&D.origen.especies[x.species]&&D.origen.trasfondos[x.bg]);if(!ok.length){toast('Ese JSON no contiene personajes válidos');return}ok.forEach(x=>{const c=Object.assign(blank(),x);const i=roster.findIndex(r=>r.id===c.id);if(i>=0)roster[i]=c;else roster.push(c)});lsSet('forja-personajes',roster);panel=null;step='inicio';render();toast(ok.length+' personajes importados');return}
  if(!o||!D.clases[o.cls]||!D.origen.especies[o.species]||!D.origen.trasfondos[o.bg]){toast('Ese JSON no es un personaje de Forja de Héroes');return}
  ch=Object.assign(blank(),o);if(roster.some(r=>r.id===ch.id))ch.id=uid();
  panel=null;step='ficha';render();toast('Importado: '+(ch.name||'Sin nombre'));
}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('show'),2000)}
function randomize(){
  const c=blank();c.cls=pick(Object.keys(D.clases));c.lvl=1+Math.floor(Math.random()*10);c.species=pick(Object.keys(D.origen.especies));
  const pri=D.clases[c.cls].pri;c.bg=pick(Object.keys(D.origen.trasfondos).filter(k=>D.origen.trasfondos[k].ab.some(a=>pri.includes(a))));
  c.name=pick(NAMES);c.align=pick(ALIGN.slice(1));c.sub=c.lvl>=3?pick(D.subclases.subclases[c.cls]).id:'';suggestArr(c);
  ch=c;R.normalize(ch);
  R.skillPools(ch).forEach(p=>{const t=R.profSkills(ch);ch.sk[p.key]=p.from.filter(k=>!t.has(k)).sort(()=>Math.random()-.5).slice(0,p.n)});
  R.normalize(ch);
}

/* ---------- Eventos ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
  const a=b.dataset.act,k=b.dataset.k;
  if(a.startsWith('sp-')){if(Conjuros.act(ch,a,k,b)!==false)render();return}
  if(a!=='del')delArm=null;
  switch(a){
    case 'step':if(!ch)return;step=k;window.scrollTo({top:0});break;
    case 'cls':if(ch.cls!==k){ch.cls=k;ch.sub='';ch.order='';ch.feats={};ch.sk.cls=[];ch.ex={};ch.eqCls='A';ch.armor='auto';ch.spells={picks:[],book:[],disc:[]};if(ch.method==='array')suggestArr(ch)}break;
    case 'lv':ch.lvl=Math.max(1,Math.min(20,ch.lvl+ +b.dataset.d));break;
    case 'bgmode':ch.bgMode=k;break;
    case 'p2':ch.p2=k;if(ch.p1===k)ch.p1='';break;
    case 'p1':ch.p1=k;break;
    case 'method':ch.method=k;break;
    case 'suggest':suggestArr(ch);break;
    case 'pb':ch.pb[k]=Math.max(8,Math.min(15,ch.pb[k]+ +b.dataset.d));break;
    case 'roll':{const sets=[];for(let i=0;i<6;i++)sets.push([1,2,3,4].map(()=>dado(6)).sort((x,y)=>y-x));ch.roll={sets,asg:{}};rollSort();toast('¡Dados tirados!');break}
    case 'rsort':rollSort();break;
    case 'r2man':{const bb=R.base(ch);ch.man={...bb};ch.method='man';toast('Copiado a Manual');break}
    case 'r20':tirarD20(k,+b.dataset.b||0);return;
    case 'rdmg':tirarExpr(k,b.dataset.e||'');return;
    case 'rdie':{const n=+(($('#dcount')||{}).value||1),m=+(($('#dmod')||{}).value||0);tirarExpr(n+'d'+k,n+'d'+k+(m?(m>0?' + ':' − ')+Math.abs(m):''));return}
    case 'adv':advMode=k;document.querySelectorAll('[data-act="adv"]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.k===k));return;
    case 'rclear':rollLog=[];pintarLog();return;
    case 'sk':{const arr=ch.sk[b.dataset.p]=ch.sk[b.dataset.p]||[];const i=arr.indexOf(k);i>=0?arr.splice(i,1):arr.push(k);break}
    case 'ex':{const arr=ch.ex[b.dataset.p]=ch.ex[b.dataset.p]||[];const i=arr.indexOf(k);i>=0?arr.splice(i,1):arr.push(k);break}
    case 'featab1':ch.feats[b.dataset.s].ab=[k];break;
    case 'eqcls':ch.eqCls=k;ch.armor='auto';break;
    case 'eqbg':ch.eqBg=k;break;
    case 'new':ch=blank();suggestArr(ch);step='clase';toast('Personaje nuevo');break;
    case 'home':step='inicio';panel=null;window.scrollTo({top:0});break;
    case 'panel':panel=k||null;break;
    case 'load':{const r=roster.find(x=>x.id===k);if(r){ch=Object.assign(blank(),JSON.parse(JSON.stringify(r)));panel=null;step='ficha';toast('Abierto: '+(ch.name||'Sin nombre'))}break}
    case 'del':if(delArm===k){roster=roster.filter(r=>r.id!==k);lsSet('forja-personajes',roster);if(ch&&ch.id===k)ch=null;delArm=null;toast('Borrado')}else delArm=k;break;
    case 'dljson':if(!ch)return;descargar(fname(ch.name)+'.json',JSON.stringify(ch,null,1));return;
    case 'dltext':if(!ch)return;descargar(fname(ch.name)+'.txt',sheetText());return;
    case 'dlall':descargar('forja-personajes.json',JSON.stringify(roster,null,1));return;
    case 'copytext':if(!ch)return;copy(sheetText(),'Ficha copiada');return;
    case 'copyjson':if(!ch)return;copy(JSON.stringify(ch,null,1),'JSON copiado');return;
    case 'import':importJSON($('#imp').value);return;
    default:return;
  }
  render();
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role="button"][data-act]')){e.preventDefault();e.target.click()}});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='impfile'&&el.files&&el.files[0]){const fr=new FileReader();fr.onload=()=>importJSON(String(fr.result));fr.readAsText(el.files[0]);return}
  const f=el.dataset.f;if(!f)return;
  if(f==='arr'){const k=el.dataset.k,v=+el.value,old=ch.arr[k];const o=Object.keys(ch.arr).find(x=>x!==k&&ch.arr[x]===v);if(o)ch.arr[o]=old;ch.arr[k]=v}
  else if(f==='rasg'){const r=ch.roll,k=el.dataset.k,v=+el.value,old=r.asg[k];const o=Object.keys(r.asg).find(x=>x!==k&&+r.asg[x]===v);if(o)r.asg[o]=old;r.asg[k]=v}
  else if(f==='man')ch.man[el.dataset.k]=Math.max(3,Math.min(20,parseInt(el.value)||10));
  else if(f==='feat'){ch.feats[el.dataset.k]={id:el.value,ab:[]}}
  else if(f==='featab'){ch.feats[el.dataset.k].ab[+el.dataset.i]=el.value}
  else if(f==='book'){el.checked?books.add(el.value):books.delete(el.value);lsSet('forja-libros',[...books])}
  else if(f==='shield')ch.shield=el.checked;
  else if(f==='lvl')ch.lvl=+el.value;
  else if(f==='cls'){}
  else ch[f]=el.value;
  render();
});
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.id==='sp-q'){Conjuros.setQuery(el.value);const pos=el.selectionStart;render();const n=$('#sp-q');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}return}
  if(el.id==='f-name'){ch.name=el.value;if(step==='ficha'){const h=document.querySelector('.sh-head h2');if(h)h.textContent=ch.name||'Sin nombre'}else{const h=document.querySelector('.mini-h h2');if(h)h.textContent=ch.name||'Sin nombre'}saveCurrent();return}
  const t=el.dataset.t;if(!t||!ch)return;ch[t]=el.value;saveCurrent();
});

async function iniciar(){
  const [clases,subclases,origen,equipo,conjuros]=await Promise.all(['clases','subclases','origen','equipo','conjuros'].map(n=>cargar('data/'+n+'.json?v='+(window.FORJA_V||'1'))));
  D={clases,subclases,origen,equipo};R.init(D);Conjuros.init(conjuros,subclases);
  roster=lsGet('forja-personajes')||[];
  // Recupera un borrador de versiones anteriores si no estaba guardado (salvo el personaje de ejemplo)
  const draft=lsGet('forja-borrador');
  if(draft&&D.clases[draft.cls]&&!/Personaje de ejemplo/.test(draft.notes||'')&&!roster.some(r=>r.id===draft.id)){roster.unshift(Object.assign(blank(),draft));lsSet('forja-personajes',roster)}
  try{localStorage.removeItem('forja-borrador')}catch(e){}
  ch=null;step='inicio';
  render();
}
iniciar().catch(err=>{console.error(err);$('#stage').innerHTML=`<div class="panel"><p class="bad">No se pudieron cargar los datos (${esc(err.message)}). Si abres la página desde tu ordenador, sírvela con un servidor local en vez de abrir el archivo directamente.</p></div>`});
})();
