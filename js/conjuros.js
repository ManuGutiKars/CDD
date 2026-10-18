// Forja de Héroes · paso de conjuros
'use strict';
const Conjuros=(()=>{
const R=Reglas;
let SPELLS=[],BYID={},BYNAME={},SUBS={},LANDS={},LBL={};
const fold=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LVN=l=>l===0?'Trucos':'Nivel '+l;
const DISC_LISTS=['clerigo','druida','mago'];
const F={q:'',tab:'all',onlyPrep:false,onlyBook:false,onlyRit:false,noConc:false};
const open=new Set();

function init(spells,subs){
  SPELLS=spells;BYID=Object.fromEntries(SPELLS.map(s=>[s.id,s]));BYNAME=Object.fromEntries(SPELLS.map(s=>[fold(s.n),s]));
  SUBS=subs.subclases;LANDS=subs.tierras;LBL=subs.etiquetas;
}
const st=ch=>{ch.spells=ch.spells||{};['picks','book','disc'].forEach(k=>{if(!Array.isArray(ch.spells[k]))ch.spells[k]=[]});return ch.spells};
const sub=ch=>R.subOn(ch);

function grantedAll(ch){
  const s=R.subOf(ch);if(!s)return[];
  const g=s.land?s.gl[ch.land||'arid']:(s.g||[]);const out=[];
  for(const [at,names] of g)for(const raw of names){const [nm,lv]=raw.split('|');const sp=BYNAME[fold(nm)];out.push({n:sp?sp.n:nm,id:sp?sp.id:null,l:sp?sp.l:+lv,at,sp})}
  return out;
}
const granted=ch=>ch.lvl<3?[]:grantedAll(ch).filter(x=>x.at<=ch.lvl);

function rules(ch){
  const c=R.casterOf(ch);if(!c)return null;
  const L=ch.lvl,s=sub(ch);
  const extra=(ch.cls==='clerigo'&&ch.order==='taumaturgo')||(ch.cls==='druida'&&ch.order==='mago')?1:0;
  const r={c,list:c.list,cantrips:c.tr(L)+extra,prep:c.pr(L)};
  if(c.pact){const p=R.PACT(L);r.pact=p;r.slots=null;r.maxL=p.lv;r.arc=Object.keys(R.ARC).map(Number).filter(k=>L>=R.ARC[k])}
  else{r.slots=c.sl(L);r.maxL=r.slots.length;r.arc=[]}
  r.gr=granted(ch);r.gset=new Set(r.gr.filter(x=>x.id).map(x=>x.id));
  r.wiz=!!c.book;
  r.savant=r.wiz&&s&&s.school?2+(r.maxL-2):0;
  r.book=r.wiz?6+2*(L-1)+r.savant:0;
  r.disc=s&&s.disc&&L>=s.disc?2:0;
  r.lists=[r.list];if(ch.cls==='bardo'&&L>=10)r.lists=['bardo','clerigo','druida','mago'];
  return r;
}
const inLists=(s,R0)=>s.k.some(k=>R0.lists.includes(k));
function pool(sp,R0){if(sp.l===0)return 'cantrip';if(sp.l<=R0.maxL)return 'prep';if(R0.arc.includes(sp.l))return 'arc'+sp.l;return 'locked'}
function normalize(ch,R0){
  const S=st(ch);let p=S.picks.filter(id=>BYID[id]&&!R0.gset.has(id));
  if(R0.wiz){const b=new Set(S.book);p=p.filter(id=>BYID[id].l===0||b.has(id))}
  S.picks=p;S.disc=S.disc.filter(id=>BYID[id]&&!R0.gset.has(id));S.book=S.book.filter(id=>BYID[id]);
}
function counts(ch,R0){
  const S=st(ch),n={cantrip:0,prep:0,locked:0,book:0,disc:0};R0.arc.forEach(a=>n['arc'+a]=0);
  S.picks.forEach(id=>{const p=pool(BYID[id],R0);n[p]=(n[p]||0)+1});
  if(R0.wiz)n.book=S.book.length;
  if(R0.disc)n.disc=S.disc.length;
  return n;
}
const cap=(p,R0)=>p==='cantrip'?R0.cantrips:p==='prep'?R0.prep:p.startsWith('arc')?1:0;
function meter(k,have,max,x,soft){
  const s=have>max&&!soft?'over':have>=max&&max>0?'full':'';const w=max?Math.min(100,have/max*100):0;
  return `<div class="meter ${s}"><div class="top"><span class="k">${k}</span><span class="v">${have}<small> / ${max}</small></span></div><div class="bar"><i style="width:${w}%"></i></div><span class="x">${x}</span></div>`;
}
const left=(h,m,t)=>m-h>0?`Te quedan ${m-h}${t||''}`:h>m?`Te sobran ${h-m}`:'Completo'+(t||'');

function levels(ch,R0){
  const ls=new Set(SPELLS.filter(s=>inLists(s,R0)).map(s=>s.l));R0.gr.forEach(x=>{if(x.id)ls.add(x.l)});
  return [...ls].sort((a,b)=>a-b).filter(l=>l>0||R0.cantrips>0||R0.gr.some(x=>x.l===0&&x.id));
}
function unlockAt(ch,l){
  const c=R.casterOf(ch);if(c.pact){if(l>5)return R.ARC[l];for(let L=1;L<=20;L++)if(R.PACT(L).lv>=l)return L}
  for(let L=1;L<=20;L++)if(c.sl(L).length>=l)return L;return null;
}
const tags=s=>`${s.r?'<span class="tg r" title="Ritual">R</span>':''}${s.cc?'<span class="tg c" title="Concentración">C</span>':''}${s.src&&window.ForjaLibros?`<span class="tg f" title="${esc(s.src)}">${esc(window.ForjaLibros.short(s.src))}</span>`:''}`;
const detail=s=>`<div class="det"><div class="flds"><div><span>Tiempo</span> ${esc(s.t)}${s.r?' (o ritual)':''}</div><div><span>Alcance</span> ${esc(s.a)}</div><div><span>Componentes</span> ${esc(s.co)}</div><div><span>Duración</span> ${esc(s.du)}</div></div><div>${s.e}</div>${s.u?`<div class="up">${s.u}</div>`:''}${s.ci?`<div class="up">${s.ci}</div>`:''}</div>`;
const nameBtn=(s,x)=>`<button class="nm" data-act="sp-open" data-k="${s.id}" aria-expanded="${open.has(s.id)}"><span class="dot" style="background:${s.c}"></span><b>${esc(s.n)}</b>${tags(s)}<span class="sch">${s.s}</span>${x||''}</button>`;
function pass(ch,s,q,R0){
  const S=st(ch);
  if(q&&!fold(s.n+' '+s.s).includes(q))return false;
  if(window.ForjaLibros&&!window.ForjaLibros.ok(s.src)&&!R0.gset.has(s.id)&&!S.picks.includes(s.id)&&!S.book.includes(s.id)&&!S.disc.includes(s.id))return false;
  if(F.onlyRit&&!s.r)return false;if(F.noConc&&s.cc)return false;
  if(F.onlyPrep&&!(R0.gset.has(s.id)||S.picks.includes(s.id)||S.disc.includes(s.id)))return false;
  if(F.onlyBook&&!(S.book.includes(s.id)||s.l===0&&S.picks.includes(s.id)))return false;
  return true;
}

function render(ch,el,sheet){
  const R0=rules(ch);
  if(!R0){
    const s=R.subOf(ch),cast=s&&s.caster;
    el.innerHTML=`<div class="panel"><h2 class="ph2">Conjuros</h2><p class="muted">${cast?`Tu ${esc(s.n)} lanza conjuros a partir del nivel 3.`:`El ${esc(R.cls(ch).n.toLowerCase())} no lanza conjuros por su clase.`}${ch.cls==='guerrero'||ch.cls==='picaro'?' Si eliges la subclase '+(ch.cls==='guerrero'?'Caballero Arcano':'Embaucador Arcano')+' a partir del nivel 3, podrás elegir conjuros de mago aquí.':''} Los conjuros que te dé tu especie o una dote aparecen en sus rasgos.</p></div>`;
    return;
  }
  normalize(ch,R0);const N=counts(ch,R0),S=st(ch);
  let b='';
  if(R0.cantrips)b+=meter('Trucos',N.cantrip,R0.cantrips,left(N.cantrip,R0.cantrips));
  if(R0.wiz)b+=meter('Libro de conjuros',N.book,R0.book,N.book<R0.book?`Te quedan ${R0.book-N.book} gratis · niveles 1 a ${R0.maxL}`:'Gratis completos. Copiar más: 50 po y 2 h por nivel',true);
  b+=meter('Conjuros preparados',N.prep,R0.prep,left(N.prep,R0.prep,` · niveles 1 a ${R0.maxL}`)+(R0.wiz?' · desde tu libro':''));
  if(R0.arc.length){const a=R0.arc.reduce((x,k)=>x+N['arc'+k],0);b+=meter('Arcanos místicos',a,R0.arc.length,'Uno por nivel: '+R0.arc.join(', '))}
  if(R0.disc)b+=meter('Descubrimientos mágicos',N.disc,R0.disc,left(N.disc,R0.disc,' · de Clérigo, Druida o Mago'));
  const slotsH=R0.pact?`<div class="slots"><div class="slot"><span class="sl">Nivel ${R0.pact.lv}</span><span class="pips">${'<i></i>'.repeat(R0.pact.n)}</span></div></div>`
    :`<div class="slots">${R0.slots.map((n,i)=>`<div class="slot"><span class="sl">Nv ${i+1}</span><span class="pips">${'<i></i>'.repeat(n)}</span></div>`).join('')}</div>`;
  b+=`<div class="meter"><div class="top"><span class="k">${R0.pact?'Espacios de pacto':'Espacios de conjuro'}</span><span class="v">${R0.pact?R0.pact.n:R0.slots.reduce((a,b)=>a+b,0)}</span></div>${slotsH}<span class="x">CD ${sheet.spell.dc} · ataque ${R.sg(sheet.spell.atk)} · ${R.ABF[sheet.spell.ab]}</span></div>`;
  const notes=[];
  if(R0.wiz)notes.push(`Marca <b>Libro</b> para los conjuros aprendidos y <b>Prep.</b> para los que preparas. Solo puedes preparar los de tu libro.${R0.savant?` Tu escuela te da ${R0.savant} conjuros gratis (ya sumados).`:''}`);
  if(R0.gr.length)notes.push(`Tu subclase te da <b>${R0.gr.length} conjuros siempre preparados</b> que no cuentan para tu límite.`);
  if(R0.lists.length>1)notes.push('Secretos mágicos: puedes elegir también de las listas de Clérigo, Druida y Mago.');
  if(R0.c.third)notes.push('Lanzador de un tercio: usas la lista de mago.');

  // Lista
  const q=fold(F.q.trim()),P=new Set(S.picks),B=new Set(S.book);
  const filtering=q||F.onlyPrep||F.onlyBook||F.onlyRit||F.noConc;
  let ls=levels(ch,R0);
  if(F.tab!=='all'&&F.tab!=='disc'&&!ls.includes(+F.tab))F.tab='all';if(F.tab==='disc'&&!R0.disc)F.tab='all';
  const tabs=`<button class="tab" data-act="sp-tab" data-k="all" aria-pressed="${F.tab==='all'}">Disponibles</button>`+ls.map(l=>{const lk=l>0&&l>R0.maxL&&!R0.arc.includes(l);return `<button class="tab ${lk?'locked':''}" data-act="sp-tab" data-k="${l}" aria-pressed="${String(F.tab)===String(l)}">${l===0?'Trucos':l}</button>`}).join('')+(R0.disc?`<button class="tab" data-act="sp-tab" data-k="disc" aria-pressed="${F.tab==='disc'}">Descubrimientos</button>`:'');
  let h='';
  if(F.tab!=='disc'){
    let L2=F.tab==='all'?ls.filter(l=>l===0||l<=R0.maxL||R0.arc.includes(l)):[+F.tab];
    for(const l of L2){
      const seen=new Set();let arr=[];
      R0.gr.filter(x=>x.id&&x.l===l).forEach(x=>{if(!seen.has(x.id)){seen.add(x.id);arr.push(x.sp)}});
      SPELLS.filter(s=>s.l===l&&inLists(s,R0)).forEach(s=>{if(!seen.has(s.id)){seen.add(s.id);arr.push(s)}});
      arr.sort((a,b)=>(R0.gset.has(b.id)-R0.gset.has(a.id))||a.n.localeCompare(b.n,'es'));
      arr=arr.filter(s=>pass(ch,s,q,R0));
      if(!arr.length&&filtering)continue;
      const locked=l>0&&l>R0.maxL&&!R0.arc.includes(l);
      const p=l===0?'cantrip':locked?'locked':l<=R0.maxL?'prep':'arc'+l;
      const full=!locked&&N[p]>=cap(p,R0),two=R0.wiz&&l>0&&!p.startsWith('arc');
      const subt=l===0?`${N.cantrip} de ${R0.cantrips} elegidos`:locked?`Se desbloquea a nivel ${unlockAt(ch,l)}`:p.startsWith('arc')?'Arcano místico · elige 1':R0.wiz?'Libro y preparados':'Cuentan para tus preparados';
      h+=`<div class="grp"><div class="grp-h"><h3>${LVN(l)}</h3><span>${subt}</span></div>`;
      if(two&&arr.length)h+=`<div class="colh"><span>Libro</span><span>Prep.</span><span></span></div>`;
      if(!arr.length)h+='<p class="muted">No hay conjuros de este nivel en tu lista.</p>';
      for(const s of arr){
        const g=R0.gset.has(s.id),on=P.has(s.id),inB=B.has(s.id);let ck,cl='';
        if(g){ck=(two?'<span class="ckph"></span>':'')+'<span class="ckph" title="Siempre preparado">✓</span>';cl='gr'}
        else if(two){const bdis=!inB&&locked,pdis=!on&&(!inB||locked||full);
          ck=`<input type="checkbox" id="cb-${s.id}" data-act="sp-book" data-k="${s.id}" ${inB?'checked':''} ${bdis?'disabled':''} aria-label="${esc(s.n)} en el libro"><input type="checkbox" id="ck-${s.id}" data-act="sp-pick" data-k="${s.id}" ${on?'checked':''} ${pdis?'disabled':''} aria-label="Preparar ${esc(s.n)}">`;
          cl=(on?'on':'')+(!inB&&locked?' dim':'')}
        else{const dis=!on&&(locked||full);ck=`<input type="checkbox" id="ck-${s.id}" data-act="sp-pick" data-k="${s.id}" ${on?'checked':''} ${dis?'disabled':''} aria-label="Elegir ${esc(s.n)}">`;cl=(on?'on':'')+(dis?' dim':'')}
        h+=`<div class="sp ${cl}"><div class="sp-row ${two?'two':''}">${ck}${nameBtn(s,g?'<span class="lockb">Subclase</span>':'')}<span class="meta">${esc(s.t.split(',')[0])}</span></div>${open.has(s.id)?detail(s):''}</div>`;
      }
      h+='</div>';
    }
  }
  if(R0.disc&&(F.tab==='all'||F.tab==='disc')){
    const Dd=new Set(S.disc),full=Dd.size>=R0.disc;
    let arr=SPELLS.filter(s=>(s.l===0||s.l<=R0.maxL)&&s.k.some(k=>DISC_LISTS.includes(k))&&!s.k.includes('bardo')&&!R0.gset.has(s.id)).filter(s=>pass(ch,s,q,R0)).sort((a,b)=>a.l-b.l||a.n.localeCompare(b.n,'es'));
    if(arr.length||!filtering){h+=`<div class="grp"><div class="grp-h"><h3>Descubrimientos mágicos</h3><span>${Dd.size} de ${R0.disc} · siempre preparados</span></div>`;
      for(const s of arr){const on=Dd.has(s.id),dis=!on&&full;h+=`<div class="sp ${on?'on':''} ${dis?'dim':''}"><div class="sp-row"><input type="checkbox" id="cd-${s.id}" data-act="sp-disc" data-k="${s.id}" ${on?'checked':''} ${dis?'disabled':''} aria-label="Elegir ${esc(s.n)}">${nameBtn(s)}<span class="meta">${LVN(s.l)}</span></div>${open.has(s.id)?detail(s):''}</div>`}
      h+='</div>'}
  }
  if(!h)h=`<p class="muted">${F.onlyPrep?'Aún no tienes conjuros preparados.':'Ningún conjuro coincide con la búsqueda.'}</p>`;

  // Selección
  const sorted=ids=>ids.map(id=>BYID[id]).filter(Boolean).sort((a,b)=>a.l-b.l||a.n.localeCompare(b.n,'es'));
  const items=[...sorted(S.picks).map(s=>({s,t:'sp-pick'})),...(R0.disc?sorted(S.disc).map(s=>({s,t:'sp-disc'})):[]),...R0.gr.map(x=>({s:x.sp||{n:x.n,l:x.l,c:'var(--muted)'},t:'gr'}))];
  const BO=R0.wiz?sorted(S.book.filter(id=>!S.picks.includes(id))):[];
  const warns=[];
  if(N.cantrip>R0.cantrips)warns.push(`Te sobran ${N.cantrip-R0.cantrips} trucos.`);
  if(N.prep>R0.prep)warns.push(`Te sobran ${N.prep-R0.prep} conjuros preparados.`);
  if(N.locked)warns.push(`${N.locked} conjuro${N.locked>1?'s son':' es'} de un nivel que aún no puedes lanzar.`);
  if(R0.disc&&N.disc>R0.disc)warns.push(`Te sobran ${N.disc-R0.disc} descubrimientos.`);
  R0.arc.forEach(a=>{if(N['arc'+a]>1)warns.push(`Solo un Arcano místico de nivel ${a}.`)});
  let side=`<div class="side-h"><h3>Tu selección</h3><button class="btn small" data-act="sp-clear" id="sp-clear" ${items.length+BO.length?'':'disabled'}>Vaciar</button></div>`;
  if(warns.length)side+=`<div class="warn">${warns.join(' ')} Quita los que sobran.</div>`;
  if(!items.length&&!BO.length)side+='<p class="muted">Marca la casilla de un conjuro para añadirlo.</p>';
  const g={};items.forEach(it=>(g[it.s.l]=g[it.s.l]||[]).push(it));
  for(const l of Object.keys(g).map(Number).sort((a,b)=>a-b)){
    side+=`<div class="sel-g"><h4>${LVN(l)}</h4><ul>${g[l].sort((a,b)=>a.s.n.localeCompare(b.s.n,'es')).map(it=>{const s=it.s,bad=it.t==='sp-pick'&&pool(s,R0)==='locked';
      const tag=it.t==='gr'?'<span class="lockb">Subclase</span>':it.t==='sp-disc'?'<span class="tg f">Descubr.</span>':'';
      const btn=it.t==='gr'?'<span class="rmph"></span>':`<button class="rm" data-act="${it.t}" data-k="${s.id}" aria-label="Quitar ${esc(s.n)}">×</button>`;
      return `<li class="${bad?'bad':''}"><span class="dot" style="background:${s.c}"></span><span class="sn">${esc(s.n)}</span>${tag}${btn}</li>`}).join('')}</ul></div>`;
  }
  if(BO.length)side+=`<div class="sel-g"><h4>En el libro, sin preparar</h4><ul>${BO.map(s=>`<li class="${s.l>R0.maxL?'bad':''}"><span class="dot" style="background:${s.c}"></span><span class="sn">${esc(s.n)} <span class="muted small">${LVN(s.l)}</span></span><button class="rm" data-act="sp-book" data-k="${s.id}" aria-label="Quitar ${esc(s.n)} del libro">×</button></li>`).join('')}</ul></div>`;

  el.innerHTML=`<div class="budget">${b}</div>${notes.length?`<div class="notes">${notes.map(n=>`<span>${n}</span>`).join('')}</div>`:''}
  <div class="sp-layout"><section style="min-width:0">
    <div class="filters"><div class="frow">
      <input class="search" type="search" id="sp-q" placeholder="Buscar conjuro o escuela…" autocomplete="off" aria-label="Buscar conjuro" value="${esc(F.q)}">
      <button class="tog" data-act="sp-tog" data-k="onlyPrep" aria-pressed="${F.onlyPrep}">Solo preparados</button>
      ${R0.wiz?`<button class="tog" data-act="sp-tog" data-k="onlyBook" aria-pressed="${F.onlyBook}">Solo en el libro</button>`:''}
      <button class="tog" data-act="sp-tog" data-k="onlyRit" aria-pressed="${F.onlyRit}">Rituales</button>
      <button class="tog" data-act="sp-tog" data-k="noConc" aria-pressed="${F.noConc}">Sin concentración</button>
    </div><div class="tabs" role="group" aria-label="Nivel de conjuro">${tabs}</div></div>
    <div id="sp-list">${h}</div></section>
    <aside class="sp-side">${side}</aside></div>`;
}
let clearArm=false;
function act(ch,a,k,btn){
  const S=st(ch);const tg=(arr,k)=>{const i=arr.indexOf(k);if(i>=0)arr.splice(i,1);else arr.push(k)};
  if(a!=='sp-clear')clearArm=false;
  if(a==='sp-tab')F.tab=k;
  else if(a==='sp-tog')F[k]=!F[k];
  else if(a==='sp-open')open.has(k)?open.delete(k):open.add(k);
  else if(a==='sp-pick')tg(S.picks,k);
  else if(a==='sp-book'){tg(S.book,k);if(!S.book.includes(k))S.picks=S.picks.filter(x=>x!==k)}
  else if(a==='sp-disc')tg(S.disc,k);
  else if(a==='sp-clear'){if(!clearArm){clearArm=true;btn.textContent='¿Seguro?';return false}S.picks=[];S.book=[];S.disc=[];clearArm=false}
  return true;
}
function summary(ch){
  const R0=rules(ch);if(!R0)return null;normalize(ch,R0);const S=st(ch);
  const g={};[...S.picks,...(R0.disc?S.disc:[])].map(id=>BYID[id]).filter(Boolean).forEach(s=>(g[s.l]=g[s.l]||[]).push(s.n));
  R0.gr.forEach(x=>(g[x.l]=g[x.l]||[]).push(x.n+' ★'));
  const lines=Object.keys(g).map(Number).sort((a,b)=>a-b).map(l=>[LVN(l),g[l].sort((a,b)=>a.localeCompare(b,'es'))]);
  const book=R0.wiz?S.book.filter(id=>!S.picks.includes(id)).map(id=>BYID[id]).filter(Boolean).map(s=>s.n):[];
  return {lines,book,slots:R0.pact?`${R0.pact.n} espacios de pacto de nivel ${R0.pact.lv}`:R0.slots.map((n,i)=>`Nv${i+1}×${n}`).join(' · ')};
}
function setQuery(v){F.q=v}
return {init,render,act,summary,rules,setQuery,LBL:()=>LBL,LANDS:()=>LANDS};
})();
