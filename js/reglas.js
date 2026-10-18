// Forja de Héroes · reglas y cálculo de la ficha (D&D 2024)
'use strict';
const Reglas=(()=>{
const ABS=[['str','FUE','Fuerza'],['dex','DES','Destreza'],['con','CON','Constitución'],['int','INT','Inteligencia'],['wis','SAB','Sabiduría'],['cha','CAR','Carisma']];
const AB=Object.fromEntries(ABS.map(a=>[a[0],a[1]])), ABF=Object.fromEntries(ABS.map(a=>[a[0],a[2]]));
const SK=[['acrobatics','Acrobacias','dex'],['arcana','Arcanos','int'],['athletics','Atletismo','str'],['deception','Engaño','cha'],['history','Historia','int'],['performance','Interpretación','cha'],['intimidation','Intimidación','cha'],['investigation','Investigación','int'],['sleight','Juego de Manos','dex'],['medicine','Medicina','wis'],['nature','Naturaleza','int'],['perception','Percepción','wis'],['insight','Perspicacia','wis'],['persuasion','Persuasión','cha'],['religion','Religión','int'],['stealth','Sigilo','dex'],['survival','Supervivencia','wis'],['animal','Trato con Animales','wis']];
const SKN=Object.fromEntries(SK.map(s=>[s[0],s[1]])), SKA=Object.fromEntries(SK.map(s=>[s[0],s[2]])), ALLSK=SK.map(s=>s[0]);
const ARRAY=[15,14,13,12,10,8], PBC={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
const md=v=>Math.floor((v-10)/2), sg=n=>n>=0?'+'+n:'−'+Math.abs(n);
const pbOf=L=>2+Math.floor((L-1)/4);
const m=p=>String(Math.round(p*0.3*10)/10).replace('.',',')+' m';

// ---- Conjuros ----
const FULL=[[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
const HALF=[[2],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],[4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
const THIRD=[[],[],[2],[3],[3],[3],[4,2],[4,2],[4,2],[4,3],[4,3],[4,3],[4,3,2],[4,3,2],[4,3,2],[4,3,3],[4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1]];
const PREP_FULL=[4,5,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22];
const PREP_HALF=[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];
const PREP_THIRD=[0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13];
const C3=l=>l<4?0:l<10?1:2;
const CASTER={
  bardo:{list:'bardo',ab:'cha',tr:l=>2+C3(l),pr:l=>PREP_FULL[l-1],sl:l=>FULL[l-1]},
  brujo:{list:'brujo',ab:'cha',tr:l=>2+C3(l),pr:l=>[2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15][l-1],pact:true},
  clerigo:{list:'clerigo',ab:'wis',tr:l=>3+C3(l),pr:l=>PREP_FULL[l-1],sl:l=>FULL[l-1]},
  druida:{list:'druida',ab:'wis',tr:l=>2+C3(l),pr:l=>PREP_FULL[l-1],sl:l=>FULL[l-1]},
  explorador:{list:'explorador',ab:'wis',tr:()=>0,pr:l=>PREP_HALF[l-1],sl:l=>HALF[l-1]},
  hechicero:{list:'hechicero',ab:'cha',tr:l=>4+C3(l),pr:l=>[2,4,6,7,9,10,11,12,14,15,16,16,17,17,18,18,19,20,21,22][l-1],sl:l=>FULL[l-1]},
  mago:{list:'mago',ab:'int',tr:l=>3+C3(l),pr:l=>[4,5,6,7,9,10,11,12,14,15,16,16,17,18,19,21,22,23,24,25][l-1],sl:l=>FULL[l-1],book:true},
  paladin:{list:'paladin',ab:'cha',tr:()=>0,pr:l=>PREP_HALF[l-1],sl:l=>HALF[l-1]},
  artifice:{list:'artifice',ab:'int',tr:l=>l<10?2:l<14?3:4,pr:l=>PREP_HALF[l-1],sl:l=>HALF[l-1]},
  'guerrero:arcano':{list:'mago',ab:'int',tr:l=>l<3?0:l<10?2:3,pr:l=>PREP_THIRD[l-1],sl:l=>THIRD[l-1],third:true},
  'picaro:arcano':{list:'mago',ab:'int',tr:l=>l<3?0:l<10?3:4,pr:l=>PREP_THIRD[l-1],sl:l=>THIRD[l-1],third:true}
};
const PACT=l=>({n:l<2?1:l<11?2:l<17?3:4, lv:Math.min(5,Math.ceil(l/2))});
const ARC={6:11,7:13,8:15,9:17};
function casterOf(ch){
  const k=CASTER[ch.cls]?ch.cls:CASTER[ch.cls+':'+ch.sub]&&ch.lvl>=3?ch.cls+':'+ch.sub:null;
  return k?Object.assign({key:k},CASTER[k]):null;
}

// ---- Utilidades de datos ----
let D=null;
function init(data){D=data;D.armaByN=Object.fromEntries(D.equipo.armas.map(a=>[a.n,a]));D.armorByN=Object.fromEntries(D.equipo.armaduras.map(a=>[a.n,a]));}
const cls=ch=>D.clases[ch.cls];
const subOf=ch=>(D.subclases.subclases[ch.cls]||[]).find(s=>s.id===ch.sub)||null;
const subOn=ch=>ch.lvl>=3?subOf(ch):null;

// Huecos de dote por nivel: mejoras de característica, don épico y estilos de combate
function featSlots(ch){
  const c=cls(ch),L=ch.lvl,out=[];
  c.asi.forEach(l=>{if(l<=L)out.push({key:'asi'+l,lvl:l,cats:['general'],label:'Nivel '+l})});
  if(L>=19)out.push({key:'epica',lvl:19,cats:['epica','general'],label:'Nivel 19 · Don épico'});
  if(c.style&&L>=c.style)out.push({key:'estilo',lvl:c.style,cats:['estilo'],label:'Nivel '+c.style+' · Estilo de combate'});
  const s=subOn(ch);if(s&&s.id==='campeon'&&L>=7)out.push({key:'estilo2',lvl:7,cats:['estilo'],label:'Nivel 7 · Estilo adicional'});
  return out;
}
function featsTaken(ch){
  const bg=D.origen.trasfondos[ch.bg];
  const list=[{key:'bg',id:(bg.fOpts&&bg.fOpts.includes(ch.bgFeat))?ch.bgFeat:bg.f,src:'Trasfondo'}];
  if(D.origen.especies[ch.species].feat)list.push({key:'hum',id:ch.feat2||'duro',src:'Humano'});
  featSlots(ch).forEach(s=>{const v=(ch.feats||{})[s.key];if(v&&v.id&&D.origen.dotes[v.id])list.push({key:s.key,id:v.id,src:s.label,ab:v.ab||[]})});
  return list;
}

// ---- Características ----
function base(ch){if(ch.method==='roll'){const r=ch.roll||{},o={};ABS.forEach(([a])=>{const t=r.sets&&r.asg?r.sets[r.asg[a]]:null;o[a]=t?t[0]+t[1]+t[2]:10});return o}
  return ch.method==='array'?ch.arr:ch.method==='pb'?ch.pb:ch.man}
function abilities(ch){
  const b=base(ch),bg=D.origen.trasfondos[ch.bg],sc={},bon={str:0,dex:0,con:0,int:0,wis:0,cha:0};
  if(ch.bgMode==='111')bg.ab.forEach(a=>bon[a]+=1);else{bon[ch.p2]+=2;bon[ch.p1]+=1}
  ABS.forEach(([a])=>sc[a]=Math.min(20,(+b[a]||0)+bon[a]));
  const gen={},epi={};
  featsTaken(ch).forEach(f=>{const d=D.origen.dotes[f.id];if(!f.ab)return;
    if(d.asi){(f.ab||[]).forEach(a=>{if(a)gen[a]=(gen[a]||0)+1})}
    else if(d.ab){const a=f.ab[0];if(a&&d.ab.includes(a)){(d.cat==='epica'?epi:gen)[a]=((d.cat==='epica'?epi:gen)[a]||0)+1}}});
  ABS.forEach(([a])=>{sc[a]=Math.min(20,sc[a]+(gen[a]||0))});
  if(ch.cls==='barbaro'&&ch.lvl>=20){sc.str=Math.min(25,sc.str+4);sc.con=Math.min(25,sc.con+4)}
  if(ch.cls==='monje'&&ch.lvl>=20){sc.dex=Math.min(25,sc.dex+4);sc.wis=Math.min(25,sc.wis+4)}
  ABS.forEach(([a])=>{sc[a]=Math.min(30,sc[a]+(epi[a]||0))});
  const mo={};ABS.forEach(([a])=>mo[a]=md(sc[a]));
  return {sc,mo,bon,base:b};
}

// ---- Habilidades ----
function skillPools(ch){
  const c=cls(ch),sp=D.origen.especies[ch.species],P=[];
  P.push({key:'cls',label:'Clase · '+c.n,n:c.sk.n,from:c.sk.from==='all'?ALLSK:c.sk.from});
  if(sp.skill)P.push({key:'sp',label:'Especie · '+sp.n,n:sp.skillN||1,from:sp.skill==='all'?ALLSK:sp.skill});
  if(ch.cls==='barbaro'&&ch.lvl>=3)P.push({key:'barb3',label:'Conocimiento primigenio',n:1,from:c.sk.from});
  const s=subOn(ch);
  if(s&&s.id==='saber')P.push({key:'saber',label:'Colegio del Saber',n:3,from:ALLSK});
  if(s&&s.id==='batalla')P.push({key:'batalla',label:'Estudiante de la guerra',n:1,from:D.clases.guerrero.sk.from});
  if(s&&s.skills)P.push({key:'sub',label:s.n+(s.skills.exp?' (con pericia)':''),n:s.skills.n,from:s.skills.from});
  featsTaken(ch).forEach(f=>{const fx=D.origen.dotes[f.id].fx||{};if(fx.skills)P.push({key:'f:'+f.key,label:'Dote · '+D.origen.dotes[f.id].n+' ('+String(f.src).toLowerCase()+')',n:fx.skills,from:fx.from||ALLSK})});
  return P;
}
function fixedSkills(ch){
  const fx=new Set(D.origen.trasfondos[ch.bg].sk);
  const s=subOn(ch);if(s&&s.id==='misericordia'){fx.add('insight');fx.add('medicine')}
  featsTaken(ch).forEach(f=>((D.origen.dotes[f.id].fx||{}).fixedSk||[]).forEach(k=>fx.add(k)));
  return fx;
}
function expertisePools(ch){
  const c=cls(ch),P=[];
  (c.exp||[]).forEach(([l,n,from],i)=>{if(ch.lvl>=l)P.push({key:'c'+i,label:c.n+' · nivel '+l,n,from:from||null})});
  featsTaken(ch).forEach(f=>{const fx=D.origen.dotes[f.id].fx||{};if(fx.expertise)P.push({key:'f:'+f.key,label:'Dote · '+D.origen.dotes[f.id].n+' ('+String(f.src).toLowerCase()+')',n:fx.expertise,from:null})});
  return P;
}
function profSkills(ch){
  const set=fixedSkills(ch);
  skillPools(ch).forEach(p=>((ch.sk||{})[p.key]||[]).forEach(k=>set.add(k)));
  if(featsTaken(ch).some(f=>(D.origen.dotes[f.id].fx||{}).allSkills))ALLSK.forEach(k=>set.add(k));
  return set;
}
// Limpia selecciones que ya no son válidas
function normalize(ch){
  const bg=D.origen.trasfondos[ch.bg],c=cls(ch);
  if(!bg.ab.includes(ch.p2))ch.p2=bg.ab.includes(c.pri[0])?c.pri[0]:bg.ab[0];
  if(!bg.ab.includes(ch.p1)||ch.p1===ch.p2)ch.p1=bg.ab.find(a=>a!==ch.p2);
  const sp=D.origen.especies[ch.species];
  if(sp.sub&&!sp.sub.o.some(o=>o.id===ch.spSub))ch.spSub=sp.sub.o[0].id;
  if(!sp.sub)ch.spSub='';
  if(!D.origen.dotes[ch.feat2]||D.origen.dotes[ch.feat2].cat!=='origen')ch.feat2='duro';
  if(!(bg.fOpts&&bg.fOpts.includes(ch.bgFeat)))ch.bgFeat=bg.f;
  if(ch.sub&&!(D.subclases.subclases[ch.cls]||[]).some(s=>s.id===ch.sub))ch.sub='';
  // dotes en huecos
  ch.feats=ch.feats||{};
  const slots=featSlots(ch),keys=new Set(slots.map(s=>s.key));
  Object.keys(ch.feats).forEach(k=>{if(!keys.has(k))delete ch.feats[k]});
  slots.forEach(s=>{const v=ch.feats[s.key];if(!v||!D.origen.dotes[v.id]||!s.cats.includes(D.origen.dotes[v.id].cat))ch.feats[s.key]={id:s.cats[0]==='estilo'?'defensa':s.cats[0]==='epica'?'don-fortaleza':'mejora',ab:[]};
    const v2=ch.feats[s.key],d=D.origen.dotes[v2.id];
    if(d.asi){v2.ab=[v2.ab[0]||c.pri[0],v2.ab[1]||v2.ab[0]||c.pri[0]]}
    else if(d.ab){if(!d.ab.includes(v2.ab[0]))v2.ab=[d.ab.includes(c.pri[0])?c.pri[0]:d.ab[0]]}
    else v2.ab=[];
  });
  // habilidades
  ch.sk=ch.sk||{};const taken=fixedSkills(ch);
  const pools=skillPools(ch),pk=new Set(pools.map(p=>p.key));
  Object.keys(ch.sk).forEach(k=>{if(!pk.has(k))delete ch.sk[k]});
  pools.forEach(p=>{ch.sk[p.key]=(ch.sk[p.key]||[]).filter(k=>p.from.includes(k)&&!taken.has(k)).slice(0,p.n);ch.sk[p.key].forEach(k=>taken.add(k))});
  const prof=profSkills(ch);
  ch.ex=ch.ex||{};const ep=expertisePools(ch),ek=new Set(ep.map(p=>p.key)),usedEx=new Set();
  Object.keys(ch.ex).forEach(k=>{if(!ek.has(k))delete ch.ex[k]});
  ep.forEach(p=>{ch.ex[p.key]=(ch.ex[p.key]||[]).filter(k=>prof.has(k)&&(!p.from||p.from.includes(k))&&!usedEx.has(k)).slice(0,p.n);ch.ex[p.key].forEach(k=>usedEx.add(k))});
  if(!c.eq.some(o=>o.id===ch.eqCls))ch.eqCls='A';
  if(!['A','B'].includes(ch.eqBg))ch.eqBg='A';
}

// ---- Equipo ----
function inventory(ch){
  const c=cls(ch),bg=D.origen.trasfondos[ch.bg],o=c.eq.find(x=>x.id===ch.eqCls)||c.eq[0];
  const items=[];let po=o.po;
  o.items.forEach(([n,q])=>items.push({n,q,src:'Clase'}));
  if(ch.eqBg==='A'){bg.eq.forEach(([n,q])=>items.push({n,q,src:'Trasfondo'}));po+=bg.po}else po+=50;
  const merged=[];items.forEach(it=>{const e=merged.find(x=>x.n===it.n);if(e)e.q+=it.q;else merged.push({...it})});
  return {items:merged,po};
}
function armorProf(ch){
  const set=new Set(cls(ch).armCat);
  if(ch.cls==='clerigo'&&ch.order==='protector')set.add('pesada');
  if(ch.cls==='druida'&&ch.order==='guardian')set.add('media');
  const s=subOn(ch);if(s&&s.id==='valor'){set.add('media');set.add('escudo')}
  featsTaken(ch).forEach(f=>{const a=(D.origen.dotes[f.id].fx||{}).armor;if(a==='ligera'){set.add('ligera');set.add('escudo')}if(a==='media')set.add('media');if(a==='pesada')set.add('pesada');});
  return set;
}
function weaponProf(ch,w){
  const c=cls(ch);
  if(w.cat==='sencilla')return true;
  if(c.wCat==='todas')return true;
  if((ch.cls==='clerigo'&&ch.order==='protector')||(ch.cls==='druida'&&ch.order==='guardian'))return true;
  const s=subOn(ch);if(s&&s.id==='valor')return true;
  if(featsTaken(ch).some(f=>f.id==='entrenamiento-marcial'))return true;
  if(c.wCat==='monje')return w.p.includes('Ligera');
  if(c.wCat==='picaro')return w.p.includes('Ligera')||w.p.includes('Sutil');
  return false;
}
function gear(ch){
  const inv=inventory(ch),ap=armorProf(ch);
  const armors=inv.items.map(i=>D.armorByN[i.n]).filter(a=>a&&a.cat!=='escudo');
  const hasShield=inv.items.some(i=>i.n==='Escudo');
  let armor=null;
  if(ch.armor==='none')armor=null;
  else if(ch.armor&&ch.armor!=='auto')armor=armors.find(a=>a.n===ch.armor)||null;
  else armor=armors.filter(a=>ap.has(a.cat)).sort((a,b)=>b.ca-a.ca)[0]||null;
  const shield=hasShield&&ch.shield!==false;
  return {inv,armors,armor,hasShield,shield,ap};
}

// ---- Ficha completa ----
function sheet(ch){
  normalize(ch);
  const c=cls(ch),L=ch.lvl,pb=pbOf(L),sp=D.origen.especies[ch.species],bg=D.origen.trasfondos[ch.bg];
  const {sc,mo,bon}=abilities(ch);const s=subOn(ch);
  const feats=featsTaken(ch),fx=k=>feats.reduce((a,f)=>a+((D.origen.dotes[f.id].fx||{})[k]||0),0);
  const spSub=sp.sub?sp.sub.o.find(o=>o.id===ch.spSub):null;
  // PG
  const avg=c.hd/2+1;let hp=Math.max(1,c.hd+mo.con)+Math.max(1,avg+mo.con)*(L-1);
  if(sp.hpPerLvl)hp+=sp.hpPerLvl*L;
  hp+=fx('hpPerLvl')*L+fx('hpFlat');
  if(s&&s.id==='draconico')hp+=L;
  // CA
  const g=gear(ch);let ac,acn;
  const shieldOk=g.shield&&g.ap.has('escudo');
  if(g.armor){
    let mx=g.armor.maxDex;if(g.armor.cat==='media'&&feats.some(f=>f.id==='maestro-armadura-media'))mx=3;
    ac=g.armor.ca+(mx===null?mo.dex:Math.min(mo.dex,mx));acn=g.armor.n;
    if(fx('acArmor'))ac+=fx('acArmor');
  }else{
    const opts=[[10+mo.dex,'Sin armadura',true]];
    if(c.ud==='con')opts.push([10+mo.dex+mo.con,'Defensa sin armadura',true]);
    if(c.ud==='wis'&&!g.shield)opts.push([10+mo.dex+mo.wis,'Defensa sin armadura',false]);
    if(s&&s.id==='draconico')opts.push([10+mo.dex+mo.cha,'Resistencia dracónica',true]);
    if(s&&s.id==='danza'&&!g.shield)opts.push([10+mo.dex+mo.cha,'Juego de pies deslumbrante',false]);
    if(s&&s.id==='genios')opts.push([10+mo.dex+mo.cha,'Esplendor de genio',true]);
    const bul=feats.find(f=>f.id==='baluarte-infernal');if(bul&&!g.shield&&bul.ab[0])opts.push([10+mo.dex+mo[bul.ab[0]],'Baluarte infernal',false]);
    opts.sort((a,b)=>b[0]-a[0]);[ac,acn]=opts[0];
  }
  if(shieldOk){ac+=2;acn+=' + escudo'}
  if(sp.ac){ac+=sp.ac;acn+=' + protección integrada'}
  // Velocidad
  let spd=(spSub&&spSub.spd)||sp.spd;const notes=[];
  const heavy=g.armor&&g.armor.cat==='pesada';
  if(ch.cls==='monje'&&L>=2&&!g.armor&&!g.shield)spd+=[0,10,10,10,10,15,15,15,15,20,20,20,20,25,25,25,25,30,30,30][L-1];
  if(ch.cls==='barbaro'&&L>=5&&!heavy)spd+=10;
  if(ch.cls==='explorador'&&L>=6&&!heavy)spd+=10;
  spd+=fx('speed');
  // Salvaciones
  const sv=new Set(c.sv);
  feats.forEach(f=>{if((D.origen.dotes[f.id].fx||{}).saveFromAb&&f.ab[0])sv.add(f.ab[0])});
  if(ch.cls==='picaro'&&L>=15){sv.add('wis');sv.add('cha')}
  if(ch.cls==='monje'&&L>=14)ABS.forEach(([a])=>sv.add(a));
  const aura=ch.cls==='paladin'&&L>=6?Math.max(1,mo.cha):0;
  const saves={};ABS.forEach(([a])=>saves[a]=mo[a]+(sv.has(a)?pb:0)+aura);
  // Habilidades
  const prof=profSkills(ch),ex=new Set(Object.values(ch.ex||{}).flat());
  if(s&&s.skills&&s.skills.exp)((ch.sk||{}).sub||[]).forEach(k=>ex.add(k));
  const jack=ch.cls==='bardo'&&L>=2;
  const thaum=(ch.cls==='clerigo'&&ch.order==='taumaturgo'&&['arcana','religion'])||(ch.cls==='druida'&&ch.order==='mago'&&['arcana','nature'])||[];
  const skills={};SK.forEach(([k,n,a])=>{let v=mo[a]+(ex.has(k)?2*pb:prof.has(k)?pb:jack?Math.floor(pb/2):0);if(thaum.includes(k))v+=Math.max(1,mo.wis);skills[k]=v});
  // Iniciativa
  const init=mo.dex+(fx('initPB')?pb:0);
  // Ataques
  const atks=[];const seen=new Set();
  g.inv.items.forEach(it=>{const w=D.armaByN[it.n]||D.armaByN[it.n.replace(/ \(.*\)$/,'')];if(!w||seen.has(w.n))return;seen.add(w.n);
    const monkW=ch.cls==='monje'&&(w.cat==='sencilla'||w.p.includes('Ligera'))&&w.t==='cc';
    let ab=w.t==='dist'?'dex':(w.p.includes('Sutil')||monkW)?(mo.dex>mo.str?'dex':'str'):'str';
    const pr=weaponProf(ch,w);let hit=mo[ab]+(pr?pb:0)+(w.t==='dist'?fx('rangedAtk'):0);
    let die=w.d;if(monkW){const ma=c.prog['Artes marciales'][L-1];if(+ma.slice(1)>+(w.d.split('d')[1]||0))die='1'+ma}
    atks.push({n:w.n,hit,dmg:die+(mo[ab]?' '+sg(mo[ab]).replace('−','− '):''),dt:w.dt,p:w.p,m:w.m,prof:pr,ab})});
  {let die='1',ab='str';if(ch.cls==='monje'){die='1'+c.prog['Artes marciales'][L-1];ab=mo.dex>mo.str?'dex':'str'}
   else if(feats.some(f=>f.id==='sin-armas'))die='1d6';else if(feats.some(f=>f.id==='camorrista'))die='1d4';
   atks.push({n:'Golpe sin armas',hit:mo[ab]+pb,dmg:die+(mo[ab]?' '+sg(mo[ab]).replace('−','− '):''),dt:'contundente',p:[],m:'',prof:true,ab})}
  // Conjuros
  const cast=casterOf(ch);let spell=null;
  if(cast){const a=cast.ab;spell={ab:a,dc:8+pb+mo[a],atk:pb+mo[a]}}
  // Rasgos
  const feat=c.f.filter(f=>f[0]<=L).map(f=>({l:f[0],n:f[1],d:f[2],src:c.n}));
  if(s)s.f.filter(f=>f[0]<=L).forEach(f=>feat.push({l:f[0],n:f[1],d:f[2],src:s.n}));
  feat.sort((a,b)=>a.l-b.l);
  const prog=Object.entries(c.prog||{}).map(([k,v])=>[k,v[L-1]]);
  const tools=[bg.tool,c.tool].filter(Boolean);
  const pp=10+skills.perception;
  return {c,L,pb,sp,spSub,bg,sub:s,sc,mo,bon,hp,ac,acn,spd,saves,sv,aura,skills,prof,ex,jack,init,atks,spell,feat,prog,feats,g,tools,pp,
    hd:L+'d'+c.hd,size:sp.size==='choice'?ch.size:sp.size,dv:Math.max((spSub&&spSub.dv)||sp.dv||0,(s&&s.dv)||0)};
}

return {base,ABS,AB,ABF,SK,SKN,SKA,ALLSK,ARRAY,PBC,md,sg,pbOf,m,init,cls,subOf,subOn,featSlots,featsTaken,abilities,skillPools,expertisePools,fixedSkills,profSkills,normalize,inventory,gear,sheet,casterOf,PACT,ARC,CASTER};
})();
