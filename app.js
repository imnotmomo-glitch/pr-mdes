(function(){
const STATUSES=[['รอข้อมูล','--s-wait'],['เตรียม','--s-prep'],['พร้อมโพสต์','--s-ready'],['ตั้งเวลาแล้ว','--s-sched'],['โพสต์แล้ว','--s-done'],['เลื่อน/ยกเลิก','--s-skip']];
const SCOL=Object.fromEntries(STATUSES);
const PHASES=[
 {n:1,name:'รับสมัครรุ่น 2.5',a:'2026-10-26',b:'2026-12-07',open:1},
 {n:2,name:'ปิดรับ ถึงปีใหม่',a:'2026-12-08',b:'2027-01-03'},
 {n:3,name:'ภาค 2 สร้างการรับรู้',a:'2027-01-04',b:'2027-03-28'},
 {n:4,name:'อุ่นเครื่องรุ่น 3',a:'2027-03-29',b:'2027-04-25'},
 {n:5,name:'รุ่น 3 รอบที่ 1',a:'2027-04-26',b:'2027-05-30',open:1},
 {n:6,name:'ระหว่างรอบ',a:'2027-05-31',b:'2027-06-06'},
 {n:7,name:'รุ่น 3 รอบที่ 2',a:'2027-06-07',b:'2027-06-30',open:1},
 {n:8,name:'ก่อนเปิดเทอม',a:'2027-07-01',b:'2027-08-01'}];
const CGROUPS=[
 ['ภาคเรียนที่ 1 · วิชาบังคับ',['601','602','603']],
 ['ภาคเรียนที่ 1 · วิชาบังคับเลือก กลุ่ม Digital Trend',['611','612','613']],
 ['ภาคเรียนที่ 1 · วิชาบังคับเลือก กลุ่ม Convergent Physical Solution',['621','622','623']],
 ['ภาคเรียนที่ 2 · ปฏิบัติการออกแบบ',['604','605','606']],
 ['ภาคเรียนที่ 2 · วิชาเลือก',['641','642','643']]];
const TH_M=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const TH_MF=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const TH_D=['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pd=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d));};
const fd=(s,y)=>{const d=pd(s);return d.getUTCDate()+' '+TH_M[d.getUTCMonth()]+(y?' '+String(d.getUTCFullYear()+543).slice(2):'');};
const dow=s=>TH_D[pd(s).getUTCDay()];
const now=new Date();
const TODAY=new Date(now.getTime()+7*36e5).toISOString().slice(0,10);
const phaseOf=s=>(PHASES.find(p=>s>=p.a&&s<=p.b)||PHASES[PHASES.length-1]).n;

let ORIGINAL='{"updated":"","posts":[]}';let S=JSON.parse(ORIGINAL);
const ui={open:new Set(),series:'',phase:0,q:'',edit:false,canEdit:false,readOnly:false,dirty:new Set(),saving:false,restore:null};
const REPO={owner:'imnotmomo-glitch',repo:'pr-mdes',path:'data.json',branch:'main'};
const TK='mdes-pr-token';
const getTok=()=>{try{return localStorage.getItem(TK)||'';}catch(e){return '';}};
ui.canEdit=!!getTok();

const sorted=()=>S.posts.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
const live=()=>S.posts.filter(p=>p.status!=='เลื่อน/ยกเลิก');
function counts(list){const c={};STATUSES.forEach(([k])=>c[k]=0);list.forEach(p=>c[p.status]=(c[p.status]||0)+1);return c;}
function bar(list){const c=counts(list),n=list.length||1;return '<div class="bar" role="img" aria-label="สัดส่วนสถานะ">'+STATUSES.map(([k,v])=>c[k]?`<i style="width:${c[k]/n*100}%;background:var(${v})" title="${k} ${c[k]}"></i>`:'').join('')+'</div>';}
const pill=s=>`<span class="pill" style="color:var(${SCOL[s]||'--s-skip'})">${esc(s)}</span>`;

function header(){
 const cal=[['รุ่น 2.5 (เข้าเรียนภาค 2)','ตอนนี้ ถึง 7 ธ.ค. 69',1],['รุ่น 2.5 เปิดเรียน','4 ม.ค. 70',0],['รุ่น 3 รอบที่ 1','ปลาย เม.ย. ถึง 30 พ.ค. 70',1],['รุ่น 3 รอบที่ 2','สัปดาห์ที่ 2 ของ มิ.ย. ถึง 30 มิ.ย. 70',1],['รุ่น 3 เปิดเทอม','ต้น ส.ค. 70',0]];
 return `<header class="hero"><div class="hero-in">
 <div class="hero-top"><img src="assets/mdes-logo-white.png" alt="MDES" class="logo" width="895" height="208"><span class="school">Master of Design Program<br>Thammasat Design School</span></div>
 <h1>แผนประชาสัมพันธ์ MDes<br><span class="yr">2569–70</span></h1>
 <p class="lede">โพสต์ Facebook ตั้งแต่ ต.ค. 69 ถึงเปิดเทอม ส.ค. 70 ประจำทุกอังคาร 19:30 และพฤหัสบดี 12:15 และวันเสาร์ 10:00 สำหรับเรื่องพิเศษ</p>
 <div class="tools">${ui.canEdit?`<button class="btn ${ui.edit?'lime':'ghost'}" id="editBtn">${ui.edit?'ปิดโหมดแก้ไข':'แก้ไขแผน'}</button>`:''}${ui.edit?'<button class="btn ghost" id="addBtn">+ เพิ่มโพสต์</button>':''}<button class="btn ghost" id="xlsBtn">ดาวน์โหลด Excel</button></div>
 <div class="shape" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
 </div></header>
 <div class="wrap"><section class="cal" aria-label="ปฏิทินรับสมัคร">${cal.map(c=>`<div class="${c[2]?'open':''}">${c[2]?'<span class="flag">เปิดรับสมัคร</span>':''}<b>${c[0]}</b><span>${c[1]}</span></div>`).join('')}</section></div>`;
}
function summary(){
 const L=live(),c=counts(L),total=L.length;
 const ready=c['พร้อมโพสต์']+c['ตั้งเวลาแล้ว'];
 const k=[['ทั้งหมด',total,'--navy'],['โพสต์แล้ว',c['โพสต์แล้ว'],'--s-done'],['พร้อม / ตั้งเวลาแล้ว',ready,'--s-ready'],['กำลังเตรียม',c['เตรียม'],'--s-prep'],['รอข้อมูล',c['รอข้อมูล'],'--s-wait']];
 const ph=PHASES.map(p=>{const l=L.filter(x=>phaseOf(x.date)===p.n);const cur=TODAY>=p.a&&TODAY<=p.b;
  return `<button class="ph ${ui.phase===p.n?'on':''}" data-phase="${p.n}"><span class="t">${p.n}. ${p.name}</span><span class="d">${fd(p.a)} – ${fd(p.b,1)} · ${l.length} โพสต์</span>${p.open?'<span class="tag">เปิดรับสมัคร</span>':''}${cur?'<span class="tag" style="background:var(--navy);color:var(--bg)">ช่วงปัจจุบัน</span>':''}${bar(l)}</button>`;}).join('');
 return `<section class="summary" aria-labelledby="sumh"><h2 id="sumh">ความคืบหน้า</h2>
 <div class="kpis">${k.map(x=>`<div class="kpi"><div class="v" style="color:var(${x[2]})">${x[1]}</div><div class="l">${x[0]}</div></div>`).join('')}</div>
 ${bar(L)}<div class="legend">${STATUSES.slice(0,5).map(([s,v])=>`<span><i class="dot" style="background:var(${v})"></i>${s}</span>`).join('')}</div>
 <div class="muted" style="font-size:13px">แบ่งเป็น 8 ช่วงตามปฏิทินรับสมัคร กดที่ช่วงเพื่อดูเฉพาะโพสต์ในช่วงนั้น</div>
 <div class="phases">${ph}</div></section>`;
}
function nextUp(){
 const end=new Date(pd(TODAY).getTime()+13*864e5).toISOString().slice(0,10);
 const l=sorted().filter(p=>p.date>=TODAY&&p.date<=end&&p.status!=='เลื่อน/ยกเลิก');
 return `<section class="next" aria-labelledby="nxh"><h2 id="nxh">2 สัปดาห์ข้างหน้า</h2>${l.length?l.map(p=>`<button class="nx ${p.date===TODAY?'today':''}" data-go="${p.id}"><span class="when"><b>${dow(p.date)} ${fd(p.date)}</b>${esc(p.time)}${p.date===TODAY?' · <mark>วันนี้</mark>':''}</span><span class="tt">${esc(p.title)}<div class="muted" style="font-weight:400;font-size:13px">${esc(p.series)}</div></span>${pill(p.status)}</button>`).join(''):'<div class="muted">ไม่มีโพสต์ในช่วงนี้</div>'}</section>`;
}
function courses(){
 const by={};S.posts.forEach(p=>{if(p.course)by[p.course]=p;});
 return `<section class="courses" aria-labelledby="ch"><div><h2 id="ch">เปิดห้องเรียน MDes ครบ 15 วิชา</h2><div class="muted" style="font-size:14px">แต่ละวิชามีโพสต์ของตัวเอง หนึ่งโพสต์ต่อหนึ่งวิชา กดเพื่อดูรายละเอียด</div></div>
 ${CGROUPS.map(([g,cs])=>`<div class="cgroup"><h3>${g}</h3><div class="cgrid">${cs.map(c=>{const p=by[c];if(!p)return '';return `<button class="ct" data-go="${p.id}"><span class="code">MDE ${c}</span><span class="nm">${esc(p.subtitle||p.title)}</span><span class="meta">${dow(p.date)} ${fd(p.date,1)} · <span style="color:var(${SCOL[p.status]})">● ${esc(p.status)}</span>${p.draft?' · มีร่างแล้ว':''}</span></button>`;}).join('')}</div></div>`).join('')}</section>`;
}
function matches(p){
 if(ui.series&&p.series!==ui.series)return false;
 if(ui.phase&&phaseOf(p.date)!==ui.phase)return false;
 if(ui.q){const q=ui.q.toLowerCase();if(![p.title,p.subtitle,p.summary,p.message,p.series,p.wait,p.note,p.course].join(' ').toLowerCase().includes(q))return false;}
 return true;
}
function card(p){
 const o=ui.open.has(p.id);
 const late=p.date<TODAY&&!['โพสต์แล้ว','เลื่อน/ยกเลิก'].includes(p.status);
 let h=`<article class="card ${o?'open':''} ${p.status==='เลื่อน/ยกเลิก'?'cancel':''}" id="card-${p.id}">
 <button class="head" data-toggle="${p.id}" aria-expanded="${o}"><span class="when"><b>${dow(p.date)} ${fd(p.date)}</b>${esc(p.time)}</span>
 <span style="min-width:0"><span class="tags"><span class="tag">${esc(p.series)}</span>${p.special?'<span class="tag sp">วันพิเศษ</span>':''}${p.draft?'<span class="tag dr">มีร่างแล้ว</span>':''}${late?'<span class="tag" style="color:var(--s-wait)">เลยกำหนด</span>':''}</span>
 <div class="ttl">${esc(p.title)}<span class="chev" aria-hidden="true">›</span></div>${p.subtitle?`<div class="sub">${esc(p.subtitle)}</div>`:''}${!o&&p.message?`<div class="msg">${esc(p.message)}</div>`:''}</span>${pill(p.status)}</button>`;
 if(o){
  h+=`<div class="body"><dl class="kv">
  <dt>สื่อถึง</dt><dd class="big">${esc(p.message)}</dd>
  <dt>เนื้อหา</dt><dd>${esc(p.summary)}</dd>
  ${p.credits?`<dt>รายวิชา</dt><dd>${esc(p.credits)}</dd>`:''}${p.teachers?`<dt>ผู้สอน</dt><dd>${esc(p.teachers)}</dd>`:''}
  <dt>รูปแบบ</dt><dd>${esc(p.format)}</dd>
  <dt>วันเวลา</dt><dd>${dow(p.date)} ${fd(p.date,1)} เวลา ${esc(p.time)} น.${p.special?' (วันพิเศษ)':''}</dd>
  ${p.owner?`<dt>ผู้รับผิดชอบ</dt><dd>${esc(p.owner)}</dd>`:''}
  ${p.link?`<dt>ลิงก์งาน</dt><dd><a class="linkout" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.link)}</a></dd>`:''}
  ${p.note?`<dt>หมายเหตุ</dt><dd>${esc(p.note)}</dd>`:''}
  </dl>${p.wait&&!['โพสต์แล้ว','ตั้งเวลาแล้ว'].includes(p.status)?`<div class="wait"><b>รอ:</b> ${esc(p.wait)}</div>`:''}`;
  if(p.draft)h+=`<details class="draft" open><summary><span>ร่างโพสต์</span><span class="muted" style="font-weight:400;font-size:13px">${(p.draft.slides||[]).length} ภาพ + ข้อความ caption</span></summary><div class="in">
   ${(p.draft.slides||[]).length?`<ol class="slides">${p.draft.slides.map((s,i)=>`<li><span>${i+1}</span><div><b>${esc(String(s.n||'').replace(/^\d+\s*/,''))}</b>${s.n?' · ':''}${esc(s.th)}</div></li>`).join('')}</ol>`:''}
   ${p.draft.caption?`<div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px"><b style="font-size:14px">Caption</b><button class="btn small" data-copy="${p.id}">คัดลอก caption</button></div><pre class="cap" id="cap-${p.id}">${esc(p.draft.caption)}</pre></div>`:''}
  </div></details>`;
  else h+=`<div class="muted" style="font-size:14px">ยังไม่มีร่างข้อความ${p.wait?' จะเขียนเมื่อได้ข้อมูลที่รอ':''}</div>`;
  if(ui.edit)h+=editForm(p);
  h+='</div>';
 }
 return h+'</article>';
}
function editForm(p){
 const f=(k,l,t)=>`<label for="f-${p.id}-${k}">${l}${t==='ta'?`<textarea id="f-${p.id}-${k}" data-f="${k}" data-id="${p.id}" rows="2">${esc(p[k])}</textarea>`:`<input id="f-${p.id}-${k}" data-f="${k}" data-id="${p.id}" type="${t||'text'}" value="${esc(p[k])}">`}</label>`;
 const series=[...new Set(S.posts.map(x=>x.series))];
 const sl=(p.draft&&p.draft.slides||[]).map(s=>(String(s.n||'').replace(/^\d+\s*/,'')||'-')+' :: '+s.th).join('\n');
 return `<div class="edit"><div class="eyebrow">แก้ไขโพสต์นี้</div>
 <div class="row"><label for="f-${p.id}-status">สถานะ<select id="f-${p.id}-status" data-f="status" data-id="${p.id}">${STATUSES.map(([s])=>`<option ${s===p.status?'selected':''}>${s}</option>`).join('')}</select></label>
 ${f('date','วันที่','date')}${f('time','เวลา','time')}</div>
 <div class="row"><label for="f-${p.id}-series">หมวด<input id="f-${p.id}-series" data-f="series" data-id="${p.id}" list="serieslist" value="${esc(p.series)}"></label>${f('owner','ผู้รับผิดชอบ')}<label for="f-${p.id}-special">วันพิเศษ<select id="f-${p.id}-special" data-f="special" data-id="${p.id}"><option value="0" ${p.special?'':'selected'}>ไม่ใช่</option><option value="1" ${p.special?'selected':''}>ใช่</option></select></label></div>
 ${f('title','หัวข้อโพสต์')}${f('message','สื่อถึง (ประโยคเดียว)')}${f('summary','เนื้อหา','ta')}
 <div class="row">${f('format','รูปแบบ')}${f('link','ลิงก์งาน (Canva / โพสต์จริง)','url')}${f('note','หมายเหตุ')}</div>
 ${f('wait','สิ่งที่ยังรอ','ta')}
 <label for="f-${p.id}-slides">ข้อความบนภาพ (บรรทัดละภาพ: หัวภาพ :: ข้อความ)<textarea id="f-${p.id}-slides" data-f="slides" data-id="${p.id}" rows="4">${esc(sl)}</textarea></label>
 <label for="f-${p.id}-caption">Caption<textarea id="f-${p.id}-caption" data-f="caption" data-id="${p.id}" rows="8">${esc(p.draft&&p.draft.caption||'')}</textarea></label>
 <div class="editnote">การแก้ไขจะเก็บไว้ในหน้านี้ก่อน กด "บันทึก" ด้านล่างเพื่อให้ทุกคนเห็น · ไม่ต้องการโพสต์นี้แล้ว ให้เปลี่ยนสถานะเป็น "เลื่อน/ยกเลิก"</div>
 <datalist id="serieslist">${series.map(s=>`<option value="${esc(s)}">`).join('')}</datalist></div>`;
}
function plan(){
 const series=[...new Set(sorted().map(p=>p.series))];
 const l=sorted().filter(matches);
 const groups=[];l.forEach(p=>{const k=p.date.slice(0,7);let g=groups[groups.length-1];if(!g||g.k!==k){g={k,items:[]};groups.push(g);}g.items.push(p);});
 return `<section style="display:grid;gap:12px" aria-labelledby="plh"><div><h2 id="plh">แผนโพสต์รายเดือน</h2><div class="muted" style="font-size:14px">กดที่โพสต์เพื่อดูว่าจะพูดเรื่องอะไร สื่อถึงอะไร และร่างข้อความ (ถ้ามี)</div></div>
 <div class="filters"><button class="chip ${ui.series?'':'on'}" data-series="">ทุกหมวด</button>${series.map(s=>`<button class="chip ${ui.series===s?'on':''}" data-series="${esc(s)}">${esc(s)}</button>`).join('')}</div>
 <div class="filters"><input class="search" id="q" type="search" placeholder="ค้นหาหัวข้อ เช่น 601, รับสมัคร, IS" value="${esc(ui.q)}" aria-label="ค้นหา">${ui.phase?`<button class="chip on" data-phase="0">ช่วงที่ ${ui.phase} ✕</button>`:''}<span class="muted" style="font-size:13px">${l.length} โพสต์</span></div>
 ${groups.map(g=>{const[y,m]=g.k.split('-').map(Number);return `<div class="month"><h3>${TH_MF[m-1]} ${y+543}<small>${g.items.length} โพสต์</small></h3>${g.items.map(card).join('')}</div>`;}).join('')||'<div class="muted">ไม่พบโพสต์ที่ตรงกับตัวกรอง</div>'}
 </section>`;
}
function render(){
 const fid=document.activeElement&&document.activeElement.id;
 const pos=fid&&document.activeElement.selectionStart;
 $('root').innerHTML=`${header()}<div class="wrap">${ui.restore?`<div class="banner"><span>มีการแก้ไขที่ยังไม่ได้บันทึกจากครั้งก่อน</span><span class="tools"><button class="btn small primary" id="restoreBtn">กู้คืน</button><button class="btn small" id="dropBtn">ทิ้ง</button></span></div>`:''}${summary()}${nextUp()}${courses()}${plan()}
 <footer><span>อัปเดตล่าสุด ${esc(fd(S.updated.slice(0,10),1))}${S.updated.length>10?' '+esc(S.updated.slice(11,16))+' น.':''} · วันและเวลาโพสต์เป็นข้อเสนอเริ่มต้น จะปรับตามสถิติเพจเมื่อมีข้อมูล · ข้อมูลรับสมัคร (ช่องทาง ค่าใช้จ่าย) จะใส่เมื่อหลักสูตรประกาศ</span><button class="linkbtn" id="adminBtn">${ui.canEdit?'ออกจากระบบผู้ดูแล':'สำหรับผู้ดูแล'}</button></footer>${ui.login?loginBox():''}</div>
 ${ui.dirty.size?`<div class="savebar"><span>แก้ไขแล้ว ${ui.dirty.size} โพสต์ ยังไม่ได้บันทึก</span><button class="btn lime" id="saveBtn" ${ui.saving?'disabled':''}>${ui.saving?'กำลังบันทึก…':'บันทึก'}</button><button class="btn" id="undoBtn">ยกเลิกการแก้ไข</button></div>`:''}`;
 if(fid&&$(fid)){$(fid).focus();try{if(pos!=null)$(fid).setSelectionRange(pos,pos);}catch(e){}}
}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3200);}
const find=id=>S.posts.find(p=>p.id===id);
function setField(p,k,v){
 if(k==='special')p.special=v==='1';
 else if(k==='caption'){p.draft=p.draft||{slides:[],caption:''};p.draft.caption=v;}
 else if(k==='slides'){p.draft=p.draft||{slides:[],caption:''};p.draft.slides=v.split('\n').map(s=>s.trim()).filter(Boolean).map((s,i)=>{const[a,...b]=s.split('::');return b.length?{n:(i+1)+' '+a.trim().replace(/^-$/,''),th:b.join('::').trim()}:{n:String(i+1),th:a.trim()};});}
 else p[k]=v;
 if(p.draft&&!p.draft.caption&&!(p.draft.slides||[]).length)p.draft=null;
 ui.dirty.add(p.id);stash();
}
function stash(){try{sessionStorage.setItem('mdes-unsaved',JSON.stringify(S));}catch(e){}}
function unstash(){try{sessionStorage.removeItem('mdes-unsaved');}catch(e){}}

document.addEventListener('click',async e=>{
 const t=e.target.closest('button');if(!t)return;
 if(t.dataset.toggle){const id=t.dataset.toggle;ui.open.has(id)?ui.open.delete(id):ui.open.add(id);render();return;}
 if(t.dataset.go){const id=t.dataset.go;ui.series='';ui.phase=0;ui.q='';ui.open.add(id);render();const c=$('card-'+id);if(c)c.scrollIntoView({behavior:'smooth',block:'start'});return;}
 if('series' in t.dataset){ui.series=t.dataset.series;render();return;}
 if('phase' in t.dataset){const n=+t.dataset.phase;ui.phase=ui.phase===n?0:n;render();if(ui.phase)$('plh').scrollIntoView({behavior:'smooth'});return;}
 if(t.dataset.copy){const txt=find(t.dataset.copy).draft.caption;try{await navigator.clipboard.writeText(txt);toast('คัดลอก caption แล้ว');}catch(err){const pre=$('cap-'+t.dataset.copy);const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);toast('เลือกข้อความไว้แล้ว กดคัดลอกได้เลย');}return;}
 if(t.id==='editBtn'){ui.edit=!ui.edit;render();return;}
 if(t.id==='addBtn'){const d=TODAY>'2027-07-31'?'2027-07-31':TODAY;const p={id:'n'+Date.now().toString(36),date:d,time:'10:00',special:true,phase:phaseOf(d),status:'เตรียม',owner:'',link:'',note:'',course:'',credits:'',draft:null,series:'บรรยากาศการเรียน',title:'โพสต์ใหม่',subtitle:'',summary:'',message:'',format:'',wait:''};S.posts.push(p);ui.dirty.add(p.id);ui.open.add(p.id);ui.series='';ui.phase=0;ui.q='';stash();render();const c=$('card-'+p.id);if(c){c.scrollIntoView({block:'start'});const i=$('f-'+p.id+'-title');if(i)i.focus();}return;}
 if(t.id==='undoBtn'){S=JSON.parse(ORIGINAL);ui.dirty.clear();unstash();render();toast('ยกเลิกการแก้ไขแล้ว');return;}
 if(t.id==='restoreBtn'){S=JSON.parse(ui.restore);ui.restore=null;ui.dirty=new Set(S.posts.map(p=>p.id));ui.edit=true;render();return;}
 if(t.id==='dropBtn'){ui.restore=null;unstash();render();return;}
 if(t.id==='saveBtn'){save();return;}
 if(t.id==='adminBtn'){if(ui.canEdit){try{localStorage.removeItem(TK);}catch(e){}ui.canEdit=false;ui.edit=false;render();toast('ออกจากระบบผู้ดูแลแล้ว');}else{ui.login=true;render();const i=$('tok');if(i)i.focus();}return;}
 if(t.id==='tokCancel'){ui.login=false;render();return;}
 if(t.id==='tokSave'){checkToken($('tok').value.trim());return;}
 if(t.id==='xlsBtn'){exportXlsx();return;}
});
document.addEventListener('input',e=>{const el=e.target;
 if(el.id==='q'){ui.q=el.value;render();return;}
 if(el.dataset.f&&el.dataset.id){setField(find(el.dataset.id),el.dataset.f,el.value);if(ui.dirty.size===1&&!document.querySelector('.savebar'))render();}
});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.f&&['status','date','time','special','series'].includes(el.dataset.f)){const p=find(el.dataset.id);setField(p,el.dataset.f,el.value);if(el.dataset.f==='date')p.phase=phaseOf(p.date);render();}});

function loginBox(){return `<div class="login" role="dialog" aria-labelledby="lgh"><h3 id="lgh">เข้าสู่โหมดผู้ดูแล</h3><p class="muted">ใส่ GitHub token ของบัญชีที่ดูแลเว็บนี้ ระบบจะจำไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น ผู้ที่ไม่มี token ดูได้อย่างเดียว</p><label for="tok">GitHub token<input id="tok" type="password" autocomplete="off" placeholder="github_pat_..."></label><div class="tools"><button class="btn primary" id="tokSave">เข้าสู่ระบบ</button><button class="btn" id="tokCancel">ยกเลิก</button></div></div>`;}
const api=(p,o={})=>fetch('https://api.github.com/repos/'+REPO.owner+'/'+REPO.repo+p,{...o,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+getTok(),...(o.headers||{})}});
async function checkToken(t){
 if(!t){toast('ใส่ token ก่อน');return;}
 try{const r=await fetch('https://api.github.com/repos/'+REPO.owner+'/'+REPO.repo,{headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+t}});
  const j=await r.json();
  if(!r.ok||!(j.permissions&&j.permissions.push)){toast('token นี้แก้ไขเว็บไม่ได้ ตรวจว่าให้สิทธิ์ Contents: Read and write กับ repo pr-mdes');return;}
  try{localStorage.setItem(TK,t);}catch(e){toast('เบราว์เซอร์นี้เก็บ token ไม่ได้');return;}
  ui.canEdit=true;ui.login=false;ui.edit=true;render();toast('เข้าสู่โหมดผู้ดูแลแล้ว');
 }catch(e){toast('เชื่อมต่อ GitHub ไม่ได้ ลองใหม่อีกครั้ง');}
}
const b64=s=>{const b=new TextEncoder().encode(s);let x='';for(let i=0;i<b.length;i+=0x8000)x+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(x);};
async function save(){
 if(!getTok()){toast('ต้องเข้าสู่โหมดผู้ดูแลก่อนบันทึก');return;}
 const d=new Date(Date.now()+7*36e5).toISOString();S.updated=d.slice(0,10)+' '+d.slice(11,16);
 ui.saving=true;render();stash();
 try{
  const g=await api('/contents/'+REPO.path+'?ref='+REPO.branch);
  if(!g.ok)throw new Error('read '+g.status);
  const cur=await g.json();
  const body=JSON.stringify(S,null,1);
  const r=await api('/contents/'+REPO.path,{method:'PUT',body:JSON.stringify({message:'อัปเดตแผนโพสต์ '+S.updated,content:b64(body),sha:cur.sha,branch:REPO.branch})});
  if(!r.ok)throw new Error('write '+r.status);
  ORIGINAL=JSON.stringify(S);ui.dirty.clear();ui.saving=false;unstash();render();
  toast('บันทึกแล้ว เว็บจะแสดงข้อมูลใหม่กับทุกคนภายใน 1-2 นาที');
 }catch(err){ui.saving=false;render();
  toast(/401|403/.test(err.message)?'token หมดอายุหรือไม่มีสิทธิ์ เข้าสู่ระบบใหม่':'บันทึกไม่สำเร็จ ('+err.message+') การแก้ไขยังอยู่ในหน้านี้ ลองอีกครั้ง');}
}
function loadXlsx(){return new Promise((ok,no)=>{if(window.XLSX)return ok();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s);});}
async function exportXlsx(){
 try{await loadXlsx();
  const rows=sorted().map(p=>({'วันที่':p.date,'วัน':dow(p.date),'เวลา':p.time,'วันพิเศษ':p.special?'ใช่':'','ช่วง':PHASES[phaseOf(p.date)-1].name,'หมวด':p.series,'หัวข้อ':p.title+(p.subtitle?' / '+p.subtitle:''),'สื่อถึง':p.message,'เนื้อหา':p.summary,'รูปแบบ':p.format,'สถานะ':p.status,'มีร่าง':p.draft?'มี':'','สิ่งที่รอ':p.wait,'ผู้รับผิดชอบ':p.owner,'ลิงก์':p.link,'หมายเหตุ':p.note,'Caption':p.draft&&p.draft.caption||''}));
  const c=counts(live());const sum=STATUSES.map(([k])=>({'สถานะ':k,'จำนวน':c[k]||0}));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(sum),'ภาพรวม');
  const s2=XLSX.utils.json_to_sheet(rows);s2['!cols']=[11,5,6,7,16,14,40,36,50,24,12,6,36,14,24,24,60].map(w=>({wch:w}));s2['!autofilter']={ref:s2['!ref']};XLSX.utils.book_append_sheet(wb,s2,'แผนโพสต์');
  XLSX.writeFile(wb,'MDes-แผนประชาสัมพันธ์-'+TODAY+'.xlsx');
 }catch(err){toast('ดาวน์โหลดไม่สำเร็จ ลองอีกครั้ง');}
}
async function boot(){
 try{const r=await fetch('data.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;const j=await r.json();ORIGINAL=JSON.stringify(j);S=j;}
 catch(e){$('root').innerHTML='<div class="wrap"><p>โหลดข้อมูลแผนไม่ได้ ลองรีเฟรชหน้าอีกครั้ง</p></div>';return;}
 try{const st=sessionStorage.getItem('mdes-unsaved');if(st&&st!==ORIGINAL)ui.restore=st;}catch(e){}
 render();
}
boot();
})();
