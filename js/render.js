import { state,todayKey,isDone,currentPoints,todayPoints,calculateStreak,flexTaskKey,ensureDailyPackRecord,ensureMissionTaskRows,PHASE1_TABLES,saveState,addPoints,currentCouplePoints,ensureCoupleWeekBoss,bossDayInfo,createDailySecretTask,updateCoupleStats,ensureSharedTasks } from './state.js';
import { dailyMissionPool, flexMissionPool, places,objects,harmonyQuestions, defaultSharedRewards, defaultCoupleChallenges } from './data.js';
import { periodKey,periodLabel,frequencyDescription,periodMeta } from './frequency.js';
import { $,esc,item,empty,btn } from './ui.js';
import { firebaseSummary } from './firebase.js';
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function parseTaskTitleMain(text){return String(text||'').split(/[：:]/)[0].trim()}
export function parseTaskContent(text){const raw=String(text||'');const parts=raw.split(/[：:]/);return parts.length>1?parts.slice(1).join('：').trim():raw.trim()}
export function getTaskDisplayContent(task){return parseTaskContent(task?.displayContent||task?.contentMain||task?.taskContent||task?.content||task?.title||task?.taskTitle||task?.name||'')}
export function getDisplayContent(text){return parseTaskContent(text)}
export function normalizeTaskText(text){return String(text||'').toLowerCase().replace(/[0-9０-９]+/g,'#').replace(/\s+/g,'').replace(/[，。！？、,.!?；;：:「」『』（）()\[\]【】｜|+＋\-—_]/g,'').replace(/(今天|今日|現在|請你|試著|一起|完成|進行|做一次|做一個|找空檔|輕鬆|快速|溫柔|穩定|挑戰|療癒|進階|本期|勇者|閃亮|任務#|第#輪|每週|每#天|每雙週|每月|每季|每年|#次|次)/g,'').trim()}
export function buildTaskSignature(task){const titleMain=normalizeTaskText(task?.titleMain||parseTaskTitleMain(task?.title||task?.taskTitle||task?.name||''));const content=normalizeTaskText(task?.contentMain||parseTaskContent(task?.title||task?.taskTitle||task?.name||'')||task?.description||'');const semantic=normalizeTaskText(task?.semanticKey||task?.baseTitle||'');const idea=normalizeTaskText(task?.ideaKey||task?.baseTitle||'');return [semantic||titleMain,idea||content,titleMain,content].filter(Boolean).join('::')}
export function isSimilarTask(a,b){if(!a||!b)return false;const aTitle=normalizeTaskText(parseTaskTitleMain(a.title||a.taskTitle||a.name||''));const bTitle=normalizeTaskText(parseTaskTitleMain(b.title||b.taskTitle||b.name||''));const aContent=normalizeTaskText(parseTaskContent(a.title||a.taskTitle||a.name||'')||a.description||'');const bContent=normalizeTaskText(parseTaskContent(b.title||b.taskTitle||b.name||'')||b.description||'');const aSem=normalizeTaskText(a.semanticKey||a.baseTitle||'');const bSem=normalizeTaskText(b.semanticKey||b.baseTitle||'');const aIdea=normalizeTaskText(a.ideaKey||a.baseTitle||'');const bIdea=normalizeTaskText(b.ideaKey||b.baseTitle||'');return Boolean((aTitle&&aTitle===bTitle)||(aContent&&aContent===bContent)||(aSem&&aSem===bSem)||(aIdea&&aIdea===bIdea)||buildTaskSignature(a)===buildTaskSignature(b))}
export function taskSignature(task){return buildTaskSignature(task)}
export function pickUniqueTasks(pool,count,existingTasks=[],seed='unique'){const picked=[];const ordered=[...pool].map(x=>({task:x,score:hash(seed+(x.id||x.title||''))})).sort((a,b)=>a.score-b.score).map(x=>x.task);for(const task of ordered){if([...existingTasks,...picked].some(x=>isSimilarTask(x,task)))continue;picked.push(task);if(picked.length>=count)break}return picked}
function seededIds(pool,seed,count,exclude=[],opts={}){const ex=new Set(exclude);const usedSig=new Set(opts.excludeSigs||[]);const existingTasks=opts.existingTasks||[];const pickedTasks=[];const ids=[];let longCount=0;for(const row of pool.map(x=>({task:x,score:hash(seed+x.id)})).sort((a,b)=>a.score-b.score)){if(ex.has(row.task.id))continue;if(opts.maxLongTerm!=null&&row.task.longTerm&&longCount>=opts.maxLongTerm)continue;const sig=taskSignature(row.task);if(usedSig.has(sig))continue;if([...existingTasks,...pickedTasks].some(t=>isSimilarTask(t,row.task)))continue;usedSig.add(sig);pickedTasks.push(row.task);ids.push(row.task.id);if(row.task.longTerm)longCount++;if(ids.length>=count)break}return ids}
function isTaskListValid(ids,pool,min){if(!Array.isArray(ids)||ids.length<min)return false;const sigs=new Set();let valid=0;for(const id of ids){const t=pool.find(x=>x.id===id);if(!t)continue;const sig=taskSignature(t);if(sigs.has(sig))return false;sigs.add(sig);valid++}return valid>=min}
function pickOne(pool,seed,currentIds=[],opts={}){return seededIds(pool,seed,1,currentIds,opts)[0]||''}
function dailySpecialPool(){return dailyMissionPool.filter(t=>t.pack!=='secret')}
function dailySecretPool(){return dailyMissionPool.filter(t=>t.pack==='secret')}
function flexActivePool(){return flexMissionPool.filter(t=>t.pack!=='secret')}
function sigsFromIds(pool,ids=[]){return ids.map(id=>pool.find(t=>t.id===id)).filter(Boolean).map(taskSignature)}
function tasksFromIds(pool,ids=[]){return ids.map(id=>pool.find(t=>t.id===id)).filter(Boolean)}
function habitDueSigs(){return habitDueList().map(taskSignature)}
function secretRowsForDate(date=todayKey()){return (state.secretTasks||[]).filter(x=>x.date===date&&!x.deletedAt)}
function selectedSecretTasks(){ensureMissions();return secretRowsForDate().map(r=>({...dailyMissionPool.find(x=>x.id===r.taskId),...r,taskId:r.taskId,status:r.status||'active'})).filter(x=>x.id||x.taskId)}
function settleExpiredFlexTask(task,oldPeriodKey){if(!task||!oldPeriodKey)return false;const settleKey=`${task.id}:${oldPeriodKey}`;state.missions.flex.settled=state.missions.flex.settled||{};if(state.missions.flex.settled[settleKey])return false;const done=Number(state.missions.flex.progress?.[settleKey]||0);const target=Number(task.target||task.frequencyRule?.count||1);state.missions.flex.settled[settleKey]={taskId:task.id,periodKey:oldPeriodKey,done,target,settledAt:new Date().toISOString(),completed:done>=target};if(done>0&&done<target){const bonus=Math.max(1,Math.ceil((done/target)*5));addPoints(bonus,'flexConsolation',`本期彈性任務未完成安慰獎勵：${task.title}（${done}/${target}）`,task.id)}return true}
function hasChallengeExpired(meta){if(!meta||!meta.challengeEnd)return false;return diffDaysKey(todayKey(),meta.challengeEnd)>0}

function startFlexMetaFor(task,date=todayKey()){
  const total=challengeDaysFromRule(task?.frequencyRule);
  const start=date;
  const end=addDaysToKey(start,total-1);
  return {periodKey:`${task.id}:${start}`,periodStart:start,periodEnd:end,totalDays:total,challengeEnd:end,startedAt:start,dayIndex:1,remainingDays:total};
}
function resetFlexSlotForTask(flex,task,slot,date=todayKey()){
  const meta=startFlexMetaFor(task,date);
  flex.periodMeta[task.id]=meta;
  flex.periodKeys[task.id]=meta.periodKey;
  flex.statuses[task.id]={status:'active',startedAt:date,updatedAt:new Date().toISOString()};
  flex.progress[meta.periodKey]=0;
  delete flex.todayDone[task.id];
  flex.swapCounts[String(slot)]=0;
  flex.swapped[String(slot)]=false;
  return meta;
}

export function ensureMissions(){
  let changed=false;
  const date=todayKey();
  const daily=state.missions.daily;
  const dailyPool=dailySpecialPool();
  const flexPool=flexActivePool();
  state.secretTasks=Array.isArray(state.secretTasks)?state.secretTasks:[];

  if(daily.date!==date||!isTaskListValid(daily.ids,dailyPool,3)){
    daily.date=date;daily.completed={};daily.swapped={};daily.packRewards={};
    daily.ids=seededIds(dailyPool,`daily-special:${date}`,3+(hash(date)%2),[],{excludeSigs:habitDueSigs()});
    changed=true;
  }

  const flex=state.missions.flex;flex.progress=flex.progress||{};flex.todayDone=flex.todayDone||{};flex.swapped=flex.swapped||{};flex.swapCounts=flex.swapCounts||{};flex.periodKeys=flex.periodKeys||{};flex.periodMeta=flex.periodMeta||{};flex.settled=flex.settled||{};flex.statuses=flex.statuses||{};
  if(flex.todayDate!==date){flex.todayDate=date;flex.todayDone={};changed=true;}
  let ids=Array.isArray(flex.ids)?[...flex.ids]:[];if(!isTaskListValid(ids,flexPool,5))ids=[];
  let longCount=0;const usedIds=[];const nextIds=[];const dailyTasksForDedupe=tasksFromIds(dailyPool,daily.ids);const dailySigs=dailyTasksForDedupe.map(taskSignature);
  for(let slot=0;slot<5;slot++){
    let id=ids[slot];let task=flexPool.find(x=>x.id===id);let meta=task?flex.periodMeta[id]:null;const status=flex.statuses[id]||{};const currentMeta=task?periodMeta(task.frequencyRule):null;let mustReplace=!task;
    if(task&&!meta){meta=resetFlexSlotForTask(flex,task,slot,date);changed=true;}
    if(task&&status.status==='completedWaitingRefresh'&&status.completedDate&&status.completedDate!==date){if(settleExpiredFlexTask(task,flex.periodKeys[id]||meta?.periodKey))changed=true;mustReplace=true;}
    if(task&&hasChallengeExpired(meta)){if(settleExpiredFlexTask(task,flex.periodKeys[id]||meta.periodKey))changed=true;mustReplace=true;}
    if(task&&task.longTerm&&longCount>=1)mustReplace=true;
    if(task&&nextIds.some(prev=>taskSignature(flexPool.find(x=>x.id===prev))===taskSignature(task)))mustReplace=true;
    if(task&&dailySigs.includes(taskSignature(task)))mustReplace=true;
    if(mustReplace){const excludeSigs=[...dailySigs,...sigsFromIds(flexPool,usedIds),...habitDueSigs()];const existingTasks=[...dailyTasksForDedupe,...tasksFromIds(flexPool,usedIds),...habitDueList()];id=pickOne(flexPool,`flex:${date}:${slot}:${Date.now()}`,usedIds,{maxLongTerm:longCount>=1?0:1,excludeSigs,existingTasks});task=flexPool.find(x=>x.id===id);if(task){resetFlexSlotForTask(flex,task,slot,date);}changed=true;}
    if(id&&task){nextIds.push(id);usedIds.push(id);if(task.longTerm)longCount++;}
  }
  flex.ids=nextIds;flex.date=flex.date||date;

  const existingSecrets=secretRowsForDate(date);
  const secretTasksForValidation=existingSecrets.map(r=>dailySecretPool().find(t=>t.id===r.taskId)||r);
  const validSecrets=existingSecrets.length>=1&&existingSecrets.length<=3&&existingSecrets.every(r=>dailySecretPool().some(t=>t.id===r.taskId))&&new Set(secretTasksForValidation.map(t=>normalizeTaskText(parseTaskTitleMain(t.title||'')))).size===secretTasksForValidation.length&&new Set(secretTasksForValidation.map(t=>normalizeTaskText(parseTaskContent(t.title||'')||t.description||''))).size===secretTasksForValidation.length&&!secretTasksForValidation.some((t,i)=>secretTasksForValidation.slice(i+1).some(o=>isSimilarTask(t,o)));
  if(!validSecrets){
    state.secretTasks=state.secretTasks.filter(r=>r.date!==date);
    const excludeSigs=[...dailySigs,...sigsFromIds(flexPool,flex.ids),...habitDueSigs()];
    const count=1+(hash(`secret:${date}`)%3);
    const existingTasks=[...dailyTasksForDedupe,...tasksFromIds(flexPool,flex.ids),...habitDueList()];
    const secretIds=seededIds(dailySecretPool(),`secret:${date}`,count,[],{excludeSigs,existingTasks});
    for(const [slot,taskId] of secretIds.entries()){
      const task=dailySecretPool().find(t=>t.id===taskId)||{};
      const revealDate=addDaysToKey(date,1);
      state.secretTasks.unshift({id:`secret_${date}_${slot}`,date,slot,taskId,status:'active',revealed:false,revealDate,revealedAt:null,visibleToPartnerAfterComplete:true,partnerCanSeeTitle:false,partnerCanSeeContent:false,titleMain:parseTaskTitleMain(task.title||''),contentMain:parseTaskContent(task.title||'')||task.description||'',semanticKey:task.semanticKey||task.baseTitle||'',ideaKey:task.ideaKey||task.baseTitle||'',source:'system',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),deletedAt:null,version:state.version||'phase13a'});
    }
    changed=true;
  }
  ensureDailyPackRecord(date,state.missions.daily.ids,state.missions.flex.ids);
  ensureMissionTaskRows('daily',date,state.missions.daily.ids);
  ensureMissionTaskRows('flex',date,state.missions.flex.ids);
  if(changed)saveState({source:'mission-generate'});
}
export function selectedDailyTasks(){ensureMissions();return state.missions.daily.ids.map(id=>dailySpecialPool().find(x=>x.id===id)).filter(Boolean)}
export function selectedFlexTasks(){ensureMissions();return state.missions.flex.ids.map(id=>flexActivePool().find(x=>x.id===id)).filter(Boolean)}
export function applyTheme(){document.body.classList.toggle('dark',state.settings.theme==='dark');$('#themeToggle').textContent=state.settings.theme==='dark'?'☀️':'🌙';$('#themeSelect')&&($('#themeSelect').value=state.settings.theme)}
function renderAllInternal(){
  ensureMissions();
  applyTheme();
  renderHeader();
  const active=document.querySelector('.page.active');
  const id=active?.id||'page-today';
  if(id==='page-today') renderToday();
  else if(id==='page-habits') renderHabits();
  else if(id==='page-logs') renderLogs();
  else if(id==='page-wallet') renderWallet();
  else if(id==='page-rewards') renderRewards();
  else if(id==='page-game') renderGame();
  else if(id==='page-couple') renderCouple();
  else if(id==='page-relationship') renderRelationship();
  else if(id==='page-adventure') renderAdventure();
  else if(id==='page-quests') renderQuestHub();
  else if(id==='page-challenges') renderChallengeHub();
  else if(id==='page-reports') renderReportHub();
  else if(id==='page-help') renderHelpGuide();
  else if(id==='page-stats') renderStats();
  else if(id==='page-settings') renderSettings();
  else if(id==='page-backup') renderBackup();
}
export function safeRender(){
  try{return renderAllInternal()}
  catch(e){console.error('render failed',e);const el=document.querySelector('#syncStatus');if(el)el.textContent='畫面更新失敗，請重新整理或匯出備份';}
}
export function renderAll(){return safeRender()}
export function renderCurrentPage(){return safeRender()}
function renderHeader(){$('#todayLabel').textContent=new Date().toLocaleDateString('zh-TW',{year:'numeric',month:'long',day:'numeric',weekday:'long'});$('#syncStatus').textContent=state.room.inviteCode?`房間：${state.room.inviteCode}｜${firebaseSummary()}`:firebaseSummary()}

function addDaysToKey(key,n){const d=new Date(key+'T00:00:00');d.setDate(d.getDate()+n);return todayKey(d)}
function diffDaysKey(a,b){const da=new Date(a+'T00:00:00'),db=new Date(b+'T00:00:00');return Math.floor((da-db)/86400000)}
function challengeDaysFromRule(rule){const base=Number(rule?.intervalDays)||({daily:1,weekly:7,tenDays:10,biweekly:14,monthly:30,quarterly:90,yearly:365}[rule?.type]||7);return base+Math.ceil(base/3)}
function stableFlexKey(t){const raw=state.missions.flex.periodKeys?.[t.id]||periodKey(t.frequencyRule);const key=String(raw||'');return key.startsWith(`${t.id}:`)?key:`${t.id}:${key}`}
function flexMetaForTask(t){const raw=state.missions.flex.periodMeta?.[t.id]||periodMeta(t.frequencyRule);const total=challengeDaysFromRule(t.frequencyRule);const start=raw.periodStart||todayKey();const elapsed=Math.max(1,diffDaysKey(todayKey(),start)+1);const end=addDaysToKey(start,total-1);const remain=Math.max(0,diffDaysKey(end,todayKey()));return {...raw,totalDays:total,dayNo:Math.min(total,elapsed),challengeEnd:end,remainingDays:remain}}
function habitDueList(){return (state.habits||[]).filter(h=>!h.deletedAt&&h.taskSource!=='system')}

function isSecretDone(row){return row?.status==='completed'||!!row?.completedAt}
function renderToday(){
  const fixed=selectedDailyTasks();
  const secrets=selectedSecretTasks();
  const flex=selectedFlexTasks();
  const doneFixed=fixed.filter(t=>isDone(t.id)).length;
  const doneSecret=secrets.filter(isSecretDone).length;
  const doneFlex=flex.filter(t=>Number(state.missions.flex.progress[stableFlexKey(t)]||0)>=Number(t.target||1)).length;
  const total=fixed.length+secrets.length+flex.length;
  const rate=total?Math.round((doneFixed+doneSecret+doneFlex)/total*100):0;
  $('#todayRate').textContent=`${rate}%`;
  $('#heroGreeting').textContent=rate>=100?'今天任務都完成了！':'今天先完成一小步';
  $('#todayPoints').textContent=todayPoints();$('#totalPoints').textContent=currentPoints();$('#dailyStreak').textContent=calculateStreak();$('#flexSummary').textContent=flex.length;
  renderPack(fixed,secrets,flex);
  $('#fixedTaskList').innerHTML=fixed.map((t,i)=>renderDailyCard(t,i)).join('')||empty('今天沒有今日特殊任務。');
  const secretBox=$('#secretTaskList');if(secretBox)secretBox.innerHTML=secrets.map(renderSecretCard).join('')||empty('今天沒有秘密任務。');
  $('#flexTaskList').innerHTML=flex.map((t,i)=>renderFlexCard(t,i)).join('')||empty('今天沒有本期彈性任務。')
}
function dueUserTasksByPack(key){const seen=new Set();return habitDueList().filter(h=>(h.pack||h.type||'side')===key).filter(t=>{const sig=taskSignature(t);if(seen.has(sig))return false;seen.add(sig);return true})}
function renderPack(daily=[],secrets=[],flex=[]){
  const systemBonus=daily.filter(t=>t.pack==='bonus');
  const groups=[['main','主線任務'],['side','支線任務'],['bonus','加分任務'],['secret','秘密任務']];
  $('#dailyPackGrid').innerHTML=groups.map(([key,title])=>{
    let arr=key==='secret'?[...secrets]:dueUserTasksByPack(key);
    if(key==='bonus')arr=[...arr,...systemBonus];
    const seen=new Set();arr=arr.filter(t=>{const sig=taskSignature(t);if(seen.has(sig))return false;seen.add(sig);return true});
    const done=arr.filter(t=>key==='secret'?isSecretDone(t):(t.target?Number(state.missions.flex.progress[stableFlexKey(t)]||0)>=t.target:isDone(t.id))).length;
    const total=arr.length;
    const pct=total?Math.min(100,done/total*100):0;
    const names=arr.slice(0,5).map(t=>{
      const label=key==='secret'?getTaskDisplayContent(t):(t.title||t.taskTitle||t.name||'未命名任務');
      return `・${esc(label||'完成一個秘密小任務')}`;
    }).join('<br>')||`今天沒有${title}。`;
    const condition=total?`完成條件：完成此分類今日出現的任務。`:`空狀態：可到習慣頁新增${title.replace('任務','')}，或等待系統生成。`;
    const reward=key==='main'?'額外獎勵：抽獎券 / 轉盤機會':key==='secret'?'額外獎勵：木寶箱 / 雙人點數 / Boss 小傷害':'額外獎勵：點數 / 轉盤機會';
    const claimed=!!state.missions.daily.packRewards?.[key];
    return `<article class="pack"><b>${title} <span class="pill ${done&&total?'green':''}">已完成 ${done} / 共 ${total}</span></b><small>${condition}<br>${reward}<br>${claimed?'已領取任務包獎勵':'尚未領取任務包獎勵'}</small><div class="pack-task-names">${names}</div><div class="progress"><span style="width:${pct}%"></span></div></article>`
  }).join('')
}
function renderDailyCard(t,slot){const ok=isDone(t.id);const swapped=state.missions.daily.swapped[String(slot)];const display=getTaskDisplayContent(t);return `<article class="item today-task-card ${ok?'done':''}"><div class="item-top"><div class="item-main"><div class="item-title">${ok?'✅ ':''}${esc(display)}</div><div class="item-sub">今日特殊任務｜${esc(t.category)}｜一天型｜+${t.points} 點
${esc(t.description)}</div></div><div class="actions">${btn(ok?'已完成':'完成任務',ok?'ghost small':'green small',`data-complete-daily="${t.id}"`)}${btn('恢復上一步','ghost small',`data-undo-daily="${t.id}"`)}${btn(swapped?'今日已換過':'換下一張',swapped?'ghost small':'pink small',`data-swap-daily="${slot}"`)}${btn('複製成我的習慣','purple small',`data-copy-daily="${t.id}"`)}${btn('說明','ghost small',`data-task-help="${t.id}" data-task-source="daily"`)}</div></div></article>`}
function renderSecretCard(row){const done=isSecretDone(row);const display=getTaskDisplayContent(row);return `<article class="item today-task-card ${done?'done':''}"><div class="item-top"><div class="item-main"><div class="item-title">${done?'✅ ':''}${esc(display||'完成一個秘密小任務')}</div><div class="item-sub">秘密任務｜一天型｜不可換 / 不可跳過 / 不可補救｜${done?'明天向對方揭曉任務名稱與內容':'完成前對方只知道有秘密任務進行中'}
${esc(row.description||'完成後可累積關係值、雙人點數與 Boss 小傷害。')}</div></div><div class="actions">${btn(done?'已完成':'完成',done?'ghost small':'pink small',`data-complete-secret="${row.id}" ${done?'disabled':''}`)}${btn('說明','ghost small',`data-secret-help="${row.id}"`)}</div></div></article>`}
function renderFlexCard(t,slot){const key=stableFlexKey(t);const done=Number(state.missions.flex.progress[key]||0);const target=Number(t.target||1);const todayDone=!!state.missions.flex.todayDone[t.id];const complete=done>=target;const status=state.missions.flex.statuses?.[t.id]?.status||'active';const waiting=status==='completedWaitingRefresh';const meta=flexMetaForTask(t);const swaps=(state.missions.flex.swapCounts||{})[String(slot)]||0;return `<article class="item today-task-card ${complete?'done':''}"><div class="item-top"><div class="item-main"><div class="item-title">${complete?'✅ ':''}${esc(t.title)} <span class="pill">第 ${meta.dayNo} 天 / 共 ${meta.totalDays} 天</span></div><div class="item-sub">本期彈性任務｜${esc(t.category)}｜${frequencyDescription(t.frequencyRule)}｜${done}/${target} 次｜剩餘 ${meta.remainingDays} 天｜狀態：${waiting?'已達標，明天換新':'進行中'}｜+${t.points} 點\n${esc(t.description)}</div></div><div class="actions">${btn(complete?'已完成任務':todayDone?'今日已完成':'完成任務',complete||todayDone?'ghost small':'green small',`data-complete-flex="${t.id}" ${complete||todayDone?'disabled':''}`)}${btn('恢復上一步','ghost small',`data-undo-flex="${t.id}"`)}${btn('部分完成','ghost small',`data-partial-flex="${t.id}"`)}${btn('跳過今天','ghost small',`data-skip-flex="${t.id}"`)}${btn(swaps?'再次換卡':'換下一張',swaps?'pink small':'pink small',`data-swap-flex="${slot}"`)}${btn('說明','ghost small',`data-task-help="${t.id}" data-task-source="flex"`)}</div></div></article>`}
function renderHabits(){
  $('#habitCount').textContent=`${state.habits.length} 個`;
  $('#habitList').innerHTML=state.habits.map(h=>{
    const rescueText=`補救：${h.allowRescue===false?'不允許':'允許'}｜${h.canDoubleComplete===false?'不可加倍':'可加倍'}${h.rescueHint?'｜提示：'+esc(h.rescueHint):''}`;
    const meta=`${esc(h.category)}｜${frequencyDescription(h.frequencyRule)}｜${packLabel(h.pack||h.type)}｜+${h.points} 點｜${rescueText}｜公開：${privacyLabel(h.visibility||'status')}`;
    const longSummary=renderHabitLongTermSummary(h);
    const actions=`${btn('完成','green small',`data-complete-habit="${h.id}"`)}${btn('部分完成','ghost small',`data-partial-habit="${h.id}"`)}${btn('補救','ghost small',`data-rescue-habit="${h.id}"`)}${btn('編輯','ghost small',`data-edit-habit="${h.id}"`)}${btn('複製','purple small',`data-copy-habit="${h.id}"`)}${btn('刪除','red small',`data-delete-habit="${h.id}"`)}`;
    return `<article class="item habit-card"><div class="item-top"><div class="item-main"><div class="item-title">${esc(h.title)}</div><div class="item-sub">${meta}</div>${longSummary}</div><div class="actions">${actions}</div></div></article>`;
  }).join('')||empty('尚未新增習慣。')
}
function packLabel(v){return {main:'主線任務',side:'支線任務',bonus:'加分任務',secret:'秘密任務'}[v]||'支線任務'}
function renderLogs(){const arr=Object.values(state.logs).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));$('#logList').innerHTML=arr.map(l=>item(esc(l.title),`${l.date}｜${esc(l.periodLabel||'')}｜+${l.points} 點`)).join('')||empty('尚無完成紀錄。')}
function dateRangeKeys(){const now=new Date();const day=now.getDay()||7;const weekStart=new Date(now);weekStart.setHours(0,0,0,0);weekStart.setDate(now.getDate()-day+1);const monthStart=new Date(now.getFullYear(),now.getMonth(),1);return {weekStart:todayKey(weekStart),monthStart:todayKey(monthStart),today:todayKey(now)}}
function ledgerStats(rows,startKey){const filtered=(rows||[]).filter(x=>!x.deletedAt&&String(x.date||'')>=startKey);const earned=filtered.filter(x=>Number(x.amount)>0).reduce((s,x)=>s+Number(x.amount||0),0);const spent=Math.abs(filtered.filter(x=>Number(x.amount)<0).reduce((s,x)=>s+Number(x.amount||0),0));return {earned,spent,net:earned-spent}}
function fmtSigned(n){n=Number(n)||0;return `${n>=0?'+':''}${n}`}
function setText(id,text){const el=$('#'+id);if(el)el.textContent=text}
function relationDelta(row,key){return Number(row?.[key] ?? (key==='heartbeat'?row?.companionship:0) ?? 0)||0}
function relationshipLogSum(startKey,key){return (state.relationshipLogs||[]).filter(x=>!x.deletedAt&&String(x.date||'')>=startKey).reduce((s,x)=>s+relationDelta(x,key),0)}
function wishInvestedSum(startKey,key){return (state.coupleWishLogs||[]).filter(x=>!x.deletedAt&&x.action==='invest'&&(!startKey||String(x.date||'')>=startKey)).reduce((s,x)=>s+Number(x[key]||0),0)}
function renderWallet(){
  const ranges=dateRangeKeys();
  const personal=(state.pointsLedger||[]).filter(x=>!x.deletedAt);
  const couple=(state.couplePointsLedger||[]).filter(x=>!x.deletedAt);
  const pWeek=ledgerStats(personal,ranges.weekStart), pMonth=ledgerStats(personal,ranges.monthStart);
  const cWeek=ledgerStats(couple,ranges.weekStart), cMonth=ledgerStats(couple,ranges.monthStart);
  setText('walletPersonalTotal',currentPoints());
  setText('walletPersonalWeekEarned',pWeek.earned);
  setText('walletPersonalWeekSpent',pWeek.spent);
  setText('walletPersonalMonthNet',fmtSigned(pMonth.net));
  setText('walletPersonalMonthDetail',`獲得 ${pMonth.earned}｜使用 ${pMonth.spent}`);
  setText('walletCoupleTotal',currentCouplePoints());
  setText('walletCoupleWeekEarned',cWeek.earned);
  setText('walletCoupleWeekSpent',cWeek.spent);
  setText('walletCoupleMonthNet',fmtSigned(cMonth.net));
  setText('walletCoupleMonthDetail',`獲得 ${cMonth.earned}｜使用 ${cMonth.spent}`);
  const rs=state.relationshipStats||{};const heartbeat=Number(rs.heartbeat ?? rs.companionship ?? 0)||0;
  const relWeek={intimacy:relationshipLogSum(ranges.weekStart,'intimacy')-wishInvestedSum(ranges.weekStart,'intimacy'),chemistry:relationshipLogSum(ranges.weekStart,'chemistry')-wishInvestedSum(ranges.weekStart,'chemistry'),heartbeat:relationshipLogSum(ranges.weekStart,'heartbeat')-wishInvestedSum(ranges.weekStart,'heartbeat')};
  const relMonth={intimacy:relationshipLogSum(ranges.monthStart,'intimacy')-wishInvestedSum(ranges.monthStart,'intimacy'),chemistry:relationshipLogSum(ranges.monthStart,'chemistry')-wishInvestedSum(ranges.monthStart,'chemistry'),heartbeat:relationshipLogSum(ranges.monthStart,'heartbeat')-wishInvestedSum(ranges.monthStart,'heartbeat')};
  const invested={intimacy:wishInvestedSum('', 'intimacy'),chemistry:wishInvestedSum('', 'chemistry'),heartbeat:wishInvestedSum('', 'heartbeat')};
  setText('walletRelIntimacy',Number(rs.intimacy||0));setText('walletRelChemistry',Number(rs.chemistry||0));setText('walletRelHeartbeat',heartbeat);
  setText('walletRelIntimacyChange',`本週 ${fmtSigned(relWeek.intimacy)}｜本月 ${fmtSigned(relMonth.intimacy)}`);
  setText('walletRelChemistryChange',`本週 ${fmtSigned(relWeek.chemistry)}｜本月 ${fmtSigned(relMonth.chemistry)}`);
  setText('walletRelHeartbeatChange',`本週 ${fmtSigned(relWeek.heartbeat)}｜本月 ${fmtSigned(relMonth.heartbeat)}`);
  setText('walletWishInvestedTotal',invested.intimacy+invested.chemistry+invested.heartbeat);
  setText('walletWishInvestedDetail',`親密 ${invested.intimacy}｜默契 ${invested.chemistry}｜心動 ${invested.heartbeat}`);
  const active=state.settings?.activeEffects?.doubleNext?item('⚡ 目前效果','下個任務點數 x2 生效中'):'';
  const personalList=$('#walletPersonalLedger');if(personalList)personalList.innerHTML=personal.slice(0,10).map(x=>item(`${Number(x.amount)>=0?'+':''}${esc(x.amount)} 個人點數`,`${esc(x.description||x.source||'點數紀錄')}｜${esc(x.date||'')}`)).join('')||empty('目前尚無個人點數紀錄。完成任務、任務線、寶箱或小遊戲後會累積。');
  const coupleList=$('#walletCoupleLedger');if(coupleList)coupleList.innerHTML=couple.slice(0,10).map(x=>item(`${Number(x.amount)>=0?'+':''}${esc(x.amount)} 雙人點數`,`${esc(x.description||x.source||'雙人點數紀錄')}｜${esc(x.date||'')}`)).join('')||empty('目前尚無雙人點數紀錄。完成共同任務、雙人挑戰、關係互動或 Boss 後可取得。');
  const relRows=[...(state.relationshipLogs||[]).filter(x=>!x.deletedAt).map(x=>({date:x.date,title:x.title||x.action||'關係互動',sub:`親密 ${fmtSigned(relationDelta(x,'intimacy'))}｜默契 ${fmtSigned(relationDelta(x,'chemistry'))}｜心動 ${fmtSigned(relationDelta(x,'heartbeat'))}${x.couplePoints?`｜雙人點數 ${fmtSigned(x.couplePoints)}`:''}`})),...(state.coupleWishLogs||[]).filter(x=>!x.deletedAt&&x.action==='invest').map(x=>({date:x.date,title:`投入願望：${x.title||x.wishId||''}`,sub:`親密 -${Number(x.intimacy||0)}｜默契 -${Number(x.chemistry||0)}｜心動 -${Number(x.heartbeat||0)}`}))].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,10);
  const relList=$('#walletRelationshipLedger');if(relList)relList.innerHTML=relRows.map(x=>item(esc(x.title||'關係值紀錄'),`${esc(x.sub)}｜${esc(x.date||'')}`)).join('')||empty('目前尚無關係值紀錄。完成今日靠近一點、默契挑戰、約會卡、深聊卡或雙人願望後會出現。');
  const itemHtml=renderWalletItemGroups();
  const box=$('#itemList');if(box)box.innerHTML=(active||'')+itemHtml;
  const recent=[...personal.slice(0,10).map(x=>({kind:'個人點數',title:`${Number(x.amount)>=0?'+':''}${x.amount} 點`,sub:x.description||x.source,date:x.date})),...couple.slice(0,10).map(x=>({kind:'雙人點數',title:`${Number(x.amount)>=0?'+':''}${x.amount} 點`,sub:x.description||x.source,date:x.date})),...(state.itemUseLogs||[]).filter(x=>!x.deletedAt).slice(0,10).map(x=>({kind:'道具使用',title:x.item||x.itemName||'道具',sub:x.effect||x.description||x.target,date:x.date}))].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,20);
  $('#ledgerList').innerHTML=recent.map(x=>item(`${esc(x.kind)}｜${esc(x.title)}`,`${esc(x.sub||'')}｜${esc(x.date||'')}`)).join('')||empty('目前尚無資料。完成任務、關係互動、小遊戲、Boss 或冒險後會累積紀錄。')
}
function walletItemCategory(it){const name=String(it.name||it.itemName||'');const type=String(it.itemType||it.category||'');if(['補救券','加倍卡','跳過券','換卡券','任務券'].includes(name))return '任務道具';if(['抽獎券','轉盤機會','木寶箱','銀寶箱','金寶箱','雙人寶箱'].some(x=>name.includes(x))||type==='ticket'||type==='chest'||type==='spin')return '遊戲道具';if(['火焰球','冰凍彈','破盾券','追加攻擊券','弱點卡','Boss 弱點卡','能量藥水','Boss 碎片'].some(x=>name.includes(x)))return 'Boss 道具';if(['地圖鑰匙','指南針','星光碎片','地圖換算券'].some(x=>name.includes(x))||type.includes('map'))return '地圖道具';if(['關係寶箱','約會卡','深聊卡','心動卡'].some(x=>name.includes(x))||type.includes('relationship'))return '關係道具';return '其他'}
function renderWalletItemGroups(){const groups=['任務道具','遊戲道具','Boss 道具','地圖道具','關係道具','其他'];const rows=(state.gameItems||state.items||[]).filter(x=>!x.deletedAt&&Number(x.quantity)>0).map(x=>({...x,_kind:'gameItem',_category:walletItemCategory(x)}));for(const c of (state.relationshipChests||[]).filter(x=>!x.deletedAt&&x.status!=='opened')){rows.push({id:c.id,name:c.name||'關係寶箱',quantity:1,itemType:'relationshipChest',description:`來源：${c.source||'關係互動'}。可獲得親密值、默契值、心動值、雙人點數、約會靈感卡、深聊卡、稱號或徽章。`,_kind:'relationshipChest',_category:'關係道具'});}if(!rows.length)return empty('目前尚無道具。完成任務、關係互動、小遊戲、Boss 或冒險後可取得道具。');return groups.map(g=>{const arr=rows.filter(x=>x._category===g);if(!arr.length)return '';return `<div class="wallet-item-group"><h3>${esc(g)}</h3><div class="list compact">${arr.map(x=>{const usage=itemEffectTextForWallet(x);const actions=x._kind==='relationshipChest'?`${btn('開啟','amber small',`data-open-relationship-chest="${x.id}"`)}${btn('說明','ghost small',`data-use-item-info="${x.id}"`)}`:itemActionButtons(x);return item(esc(x.name||x.itemName||'道具'),`數量：${Number(x.quantity||1)}｜分類：${esc(g)}\n用途：${esc(usage)}`,actions)}).join('')}</div></div>`}).join('')}
function itemEffectTextForWallet(it){const name=it?.name||it?.id||'';const m={'抽獎券':'前往翻牌使用，不會在錢包直接扣除。','轉盤機會':'前往轉盤使用，不會在錢包直接扣除。','補救券':'開啟補救流程，選擇昨天未完成的習慣。','加倍卡':'啟用後下一個任務點數 x2。','跳過券':'請在可跳過任務卡上使用。','換卡券':'請在本期彈性任務第二次以上換卡時使用。','任務券':'可作為任務活動或後續兌換用券。','火焰球':'攻擊本週 Boss，造成 30 傷害。','冰凍彈':'攻擊 Boss，並啟用今日任務傷害加成。','破盾券':'對 Boss 破盾並造成傷害。','追加攻擊券':'啟用下一次 Boss 攻擊加倍。','Boss 弱點卡':'啟用本週任務弱點傷害加成。','能量藥水':'使用後轉成雙人點數。','星光碎片':'集滿 5 個可合成銀寶箱。','地圖換算券':'啟用地圖步數加成，套用到下一個主線任務。','關係寶箱':'開啟後取得關係值、雙人點數或關係卡片。'};if(String(name).includes('寶箱'))return m[name]||'開啟寶箱並獲得隨機獎勵。';return m[name]||it?.description||'可使用道具。'}
function itemActionButtons(x){const n=x.name;const usable=Number(x.quantity||0)>0;const useBtn=usable?btn('使用','purple small',`data-use-item="${x.id}"`):'';const info=btn('說明','ghost small',`data-use-item-info="${x.id}"`);return useBtn+info}
function renderRewards(){$('#rewardCount').textContent=`${state.rewards.length} 個`;$('#rewardList').innerHTML=state.rewards.map(r=>{const stock=r.stock!==''&&r.stock!=null?`｜庫存 ${r.stock}`:'';const weekly=r.weeklyLimit?`｜每週上限 ${r.weeklyLimit}`:'';return item(esc(r.name),`${esc(r.category)}｜需要 ${r.cost} 點${stock}${weekly}${r.note?`\n${esc(r.note)}`:''}`,`${btn('兌換','amber small',`data-redeem="${r.id}"`)}${btn('編輯','ghost small',`data-edit-reward="${r.id}"`)}${btn('刪除','red small',`data-delete-reward="${r.id}"`)}`)}).join('')||empty('尚未新增獎勵。');const box=$('#rewardRedemptionList');if(box){box.innerHTML=state.rewardRedemptions.slice(0,30).map(r=>item(`${r.used?'✅ ':''}${esc(r.name||r.rewardName||'獎勵')}`,`花費 ${r.finalCost??r.cost} 點${r.discountUsed?'｜已用折價券':''}｜${r.date||''}${r.note?`\n備註：${esc(r.note)}`:''}`,`${btn(r.used?'已使用':'標記已使用',r.used?'ghost small':'green small',`data-use-redemption="${r.id}"`)}${btn('備註','ghost small',`data-note-redemption="${r.id}"`)}`)).join('')||empty('尚無兌換紀錄。')}}
function renderGame(){
  const ticket=state.gameItems.find(x=>x.name==='抽獎券')?.quantity||0;const dropClaimed=state.gameLogs.some(x=>x.date===todayKey()&&x.action==='quickDrop'&&!x.deletedAt);const dropBtn=$('#quickDropBtn');if(dropBtn){dropBtn.textContent=dropClaimed?'今日份已領':'領取今日小補給';dropBtn.disabled=dropClaimed;}
  const spins=state.gameItems.find(x=>x.name==='轉盤機會')?.quantity||0;
  const todaySpins=state.gameLogs.filter(x=>x.date===todayKey()&&x.action==='spinWheel'&&!x.deletedAt).length;
  const lastFlip=state.gameLogs.find(x=>x.action==='flip'&&!x.deletedAt);
  const lastSpin=state.gameLogs.find(x=>x.action==='spinWheel'&&!x.deletedAt);
  $('#flipArea').innerHTML=[0,1,2].map(i=>`<button type="button" class="flip-card" data-flip-index="${i}"><span>?</span><small>抽獎券 ${ticket}</small></button>`).join('');
  const flipBox=$('#flipResult');if(flipBox)flipBox.innerHTML=lastFlip?item('最近翻牌結果',`${esc(lastFlip.description)}｜${lastFlip.createdAt?new Date(lastFlip.createdAt).toLocaleString('zh-TW'):lastFlip.date}`):empty('按翻牌後會顯示結果。');
  const wheel=$('#wheelArea');if(wheel)wheel.innerHTML=`<div class="wheel-card"><div class="wheel-icon">🎡</div><b>今日轉盤 ${todaySpins}/3</b><span>可用機會：${spins}</span><small>獎項：點數加倍、額外點數、折價券、休息券、隨機任務券</small></div>`;
  const wheelBox=$('#wheelResult');if(wheelBox)wheelBox.innerHTML=lastSpin?item('最近轉盤結果',`${esc(lastSpin.description)}｜${lastSpin.createdAt?new Date(lastSpin.createdAt).toLocaleString('zh-TW'):lastSpin.date}`):empty('完成每日任務包後可取得轉盤機會。');
  const chests=state.gameItems.filter(x=>x.name.includes('寶箱')&&Number(x.quantity)>0);
  $('#chestList').innerHTML=chests.map(c=>item(esc(c.name),`數量：${c.quantity}｜${chestHint(c.name)}`,btn('開箱','amber small',`data-open-chest="${c.id}"`))).join('')||empty('目前沒有寶箱。連續獎勵、任務包、任務線、Boss 或共同任務都可以取得。');
  const gl=$('#gameLogList');if(gl)gl.innerHTML=state.gameLogs.slice(0,15).map(x=>item(esc(x.description||x.action),`${x.date||''}｜${esc(x.action||'game')}`)).join('')||empty('尚無遊戲紀錄。');
}
function chestHint(name){if(name==='木寶箱')return '小量點數、抽獎券、補救券';if(name==='銀寶箱')return '中量點數、抽獎券、加倍卡';if(name==='金寶箱')return '大量點數、徽章、稀有券';if(name==='雙人寶箱')return '雙人任務與共同挑戰獎勵';return '隨機獎勵'}
function renderCouple(){
  updateCoupleStats();
  ensureSharedTasks();
  const room=state.room.inviteCode?`已加入房間：${state.room.name||'雙人房間'}｜邀請碼：${state.room.inviteCode}`:'尚未加入房間。可建立邀請碼或輸入邀請碼加入。';
  $('#roomStatus').textContent=room;$('#roomStatus').className=`cloud-box ${state.room.inviteCode?'ok':'warn'}`;$('#roomName').value=state.room.name||'';if(document.activeElement?.id!=='inviteCode')$('#inviteCode').value=state.room.inviteCode||'';
  const members=state.room.members.length?state.room.members:[{name:'我',email:'本機成員'}];$('#memberList').innerHTML=members.map(m=>item(esc(m.name||m.email||'成員'),esc(m.email||'本機 / 等待同步'))).join('');
  const assignedBox=$('#assignedTaskList');if(assignedBox)assignedBox.innerHTML=(state.assignedTasks||[]).slice(0,12).map(t=>{
    const pending=t.status==='pending'; const accepted=t.status==='accepted'||t.status==='changePending'||t.status==='deletePending'; const completed=t.status==='completed';
    const actions=[pending?btn('接受','green small',`data-accept-assigned="${t.id}"`):'',pending?btn('拒絕','red small',`data-reject-assigned="${t.id}"`):'',!completed?btn('提出修改','ghost small',`data-request-edit-assigned="${t.id}"`):'',!completed?btn('提出刪除','red small',`data-request-delete-assigned="${t.id}"`):'',accepted?btn('完成','green small',`data-complete-assigned="${t.id}"`):'',t.status==='changePending'||t.status==='deletePending'?btn('同意變更','purple small',`data-approve-assigned-change="${t.id}"`):'',t.status==='changePending'||t.status==='deletePending'?btn('拒絕變更','ghost small',`data-reject-assigned-change="${t.id}"`):'',btn('複製成新任務','ghost small',`data-copy-assigned="${t.id}"`)].join('');
    const reward=(t.rewardRules||[]).slice(0,2).map(rewardRuleShortLabel).join('、')||`${t.points||0} 點`;
    return item(esc(t.title),`${packLabel(t.taskType||t.type||'side')}｜${esc(assignStatusLabel(t.status))}｜給：${esc(t.receiverName||'對方')}\n頻率：${esc(t.frequency||t.frequencyRule?.type||'一次性')}｜目標：${t.targetAmount||1}${esc(t.targetUnit||'次')}｜${t.canDoubleComplete===false?'不可加倍':'可加倍'}｜補救：${t.allowRescue===false?'不允許':'允許'}\n系統獎勵：${esc(reward)}｜指派者額外獎勵：${esc(t.extraReward||'無')}`,actions)
  }).join('')||empty('尚未有對方指派任務。');
  $('#supportTarget').innerHTML=state.users.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('');
  $('#supportInbox').innerHTML=state.supportLogs.slice(0,8).map(s=>item(`${esc(s.type)}｜${esc(s.toName)}`,`${esc(s.message)}｜${s.date}`)).join('')||empty('尚無支援紀錄。');
  const cs=state.coupleStats||{};const boss=ensureCoupleWeekBoss();const bd=bossDayInfo(boss);
  $('#coupleBattleStats').innerHTML=[
    ['今日戰況',`我 ${cs.myTodayCompleted||0} / 對方 ${cs.partnerTodayCompleted||0}`,`秘密任務 ${cs.secretCompleted||0}｜今日雙人點數 ${currentCouplePoints()}`],
    ['本週戰況',`本週稱號：${cs.weeklyTitle||'默契練習中'}`,`共同任務 ${(cs.sharedProgress||[]).length} 個進行中`],
    ['Boss 戰況',`${boss.name} HP ${boss.hp}/${boss.maxHp}`,`第 ${bd.day} 天 / 共 7 天｜${bossStatusLabel(boss.status)}`]
  ].map(x=>`<article class="stat-card"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></article>`).join('');
  $('#coupleBossBox').innerHTML=`<b>${boss.emoji||'👾'} ${esc(boss.name)}</b>｜HP ${boss.hp}/${boss.maxHp}｜第 ${bd.day} 天 / 共 7 天\n${esc(boss.description||'完成任務扣 Boss HP，擊敗後取得雙人寶箱。')}\n狀態：${bossStatusLabel(boss.status)}\n我的傷害：${boss.myDamage||0}｜對方傷害：${boss.partnerDamage||0}\n個人習慣：${boss.habitDamage||0}｜共同任務：${boss.sharedQuestDamage||0}｜雙人挑戰：${boss.challengeDamage||0}\n秘密任務：${boss.secretTaskDamage||0}｜冒險：${boss.adventureDamage||0}｜道具：${boss.itemDamage||0}<div class="progress"><span style="width:${Math.max(0,Math.min(100,Number(boss.hp||0)/Number(boss.maxHp||1)*100))}%"></span></div><div class="actions">${btn('查看 Boss 戰報','ghost small',`data-boss-report="${boss.id}"`)}${boss.status==='pendingReward'||boss.status==='defeated'?btn('領取 Boss 獎勵','amber small',`data-claim-boss="${boss.id}"`):''}</div>`;
  $('#privacyHabitList').innerHTML=(state.habits||[]).slice(0,20).map(h=>item(esc(h.title||'未命名習慣'),`目前公開範圍：${privacyLabel(h.visibility||'status')}`,`<select data-privacy-habit="${h.id}"><option value="public" ${h.visibility==='public'?'selected':''}>完全公開</option><option value="status" ${!h.visibility||h.visibility==='status'?'selected':''}>只公開狀態</option><option value="secret" ${h.visibility==='secret'?'selected':''}>隱藏任務</option><option value="private" ${h.visibility==='private'?'selected':''}>私密</option></select>`)).join('')||empty('尚未建立習慣；未來新增習慣後可在這裡設定公開範圍。');
  $('#sharedQuestList').innerHTML=(state.sharedTaskProgress||[]).filter(p=>!p.deletedAt&&p.status!=='replaced'&&p.status!=='skipped').map(p=>{const q=(state.sharedTasks||state.sharedQuests).find(x=>x.id===p.questId)||p;const start=new Date((p.periodStart||todayKey())+'T00:00:00');const day=Number(p.dayIndex||Math.min(Number(p.totalDays||q.totalDays||1),Math.max(1,Math.floor((new Date()-start)/86400000)+1)));const remain=Math.max(0,Math.ceil((new Date((p.periodEnd||todayKey())+'T23:59:59')-new Date())/86400000));const rewardText=[q.reward?.couplePoints?`雙人點數 +${q.reward.couplePoints}`:'',q.reward?.bossDamage?`Boss 傷害 +${q.reward.bossDamage}`:'',q.reward?.item?getDisplayContent(q.reward.item):''].filter(Boolean).join('｜')||'依完成率給獎勵';return item(esc(q.title||p.title||p.questId),`${esc(getDisplayContent(q.description||p.description||'共同任務'))}
${q.scope||p.scope||'weekly'}｜第 ${day} 天 / 共 ${p.totalDays||q.totalDays||'?'} 天｜剩餘 ${remain} 天
進度：${p.progress||0}/${p.target||q.target||1}｜我的貢獻 ${p.myProgress||0} / 對方 ${p.partnerProgress||0}
完成獎勵：${esc(rewardText)}
安慰獎勵：30% / 80% 依完成率給`, `${btn('提出換下一張','ghost small',`data-request-shared-change="${p.id}" data-shared-action="swap"`)}${btn('提出跳過','ghost small',`data-request-shared-change="${p.id}" data-shared-action="skip"`)}`, p.status==='completed')}).join('')||empty('共同任務會根據雙人習慣與活躍度自動生成，到期才結算。');
  const reqBox=$('#sharedTaskRequestList');if(reqBox)reqBox.innerHTML=(state.sharedTaskChangeRequests||[]).filter(r=>r.status==='pending'&&!r.deletedAt).map(r=>item('共同任務變更待同意',`${r.requestType==='swap'?'提出換下一張':'提出跳過'}｜${r.reason||'等待對方同意'}`,`${btn('同意','green small',`data-respond-shared-change="${r.id}" data-approve="true"`)}${btn('拒絕','ghost small',`data-respond-shared-change="${r.id}" data-approve="false"`)}`)).join('')||'';
  $('#couplePointsBox').textContent=`目前雙人點數：${currentCouplePoints()} 點`;
  const sharedRewardRows=[...defaultSharedRewards.map(r=>({...r,source:'builtin'})),...(state.sharedRewards||[]).filter(r=>!r.deletedAt)].filter(r=>!r.deletedAt);
  $('#sharedRewardList').innerHTML=sharedRewardRows.slice(0,120).map(r=>item(esc(getDisplayContent(r.name)),`${esc(r.category||'其他')}｜需要 ${r.cost} 雙人點數｜${r.source==='builtin'?'內建靜態':'自訂'}
${esc(getDisplayContent(r.description||r.note||''))}`,`${r.source==='builtin'?'':btn('編輯','ghost small',`data-edit-shared-reward="${r.id}"`)}${btn('複製','ghost small',`data-copy-shared-reward="${r.id}"`)}${r.source==='builtin'?'':btn('刪除','red small',`data-delete-shared-reward="${r.id}"`)}${btn('兌換','pink small',`data-redeem-shared="${r.id}"`)}`)).join('')||empty('尚未建立雙人獎勵。');
  $('#sharedRedemptionList').innerHTML=(state.sharedRewardRedemptions||[]).slice(0,8).map(r=>item(esc(r.name),`${r.date||''}｜${r.used?'已使用':'未使用'}｜${r.cost} 點`)).join('')||empty('尚無雙人兌換紀錄。');
  const cwp=$('#coupleWishPanel');if(cwp)cwp.innerHTML=renderWishPoolList();
  const secret=createDailySecretTask();
  const yesterday=addDaysToKey(todayKey(),-1);
  const revealed=(state.coupleSecretTasks||[]).filter(x=>x.date===yesterday&&x.status==='completed'&&!x.deletedAt).map(x=>`昨日秘密任務揭曉：${x.title}`).join('\n');
  $('#secretTaskBox').innerHTML=item(secret.status==='completed'?'✅ 完成秘密任務':'今日秘密任務',secret.status==='completed'?`對方今天會看到：已完成秘密任務，明天揭曉${revealed?'\n'+revealed:''}`:`自己的內容：${secret.title}\n完成前對方只知道「有秘密任務進行中」，完成後明天揭曉名稱與內容。`);
  $('#coupleChallengeList').innerHTML=(state.coupleChallenges||[]).filter(c=>!c.deletedAt).map(c=>renderChallengeItem(c,'couple')).join('')||empty('尚無雙人挑戰。');
  $('#coupleReportList').innerHTML=[...(state.coupleBattleReports||[]).slice(0,5),...(state.bossBattleReports||[]).slice(0,3)].map(r=>item(`${r.scope==='boss'?'Boss':r.scope==='weekly'?'每週':'每日'}戰報`,`${r.date||''}\n${esc(r.text||'')}`,`${btn('另存快照','ghost small',`data-save-report-snapshot="${r.id}"`)}`)).join('')||empty('尚未產生雙人戰報。');
}
function bossStatusLabel(s){return {active:'戰鬥中',defeated:'已擊敗',pendingReward:'可領獎',claimed:'已領獎',expired:'已封存'}[s]||s||'戰鬥中'}
function renderChallengeItem(c,context='couple'){const leader=Number(c.myProgress||0)>Number(c.partnerProgress||0)?'我暫時領先':Number(c.myProgress||0)<Number(c.partnerProgress||0)?'對方暫時領先':'目前平手';const status=c.status||'active';const ended=status==='completed'||status==='abandoned'||status==='deleted';const disabled=ended?'disabled':'';const actions=[btn('完成 / 記錄進度','green small',`data-complete-challenge="${c.id}" ${disabled}`),btn('部分完成','amber small',`data-partial-challenge="${c.id}" ${c.partialAllowed===false||ended?'disabled':''}`),btn('補救','purple small',`data-rescue-challenge="${c.id}" ${c.allowRescue===false||ended?'disabled':''}`),btn('編輯','ghost small',context==='hub'?`data-edit-challenge-hub="${c.id}"`:`data-edit-challenge="${c.id}"`),btn('複製','ghost small',`data-copy-challenge="${c.id}"`),btn('刪除','red small',`data-delete-challenge="${c.id}"`),btn('開始','primary small',`data-start-challenge="${c.id}" ${status==='active'?'disabled':''}`),btn('放棄','ghost small',`data-abandon-challenge="${c.id}" ${ended?'disabled':''}`),btn('結算','pink small',`data-settle-challenge="${c.id}" ${status==='completed'?'disabled':''}`)].join('');const mode={cooperate:'合作',competitive:'競爭',separate:'各自完成',cumulative:'累積達標'}[c.challengeType]||c.challengeType||'合作';const reward=[c.reward?.couplePoints?`雙人點數 +${c.reward.couplePoints}`:'',c.reward?.bossDamage?`Boss 傷害 +${c.reward.bossDamage}`:'',c.reward?.intimacy?`親密值 +${c.reward.intimacy}`:'',c.reward?.chemistry?`默契值 +${c.reward.chemistry}`:'',c.reward?.heartbeat?`心動值 +${c.reward.heartbeat}`:'',c.reward?.item?getDisplayContent(c.reward.item):'',c.reward?.custom?getDisplayContent(c.reward.custom):''].filter(Boolean).join('｜')||'未設定';return item(esc(c.title||'未命名雙人挑戰'),`${esc(getDisplayContent(c.description||''))}
${c.scope||c.frequency||'weekly'}｜${mode}｜${c.progress||0}/${c.target||1}${esc(c.targetUnit||'次')}
我 ${c.myProgress||0} / 對方 ${c.partnerProgress||0}｜${leader}
分類：${esc(c.category||'其他')}｜任務類型：${esc(c.taskType||c.type||'side')}｜公開：${privacyLabel(c.visibility||'status')}
獎勵：${esc(reward)}｜狀態：${status==='completed'?'完成':status==='abandoned'?'放棄':'進行中'}`,actions,status==='completed')}
function privacyLabel(v){return {public:'完全公開',status:'只公開狀態',secret:'隱藏任務',private:'私密'}[v]||'只公開狀態'}

function weekKeyOf(date=new Date()){
  const d=new Date(date);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(0,0,0,0);return todayKey(d);
}
function coupleWishStatus(w){
  if(w.status==='已完成'||w.status==='completed')return '已完成';
  const ready=Number(w.investedIntimacy||0)>=Number(w.requiredIntimacy||0)&&Number(w.investedChemistry||0)>=Number(w.requiredChemistry||0)&&Number(w.investedHeartbeat||0)>=Number(w.requiredHeartbeat||0);
  const invested=Number(w.investedIntimacy||0)+Number(w.investedChemistry||0)+Number(w.investedHeartbeat||0);
  if(ready)return '已達標';if(invested>0)return '累積中';return '想做';
}
function wishProgressText(w){return `親密值：${Number(w.investedIntimacy||0)} / ${Number(w.requiredIntimacy||0)}
默契值：${Number(w.investedChemistry||0)} / ${Number(w.requiredChemistry||0)}
心動值：${Number(w.investedHeartbeat||0)} / ${Number(w.requiredHeartbeat||0)}`}
function renderWishPoolList(){return (state.coupleWishPool||[]).filter(w=>!w.deletedAt).map(w=>item(esc(w.title),`${esc(w.category||'其他')}｜期待程度 ${w.excitementLevel||3}
${wishProgressText(w)}
狀態：${coupleWishStatus(w)}`,`${btn('投入數值','pink small',`data-invest-wish="${w.id}"`)}${btn('標記完成','green small',`data-complete-wish="${w.id}"`)}${btn('編輯','ghost small',`data-edit-wish="${w.id}"`)}${btn('複製','ghost small',`data-copy-wish="${w.id}"`)}${btn('刪除','red small',`data-delete-wish="${w.id}"`)}`)).join('')||empty('尚未建立雙人願望。')}
function renderRelationship(){
  ensureRelationshipCardsForToday();
  const stats=state.relationshipStats||{intimacy:0,chemistry:0,heartbeat:0};
  const weekLogs=relationshipLogsThisWeek();
  const completedCards=weekLogs.filter(l=>['completeCloseToday','chemistrySuccess','chemistryTry','completeDateIdea','completeDeepTalk'].includes(l.action)).length;
  const statsBox=$('#relationshipStatsBox');
  if(statsBox)statsBox.innerHTML=[
    ['親密值',stats.intimacy||0,'來自關心、肯定、深聊與約會完成'],
    ['默契值',stats.chemistry||0,'來自默契挑戰、猜答案與深聊'],
    ['心動值',stats.heartbeat||stats.companionship||0,'來自約會、願望、驚喜與回顧'],
    ['本週互動',weekLogs.length,'本週關係紀錄總數'],
    ['本週卡片完成',completedCards,'靠近一點、默契、約會與深聊']
  ].map(x=>`<article class="stat-card relationship-stat"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></article>`).join('');
  const close=cardById('closeTodayCards',state.currentRelationshipCards?.closeTodayId)||state.closeTodayCards?.[0];
  const closeDone=(state.relationshipLogs||[]).some(l=>l.date===todayKey()&&l.cardId===close?.id&&l.action==='completeCloseToday'&&!l.deletedAt);
  const swapped=!!state.currentRelationshipCards?.closeTodaySwapped;
  const closeActions=(closeDone?btn('今日已完成','ghost small','disabled'):btn('完成今日靠近一點','pink small','id="completeCoupleTaskBtn"'))+(swapped?btn('今日已換過','ghost small','disabled'):btn('今天換一題','ghost small','id="changeCoupleTaskBtn"'));
  const closeBox=$('#todayCoupleTask');if(closeBox)closeBox.innerHTML=relationshipCardItem(close,closeActions,{type:'closeToday',done:closeDone,pressureFree:true});
  const chem=cardById('chemistryChallengeCards',state.currentRelationshipCards?.chemistryId)||state.chemistryChallengeCards?.[0];
  const hq=$('#harmonyQuestion');if(hq)hq.innerHTML=chem?relationshipCardItem(chem,'',{type:'chemistry',pressureFree:true,compact:true}):empty('尚無默契挑戰。');
  const date=cardById('dateIdeaCards',state.currentRelationshipCards?.dateIdeaId)||state.dateIdeaCards?.[0];
  const talk=cardById('deepTalkCards',state.currentRelationshipCards?.deepTalkId)||state.deepTalkCards?.[0];
  const dateBox=$('#dateCardBox');if(dateBox)dateBox.innerHTML=relationshipCardItem(date,'',{type:'dateIdea',pressureFree:true,compact:true});
  const talkBox=$('#talkCardBox');if(talkBox)talkBox.innerHTML=relationshipCardItem(talk,'',{type:'deepTalk',pressureFree:true,compact:true});
  const bal=$('#coupleWishBalanceBox');if(bal)bal.innerHTML=`<div class="balance-line"><b>可用關係值</b><span>親密 ${state.relationshipStats?.intimacy||0}｜默契 ${state.relationshipStats?.chemistry||0}｜心動 ${state.relationshipStats?.heartbeat||state.relationshipStats?.companionship||0}</span></div><div class="balance-line"><span>願望池使用三種關係值慢慢投入；雙人點數保留給雙人獎勵直接兌換。</span></div>`;
  const converted=weeklyPersonalConverted();
  const remain=Math.max(0,100-converted);
  const canGain=Math.floor(remain/5);
  const convertBox=$('#personalToCoupleConvertBox');if(convertBox)convertBox.innerHTML=`<div class="convert-grid"><div><b>本週個人點數轉換額度</b><p>已轉換 ${converted} / 100 個人點數，可再轉換 ${remain} 個人點數，最多再得到 ${canGain} 雙人點數。</p><small>比例：5 個人點數 = 1 雙人點數，每週一 00:00 重置。</small></div><label>轉換個人點數<input id="personalConvertAmount" type="number" min="5" step="5" value="50"></label><button id="convertPersonalToCoupleBtn" class="btn pink" type="button">確認轉換</button></div>`;
  const wish=$('#wishPoolList');if(wish)wish.innerHTML=(state.coupleWishPool||[]).filter(x=>!x.deletedAt).slice(0,30).map(w=>{const status=coupleWishStatus(w);const done=status==='已完成';const reached=status==='已達標';const actions=[btn('投入數值','pink small',`data-invest-wish="${w.id}"`),done?btn('已完成','ghost small','disabled'):btn(reached?'標記完成':'標記完成','green small',`data-complete-wish="${w.id}"`),btn('編輯','ghost small',`data-edit-wish="${w.id}"`),btn('複製','ghost small',`data-copy-wish="${w.id}"`),btn('刪除','red small',`data-delete-wish="${w.id}"`)].join('');const desc=`願望說明：${esc(w.description||w.content||'未填寫')}\n分類：${esc(w.category||'其他')}｜期待程度：${esc(String(w.excitementLevel||w.expectation||'3'))}｜狀態：${status}\n${wishProgressText(w)}`;return item(esc(w.title),desc,actions,done)}).join('')||empty('尚無願望。可以把約會靈感卡或深聊卡加入願望池，也可以手動新增。');
  const chestSourceCount=weekLogs.filter(l=>['completeCloseToday','chemistrySuccess','chemistryTry','completeDateIdea','completeDeepTalk','completeWish','relationshipReview'].includes(l.action)).length;const availableChests=(state.relationshipChests||[]).filter(x=>!x.deletedAt&&x.status!=='opened').length;const weeklyChests=(state.relationshipChests||[]).filter(x=>!x.deletedAt&&new Date(x.createdAt||x.date||0)>=new Date(Date.now()-7*86400000)).length;const chestSummary=$('#relationshipChestSummary');if(chestSummary)chestSummary.innerHTML=`<div class="balance-line"><b>本週獲得關係寶箱：${weeklyChests} 個</b><span>來源：完成 ${chestSourceCount} 次關係互動</span></div><div class="balance-line"><span>寶箱可能包含親密值、默契值、心動值、雙人點數、約會靈感卡、深聊卡、關係稱號或關係徽章。</span><span>${availableChests>0?'有寶箱可開啟':'目前沒有待開啟寶箱'}</span></div>`;const ch=$('#relationshipChestList');if(ch)ch.innerHTML=(state.relationshipChests||[]).filter(x=>!x.deletedAt).slice(0,12).map(c=>{const opened=c.status==='opened';const actions=opened?btn('已開啟','ghost small','disabled'):(btn('開啟','pink small',`data-open-relationship-chest="${c.id}"`)+btn('前往錢包','ghost small','data-page="wallet"'));return item(esc(c.name||'關係寶箱'),`${opened?'已開啟':'可開啟'}｜來源：${esc(c.source||'關係互動')}\n可獲得：${esc(c.rewardLabel||'親密值 / 默契值 / 心動值 / 雙人點數')}`,actions,opened)}).join('')||empty('完成今日靠近一點、默契挑戰、約會靈感卡、深聊卡、雙人願望或每週關係回顧後，可取得關係寶箱。');
  const reviews=$('#relationshipReviewList');if(reviews)reviews.innerHTML=(state.relationshipReviews||[]).filter(x=>!x.deletedAt).slice(0,5).map(r=>item(`${r.scope==='weekly'?'每週':'每日'}關係回顧`,`${r.periodKey||r.date||''}\n${esc(r.latestText||r.text||'')}`,btn('複製','ghost small',`data-copy-relationship-review="${r.id}"`)+btn('另存快照','ghost small',`data-save-relationship-review="${r.id}"`))).join('')||empty('尚未產生關係回顧。');
}
function relationshipLogsThisWeek(){const since=new Date();since.setDate(since.getDate()-7);return (state.relationshipLogs||[]).filter(l=>!l.deletedAt&&new Date(l.date||l.createdAt||0)>=since)}
function ensureRelationshipCardsForToday(){const c=state.currentRelationshipCards=state.currentRelationshipCards||{};if(c.date!==todayKey()){c.date=todayKey();c.closeTodaySwapped=false;c.closeTodayId=pickRelationshipCard('closeTodayCards','closeToday');c.chemistryId=pickRelationshipCard('chemistryChallengeCards','chemistry');c.dateIdeaId=pickRelationshipCard('dateIdeaCards','dateIdea');c.deepTalkId=pickRelationshipCard('deepTalkCards','deepTalk');}}
function cardById(table,id){return (state[table]||[]).find(x=>x.id===id&&!x.deletedAt)}
function recentSemanticKeys(type,days=14){const cutoff=new Date();cutoff.setDate(cutoff.getDate()-days);return new Set((state.cardDrawLogs||[]).filter(l=>l.type===type&&new Date(l.date||l.createdAt||0)>=cutoff&&!l.deletedAt).map(l=>l.semanticKey).filter(Boolean))}
function pickRelationshipCard(table,type){const recent=recentSemanticKeys(type,14);const pool=(state[table]||[]).filter(c=>c.enabled!==false&&!recent.has(c.semanticKey)&&!recent.has(c.ideaKey));const src=pool.length?pool:(state[table]||[]);return (src.sort((a,b)=>hash(todayKey()+type+a.id)-hash(todayKey()+type+b.id))[0]||{}).id||''}
function relationshipCardItem(card,actions='',opts={}){if(!card)return empty('卡片池尚未建立。');const r=card.reward||{};const title=esc(card.title||'關係卡片');const content=esc(card.content||'');const badges=[card.category,card.intensity,card.locationType].filter(Boolean).map(x=>`<span class="rel-badge">${esc(x)}</span>`).join('');const rewards=[];if(r.intimacy)rewards.push(`親密 +${r.intimacy}`);if(r.chemistry)rewards.push(`默契 +${r.chemistry}`);if(r.heartbeat||r.companionship)rewards.push(`心動 +${(r.heartbeat ?? r.companionship)}`);if(r.couplePoints)rewards.push(`雙人點數 +${r.couplePoints}`);return `<article class="item relationship-card ${opts.done?'done':''}"><div class="item-title">${title}</div><div class="item-sub rel-badge-row">${badges}<span class="no-pressure">不完成不扣分</span></div><p class="relationship-card-content">${content}</p><div class="reward-line">${rewards.join('、')||'互動回顧素材'}</div>${actions?`<div class="button-row relationship-actions">${actions}</div>`:''}</article>`}
function titleMainOf(card){return String(card?.title||'').split(/[：:]/)[0].trim()}
function relationshipPoolValidation(pool=[]){const ids=new Set(), sem=new Set(), idea=new Set(), title=new Set(), content=new Set();let idDup=0,semDup=0,ideaDup=0,titleDup=0,contentDup=0;for(const c of pool||[]){if(ids.has(c.id))idDup++;ids.add(c.id);if(c.semanticKey){if(sem.has(c.semanticKey))semDup++;sem.add(c.semanticKey)}if(c.ideaKey){if(idea.has(c.ideaKey))ideaDup++;idea.add(c.ideaKey)}const tm=titleMainOf(c);if(tm){if(title.has(tm))titleDup++;title.add(tm)}const ct=String(c.content||'').replace(/\s+/g,'').slice(0,120);if(ct){if(content.has(ct))contentDup++;content.add(ct)}}return {count:(pool||[]).length,idUnique:ids.size,semanticUnique:sem.size,ideaUnique:idea.size,titleUnique:title.size,contentUnique:content.size,issues:idDup+semDup+ideaDup+contentDup,titleDuplicated:titleDup}}
function relationshipPoolValidationHtml(){const rows=[['今日靠近一點','closeTodayCards'],['默契挑戰','chemistryChallengeCards'],['約會靈感卡','dateIdeaCards'],['深聊卡','deepTalkCards']].map(([n,t])=>{const v=relationshipPoolValidation(state[t]||[]);const ok=v.count>=1000&&v.issues===0;return `<article class="item ${ok?'done':''}"><div class="item-title">${n}：${v.count} 張 ${ok?'✓':'需檢查'}</div><div class="item-sub">id 唯一 ${v.idUnique}｜semanticKey ${v.semanticUnique}｜ideaKey ${v.ideaUnique}｜標題主題 ${v.titleUnique}｜內容 ${v.contentUnique}</div><p>${ok?'內容池數量達標，且 id / semanticKey / ideaKey / 內容未發現重複。':'請檢查是否有重複 key、重複內容或數量不足。'}最近 14 天抽卡會避開相同 semanticKey / ideaKey。</p></article>`}).join('');return `<div class="relationship-pool-validation">${rows}</div>`}
function renderAdventure(){
  const mode=state.adventure.selectedMap||'solo';
  // 提供 inline fallback，避免某些手機瀏覽器在重新 render 後 delegation 失效造成雙人地圖點擊沒反應。
  try{window.__openMapNode=(nodeId,nodeMode)=>openMapModal(nodeId,nodeMode)}catch{}
  const progress=(state.mapProgress||[]).find(p=>p.mode===mode)||{currentSteps:0,currentNodeId:`${mode}_node_01`,unlockedNodeIds:[`${mode}_node_01`]};
  const nodes=(state.mapNodes||[]).filter(n=>n.mode===mode&&!n.deletedAt).sort((a,b)=>Number(a.requiredSteps||0)-Number(b.requiredSteps||0));
  const totalSteps=nodes.length?Number(nodes[nodes.length-1].requiredSteps||0):0;
  const current=nodes.find(n=>n.id===progress.currentNodeId)||nodes.filter(n=>Number(n.requiredSteps||0)<=Number(progress.currentSteps||0)).pop()||nodes[0];
  const soloTab=$('#adventureSoloTab'), coupleTab=$('#adventureCoupleTab');
  if(soloTab)soloTab.classList.toggle('primary',mode==='solo');
  if(coupleTab)coupleTab.classList.toggle('primary',mode==='couple');
  const title=$('#activeMapTitle'); if(title)title.textContent=mode==='solo'?'我的冒險地圖':'共同冒險地圖';
  const place=$('#activeMapPlace'); if(place)place.textContent=current?`${current.name}｜${progress.currentSteps||0} / ${totalSteps} 格`:'';
  const map=$('#activeMap'); if(map)map.innerHTML=mapHtml10C(mode,progress,nodes);
  const bag=$('#mapBackpack'); if(bag)bag.innerHTML=mapBackpackHtml();
  const showReverted=!!document.querySelector('#showRevertedAdventure')?.checked;const allLogs=(state.adventureLogs||state.adventure.logs||[]);const logs=allLogs.filter(l=>showReverted||!l.revertedAt);const revertedCount=allLogs.filter(l=>l.revertedAt&&!l.deletedAt).length;const advHead=document.querySelector('#adventureLogHeadNote');if(advHead)advHead.textContent=`最近 15 筆｜已撤銷 ${revertedCount} 筆`;$('#adventureLog').innerHTML=logs.slice(0,15).map(l=>item(`${l.revertedAt?'↩️ 已撤銷｜':''}${esc(l.title||l.reason||l.description||'冒險紀錄')}`,`${l.date||''}｜${(l.mapType==='couple'||l.mode==='couple')?'共同':'個人'}${l.placeName?'｜'+esc(l.placeName):''}${l.steps?`｜${l.revertedAt?'-':'+'}${l.steps} 格`:''}${l.fromStep!=null&&l.toStep!=null?`｜${l.fromStep} → ${l.toStep} 格`:''}${l.revertedAt?`｜已撤銷：${esc(l.revertReason||'恢復上一步')}`:''}`)).join('')||empty('尚無冒險紀錄。完成主線任務、使用換算券或探索地點後會出現紀錄。');
  const mb=$('#monthlyReportBox');if(mb)mb.innerHTML=state.monthlyReports?.[0]?item('最近月報',esc(state.monthlyReports[0].text||''),btn('複製','ghost small','id="copyMonthlyReportBtn2"')):empty('尚未產生每月人生報告。');
}
function mapBackpackHtml(){const defs=[
  ['火焰球','Boss 道具','攻擊 Boss'],['冰凍彈','Boss 道具','攻擊 Boss 並啟用加成'],['破盾券','Boss 道具','破盾 / 攻擊 Boss'],['追加攻擊券','能力卡','下一次 Boss 攻擊加倍'],['Boss 弱點卡','能力卡','本週某類任務傷害加成'],['星光碎片','地圖道具','集滿 5 個合成銀寶箱'],['地圖換算券','換算券','主線或今日地圖步數加成'],['能量藥水','地圖道具','恢復挑戰或雙人點數'],['地圖鑰匙','地圖道具','解鎖地區或隱藏支線'],['稱號碎片','支線材料','合成稱號或徽章']
];const rows=defs.map(([name,cat,use])=>{const it=(state.gameItems||[]).find(i=>i.name===name)||{id:name,name,quantity:0};return `<div class="map-bag-item"><b>${esc(name)}</b><small>${esc(cat)}｜數量 ${Number(it.quantity||0)}｜用途：${esc(use)}</small><div class="actions">${Number(it.quantity||0)>0?btn('使用','purple small',`data-use-item="${it.id}"`):''}${btn('說明','ghost small',`data-use-item-info="${it.id||name}"`)}</div></div>`}).join('');return `<b>地圖背包</b><div class="map-bag-grid">${rows}</div>`}
function mapHtml10C(mode,progress,nodes){return nodes.map(n=>{const unlocked=(progress.unlockedNodeIds||[]).includes(n.id)||Number(n.requiredSteps||0)<=Number(progress.currentSteps||0);const current=n.id===progress.currentNodeId;const passed=unlocked&&!current;return `<button type="button" class="map-node-v2 ${unlocked?'unlocked':'locked'} ${current?'current':''} ${passed?'passed':''}" data-map-node-id="${n.id}" data-map-mode="${mode}" onclick="window.__openMapNode && window.__openMapNode('${n.id}','${mode}')" aria-label="${esc(n.name)}｜${unlocked?'可查看':'尚未解鎖'}"><div class="emoji">${current?'📍':n.mode==='couple'?'💞':'🗺️'}</div><div class="node-name">${esc(n.name)}</div><div class="node-sub">${unlocked?(current?'目前所在地':'已解鎖'):'未解鎖'}｜需 ${n.requiredSteps} 格</div><small>支線 ${n.sideQuests?.length||0}｜探索 ${n.exploreObjects?.length||0}</small></button>`}).join('')}
export function openMapModal(nodeId,mode){const node=(state.mapNodes||[]).find(n=>n.id===nodeId);if(!node)return;state.adventure.selectedMap=mode||node.mode;state.adventure.selectedNodeId=node.id;const p=(state.mapProgress||[]).find(x=>x.mode===node.mode)||{};const unlocked=(p.unlockedNodeIds||[]).includes(node.id)||Number(node.requiredSteps||0)<=Number(p.currentSteps||0);$('#mapModalBackdrop').hidden=false;$('#mapNodeModal').hidden=false;$('#mapModalTitle').textContent=`${node.mode==='couple'?'💞':'🗺️'} ${node.name}`;if(!unlocked){$('#mapModalContent').innerHTML=`<div class="empty">該地區尚未解鎖。<br>需要 ${node.requiredSteps} 格，目前 ${p.currentSteps||0} 格。</div>`;return}const status=node.id===p.currentNodeId?'目前所在':(Number(node.requiredSteps)<=Number(p.currentSteps||0)?'已走過':'已解鎖');const sideHtml=(node.sideQuests||[]).map(q=>mapSideQuestItem(q,node)).join('');const objHtml=(node.exploreObjects||[]).map(o=>mapObjectItem(o,node)).join('');const reward=node.reward||{};$('#mapModalContent').innerHTML=`<div class="detail-box"><b>地區故事</b><br>${esc(node.story||'這裡還沒有故事。')}<br><br><b>狀態：</b>${status}｜<b>Boss 弱點：</b>${esc(node.bossWeakness||'無')}<br><b>地點獎勵：</b>${[reward.points?`+${reward.points}點`:'',reward.exp?`EXP+${reward.exp}`:'',reward.item||'',reward.badge?`徽章:${reward.badge}`:''].filter(Boolean).join('、')||'無'}</div><h3>地圖支線</h3><div class="list compact">${sideHtml||empty('此地沒有支線。')}</div><h3>探索物件</h3><div class="object-grid map-object-grid">${objHtml||empty('此地沒有探索物件。')}</div>`}
export function closeMapModal(){const b=$('#mapModalBackdrop'),m=$('#mapNodeModal');if(b)b.hidden=true;if(m)m.hidden=true}
function mapSideQuestItem(q,node){const prog=(state.mapSideQuestProgress||[]).find(p=>p.sideQuestId===q.id&&!p.deletedAt);const done=prog?.status==='completed';const ready=mapQuestConditionReady(q);const action=done?btn('已完成','ghost small','disabled'):ready?btn('領取完成','green small',`data-map-sidequest="${q.id}"`):btn('前往完成','ghost small',`data-map-sidequest-goto="${q.id}"`);return item(esc(q.title),`${esc(q.description||'')}
條件：${esc(q.condition?.label||'達成遊戲條件')}
獎勵：${q.reward?.points||0} 點、Boss 傷害 ${q.reward?.bossDamage||0}${q.reward?.item?'、'+q.reward.item:''}`,action,done)}
function mapQuestConditionReady(q){const c=q.condition||{};if(c.type==='bossDamage')return (state.bossDamageLogs||[]).reduce((a,b)=>a+Number(b.amount||0),0)>=Number(c.target||0);if(c.type==='flipCount')return (state.gameLogs||[]).filter(g=>g.action==='flip'&&!g.deletedAt).length>=Number(c.target||1);if(c.type==='openChest')return (state.gameLogs||[]).filter(g=>g.action==='openChest'&&!g.deletedAt).length>=Number(c.target||1);if(c.type==='itemOwned'||c.type==='collectItem'||c.type==='travelCoupon')return Number((state.gameItems||[]).find(i=>i.name===c.item)?.quantity||0)>=Number(c.target||1);if(c.type==='useItem')return (state.itemUseLogs||[]).filter(l=>l.item===c.item&&!l.deletedAt).length>=Number(c.target||1);if(c.type==='hiddenQuest')return (state.mapHiddenQuests||[]).length>=Number(c.target||1);return (state.gameLogs||[]).length>=Number(c.target||1)}
function mapObjectItem(o,node){const status=mapObjectStatus(o,node);return `<button type="button" class="object-card ${status.explored?'done':''}" data-map-object="${o.id}" data-map-node-object="${node.id}"><div class="emoji">${o.emoji}</div><div class="object-name">${esc(o.name)}</div><div class="object-sub">${status.explored?status.label:esc(o.description||'探索物件')}</div><small>${mapRewardLabel(o.reward)}</small></button>`}
function mapObjectStatus(o,node){const p=(state.mapProgress||[]).find(x=>x.mode===node.mode)||{};const isCurrent=p.currentNodeId===node.id;const today=todayKey();if(isCurrent){const exploredToday=(state.mapExploreLogs||[]).some(l=>l.objectId===o.id&&l.nodeId===node.id&&l.date===today&&!l.deletedAt);return {explored:exploredToday,label:'今日已探索過，明天可再次探索'};}const exploredEver=(state.mapExploreLogs||[]).some(l=>l.objectId===o.id&&l.nodeId===node.id&&!l.deletedAt);return {explored:exploredEver,label:'已探索過'};}
function mapRewardLabel(r={}){if(r.item)return `獲得 ${r.item}`;if(r.hiddenQuestTitle)return '解鎖地圖隱藏支線';if(r.story)return '短劇情';if(r.ability)return r.ability;return '地圖獎勵'}


function assignStatusLabel(v){return {pending:'待接受',accepted:'進行中',rejected:'已拒絕',completed:'已完成',cancelled:'已取消',changePending:'變更待同意',deletePending:'刪除待同意'}[v]||v||'待接受'}
function rewardRuleTriggerLabel(r={}){return {singleComplete:'單次完成',streak:'連續完成',periodCount:'週期內達成',totalCount:'累積完成',minimumComplete:'最低啟動完成',rescueComplete:'補救完成',amountComplete:'完成特定量'}[r.rewardTriggerType]||'獎勵規則'}
function rewardItemsLabel(items=[],habit={},rule={}){return (items||[]).map(x=>{const t=x.type||x.rewardType;const v=x.value??x.amount??x.name??'';const q=x.qty?` x${x.qty}`:'';if(t==='points')return `點數 +${v}`;if(t==='exp')return `EXP +${v}`;if(t==='chest')return `${v}${q}`;if(t==='item')return `${v}${q}`;if(t==='bossDamage')return `Boss 傷害 +${v}`;if(t==='mapSteps')return `地圖 +${v} 格`;if(t==='badge')return `徽章：${v==='auto'?`${habit.title||'習慣'} ${rule.conditionValue||''} ${rule.rewardTriggerType==='streak'?'日':'次'}徽章`:v}`;if(t==='couplePoints')return `雙人點數 +${v}`;if(t==='relationshipValue')return `關係值 +${v}`;if(t==='customReward')return getDisplayContent(String(v));return `${t||'獎勵'} ${v}${q}`}).filter(Boolean).join('、')||'未設定獎勵'}
function rewardRuleShortLabel(r){return `${rewardRuleTriggerLabel(r)} ${r.conditionValue||1}${r.conditionPeriod||''}：${rewardItemsLabel(r.rewardItems||[])}`}

function rewardRuleGroupLabel(r){
  const t=r?.rewardTriggerType||'singleComplete';
  if(t==='singleComplete')return '單次獎勵';
  if(t==='streak')return '連續獎勵';
  if(t==='periodCount')return '週期達成獎勵';
  if(t==='totalCount')return '累積獎勵';
  return '特殊獎勵';
}
function rewardRuleStatusLabel(h,rule){
  const p=rewardRuleProgress(h,rule);
  const claimed=hasClaimedRule(h,rule);
  const can=p.current>=p.target && rule.enabled!==false && (!claimed || rule.repeatable);
  return {...p,claimed,can,label:claimed&&!rule.repeatable?'已領取':can?'可領取':`${p.current}/${p.target}`};
}
function renderHabitLongTermSummary(h){
  const rules=(h.rewardRules||[]).filter(r=>r.enabled!==false);
  if(!rules.length)return `<div class="long-reward-box muted-box">尚未設定長期獎勵，可在編輯習慣中新增。</div>`;
  const rows=rules.slice(0,4).map(r=>{
    const s=rewardRuleStatusLabel(h,r);
    const cls=s.can?'green':s.claimed?'ghost':'';
    const claimBtn=s.can?btn('領取','green tiny',`data-claim-habit-reward="${h.id}:${r.rewardRuleId}"`):'';
    return `<div class="long-reward-row"><span>${esc(rewardRuleTriggerLabel(r))}：${s.current} / ${s.target}</span><span class="pill ${cls}">${s.label}</span>${claimBtn}</div>`;
  }).join('');
  const more=rules.length>4?`<small>另有 ${rules.length-4} 則長期獎勵，可按「編輯」查看。</small>`:'';
  return `<div class="long-reward-box"><b>長期進度</b>${rows}${more}</div>`;
}
function rewardRuleProgress(h,rule){const logs=(state.habitLogs||[]).filter(l=>(l.habitId===h.id||l.taskId===h.id)&&!l.deletedAt);const target=Number(rule.conditionValue||1);let current=0;if(rule.rewardTriggerType==='streak')current=calculateStreak(h);else if(rule.rewardTriggerType==='periodCount')current=logs.filter(l=>daysBetween(new Date(l.date),new Date())<=Number(String(rule.conditionPeriod||'30').replace(/\D/g,'')||30)).length;else if(rule.rewardTriggerType==='totalCount')current=logs.length;else if(rule.rewardTriggerType==='rescueComplete')current=logs.filter(l=>l.type==='rescue'||l.status==='rescued').length;else current=logs.length;return {current,target}}
function daysBetween(a,b){return Math.abs(Math.floor((b-a)/86400000))}
function hasClaimedRule(h,rule){return (rule.claimedHistory||[]).some(x=>x&&x.claimedAt&&!x.deletedAt)}
function rateForPack(pack){const hs=(state.habits||[]).filter(h=>(h.pack||h.type)===pack&&!h.deletedAt);if(!hs.length)return 0;const today=todayKey();const done=hs.filter(h=>(state.habitLogs||[]).some(l=>l.date===today&&(l.habitId===h.id||l.taskId===h.id)&&!l.deletedAt)).length;return Math.round(done/hs.length*100)}

function reportTimeValue(r){return Date.parse(r.generatedAt||r.updatedAt||r.createdAt||r.completedAt||r.date||r.periodKey||0)||0}
function latestByReportType(rows,filterFn=()=>true){return (rows||[]).filter(x=>x&&!x.deletedAt&&filterFn(x)).sort((a,b)=>reportTimeValue(b)-reportTimeValue(a))[0]||null}
function latestReportSummaries(){
  const daily=latestByReportType(state.reports,r=>(r.reportType||'')==='daily');
  const weekly=latestByReportType([...(state.reports||[]),...(state.weeklyReviews||[])],r=>(r.reportType||'weekly')==='weekly'||r.weekStart||r.weekKey);
  const monthly=latestByReportType([...(state.reports||[]),...(state.monthlyReports||[])],r=>(r.reportType||'monthly')==='monthly'||r.month||r.monthKey);
  const couple=latestByReportType([...(state.reports||[]),...(state.coupleBattleReports||[])],r=>String(r.reportType||'').startsWith('couple')||r.scope==='daily'||r.scope==='weekly'||r.scope==='challenge');
  const boss=latestByReportType([...(state.reports||[]),...(state.bossBattleReports||[])],r=>(r.reportType||'')==='boss'||r.bossId||r.scope==='boss');
  const relation=latestByReportType([...(state.relationshipReviews||[]),...(state.relationshipReviewSnapshots||[])],r=>true);
  const pack=(label,r)=>r?{label,period:r.periodKey||r.weekStart||r.weekEnd||r.month||r.monthKey||r.date||'',text:r.latestText||r.text||r.summary||r.reviewText||r.snapshotText||''}:null;
  return [pack('最新每日戰報',daily),pack('最新每週戰報',weekly),pack('最新每月人生報告',monthly),pack('最新雙人戰報',couple),pack('最新 Boss 戰報',boss),pack('最新關係回顧',relation)].filter(Boolean);
}
function renderStats(){
  const today=todayKey();
  const notDeleted=a=>(Array.isArray(a)?a:[]).filter(x=>!x.deletedAt);
  const count=a=>notDeleted(a).length;
  const doneToday=notDeleted(state.habitLogs).filter(l=>(l.date||'').slice(0,10)===today && ['done','complete','completed','rescue','partial'].includes(l.type||l.status||'done')).length;
  const todayTasks=notDeleted(state.dailyTasks).filter(t=>(t.date||t.dayKey||today)===today);
  const specialTotal=todayTasks.length;
  const specialDone=todayTasks.filter(t=>t.done||t.completed||t.status==='completed'||state.missions?.daily?.completed?.[t.id]).length;
  const secrets=notDeleted(state.secretTasks).filter(t=>(t.date||t.dayKey||today)===today);
  const secretDone=secrets.filter(t=>t.done||t.completed||t.status==='completed').length;
  const flex=notDeleted(state.flexTasks);
  const flexDone=flex.filter(t=>['completedToday','completedWaitingRefresh','settled','completed'].includes(t.status)).length;
  const flexRate=flex.length?Math.round(flexDone/flex.length*100):0;
  const packCats=['main','side','bonus','secret'];
  const packLabel={main:'主線',side:'支線',bonus:'加分',secret:'秘密'};
  const packStats=packCats.map(k=>({k,label:packLabel[k],rate:rateForPack(k)||0}));
  const todayPts=todayPoints();
  const todayBoss=notDeleted(state.bossDamageLogs).filter(l=>(l.date||l.createdAt||'').slice(0,10)===today).reduce((a,b)=>a+Number(b.amount||b.damage||0),0);
  const todayMap=notDeleted(state.mapProgress).reduce((a,b)=>a+Number(b.todaySteps||0),0);
  const ld=state.levelData||{level:1,exp:0,nextLevelExp:100,title:'新手冒險者'};
  const attrs=state.attributes||{};
  const rel=Array.isArray(state.relationshipStats)?(state.relationshipStats[0]||{}):(state.relationshipStats||{});
  const overview=[
    ['今日特殊任務',`${specialDone}/${specialTotal}`],['秘密任務',`${secretDone}/${secrets.length}`],['本期彈性任務',`${flexRate}%`],['今日點數',todayPts],['今日 Boss 傷害',todayBoss],['今日地圖步數',todayMap],['角色等級',`Lv.${ld.level||1}`],['目前點數',currentPoints()],['親密 / 默契 / 心動',`${rel.intimacy||0}/${rel.chemistry||0}/${rel.heartbeat||rel.companionship||0}`]
  ];
  $('#statsOverview').innerHTML=overview.map(x=>`<article class="stat-card"><span>${x[0]}</span><b>${x[1]}</b><small>v15.0.0-stable</small></article>`).join('')+`<article class="stat-card wide-stat"><span>下一級進度</span><b>${ld.exp||0}/${ld.nextLevelExp||100}</b><div class="progress"><span style="width:${Math.min(100,(Number(ld.exp||0)/Number(ld.nextLevelExp||100))*100)}%"></span></div></article>`;
  const habitStats=item('今日任務包完成率',packStats.map(x=>`${x.label} ${x.rate}%`).join('｜'))+
    item('習慣完成統計',`今日完成紀錄：${doneToday} 筆｜近 7 天：${logsInDays(7)} 筆｜近 30 天：${logsInDays(30)} 筆
補救：${count(state.rescueLogs)}｜加倍：${count(state.itemUseLogs?.filter?.(x=>x.itemKey==='加倍卡'||x.itemType==='double')||[])}｜跳過：${count(state.habitLogs?.filter?.(x=>x.type==='skip')||[])}`)+
    item('分類完成率',`健康 ${categoryRate('健康')}%｜知識 ${categoryRate('知識')}%｜自律 ${categoryRate('自律')}%｜財務 ${categoryRate('財務')}%｜關係 ${categoryRate('關係')}%`);
  const rewardHtml=(state.habits||[]).flatMap(h=>(h.rewardRules||[]).map(r=>{const p=rewardRuleProgress(h,r);const can=p.current>=p.target&&!hasClaimedRule(h,r)&&r.enabled!==false;return item(`${esc(h.title)}｜${rewardRuleTriggerLabel(r)}`,`進度 ${p.current}/${p.target}｜${r.enabled===false?'停用':'啟用'}｜${r.repeatable?'可重複':'一次性'}
獎勵：${esc(rewardItemsLabel(r.rewardItems||[],h,r))}`,`${can?btn('領取獎勵','green small',`data-claim-habit-reward="${h.id}:${r.rewardRuleId}"`):btn(hasClaimedRule(h,r)?'已領取':'尚未達標','ghost small','disabled')}${btn('前往編輯習慣','ghost small',`data-edit-habit="${h.id}"`)}`)})).join('')||empty('尚無長期獎勵規則。到習慣頁新增 rewardRules 後會顯示進度。');
  const achievementHtml=(state.achievements||[]).slice(0,60).map(a=>item(`${a.unlocked?'🏅':'🔒'} ${esc(a.name||a.title||'徽章')}`,`${esc(a.description||a.conditionText||'系統會依習慣分類、習慣名稱與達成門檻自動生成徽章。')}
進度 ${Number(a.progress||0)}/${Number(a.target||a.condition?.target||1)}${a.unlockedAt?'｜解鎖：'+a.unlockedAt.slice(0,10):''}`)).join('')||empty('尚無徽章。完成習慣連續 / 累積條件後會自動解鎖。');
  const attrHtml=Object.entries({health:'健康',knowledge:'知識',discipline:'自律',finance:'財務',relationship:'關係'}).map(([k,n])=>`<div class="attr-row"><span>${n}</span><b>${Number(attrs[k]||0)}</b><div class="progress"><span style="width:${Math.min(100,Number(attrs[k]||0)%100)}%"></span></div></div>`).join('')+`<div class="detail-box">關係數值摘要：親密 ${rel.intimacy||0}｜默契 ${rel.chemistry||0}｜心動 ${rel.heartbeat||rel.companionship||0}</div>`;
  function mapStats(mode){
    const nodes=notDeleted(state.mapNodes).filter(n=>n.mode===mode).sort((a,b)=>Number(a.requiredSteps||0)-Number(b.requiredSteps||0));
    const p=notDeleted(state.mapProgress).find(x=>x.mode===mode)||{};
    const totalSteps=nodes.length?Number(nodes[nodes.length-1].requiredSteps||0):Number(p.totalSteps||0);
    const currentSteps=Number(p.currentSteps||0);
    const unlockedIds=Array.isArray(p.unlockedNodeIds)?p.unlockedNodeIds:nodes.filter(n=>Number(n.requiredSteps||0)<=currentSteps).map(n=>n.id);
    const currentNode=nodes.find(n=>n.id===p.currentNodeId)||nodes.filter(n=>Number(n.requiredSteps||0)<=currentSteps).pop()||nodes[0]||{};
    const exploreObjects=notDeleted(state.mapExploreObjects).filter(o=>o.mode===mode||nodes.some(n=>n.id===o.nodeId));
    const exploreLogs=notDeleted(state.mapExploreLogs).filter(l=>l.mode===mode||nodes.some(n=>n.id===l.nodeId));
    const sideQuests=notDeleted(state.mapSideQuests).filter(q=>q.mode===mode||nodes.some(n=>n.id===q.nodeId));
    const sideDone=notDeleted(state.mapSideQuestProgress).filter(x=>(x.mode===mode||sideQuests.some(q=>q.id===x.questId||q.id===x.sideQuestId))&&(x.status==='completed'||x.completed)).length;
    const storyUnlocked=nodes.filter(n=>unlockedIds.includes(n.id)||Number(n.requiredSteps||0)<=currentSteps).length;
    return {mode,nodes,totalSteps,currentSteps,currentNode,unlockedCount:storyUnlocked,exploreTotal:exploreObjects.length,exploreDone:exploreLogs.length,sideTotal:sideQuests.length,sideDone};
  }
  const soloMap=mapStats('solo');
  const coupleMap=mapStats('couple');
  const revertedAdvCount=notDeleted(state.adventureLogs).filter(x=>x.revertedAt).length;const validAdvCount=notDeleted(state.adventureLogs).filter(x=>!x.revertedAt).length;const mapHtml=[soloMap,coupleMap].map(m=>item(`${m.mode==='couple'?'雙人':'單人'}地圖進度`,`${m.currentSteps} / ${m.totalSteps} 格｜目前地點：${esc(m.currentNode?.name||m.currentNode?.id||'尚未開始')}｜已解鎖 ${m.unlockedCount}/${m.nodes.length} 個地區
探索物件：${m.exploreDone}/${m.exploreTotal}｜地圖支線：${m.sideDone}/${m.sideTotal}｜有效冒險紀錄 ${validAdvCount} 筆`)).join('')+
    item('地圖背包與探索總覽',`地圖背包道具：${count(state.mapInventory)} 種｜探索紀錄：${count(state.mapExploreLogs)}｜地圖隱藏支線：${count(state.mapHiddenQuests)}
統計頁使用 mapProgress 實際值，並排除 revertedAt 不為空的冒險紀錄。已撤銷紀錄：${revertedAdvCount} 筆。`);
  const activeBoss=(state.coupleBosses||[]).find(b=>b.status==='active')||ensureCoupleWeekBoss();
  const bossLogs=notDeleted(state.bossDamageLogs);
  const sumType=t=>bossLogs.filter(x=>x.sourceType===t||x.type===t).reduce((a,b)=>a+Number(b.amount||b.damage||0),0);
  const bossHtml=item(activeBoss?.name||'本週 Boss',`HP：${activeBoss?.hp??0}/${activeBoss?.maxHp??0}｜狀態：${activeBoss?.status||'active'}｜可領獎：${(state.coupleBosses||[]).some(b=>b.status==='pendingReward')?'是':'否'}
我的傷害：${activeBoss?.myDamage||0}｜對方傷害：${activeBoss?.partnerDamage||0}
個人習慣：${sumType('habit')}｜共同任務：${sumType('sharedTask')}｜雙人挑戰：${sumType('challenge')}｜秘密任務：${sumType('secret')}｜冒險：${sumType('adventure')}｜道具：${sumType('item')}
歷史擊敗：${(state.coupleBosses||[]).filter(b=>b.status==='claimed'||b.status==='defeated').length}`);
  const assigned=notDeleted(state.assignedTasks);const changes=notDeleted(state.assignedTaskChangeRequests).filter(x=>x.status==='pending').length;
  const duoHtml=item('雙人統計',`今日雙人完成數：${count(state.coupleBattleReports?.filter?.(x=>(x.date||x.createdAt||'').slice(0,10)===today)||[])}｜共同任務：${count(state.sharedTasks)}｜雙人挑戰：${count(state.coupleChallenges)}｜秘密任務：${secrets.length}
對方指派：待接受 ${assigned.filter(x=>x.status==='pending').length}｜進行中 ${assigned.filter(x=>x.status==='accepted').length}｜已完成 ${assigned.filter(x=>x.status==='completed').length}｜變更待同意 ${changes}
雙人點數：${currentCouplePoints()}｜雙人獎勵兌換：${count(state.sharedRewardRedemptions)}｜雙人戰報：${count(state.coupleBattleReports)}`);
  const relHtml=item('情侶關係養成統計',`親密值 ${rel.intimacy||0}｜默契值 ${rel.chemistry||0}｜心動值 ${rel.heartbeat||rel.companionship||0}
今日靠近一點：${count(state.cardDrawLogs?.filter?.(x=>x.type==='closeToday'&&(x.date||x.createdAt||'').slice(0,10)===today)||[])}｜默契挑戰：${count(state.cardDrawLogs?.filter?.(x=>x.type==='chemistry')||[])}
約會收藏 / 完成：${count(state.cardCollectionLogs?.filter?.(x=>x.type==='dateIdea')||[])}/${count(state.coupleWishLogs)}｜深聊收藏 / 已聊：${count(state.cardCollectionLogs?.filter?.(x=>x.type==='deepTalk')||[])}
願望池：${count(state.coupleWishPool)}｜關係寶箱：${count(state.relationshipChests)}｜關係回顧：${count(state.relationshipReviews)}`);
  const reports=latestReportSummaries().map(r=>item(r.label,`${esc(r.period||'')}
${esc(r.text||'')}`,btn('前往戰報頁','ghost small','data-page="reports"'))).join('')||empty('尚無戰報摘要。統計頁只顯示每種戰報最新一筆；完整歷史請到戰報頁查看。');
  $('#frequencyStats').innerHTML=`<h3>今日任務統計</h3>${item('今日任務摘要',`今日特殊 ${specialDone}/${specialTotal}｜秘密 ${secretDone}/${secrets.length}｜本期彈性 ${flexRate}%｜今日點數 ${todayPts}｜Boss 傷害 ${todayBoss}｜地圖步數 ${todayMap}`)}<h3>習慣完成統計</h3>${habitStats}<h3>長期獎勵進度</h3>${rewardHtml}<h3>徽章牆</h3>${achievementHtml}<h3>生活屬性</h3><div class="attr-grid">${attrHtml}</div><h3>冒險進度</h3>${mapHtml}<h3>Boss 貢獻</h3>${bossHtml}<h3>雙人統計</h3>${duoHtml}<h3>情侶關係養成統計</h3>${relHtml}<h3>戰報摘要</h3>${reports}`;
  function logsInDays(days){const since=Date.now()-days*86400000;return notDeleted(state.habitLogs).filter(l=>Date.parse(l.date||l.createdAt||'')>=since).length}
  function categoryRate(cat){const hs=notDeleted(state.habits).filter(h=>h.category===cat);if(!hs.length)return 0;const todayLogs=notDeleted(state.habitLogs).filter(l=>(l.date||'').slice(0,10)===today);return Math.round(hs.filter(h=>todayLogs.some(l=>l.habitId===h.id)).length/hs.length*100)}
}
function renderQuestHub(){
  const el=$('#questHubList'); if(!el)return;
  const rows=[];
  for(const h of (state.habits||[]).filter(x=>!x.deletedAt)){
    const rules=Array.isArray(h.rewardRules)?h.rewardRules:[];
    for(const rule of rules){
      const prog=rewardRuleProgress(h,rule);
      const canClaim=prog.current>=prog.target && rule.enabled!==false && !hasClaimedRule(h,rule);
      const rewards=rewardItemsLabel(rule.rewardItems||[],h,rule);
      rows.push(item(`${esc(h.title)}｜${rewardRuleGroupLabel(rule)}｜${rewardRuleTriggerLabel(rule)}`,`目前進度：${prog.current}/${prog.target}｜${rule.enabled===false?'停用':'啟用'}｜${rule.repeatable?'可重複':'一次性'}
獎勵：${esc(rewards)}
說明：${esc(rule.detailNote||'')}
提醒：長期獎勵請到習慣頁新增或編輯。此頁只做唯讀總覽。`,`${canClaim?btn('領取獎勵','green small',`data-claim-habit-reward="${h.id}:${rule.rewardRuleId}"`):btn(hasClaimedRule(h,rule)?'已領取':'尚未達標','ghost small','disabled')}${btn('前往編輯習慣','ghost small',`data-edit-habit="${h.id}"`)}`));
    }
  }
  const legacy=(state.legacyRewardPlans||[]).filter(x=>!x.deletedAt).map(x=>item(`舊任務線：${esc(x.title)}`,`已封存為 legacyRewardPlans，不會遺失。可按下方按鈕將摘要複製進某個習慣的獎勵設定。`,`${btn('轉成習慣獎勵','ghost small',`data-convert-legacy-reward="${x.id}"`)}`)).join('');
  el.innerHTML=(rows.join('')+legacy)||empty('尚未有長期獎勵規則。請到習慣頁的「獎勵設定」新增。')
}
function renderChallengeHub(){
  const all=(state.coupleChallenges||[]).filter(c=>!c.deletedAt);
  const active=all.filter(c=>!['completed','abandoned','deleted'].includes(c.status||'active'));
  const completed=all.filter(c=>(c.status||'')==='completed');
  const abandoned=all.filter(c=>(c.status||'')==='abandoned');
  const system=all.filter(c=>c.source==='system'||defaultCoupleChallenges.some(d=>d.id===c.id));
  const personal=(state.quests||[]).filter(q=>!q.deletedAt).slice(0,20);
  const personalBox=$('#personalChallengeHubList');
  if(personalBox)personalBox.innerHTML=personal.map(q=>item(esc(q.title||'未命名個人挑戰'),`${esc(q.description||'')}
狀態：${esc(q.status||'進行中')}｜進度：${q.progress||0}/${q.target||1}`,`${btn('前往任務線','ghost small','data-page="quests"')}`)).join('')||empty('目前尚無個人挑戰。可按「新增個人挑戰」到任務線建立。');
  const list=$('#challengeHubList'); if(list)list.innerHTML=active.map(c=>renderChallengeItem(c,'hub')).join('')||empty('目前尚無挑戰。請新增個人挑戰或新增雙人挑戰。');
  const sys=$('#systemChallengeHubList'); if(sys)sys.innerHTML=system.map(c=>renderChallengeItem(c,'hub')).join('')||empty('目前沒有系統挑戰模板。');
  const done=$('#completedChallengeHubList'); if(done)done.innerHTML=completed.map(c=>renderChallengeItem(c,'hub')).join('')||empty('尚無已完成挑戰。');
  const lost=$('#abandonedChallengeHubList'); if(lost)lost.innerHTML=abandoned.map(c=>renderChallengeItem(c,'hub')).join('')||empty('尚無已放棄挑戰。');
  const boss=ensureCoupleWeekBoss(); const hp=Math.max(0,Number(boss.hp||0)); const max=Number(boss.maxHp||100); const box=$('#challengeBossBox'); if(box)box.innerHTML=`<b>${esc(boss.name||'本週 Boss')}</b>
HP：${hp}/${max}
狀態：${boss.status==='defeated'?'已擊敗，可開雙人寶箱':'戰鬥中'}
雙人挑戰造成傷害：${boss.challengeDamage||0}<div class="progress"><span style="width:${Math.max(0,Math.min(100,(hp/max)*100))}%"></span></div>`;
  const streak=$('#streakRewardHubList'); if(streak)streak.innerHTML=(state.streakRewards||[]).slice(0,10).map(r=>item(esc(r.title||r.name||'連續獎勵'),`${r.date||''}｜${esc(r.description||'')}`)).join('')||empty('尚無連續獎勵紀錄。完成每日任務包後會累積連續天數。');
}
function renderReportHub(){
  const history=[];
  const push=(label,r)=>{if(r&&!r.deletedAt)history.push({label,row:r,time:reportTimeValue(r),period:r.periodKey||r.weekStart||r.weekEnd||r.month||r.monthKey||r.date||'',text:r.latestText||r.text||r.summary||r.reviewText||''})};
  (state.reports||[]).forEach(r=>push(`📰 ${reportTypeName(r.reportType)}`,r));
  (state.weeklyReviews||[]).forEach(r=>push('📅 本週戰報',r));
  (state.monthlyReports||[]).forEach(r=>push('🌙 每月人生報告',r));
  (state.coupleBattleReports||[]).forEach(r=>push(r.scope==='weekly'?'💞 雙人每週戰報':'💞 雙人每日戰報',r));
  (state.bossBattleReports||[]).forEach(r=>push('👾 Boss 戰報',r));
  (state.relationshipReviews||[]).forEach(r=>push('💞 關係回顧',r));
  const rows=history.sort((a,b)=>b.time-a.time).slice(0,60).map(x=>item(x.label,`${esc(x.period||'')}
${esc(x.text||'')}`,`${btn('複製文字','ghost small',`data-copy-report="${x.row.id}"`)}${btn('另存快照','purple small',`data-save-report-snapshot="${x.row.id}"`)}`));
  const snaps=(state.reportSnapshots||[]).filter(s=>!s.deletedAt).slice(0,12).map(s=>item(`📌 快照：${esc(s.snapshotName||'未命名')}`,`${s.createdAt||''}
${esc(s.text||'')}`,`${btn('複製','ghost small',`data-copy-snapshot="${s.id}"`)}${btn('刪除快照','red small',`data-delete-report-snapshot="${s.id}"`)}`)).join('');
  const el=$('#reportHubList'); if(el)el.innerHTML=(rows.join('')||empty('尚未產生戰報。可先按上方按鈕產生本週戰報、月報或雙人戰報。'))+`<h3>戰報快照</h3>${snaps||empty('尚未另存快照。按「另存快照」即可保存當下版本。')}`;
}

function reportTypeName(t){return {daily:'每日戰報',weekly:'每週戰報',monthly:'每月人生報告',couple_daily:'雙人每日戰報',couple_weekly:'雙人每週戰報',boss:'Boss 戰報',relationship:'關係回顧'}[t]||t||'戰報'}
function renderHelpGuide(){
  const el=$('#helpGuideBox'); if(!el)return;
  const guides=[["第一次使用", "先以本機模式建立習慣；設定 Firebase 後可 Google 登入同步。改版前先匯出 JSON。"], ["今天頁任務", "包含今日特殊任務、秘密任務、本期彈性任務與每日任務包。今日特殊任務可換一次、可複製成習慣；秘密任務不可換、不可跳過、不可補救；本期彈性任務不每天換，提前完成隔天換新。"], ["習慣與長期獎勵", "習慣是核心資料，可設定主線/支線/加分、頻率、補救設定與 rewardRules。原任務線已整合為長期獎勵。"], ["補救 / 加倍 / 跳過 / 換卡", "補救券隔天使用；canDoubleComplete 由使用者在習慣中設定。道具需手動使用，不會自動套用。"], ["點數、錢包與道具", "任務、遊戲、Boss、地圖、關係互動會產生點數或道具。錢包道具有使用按鈕與使用 modal。"], ["翻牌 / 轉盤 / 寶箱", "抽獎券可翻牌，轉盤機會可轉盤，寶箱可開啟取得點數、券、道具或碎片。今日小補給一天一次。"], ["雙人房間與公開範圍", "Google 登入後可建立房間或用邀請碼加入。公開範圍控制對方看到名稱、狀態或完全隱藏。"], ["對方指派任務", "對方可指派完整習慣型任務；進行中修改或刪除需接收方同意，已完成不可變動。"], ["共同任務與雙人挑戰", "共同任務是雙人版本期彈性任務，到期結算；雙人挑戰是活動、比賽或副本。"], ["Boss 戰", "每週一產生新 Boss，週一到週日可攻擊，下週一結算；舊 Boss 可領獎但不阻止新 Boss。"], ["冒險地圖與探索", "單人/雙人地圖各 30 地點。locked 地點不可探索；目前地點每日可探索；已走過地點已探索物件不可再次探索。"], ["地圖背包與地圖道具", "地圖背包包含 Boss 道具、地圖鑰匙、換算券、能力卡、支線材料，需手動使用。"], ["情侶關係養成", "包含今日靠近一點、默契挑戰、約會靈感卡、深聊卡、願望池、關係寶箱與關係回顧，不造成任務壓力。"], ["今日靠近一點", "每天一張，最多換一次；完成後增加親密值與心動值。"], ["默契挑戰", "可不限換卡，但會避開近期相似內容；完成後增加默契值。"], ["約會靈感卡", "可收藏、加入願望池、標記完成；完成後增加親密值、心動值或雙人點數。"], ["深聊卡", "可收藏、標記已聊過、加入回顧；從輕鬆題到深度題分層。"], ["雙人願望池", "保存想一起完成的約會、深聊或自訂願望，可標記完成並進入關係回顧。"], ["關係寶箱與關係回顧", "關係寶箱給關係數值與卡片獎勵；關係回顧整理互動並可另存快照。"], ["戰報與快照", "同期間重複產生會更新最新版；按另存快照才保存歷史版本。"], ["統計頁", "集中顯示今日任務、習慣、長期獎勵、徽章、冒險、Boss、雙人、關係與戰報摘要。"], ["CSV / JSON 備份", "JSON 是完整備份，CSV 是分表備份；匯入後 migrate、去重、補欄位。"], ["Firebase 同步", "資料變更立即本機保存並 debounce 同步；登入、回前景、每 30 秒、立即同步都會觸發。"], ["PWA 與清快取", "GitHub Pages 可加入主畫面；若仍看到舊版，刪除主畫面 App 後重新加入。"], ["常見問題", "白屏先清快取並用 JSON 備份還原；同步問題先看設定頁的同步狀態；需要時再展開進階同步診斷。"]];
  el.innerHTML=guides.map((g,i)=>item(`${i+1}. ${esc(g[0])}`,`這是什麼 / 怎麼操作 / 何時出現 / 紀錄位置 / 常見誤解：\n${esc(g[1])}\n範例：依照本章說明完成一次操作後，可到紀錄、統計或同步除錯面板確認。`)).join('');
}
const csvTables=[...new Set([...PHASE1_TABLES,'supportLogs','relationshipLogs','adventureLogs','importedStats'])];
function renderSettings(){
  const logged=!!state.firebase.user;
  const b=$('#authToggleBtn');
  if(b){b.textContent=logged?'登出':'Google 登入';b.className=logged?'btn red':'btn primary'}
  const sm=state.syncMeta||{}, fb=state.firebase||{}, room=state.room||{};
  const statusText=logged
    ? `已登入：${fb.user?.email||fb.user?.name||'Google 使用者'}｜同步狀態：${fb.syncStatus||'等待同步'}｜上次同步：${fb.lastSyncAt?new Date(fb.lastSyncAt).toLocaleString('zh-TW'):'尚無'}`
    : `本機模式｜尚未登入 Google，資料已保存於本機。${fb.syncError?`｜${fb.syncError}`:''}`;
  const fs=$('#firebaseStatus');
  if(fs){fs.innerHTML=`<b>${logged?'雲端同步':'本機保存'}</b><br>${esc(statusText)}${fb.syncError?`<br><span class="warn-text">${esc(fb.syncError)}</span>`:''}`;fs.className=`cloud-box ${fb.syncStatus==='同步失敗'?'warn':logged?'ok':'warn'}`}
  const restoreBtn=$('#restorePreSyncBackupBtn');
  if(restoreBtn){restoreBtn.style.display=sm.hasPreSyncBackup||sm.preSyncBackupAt?'inline-flex':'inline-flex';restoreBtn.textContent=sm.preSyncBackupAt?`還原同步前備份（${new Date(sm.preSyncBackupAt).toLocaleString('zh-TW')}）`:'還原同步前備份'}
  const account=$('#accountSettingsBox');
  if(account)account.innerHTML=item('Google 登入狀態',logged?'已登入':'未登入 / 本機模式')+item('使用者 ID',fb.user?.uid||state.currentUserId||'local')+item('使用者名稱',fb.user?.email||fb.user?.name||'本機使用者');
  const firebaseDetail=$('#firebaseDetailBox');
  if(firebaseDetail)firebaseDetail.innerHTML=item('是否已設定 Firebase',fb.configured||fb.isConfigured||logged?'已設定或已登入':'尚未確認 / 本機模式')+item('Firestore path',sm.cloudPath||`users/${fb.user?.uid||state.currentUserId||'local'}`)+item('多文件同步狀態',sm.multiDocStatus||'Phase 13F 多文件 / 分表 / chunk 同步保留')+item('chunk count',String(sm.lastCloudChunkCount||sm.chunkCount||0))+item('estimated sync size',sm.estimatedSyncSize?`${sm.estimatedSyncSize} bytes`:'尚無估算')+item('最後錯誤',sm.lastSyncError||fb.syncError||'無');
  const roomBox=$('#roomSettingsBox');
  if(roomBox)roomBox.innerHTML=item('目前 roomId',room.inviteCode||room.id||'local')+item('房間名稱',room.name||'本機模式')+item('房間資料狀態',room.inviteCode?`房間成員 ${Array.isArray(room.members)?room.members.length:0} 人｜可同步雙人資料`:'尚未建立或加入房間');
  const sd=$('#syncDebugPanel');
  if(sd){
    const rows=[
      ['Firebase 登入狀態',logged?'已登入':'未登入 / 本機模式'],['userId',fb.user?.uid||state.currentUserId||'尚無'],['roomId',room.inviteCode||room.id||'local'],['local updatedAt',state.updatedAt||'尚無'],['cloud updatedAt',sm.lastCloudUpdatedAt||'尚無'],['cloud path',sm.cloudPath||'尚無'],['chunk count',sm.lastCloudChunkCount||0],['estimated sync size',sm.estimatedSyncSize?`${sm.estimatedSyncSize} bytes`:'尚無'],['dirty',sm.dirty?'是':'否'],['syncing',sm.syncing||fb.syncStatus==='同步中'?'是':'否'],['last read',sm.lastCloudReadAt||'尚無'],['last write',sm.lastCloudWriteAt||'尚無'],['last successful sync',sm.lastSuccessfulSyncAt||fb.lastSyncAt||'尚無'],['最後同步結果',sm.lastSyncResult||fb.syncStatus||'尚無'],['最後錯誤',sm.lastSyncError||fb.syncError||'無'],['本機資料筆數摘要',PHASE1_TABLES.filter(t=>!['closeTodayCards','chemistryChallengeCards','dateIdeaCards','deepTalkCards'].includes(t)).map(t=>`${tableName(t)}:${Array.isArray(state[t])?state[t].length:state[t]?1:0}`).slice(0,18).join('｜')],['同步架構','Phase 13F 多文件 / 分表 / chunk 同步，避免單一 Firestore document 超過 1 MiB']
    ];
    sd.innerHTML=`${rows.map(r=>`<div class="debug-row"><b>${r[0]}</b><span>${esc(String(r[1]))}</span></div>`).join('')}<div class="button-row"><button id="syncNowBtn2" class="btn green small" type="button">手動立即同步</button><button id="forceLocalCloudBtn" class="btn red small" type="button">強制以本機覆蓋雲端</button><button id="forceCloudLocalBtn" class="btn purple small" type="button">強制以雲端覆蓋本機</button></div><p class="hint">強制覆蓋會二次確認。若同步失敗，請先到備份頁匯出 JSON。</p>`;
  }
}
function renderBackup(){
  const sm=state.syncMeta||{}, fb=state.firebase||{};
  const safety=$('#backupSafetyBox');
  if(safety){
    let importBackupAt=sm.preImportBackupAt||'';
    try{const raw=localStorage.getItem('habitMissionPhase1FullTablesState_preImportBackup');const parsed=raw?JSON.parse(raw):null;if(parsed?.createdAt)importBackupAt=parsed.createdAt}catch{}
    safety.innerHTML=item('自動匯入前備份',importBackupAt?`最近匯入前備份：${new Date(importBackupAt).toLocaleString('zh-TW')}`:'目前尚無匯入前備份。匯入 JSON / CSV 前會自動建立可還原版本。')+item('同步前備份',sm.preSyncBackupAt?`最近同步前備份：${new Date(sm.preSyncBackupAt).toLocaleString('zh-TW')}`:'尚無同步前備份。同步前會自動建立。')+item('同步狀態摘要',`${fb.syncStatus||'本機模式'}｜上次同步：${fb.lastSyncAt?new Date(fb.lastSyncAt).toLocaleString('zh-TW'):'尚無'}`);
  }
  const guide=$('#backupGuideBox');
  if(guide)guide.innerHTML=item('JSON 完整備份','適合完整保留目前所有資料、跨裝置還原、改版前備份。')+item('CSV 分表備份','適合分表留存、用 Excel / Notion 查看、只回補某個資料表。')+item('匯入前建議','匯入前先按「匯出 JSON」，避免格式錯誤或誤覆蓋時無法回復。')+item('危險操作','清空資料會移除目前資料；執行前會二次確認，但仍建議先下載 JSON。');
  const csvEl=$('#csvTableTools');if(csvEl)csvEl.innerHTML=csvTables.map(t=>`<article class="item"><div class="item-top"><div><div class="item-title">${tableName(t)}</div><div class="item-sub">CSV 匯入 / 匯出｜目前 ${Array.isArray(state[t])?state[t].length:(state[t]?1:0)} 筆</div></div><div class="actions"><button class="btn ghost small" type="button" data-export-csv="${t}">匯出 CSV</button><label class="btn ghost small file-btn">匯入 CSV<input type="file" accept=".csv,text/csv" data-import-csv="${t}"></label></div></div></article>`).join('')||empty('目前沒有可匯出的資料表。');
}

function tableName(t){return {users:'使用者資料表',habits:'習慣資料表',habitLogs:'習慣完成紀錄表',dailyTasks:'今日指定任務表',dailyPacks:'每日任務包表',flexTasks:'本期彈性任務表',secretTasks:'秘密任務表',pointsLedger:'點數紀錄表',rewards:'獎勵資料表',rewardRedemptions:'獎勵兌換紀錄表',gameItems:'遊戲道具表',gameLogs:'遊戲紀錄表',quests:'任務線資料表',questProgress:'任務線進度表',achievements:'成就徽章表',streakRewards:'連續獎勵表',weeklyReviews:'每週回顧表',monthlyReports:'每月報告表',settings:'設定資料表',syncMeta:'同步狀態表',supportLogs:'支援紀錄表',relationshipLogs:'關係紀錄表',adventureLogs:'冒險紀錄表',importedStats:'匯入統計表',levelData:'角色等級表',attributeLogs:'屬性成長紀錄表',storyChapters:'章節劇情表',couplePointsLedger:'雙人點數紀錄表',sharedQuests:'共同任務表',sharedQuestProgress:'共同任務進度表',sharedRewards:'雙人獎勵表',sharedRewardRedemptions:'雙人兌換紀錄表',coupleStats:'雙人戰況表',coupleSecretTasks:'秘密任務表',coupleChallenges:'雙人挑戰表',coupleBosses:'每週 Boss 表',coupleBattleReports:'雙人戰報表',coupleTitles:'雙人稱號表',sharedTasks:'共同任務表',sharedTaskProgress:'共同任務進度表',coupleChallengeProgress:'雙人挑戰進度表',bossDamageLogs:'Boss 傷害紀錄表',bossRewards:'Boss 獎勵表',bossBattleReports:'Boss 戰報表',reports:'戰報主表',reportSnapshots:'戰報快照表',bossItems:'Boss 道具表',mapNodes:'地圖節點表',mapProgress:'地圖進度表',mapSideQuests:'地圖支線表',mapSideQuestProgress:'地圖支線進度表',mapExploreObjects:'地圖探索物件表',mapExploreLogs:'地圖探索紀錄表',mapHiddenQuests:'地圖隱藏支線表',mapQuestProgress:'地圖隱藏支線進度表',mapTravelCoupons:'地圖換算券表',mapRewards:'地圖獎勵表',abilityEffects:'能力效果表',mapInventory:'地圖背包表',mapInventoryLogs:'地圖背包紀錄表',mapExploreDailyLogs:'地圖每日探索表',activeItemEffects:'啟用中道具效果表',closeTodayCards:'今日靠近一點卡池',chemistryChallengeCards:'默契挑戰卡池',dateIdeaCards:'約會靈感卡池',deepTalkCards:'深聊卡池',relationshipStats:'關係數值表',coupleWishPool:'雙人願望池',coupleWishLogs:'願望紀錄表',relationshipChests:'關係寶箱表',relationshipChestLogs:'關係寶箱紀錄表',mapTravelLogs:'地圖旅行紀錄表',relationshipReviews:'關係回顧表',relationshipReviewSnapshots:'關係回顧快照表',cardDrawLogs:'抽卡紀錄表',cardCollectionLogs:'卡片收藏紀錄表'}[t]||t}
