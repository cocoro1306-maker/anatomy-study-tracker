"use strict";
const DAILY_TARGET=210,EXAM_DATE="2026-11-09",MOCK_START="2026-11-07";
const STORAGE_KEY="anatomy-study-progress-v2",PARTIAL_KEY="anatomy-study-partial-minutes-v1",MOCK_KEY="anatomy-study-mock-v1",DAILY_LOG_KEY="anatomy-study-daily-log-v1",MIGRATION_KEY="anatomy-study-lecture-migration-v1",PRIORITY_KEY="anatomy-study-priority-v1";
const stages=["PPT 課前預習","觀看影片＋做筆記","基礎觀念測驗","歷屆考古題"];
const chapters=[
{id:"2026-10-24",title:"5.1 Abdominal Cavity & Abdominal Wall",description:"腹腔、前外側腹壁",durations:[25,85,35,50]},
{id:"2026-10-25",title:"5.2 Inguinal Region, Scrotum & Testis",description:"腹股溝管、精索、陰囊與睪丸"},
{id:"2026-10-26",title:"Peritoneum & Peritoneal Cavity",description:"腹膜、大小網膜、腹膜腔"},
{id:"2026-10-28",title:"Esophagus & Stomach",description:"食道、胃、血管與淋巴"},
{id:"2026-10-29",title:"Small & Large Intestines",description:"小腸、大腸、血管供應"},
{id:"2026-10-30",title:"Spleen & Pancreas + Liver",description:"脾臟、胰臟、肝臟與膽道；兩份 PPT 合併一組四階段",durations:[35,194,45,60],stageLabels:["PPT 課前預習（兩份）","影片＋筆記","基礎觀念測驗","歷屆考古題"]},
{id:"2026-11-01",title:"Kidneys, Ureters & Suprarenal Glands",description:"腎臟、輸尿管、腎上腺"},
{id:"2026-10-27",title:"Summary of Abdominal Visceral Innervation",description:"腹部內臟自主神經支配總整理"},
{id:"2026-11-02",title:"Diaphragm & Posterior Abdominal Wall",description:"橫膈、後腹壁肌肉與腰神經叢"},
{id:"2026-11-03",title:"Pelvis & Pelvic Viscera",description:"骨盆壁、骨盆底、骨盆內臟"},
{id:"2026-11-04",title:"Male & Female Pelvic Viscera",description:"男女生殖器官、血管與韌帶"},
{id:"2026-11-05",title:"Perineum",description:"會陰、肛管、神經與血管"}
];
const videos=[
{title:"Inguinal scrutom testis.mp4",start:0,end:3442,speed:1,id:"2026-10-25"},
{title:"Abdomen 10.13.2026 — Peritoneum",start:0,end:9610,speed:1.5,id:"2026-10-26"},
{title:"Abdomen 10.13.2026 — Esophagus & Stomach",start:9240,end:15160,speed:1.5,id:"2026-10-28"},
{title:"Abdomen 10.15.2026 — Small & Large Intestines",start:0,end:12081,speed:1.5,id:"2026-10-29"},
{title:"Abdomen 10.16.2026 — Spleen & Pancreas + Liver",start:0,end:15155,speed:1.5,id:"2026-10-30"},
{title:"Abdomen 10.20.2026 — Kidneys",start:0,end:5400,speed:1.5,id:"2026-11-01"},
{title:"Abdomen 10.20.2026 — Innervation",start:5400,end:7720,speed:1.5,id:"2026-10-27"},
{title:"Abdomen 10.20.2026 — Posterior Abdominal Wall",start:7720,end:13977,speed:1.5,id:"2026-11-02"}
];
const $=id=>document.getElementById(id);
const VIDEO_STORAGE_KEY="anatomy-custom-videos-v1";
const customVideoData=loadVideoData();
// Correct the previously published default timestamp, including the old saved default.
if(Array.isArray(customVideoData["2026-10-28"]))for(const v of customVideoData["2026-10-28"]){if(v.start===9610)v.start=9240;}
function loadVideoData(){try{const value=JSON.parse(localStorage.getItem(VIDEO_STORAGE_KEY)||"{}");return value&&typeof value==="object"&&!Array.isArray(value)?value:{}}catch{return {}}}
function parseClock(value){const s=value.trim();if(!/^\d{1,3}:[0-5]\d:[0-5]\d$/.test(s))return null;const [h,m,sec]=s.split(":").map(Number);return h*3600+m*60+sec}
function mergedVideos(id){const originals=videos.filter(v=>v.id===id);const saved=customVideoData[id];if(!Array.isArray(saved))return originals;return saved.filter(v=>v&&typeof v.title==="string"&&Number.isFinite(v.start)&&Number.isFinite(v.end)&&v.end>v.start).map(v=>({...v,id}))}
let editingVideoIndex=null;

function load(key){try{const x=JSON.parse(localStorage.getItem(key)||"{}");return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}catch{return {}}}
const progress=load(STORAGE_KEY),partial=load(PARTIAL_KEY),mock=load(MOCK_KEY),daily=load(DAILY_LOG_KEY),migration=load(MIGRATION_KEY);
let priority=localStorage.getItem(PRIORITY_KEY)||"2026-10-28",selected=priority,filter="all",query="",view="dashboard";
const videoFor=id=>mergedVideos(id);
const watchMinutes=c=>Math.ceil(videoFor(c.id).reduce((s,v)=>s+(v.end-v.start)/(v.speed||1.5)/60,0));
const durations=c=>c.durations||[25,(videoFor(c.id).length?watchMinutes(c):60)+25,35,50];
const total=c=>durations(c).reduce((a,b)=>a+b,0);
const label=(c,i)=>c.stageLabels?.[i]||stages[i];
const fmt=n=>{n=Math.max(0,Math.ceil(n));const h=Math.floor(n/60),m=n%60;return h?`${h} 小時${m?` ${m} 分`:""}`:`${m} 分鐘`};
const clock=n=>`${Math.floor(n/3600)}:${String(Math.floor(n%3600/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const dateValue=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const daysUntil=s=>Math.max(0,Math.round((dateValue(s)-dateValue(today()))/86400000));
// Preserve original storage keys and old migration snapshots. No reset of existing checked stages.
if(!migration.merged1016){
 const spleen=Array.isArray(progress["2026-10-30"])?[...progress["2026-10-30"]]:[false,false,false,false];
 const liver=Array.isArray(progress["2026-10-31"])?[...progress["2026-10-31"]]:[false,false,false,false];
 const sp=Array.isArray(partial["2026-10-30"])?[...partial["2026-10-30"]]:[0,0,0,0];
 const lp=Array.isArray(partial["2026-10-31"])?[...partial["2026-10-31"]]:[0,0,0,0];
 migration.oldSpleenProgress=spleen;migration.oldLiverProgress=liver;migration.oldSpleenPartial=sp;migration.oldLiverPartial=lp;
 // A merged stage is complete only if both old stages were complete.
 progress["2026-10-30"]=stages.map((_,i)=>spleen[i]===true&&liver[i]===true);
 // Keep any partial progress from either source, capped at new combined stage duration.
 partial["2026-10-30"]=durations(chapters[5]).map((d,i)=>progress["2026-10-30"][i]?d:Math.min(d,Math.max(0,Number(sp[i])||0)+Math.max(0,Number(lp[i])||0)));
 migration.merged1016=true;
}
for(const c of chapters){
 if(!Array.isArray(progress[c.id])){
  if(c.id==="2026-10-24"||c.id==="2026-10-26")progress[c.id]=[true,true,true,true];
  else if(c.id==="2026-10-25"){let old=[];try{old=JSON.parse(localStorage.getItem("anatomy-5-2")||"[]")}catch{}progress[c.id]=stages.map((_,i)=>old[i]===true)}
  else progress[c.id]=[false,false,false,false];
 }
 if(!Array.isArray(partial[c.id]))partial[c.id]=[0,0,0,0];
 durations(c).forEach((d,i)=>{progress[c.id][i]=progress[c.id][i]===true;partial[c.id][i]=progress[c.id][i]?d:Math.max(0,Math.min(d,Number(partial[c.id][i])||0))});
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));localStorage.setItem(PARTIAL_KEY,JSON.stringify(partial));localStorage.setItem(MOCK_KEY,JSON.stringify(mock));localStorage.setItem(DAILY_LOG_KEY,JSON.stringify(daily));localStorage.setItem(MIGRATION_KEY,JSON.stringify(migration));localStorage.setItem(PRIORITY_KEY,priority)}
const complete=c=>progress[c.id].every(Boolean),completed=c=>progress[c.id].filter(Boolean).length;
const remainingStage=(c,i)=>progress[c.id][i]?0:Math.max(0,durations(c)[i]-partial[c.id][i]);
const remaining=c=>stages.reduce((s,_,i)=>s+remainingStage(c,i),0),done=c=>total(c)-remaining(c);
const remainingAll=()=>chapters.reduce((s,c)=>s+remaining(c),0);
const usedToday=()=>Math.max(0,Number(daily[today()])||0);
const getSelected=()=>chapters.find(c=>c.id===selected)||chapters[0];
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n}
function setView(next){closeVideoEditor();view=next;document.querySelectorAll(".view").forEach(n=>n.classList.toggle("active",n.id===`view-${next}`));
document.querySelectorAll("[data-view]").forEach(n=>n.classList.toggle("active",n.dataset.view===next));$("page-title").textContent=({dashboard:"學習總覽",plan:"目前學習",library:"章節資料庫",review:"考前衝刺"})[next];window.scrollTo({top:0,behavior:"smooth"});render()}
function renderStats(){const count=chapters.filter(complete).length,p=Math.round(count/chapters.length*100);$("countdown").textContent=`${daysUntil(EXAM_DATE)} 天`;$("completed").textContent=`${count} / ${chapters.length} 章`;$("progress-percent").textContent=`${p}%`;$("overall-progress").style.width=`${p}%`;$("progress-text").textContent=`已完成 ${count} 章，尚有 ${chapters.length-count} 章。各階段的部分學習時間也會保留。`}
function ordered(){const i=chapters.findIndex(c=>c.id===priority);return i<0?chapters:[...chapters.slice(i),...chapters.slice(0,i)]}
function nextTask(){for(const c of ordered())for(let i=0;i<4;i++)if(remainingStage(c,i)>0)return {c,i};return null}
function renderDashboard(){const target=$("focus-card");target.replaceChildren();const n=nextTask();if(n){const inner=el("div","focus-inner");inner.append(el("span","eyebrow",`${completed(n.c)} / 4 STAGES`),el("h4","",n.c.title),el("p","",`下一階段：${label(n.c,n.i)} · 尚需 ${fmt(remainingStage(n.c,n.i))}`));const b=el("button","primary","開啟章節 →");b.onclick=()=>{selected=n.c.id;setView("plan")};inner.append(b);target.append(inner)}else target.append(el("div","empty","所有章節已完成！"));const o=$("quick-overview");o.replaceChildren();[["已完成階段",`${chapters.reduce((s,c)=>s+completed(c),0)} / ${chapters.length*4}`],["剩餘學習量",fmt(remainingAll())],["11/7 前剩餘天數",`${daysUntil(MOCK_START)} 天`]].forEach(([a,b])=>{const r=el("div","overview-row");r.append(el("span","",a),el("strong","",b));o.append(r)})}
function plan(limit){const out=[];let free=Math.max(0,limit);for(const c of ordered()){for(let i=0;i<4&&free>0;i++){const r=remainingStage(c,i);if(!r)continue;const minutes=Math.min(r,free);out.push({c,i,minutes,before:r});free-=minutes}if(free<=0)break}return out}
function markPlan(t){const r=remainingStage(t.c,t.i),credit=Math.min(r,t.minutes);partial[t.c.id][t.i]=Math.min(durations(t.c)[t.i],partial[t.c.id][t.i]+credit);if(partial[t.c.id][t.i]>=durations(t.c)[t.i])progress[t.c.id][t.i]=true;daily[today()]=usedToday()+credit;save();render()}
function renderPlan(){const list=$("today-task-list"),notice=$("schedule-notice");list.replaceChildren();$("remaining-total").textContent=fmt(remainingAll());const now=today();if(now>=MOCK_START){$("today-total").textContent=now>=EXAM_DATE?"考試日":"模擬考";list.append(el("div","empty",now>=EXAM_DATE?"考前快速回顧錯題，祝考試順利！":"11/7–11/8 保留給模擬考與訂正。"));notice.textContent="章節資料庫仍可隨時繼續複習。";return}const used=usedToday(),free=Math.max(0,DAILY_TARGET-used);$("today-total").textContent=`${fmt(used)} / 3 小時 30 分`;if(!free)list.append(el("div","empty","今天已達 3.5 小時目標！明天再接續。"));else{const tasks=plan(free);if(!tasks.length)list.append(el("div","empty","所有學習階段都完成了！"));for(const t of tasks){const row=el("label","taskrow"),input=el("input"),content=el("div","tasktext"),time=el("span","tasktime",fmt(t.minutes));input.type="checkbox";content.append(el("strong","",label(t.c,t.i)),el("small","",t.c.title));if(t.minutes<t.before)content.append(el("small","",`本次 ${fmt(t.minutes)}，其餘 ${fmt(t.before-t.minutes)} 下次繼續`));input.onchange=()=>{if(input.checked)markPlan(t)};row.append(input,content,time);list.append(row)}}const capacity=Math.max(0,daysUntil(MOCK_START)*DAILY_TARGET-used);notice.textContent=remainingAll()>capacity?`目前剩餘 ${fmt(remainingAll())}，以每日 3.5 小時計算，11/7 前可能需要優先安排重點。`:`今日已記錄 ${fmt(used)}，尚可安排 ${fmt(free)}。不必一天完成整章。`}
function renderList(){const list=$("chapter-list");list.replaceChildren();for(const c of chapters){const text=`${c.title} ${c.description}`.toLowerCase();if(query&&!text.includes(query))continue;if(filter==="done"&&!complete(c))continue;if(filter==="incomplete"&&complete(c))continue;const b=el("button","chapter-item"+(c.id===selected?" active":"")+(complete(c)?" completed":""));b.type="button";b.append(el("strong","",c.title),el("span","",complete(c)?"✓ 已完成":`${completed(c)} / 4 階段完成`));b.onclick=()=>{selected=c.id;setView("plan")};list.append(b)}if(!list.children.length)list.append(el("div","empty","沒有符合條件的章節"))}
function renderDetail(){const c=getSelected();$("chapter-category").textContent=c.id==="2026-10-25"?"ABDOMEN · 5.2":c.id==="2026-10-24"?"ABDOMEN · 5.1":"ABDOMEN · LECTURE";$("chapter-title").textContent=c.title;$("chapter-description").textContent=c.description;const s=$("chapter-status");s.className="status";if(complete(c)){s.textContent="已完成";s.classList.add("done")}else if(completed(c)||partial[c.id].some(Boolean)){s.textContent="進行中";s.classList.add("working")}else s.textContent="未開始";const p=$("set-priority");p.textContent=c.id===priority?"✓ 目前優先學習章節":"設為下一個學習章節";p.classList.toggle("active",c.id===priority);const vids=videoFor(c.id),vbox=$("chapter-video-info");vbox.replaceChildren();
if(!vids.length)vbox.append(el("p","muted","尚未設定影片時間，可點選「新增影片時間」。"));
for(const [index,v] of vids.entries()){
 const box=el("div","video-card");
 box.append(el("strong","",v.title),el("span","",`開始時間　${clock(v.start)}`),el("span","",`結束時間　${clock(v.end)}`));
 const edit=el("button","video-edit","編輯時間");edit.type="button";edit.onclick=()=>openVideoEditor(index);box.append(edit);vbox.append(box);
}
$("stage-count").textContent=`${completed(c)} / 4`;$("stage-progress").style.width=`${Math.round(done(c)/total(c)*100)}%`;const tasks=$("chapter-tasks");tasks.replaceChildren();durations(c).forEach((d,i)=>{const row=el("label","taskrow"+(progress[c.id][i]?" checked":"")),check=el("input"),content=el("div","tasktext"),time=el("span","tasktime");check.type="checkbox";check.checked=progress[c.id][i];content.append(el("strong","",label(c,i)));if(progress[c.id][i])time.textContent="✓ 已完成";else if(partial[c.id][i])time.textContent=`${fmt(partial[c.id][i])} / ${fmt(d)}`;else time.textContent=fmt(d);check.onchange=()=>{progress[c.id][i]=check.checked;partial[c.id][i]=check.checked?d:0;save();render()};row.append(check,content,time);tasks.append(row)});$("chapter-total-duration").textContent=fmt(total(c));$("chapter-done-duration").textContent=fmt(done(c));$("chapter-remaining-duration").textContent=fmt(remaining(c));$("chapter-duration-tip").textContent=complete(c)?"四階段已全部完成。":`以每天 3.5 小時計算，剩餘內容約需 ${Math.ceil(remaining(c)/DAILY_TARGET)} 天，可依自己的進度分多天完成。`}

function openVideoEditor(index=null){
 const c=getSelected(),items=videoFor(c.id),v=index===null?null:items[index];editingVideoIndex=index;
 $("video-form").hidden=false;
 $("video-title").value=v?.title||`Abdomen — ${c.title}`;
 $("video-start").value=v?clock(v.start):"0:00:00";
 $("video-end").value=v?clock(v.end):"";
 $("video-form-message").textContent="";
 $("video-title").focus();
}
function closeVideoEditor(){$("video-form").hidden=true;editingVideoIndex=null}
function saveVideo(event){
 event.preventDefault();const c=getSelected(),start=parseClock($("video-start").value),end=parseClock($("video-end").value),title=$("video-title").value.trim();
 if(!title||start===null||end===null||end<=start){$("video-form-message").textContent="請確認影片名稱及開始／結束時間（時:分:秒）。";return}
 const list=videoFor(c.id).map(v=>({...v}));const record={title,start,end,speed:(list[editingVideoIndex]?.speed||1.5),id:c.id};
 if(editingVideoIndex===null)list.push(record);else list[editingVideoIndex]=record;
 customVideoData[c.id]=list;
 localStorage.setItem(VIDEO_STORAGE_KEY,JSON.stringify(customVideoData));
 // Keep completed stages completed; cap partial minutes against changed estimates.
 durations(c).forEach((d,i)=>{partial[c.id][i]=progress[c.id][i]?d:Math.min(d,partial[c.id][i]||0)});
 save();closeVideoEditor();render();
}

function renderReview(){const box=$("review-summary");box.replaceChildren();const r=remainingAll(),days=daysUntil(MOCK_START);[["剩餘章節學習量",fmt(r)],["模擬考前可用時間",fmt(days*DAILY_TARGET)],["完成章節",`${chapters.filter(complete).length} / ${chapters.length} 章`]].forEach(([a,b])=>{const row=el("div","overview-row");row.append(el("span","",a),el("strong","",b));box.append(row)});if(r>days*DAILY_TARGET)box.append(el("div","notice","剩餘工作量超過每日 3.5 小時的可用時間，建議優先複習重要章節。"));$("mock-1").checked=mock.first===true;$("mock-2").checked=mock.second===true}
function render(){renderStats();renderDashboard();renderPlan();renderList();renderDetail();renderReview()}
$("toggle-video-editor").addEventListener("click",()=>openVideoEditor());
$("video-form").addEventListener("submit",saveVideo);
$("video-cancel").addEventListener("click",closeVideoEditor);
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.go)));
$("chapter-search").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();renderList()});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));renderList()}));
$("set-priority").addEventListener("click",()=>{priority=selected;save();render()});
$("mock-1").addEventListener("change",e=>{mock.first=e.target.checked;save()});
$("mock-2").addEventListener("change",e=>{mock.second=e.target.checked;save()});
$("backup").addEventListener("click",()=>{const keys=[STORAGE_KEY,PARTIAL_KEY,MOCK_KEY,DAILY_LOG_KEY,MIGRATION_KEY,PRIORITY_KEY,VIDEO_STORAGE_KEY,"anatomy-5-2"];const payload={exportedAt:new Date().toISOString(),storage:{}};keys.forEach(k=>payload.storage[k]=localStorage.getItem(k));const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`anatomy-progress-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
save();render();
