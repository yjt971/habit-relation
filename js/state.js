import { defaultHabits, coupleTasks, closeTodayCards, chemistryChallengeCards, dateIdeaCards, deepTalkCards, defaultQuests, defaultAchievements, defaultStoryChapters, levelTitles, attributeByCategory, defaultSharedQuests, defaultSharedRewards, defaultCoupleChallenges, bossPool, mapNodesSeed } from './data.js';
import { normalizeRule, periodKey } from './frequency.js';

export const KEY='habitMissionPhase1FullTablesState';
export const LEGACY_KEYS=['habitMissionPhase0StableState','habitMissionFrequencyRuleV4_randomMissions'];
export const APP_VERSION='15.1.0-stable';
export const PHASE1_TABLES=['users','habits','habitLogs','dailyTasks','dailyPacks','flexTasks','secretTasks','pointsLedger','rewards','rewardRedemptions','gameItems','gameLogs','quests','questProgress','achievements','streakRewards','weeklyReviews','monthlyReports','adventureLogs','couplePointsLedger','sharedQuests','sharedQuestProgress','sharedTasks','sharedTaskProgress','sharedTaskChangeRequests','sharedRewards','sharedRewardRedemptions','coupleStats','coupleSecretTasks','coupleChallenges','coupleChallengeProgress','coupleBosses','bossDamageLogs','bossRewards','bossBattleReports','coupleBattleReports','reports','reportSnapshots','coupleTitles','bossItems','mapNodes','mapProgress','mapSideQuests','mapSideQuestProgress','mapExploreObjects','mapExploreLogs','mapHiddenQuests','mapQuestProgress','mapTravelCoupons','mapTravelLogs','mapRewards','abilityEffects','settings','syncMeta','levelData','attributeLogs','storyChapters','assignedTasks','rescueTemplates','rescueLogs','taskSwapLogs','itemUseLogs','mapInventory','mapInventoryLogs','mapExploreDailyLogs','activeItemEffects','habitRewardRules','habitRewardLogs','assignedTaskChangeRequests','assignedTaskRewards','assignedTaskLogs','legacyRewardPlans','closeTodayCards','chemistryChallengeCards','dateIdeaCards','deepTalkCards','relationshipStats','relationshipLogs','coupleWishPool','coupleWishLogs','relationshipChests','relationshipChestLogs','relationshipReviews','relationshipReviewSnapshots','cardDrawLogs','cardCollectionLogs','chemistryChallengeSessions','chemistryChallengeAnswers','coupleLetters','coupleLetterReplies','coupleLetterLogs'];

export const todayKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
export const nowIso=()=>new Date().toISOString();
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);

function currentUserOf(s){return s?.firebase?.user?.uid||s?.currentUserId||'me'}
function currentRoomOf(s){return s?.room?.inviteCode||s?.room?.id||'local'}
export function withMeta(record,type='rec',stateRef=state){
  if(!isObj(record))return record;
  const now=nowIso();
  const next={...record};
  if(!next.id)next.id=uid(type);
  if(!next.userId)next.userId=currentUserOf(stateRef);
  if(!next.roomId)next.roomId=currentRoomOf(stateRef);
  if(!next.createdAt)next.createdAt=now;
  if(!next.updatedAt)next.updatedAt=next.createdAt;
  if(!('deletedAt' in next))next.deletedAt=null;
  if(!next.version)next.version=APP_VERSION;
  return next;
}
function metaArray(arr,type,stateRef){return Array.isArray(arr)?arr.map(x=>withMeta(x,type,stateRef)):[]}
function metaObject(obj,type,stateRef){return isObj(obj)?Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,withMeta(v,type,stateRef)])):{};}
function dedupeById(arr,type,stateRef){const out=[];const seen=new Set();for(const x of metaArray(arr,type,stateRef)){if(!x?.id)continue;if(seen.has(x.id))continue;seen.add(x.id);out.push(x)}return out}

export const defaultState=()=>({
  version:APP_VERSION,
  createdAt:nowIso(),
  updatedAt:nowIso(),
  deletedAt:null,
  currentUserId:'me',
  settings:{id:'settings_main',theme:'light',activeEffects:{doubleNext:false,discountNext:false},createdAt:nowIso(),updatedAt:nowIso(),deletedAt:null,version:APP_VERSION},
  users:[{id:'me',name:'我'},{id:'user2',name:'使用者2'}],
  habits:defaultHabits,
  habitLogs:[],
  dailyTasks:[],
  dailyPacks:[],
  flexTasks:[],
  secretTasks:[],
  pointsLedger:[],
  rewards:[{id:'r1',name:'手搖飲一杯',cost:50,category:'小獎勵',stock:'',weeklyLimit:'',note:''},{id:'r2',name:'放鬆按摩 30 分鐘',cost:180,category:'中獎勵',stock:'',weeklyLimit:'',note:''}],
  rewardRedemptions:[],
  gameItems:[{id:'ticket',name:'抽獎券',quantity:1,itemType:'ticket'},{id:'task-ticket',name:'任務券',quantity:0,itemType:'ticket'},{id:'rescue-ticket',name:'補救券',quantity:0,itemType:'rescue'},{id:'double-card',name:'加倍卡',quantity:0,itemType:'booster'},{id:'skip-ticket',name:'跳過券',quantity:0,itemType:'skip'},{id:'discount-coupon',name:'商店折價券',quantity:0,itemType:'discount'},{id:'swap-ticket',name:'換卡券',quantity:0,itemType:'swap'},{id:'fireball',name:'火焰球',quantity:0,itemType:'boss'},{id:'ice-bomb',name:'冰凍彈',quantity:0,itemType:'boss'},{id:'shield-break',name:'破盾券',quantity:0,itemType:'boss'},{id:'extra-attack',name:'追加攻擊券',quantity:0,itemType:'boss'},{id:'boss-weakness',name:'Boss 弱點卡',quantity:0,itemType:'boss'},{id:'energy-potion',name:'能量藥水',quantity:0,itemType:'boss'},{id:'boss-shard',name:'Boss 碎片',quantity:0,itemType:'fragment'},{id:'rest-ticket',name:'休息券',quantity:0,itemType:'rest'},{id:'random-task-ticket',name:'隨機任務券',quantity:0,itemType:'ticket'},{id:'hidden-task-ticket',name:'隱藏任務券',quantity:0,itemType:'ticket'},{id:'chest-shard',name:'寶箱碎片',quantity:0,itemType:'fragment'},{id:'badge-shard',name:'徽章碎片',quantity:0,itemType:'badge'},{id:'wheel-spin',name:'轉盤機會',quantity:0,itemType:'spin'},{id:'wood-chest',name:'木寶箱',quantity:1,itemType:'chest'},{id:'silver-chest',name:'銀寶箱',quantity:0,itemType:'chest'},{id:'gold-chest',name:'金寶箱',quantity:0,itemType:'chest'},{id:'couple-chest',name:'雙人寶箱',quantity:0,itemType:'chest'}],
  gameLogs:[],
  quests:defaultQuests,
  questProgress:[],
  achievements:defaultAchievements.map(a=>({...a,unlocked:false,unlockedAt:'',progress:0})),
  levelData:{id:'level_main',level:1,exp:0,totalExp:0,title:'新手冒險者',nextLevelExp:100,createdAt:nowIso(),updatedAt:nowIso(),deletedAt:null,version:APP_VERSION},
  attributeLogs:[],
  attributes:{health:0,knowledge:0,discipline:0,finance:0,relationship:0},
  storyChapters:defaultStoryChapters.map(c=>({...c,unlocked:false,unlockedAt:''})),
  streakRewards:[],
  weeklyReviews:[],
  monthlyReports:[],
  adventureLogs:[],
  mapTravelLogs:[],
  syncMeta:{id:'sync_meta_main',lastLocalSaveAt:'',lastCloudReadAt:'',lastCloudWriteAt:'',source:'local',createdAt:nowIso(),updatedAt:nowIso(),deletedAt:null,version:APP_VERSION},
  // Backward-compatible UI fields retained
  logs:{},
  items:[],
  room:{id:'local',name:'',inviteCode:'',members:[]},
  supportLogs:[],
  coupleTasks,
  coupleDailyTaskId:'',
  harmonyDaily:{},
  relationshipLogs:[],
  adventure:{soloStep:0,coupleStep:0,selectedNode:0,selectedMap:'solo',logs:[]},
  missions:{daily:{date:'',ids:[],completed:{},swapped:{}},flex:{date:'',ids:[],progress:{},todayDone:{},swapped:{},statuses:{},periodKeys:{},periodMeta:{},swapCounts:{},settled:{}}},
  firebase:{user:null,lastSyncAt:'',syncStatus:'本機模式',syncError:'',lastSyncReason:''},
  importedStats:[],
  couplePointsLedger:[],
  sharedQuests:defaultSharedQuests,
  sharedQuestProgress:[],
  sharedTasks:defaultSharedQuests,
  sharedTaskProgress:[],
  sharedTaskChangeRequests:[],
  builtInCoupleRewards:defaultSharedRewards,
  sharedRewards:[],
  sharedRewardRedemptions:[],
  coupleStats:{id:'couple_stats_main',myTodayCompleted:0,partnerTodayCompleted:0,myWeeklyRate:0,partnerWeeklyRate:0,leader:'tie',secretCompleted:0,weeklyTitle:'默契練習中',createdAt:nowIso(),updatedAt:nowIso(),deletedAt:null,version:APP_VERSION},
  coupleSecretTasks:[],
  coupleChallenges:defaultCoupleChallenges.map(c=>({...c,progress:0,myProgress:0,partnerProgress:0,status:'active'})),
  coupleChallengeProgress:[],
  coupleBosses:[],
  bossDamageLogs:[],
  bossRewards:[],
  bossBattleReports:[],
  coupleBattleReports:[],
  reports:[],
  reportSnapshots:[],
  coupleTitles:[],
  bossItems:[],
  assignedTasks:[],
  rescueTemplates:[],
  rescueLogs:[],
  taskSwapLogs:[],
  itemUseLogs:[],
  mapInventory:[],
  mapInventoryLogs:[],
  mapExploreDailyLogs:[],
  activeItemEffects:[],
  habitRewardRules:[],
  habitRewardLogs:[],
  assignedTaskChangeRequests:[],
  assignedTaskRewards:[],
  assignedTaskLogs:[],
  legacyRewardPlans:[],
  closeTodayCards,
  chemistryChallengeCards,
  dateIdeaCards,
  deepTalkCards,
  relationshipStats:{id:'relationship_stats_main',intimacy:0,chemistry:0,heartbeat:0,companionship:0,closeTodayStreak:0,lastCloseTodayDate:'',createdAt:nowIso(),updatedAt:nowIso(),deletedAt:null,version:APP_VERSION},
  coupleWishPool:[],
  coupleWishLogs:[],
  relationshipChests:[],
  relationshipChestLogs:[],
  relationshipReviews:[],
  relationshipReviewSnapshots:[],
  cardDrawLogs:[],
  cardCollectionLogs:[],
  chemistryChallengeSessions:[],
  chemistryChallengeAnswers:[],
  coupleLetters:[],
  coupleLetterReplies:[],
  coupleLetterLogs:[],
  currentRelationshipCards:{date:'',closeTodayId:'',closeTodaySwapped:false,chemistryId:'',chemistryChoiceId:'',letterPromptId:'',dateIdeaId:'',deepTalkId:''}
});


function migrateQuestsIntoRewardRules(s){
  if(!Array.isArray(s.quests))return;
  for(const q of s.quests){
    if(!q||q.deletedAt||q.migratedToRewardRule)continue;
    const linked=s.habits.find(h=>h.id===q.linkedHabitId)||s.habits.find(h=>(h.pack==='main'||h.type==='main')&&(h.category===q.category||h.category===q.linkedCategory));
    const rule={rewardRuleId:`legacy_${q.id}`,rewardTriggerType:'periodCount',conditionValue:Number(q.target||1),conditionPeriod:`${q.durationDays||30}days`,detailNote:`由舊任務線轉入：${q.title||''}`,repeatable:false,enabled:q.enabled!==false,claimedHistory:[],rewardItems:[{type:'points',value:Number(q.reward?.points||80)},{type:'exp',value:Number(q.reward?.exp||80)},...(q.reward?.item?[{type:'chest',value:q.reward.item,qty:1}]:[]),{type:'badge',value:q.reward?.badge||'auto'},...(q.mapReward?.steps?[{type:'mapSteps',value:q.mapReward.steps}]:[])]};
    if(linked){
      linked.rewardRules=normalizeRewardRules([...(linked.rewardRules||[]),rule],linked);
      q.migratedToRewardRule=linked.id;
    }else{
      s.legacyRewardPlans.push(withMeta({id:`legacy_${q.id}`,questId:q.id,title:q.title,description:q.description,status:'archived',rewardRule:rule,original:q},'legacyRewardPlan',s));
      q.migratedToRewardRule='legacyRewardPlans';
    }
  }
}

export function getCurrentRoomId(stateRef=state){return stateRef?.room?.inviteCode||stateRef?.room?.id||stateRef?.firebase?.roomId||'local'}
export function getCurrentUserId(stateRef=state){return stateRef?.firebase?.user?.uid||stateRef?.currentUserId||'me'}
export function getPartnerUserId(stateRef=state){const me=getCurrentUserId(stateRef);const room=stateRef?.room||{};const ids=[...(room.memberIds||[]),...(Array.isArray(room.members)?room.members.map(x=>x.id||x.uid||x):[]),...Object.keys(room.members||{}),...(stateRef?.users||[]).map(u=>u.id)].filter(Boolean).map(String);return ids.find(id=>id!==me&&id!=='me')||stateRef?.partnerUserId||'user2'}
export function ensureArrayTable(tableName,stateRef=state){if(!Array.isArray(stateRef[tableName]))stateRef[tableName]=[];return stateRef[tableName]}
export function createChemistrySessionBase(input={},stateRef=state){const now=nowIso();const dateKey=input.dateKey||todayKey();const roomId=input.roomId||getCurrentRoomId(stateRef);const userId=input.createdBy||getCurrentUserId(stateRef);const options=Array.isArray(input.options)?input.options.slice(0,4):['選項 A','選項 B','選項 C','選項 D'];while(options.length<4)options.push(`選項 ${options.length+1}`);const maxSeq=Math.max(0,...ensureArrayTable('chemistryChallengeSessions',stateRef).filter(x=>x.roomId===roomId&&x.dateKey===dateKey&&!x.deletedAt).map(x=>Number(x.sequenceNo||0)));return withMeta({id:input.id||uid('chemSession'),roomId,dateKey,sequenceNo:Number(input.sequenceNo||maxSeq+1),cardId:input.cardId||'',questionTitle:input.questionTitle||input.title||'尚未設定默契題目',options,category:input.category||'默契',intensity:input.intensity||'輕量',createdBy:userId,targetUserIds:input.targetUserIds||[userId,getPartnerUserId(stateRef)].filter(Boolean),status:input.status||'waiting',result:input.result||null,matchedOptionIndex:input.matchedOptionIndex??null,rewardsGranted:!!input.rewardsGranted,completedAt:input.completedAt||null,createdAt:input.createdAt||now,updatedAt:input.updatedAt||now,deletedAt:input.deletedAt??null,version:input.version||APP_VERSION},'chemistryChallengeSession',stateRef)}
export function createChemistryAnswerBase(input={},stateRef=state){const now=nowIso();const idx=Number(input.optionIndex??0);const optText=input.optionText||input.options?.[idx]||'';return withMeta({id:input.id||uid('chemAnswer'),sessionId:input.sessionId||'',roomId:input.roomId||getCurrentRoomId(stateRef),userId:input.userId||getCurrentUserId(stateRef),optionIndex:idx,optionText:optText,answeredAt:input.answeredAt||now,createdAt:input.createdAt||now,updatedAt:input.updatedAt||now,deletedAt:input.deletedAt??null,version:input.version||APP_VERSION},'chemistryChallengeAnswer',stateRef)}
export function createCoupleLetterBase(input={},stateRef=state){const now=nowIso();return withMeta({id:input.id||uid('letter'),roomId:input.roomId||getCurrentRoomId(stateRef),dateKey:input.dateKey||todayKey(),promptId:input.promptId||'',promptTitle:input.promptTitle||input.title||'今日小信箱',promptType:input.promptType||'letter',fromUserId:input.fromUserId||getCurrentUserId(stateRef),toUserId:input.toUserId||getPartnerUserId(stateRef),content:input.content||'',status:input.status||'draft',isFavorite:!!input.isFavorite,createdAt:input.createdAt||now,readAt:input.readAt||null,updatedAt:input.updatedAt||now,deletedAt:input.deletedAt??null,version:input.version||APP_VERSION},'coupleLetter',stateRef)}
export function createCoupleLetterReplyBase(input={},stateRef=state){const now=nowIso();return withMeta({id:input.id||uid('letterReply'),letterId:input.letterId||'',roomId:input.roomId||getCurrentRoomId(stateRef),fromUserId:input.fromUserId||getCurrentUserId(stateRef),toUserId:input.toUserId||getPartnerUserId(stateRef),content:input.content||'',createdAt:input.createdAt||now,updatedAt:input.updatedAt||now,deletedAt:input.deletedAt??null,version:input.version||APP_VERSION},'coupleLetterReply',stateRef)}
export function createCoupleLetterLogBase(input={},stateRef=state){const now=nowIso();return withMeta({id:input.id||uid('letterLog'),letterId:input.letterId||'',roomId:input.roomId||getCurrentRoomId(stateRef),actionType:input.actionType||'sent',userId:input.userId||getCurrentUserId(stateRef),note:input.note||'',createdAt:input.createdAt||now,updatedAt:input.updatedAt||now,deletedAt:input.deletedAt??null,version:input.version||APP_VERSION},'coupleLetterLog',stateRef)}
export function normalizeRelationshipAsyncTables(stateRef=state){
  stateRef.chemistryChallengeSessions=dedupeById(ensureArrayTable('chemistryChallengeSessions',stateRef).map(x=>createChemistrySessionBase(x,stateRef)),'chemistryChallengeSession',stateRef);
  stateRef.chemistryChallengeAnswers=dedupeById(ensureArrayTable('chemistryChallengeAnswers',stateRef).map(x=>createChemistryAnswerBase(x,stateRef)),'chemistryChallengeAnswer',stateRef);
  stateRef.coupleLetters=dedupeById(ensureArrayTable('coupleLetters',stateRef).map(x=>createCoupleLetterBase(x,stateRef)),'coupleLetter',stateRef);
  stateRef.coupleLetterReplies=dedupeById(ensureArrayTable('coupleLetterReplies',stateRef).map(x=>createCoupleLetterReplyBase(x,stateRef)),'coupleLetterReply',stateRef);
  stateRef.coupleLetterLogs=dedupeById(ensureArrayTable('coupleLetterLogs',stateRef).map(x=>createCoupleLetterLogBase(x,stateRef)),'coupleLetterLog',stateRef);
  return stateRef;
}

export let state=loadState();


export function defaultRewardRulesForHabit(h={}){
  const pts=Number(h.points||10);
  return [
    {rewardRuleId:uid('rewardRule'),rewardTriggerType:'singleComplete',conditionValue:1,conditionPeriod:'once',detailNote:'每次完成基本獎勵',repeatable:true,enabled:true,claimedHistory:[],rewardItems:[{type:'points',value:pts},{type:'bossDamage',value:Math.max(3,Math.round(pts*.6))},{type:'mapSteps',value:h.pack==='main'||h.type==='main'?5:2}]},
    {rewardRuleId:uid('rewardRule'),rewardTriggerType:'streak',conditionValue:7,conditionPeriod:'day',detailNote:'連續 7 天額外獎勵',repeatable:false,enabled:true,claimedHistory:[],rewardItems:[{type:'points',value:50},{type:'chest',value:'木寶箱',qty:1},{type:'badge',value:'auto'}]}
  ];
}
export function normalizeRewardRules(rules=[],habit={}){
  const arr=Array.isArray(rules)?rules:[];
  const source=arr.length?arr:defaultRewardRulesForHabit(habit);
  return source.map(r=>({
    rewardRuleId:r.rewardRuleId||r.id||uid('rewardRule'),
    rewardTriggerType:r.rewardTriggerType||r.type||'singleComplete',
    conditionValue:Number(r.conditionValue||r.target||1),
    conditionPeriod:r.conditionPeriod||r.period||'once',
    rewardItems:Array.isArray(r.rewardItems)?r.rewardItems:(r.reward?[r.reward]:[]),
    detailNote:r.detailNote||r.description||'',
    repeatable:r.repeatable!==false,
    enabled:r.enabled!==false,
    claimedHistory:Array.isArray(r.claimedHistory)?r.claimedHistory:[]
  }))
}
export function autoBadgeName(habit,rule){
  const title=habit?.title||'習慣';
  const n=Number(rule?.conditionValue||0);
  if(rule?.rewardTriggerType==='streak')return `${title} ${n} 日徽章`;
  if(rule?.rewardTriggerType==='periodCount')return `${title} 週期達成徽章`;
  if(rule?.rewardTriggerType==='totalCount')return `${title} 累積 ${n} 次徽章`;
  return `${title} 達成徽章`;
}
export function migrateHabit(h){
  const next={...h};
  if(!next.frequencyRule)next.frequencyRule=normalizeRule(null,next.frequency);
  else next.frequencyRule=normalizeRule(next.frequencyRule,next.frequency);
  next.frequency=next.frequencyRule.type;
  next.points=Number(next.points)||10;
  next.pack=next.pack||next.type||'side';
  next.type=next.type||next.pack||'side';
  next.taskSource=next.taskSource||'user';
  next.allowRescue=next.allowRescue!==false;
  next.canDoubleComplete=next.canDoubleComplete!==false;
  next.rescueHint=next.rescueHint||next.rescueTemplateHint||'';
  next.rewardRules=normalizeRewardRules(next.rewardRules||next.rewardsRules||next.questRewards||[], next);
  next.visibility=next.visibility||'status';
  next.countForShared=next.countForShared!==false;
  next.assignableByPartner=!!next.assignableByPartner;
  next.isUserCreated=next.taskSource!=='system';
  return next;
}
function logKeyFromRecord(l){return `${l.date||todayKey()}:${l.habitId||l.taskId||l.id}`}
function rebuildLogsObject(habitLogs){const obj={};for(const l of habitLogs||[]){if(l.deletedAt)continue;obj[logKeyFromRecord(l)]=l}return obj}
function normalizeSettings(s,ref){const raw=isObj(s.settings)?s.settings:{};return withMeta({id:'settings_main',theme:'light',activeEffects:{doubleNext:false,discountNext:false,...(raw.activeEffects||{})},...raw},'settings',ref)}
function normalizeSyncMeta(s,ref){const raw=isObj(s.syncMeta)?s.syncMeta:{};return withMeta({id:'sync_meta_main',lastLocalSaveAt:'',lastCloudReadAt:'',lastCloudWriteAt:'',source:'local',...raw},'syncMeta',ref)}
function mirrorLegacyTables(s){
  s.logs=rebuildLogsObject(s.habitLogs);
  s.items=s.gameItems;
  return s;
}
function inferDailyPack(s){
  const date=s?.missions?.daily?.date||todayKey();
  if((s.dailyPacks||[]).some(p=>p.date===date))return [];
  const dailyIds=Array.isArray(s?.missions?.daily?.ids)?s.missions.daily.ids:[];
  const flexIds=Array.isArray(s?.missions?.flex?.ids)?s.missions.flex.ids:[];
  if(!dailyIds.length&&!flexIds.length)return [];
  return [{id:`pack_${date}`,date,dailyTaskIds:dailyIds,flexTaskIds:flexIds,status:'active',source:'migrated'}];
}
function inferMissionRows(s,type){
  const date=type==='daily'?(s?.missions?.daily?.date||todayKey()):(s?.missions?.flex?.date||todayKey());
  const ids=Array.isArray(s?.missions?.[type]?.ids)?s.missions[type].ids:[];
  const swapped=isObj(s?.missions?.[type]?.swapped)?s.missions[type].swapped:{};
  const completed=isObj(s?.missions?.[type]?.completed)?s.missions[type].completed:{};
  return ids.map((taskId,slot)=>({id:`${type}_${date}_${slot}`,date,slot,taskId,status:completed[taskId]?'completed':'active',swapHistory:swapped[String(slot)]?[{date,slot,fromTaskId:taskId,toTaskId:taskId,swappedAt:nowIso(),migrated:true}]:[],source:'migrated'}));
}
export function migrate(input){
  const d=defaultState();
  let s={...d,...(input||{})};
  if(!s.createdAt)s.createdAt=nowIso();
  if(!s.updatedAt)s.updatedAt=s.createdAt;
  if(!('deletedAt' in s))s.deletedAt=null;
  s.version=APP_VERSION;
  s.settings=normalizeSettings(s,s);
  s.syncMeta=normalizeSyncMeta(s,s);
  s.room={...d.room,...(s.room||{})};
  s.adventure={...d.adventure,...(s.adventure||{})};
  s.firebase={...d.firebase,...(s.firebase||{})};
  s.missions={...d.missions,...(s.missions||{})};
  s.missions.daily={...d.missions.daily,...(s.missions.daily||{})};
  s.missions.flex={...d.missions.flex,...(s.missions.flex||{})};
  s.missions.flex.statuses=isObj(s.missions.flex.statuses)?s.missions.flex.statuses:{};
  s.missions.flex.periodKeys=isObj(s.missions.flex.periodKeys)?s.missions.flex.periodKeys:{};
  s.missions.flex.periodMeta=isObj(s.missions.flex.periodMeta)?s.missions.flex.periodMeta:{};
  s.missions.flex.swapCounts=isObj(s.missions.flex.swapCounts)?s.missions.flex.swapCounts:{};
  s.missions.flex.settled=isObj(s.missions.flex.settled)?s.missions.flex.settled:{};
  if(!isObj(s.harmonyDaily))s.harmonyDaily={};
  if(!Array.isArray(s.adventure.logs))s.adventure.logs=[];
  s.adventureLogs=dedupeById([...(Array.isArray(s.adventureLogs)?s.adventureLogs:[]),...s.adventure.logs],'adventureLog',s);
  s.adventure.logs=s.adventureLogs;
  s.mapNodes=dedupeById([...(Array.isArray(s.mapNodes)?s.mapNodes:[]),...mapNodesSeed],'mapNode',s);
  s.mapProgress=dedupeById(Array.isArray(s.mapProgress)?s.mapProgress:[{id:'map_progress_solo',mode:'solo',currentSteps:Number(s.adventure?.soloStep||0),currentNodeId:'solo_node_01',unlockedNodeIds:['solo_node_01']},{id:'map_progress_couple',mode:'couple',currentSteps:Number(s.adventure?.coupleStep||0),currentNodeId:'couple_node_01',unlockedNodeIds:['couple_node_01']}],'mapProgress',s);
  s.mapSideQuests=dedupeById([...(Array.isArray(s.mapSideQuests)?s.mapSideQuests:[]),...s.mapNodes.flatMap(n=>n.sideQuests||[])],'mapSideQuest',s);
  s.mapSideQuestProgress=dedupeById(Array.isArray(s.mapSideQuestProgress)?s.mapSideQuestProgress:[],'mapSideQuestProgress',s);
  s.mapExploreObjects=dedupeById([...(Array.isArray(s.mapExploreObjects)?s.mapExploreObjects:[]),...s.mapNodes.flatMap(n=>n.exploreObjects||[])],'mapExploreObject',s);
  s.mapExploreLogs=dedupeById(Array.isArray(s.mapExploreLogs)?s.mapExploreLogs:[],'mapExploreLog',s);
  s.mapHiddenQuests=dedupeById(Array.isArray(s.mapHiddenQuests)?s.mapHiddenQuests:[],'mapHiddenQuest',s);
  s.mapQuestProgress=dedupeById(Array.isArray(s.mapQuestProgress)?s.mapQuestProgress:[],'mapQuestProgress',s);
  s.mapTravelCoupons=dedupeById(Array.isArray(s.mapTravelCoupons)?s.mapTravelCoupons:[],'mapTravelCoupon',s);
  s.mapRewards=dedupeById(Array.isArray(s.mapRewards)?s.mapRewards:[],'mapReward',s);
  s.abilityEffects=dedupeById(Array.isArray(s.abilityEffects)?s.abilityEffects:[],'abilityEffect',s);
  ensureMapProgressSync(s);
  const legacyLogs=Array.isArray(s.habitLogs)?s.habitLogs:(isObj(s.logs)?Object.values(s.logs):[]);
  const legacyItems=[...(Array.isArray(s.gameItems)?s.gameItems:(Array.isArray(s.items)?s.items:[])),...d.gameItems];
  s.users=dedupeById(Array.isArray(s.users)?s.users:d.users,'user',s);
  s.habits=dedupeById((Array.isArray(s.habits)?s.habits:d.habits).map(migrateHabit),'habit',s);
  s.habitLogs=dedupeById(legacyLogs,'habitLog',s);
  s.dailyPacks=dedupeById([...(Array.isArray(s.dailyPacks)?s.dailyPacks:[]),...inferDailyPack(s)],'dailyPack',s);
  s.dailyTasks=dedupeById([...(Array.isArray(s.dailyTasks)?s.dailyTasks:[]),...inferMissionRows(s,'daily')],'dailyTask',s);
  s.flexTasks=dedupeById([...(Array.isArray(s.flexTasks)?s.flexTasks:[]),...inferMissionRows(s,'flex')],'flexTask',s);
  s.secretTasks=dedupeById(Array.isArray(s.secretTasks)?s.secretTasks:[],'secretTask',s);
  s.pointsLedger=dedupeById(Array.isArray(s.pointsLedger)?s.pointsLedger:[],'point',s);
  s.rewards=dedupeById(Array.isArray(s.rewards)?s.rewards:d.rewards,'reward',s).map(r=>({stock:'',weeklyLimit:'',note:'',...r}));
  s.rewardRedemptions=dedupeById(Array.isArray(s.rewardRedemptions)?s.rewardRedemptions:[],'rewardRedemption',s).map(r=>({used:false,usedAt:'',note:'',discountUsed:false,originalCost:r.cost||0,finalCost:r.cost||0,...r}));
  s.gameItems=dedupeById(legacyItems,'gameItem',s);
  s.gameLogs=dedupeById(Array.isArray(s.gameLogs)?s.gameLogs:[],'gameLog',s);
  s.quests=dedupeById([...(Array.isArray(s.quests)?s.quests:[]),...defaultQuests],'quest',s);
  for(const q of s.quests){q.kind=q.kind||'mainQuestLine';q.linkedHabitId=q.linkedHabitId||'';q.linkedCategory=q.linkedCategory||q.category||'';q.reward=q.reward||{};q.reward.points=Number(q.reward.points||q.rewardPoints||60);q.reward.exp=Number(q.reward.exp||q.expReward||80);q.reward.item=q.reward.item||q.rewardChest||'木寶箱';q.reward.badge=q.reward.badge||q.badge||`${q.title||'任務線'}徽章`;q.mapReward=q.mapReward||{steps:10};q.bossItemReward=q.bossItemReward||'';q.enabled=q.enabled!==false;}
  s.questProgress=dedupeById(Array.isArray(s.questProgress)?s.questProgress:[],'questProgress',s);
  s.achievements=dedupeById([...(Array.isArray(s.achievements)?s.achievements:[]),...defaultAchievements.map(a=>({...a,unlocked:false,unlockedAt:'',progress:0}))],'achievement',s);
  s.levelData=withMeta({id:'level_main',level:1,exp:0,totalExp:0,title:'新手冒險者',nextLevelExp:100,...(isObj(s.levelData)?s.levelData:{})},'levelData',s);
  s.attributes={health:0,knowledge:0,discipline:0,finance:0,relationship:0,...(isObj(s.attributes)?s.attributes:{})};
  s.attributeLogs=dedupeById(Array.isArray(s.attributeLogs)?s.attributeLogs:[],'attributeLog',s);
  s.storyChapters=dedupeById([...(Array.isArray(s.storyChapters)?s.storyChapters:[]),...defaultStoryChapters.map(c=>({...c,unlocked:false,unlockedAt:''}))],'storyChapter',s);
  s.streakRewards=dedupeById(Array.isArray(s.streakRewards)?s.streakRewards:[],'streakReward',s);
  s.weeklyReviews=dedupeById(Array.isArray(s.weeklyReviews)?s.weeklyReviews:[],'weeklyReview',s);
  s.monthlyReports=dedupeById(Array.isArray(s.monthlyReports)?s.monthlyReports:[],'monthlyReport',s);
  s.couplePointsLedger=dedupeById(Array.isArray(s.couplePointsLedger)?s.couplePointsLedger:[],'couplePoint',s);
  s.sharedQuests=dedupeById([...(Array.isArray(s.sharedQuests)?s.sharedQuests:[]),...defaultSharedQuests],'sharedQuest',s);
  s.sharedQuestProgress=dedupeById(Array.isArray(s.sharedQuestProgress)?s.sharedQuestProgress:[],'sharedQuestProgress',s);
  s.sharedTasks=dedupeById([...(Array.isArray(s.sharedTasks)?s.sharedTasks:[]),...s.sharedQuests],'sharedTask',s);
  s.sharedTaskProgress=dedupeById([...(Array.isArray(s.sharedTaskProgress)?s.sharedTaskProgress:[]),...s.sharedQuestProgress],'sharedTaskProgress',s);
  s.sharedTaskChangeRequests=dedupeById(Array.isArray(s.sharedTaskChangeRequests)?s.sharedTaskChangeRequests:[],'sharedTaskChangeRequest',s);
  s.builtInCoupleRewards=dedupeById([...(Array.isArray(s.builtInCoupleRewards)?s.builtInCoupleRewards:[]),...defaultSharedRewards],'builtInCoupleReward',s);
  for(const q of s.sharedTasks){if(!s.sharedTaskProgress.some(p=>p.questId===q.id&&!p.deletedAt)){const meta=sharedTaskDates(q);s.sharedTaskProgress.push(withMeta({id:`shared_progress_${q.id}_${meta.periodKey}`,questId:q.id,title:q.title,scope:q.scope,status:'active',progress:0,target:q.target||1,myProgress:0,partnerProgress:0,periodKey:meta.periodKey,periodStart:meta.periodStart,periodEnd:meta.periodEnd,totalDays:meta.totalDays,completedAt:'',dayIndex:1,completedCount:0,swapHistory:[],settledAt:null,replacedAt:null},'sharedTaskProgress',s));}}
  s.sharedQuestProgress=s.sharedTaskProgress;
  s.sharedRewards=dedupeById((Array.isArray(s.sharedRewards)?s.sharedRewards:[]).filter(r=>r.source!=='builtin'&&!String(r.id||'').startsWith('sr_builtin_')),'sharedReward',s);
  s.sharedRewardRedemptions=dedupeById(Array.isArray(s.sharedRewardRedemptions)?s.sharedRewardRedemptions:[],'sharedRewardRedemption',s);
  s.coupleSecretTasks=dedupeById(Array.isArray(s.coupleSecretTasks)?s.coupleSecretTasks:[],'coupleSecretTask',s);
  s.coupleChallenges=dedupeById([...(Array.isArray(s.coupleChallenges)?s.coupleChallenges:[]),...defaultCoupleChallenges],'coupleChallenge',s);
  s.coupleChallengeProgress=dedupeById(Array.isArray(s.coupleChallengeProgress)?s.coupleChallengeProgress:[],'coupleChallengeProgress',s);
  s.coupleBosses=dedupeById(Array.isArray(s.coupleBosses)?s.coupleBosses:[],'coupleBoss',s);
  s.bossDamageLogs=dedupeById(Array.isArray(s.bossDamageLogs)?s.bossDamageLogs:[],'bossDamageLog',s);
  s.bossRewards=dedupeById(Array.isArray(s.bossRewards)?s.bossRewards:[],'bossReward',s);
  s.bossBattleReports=dedupeById(Array.isArray(s.bossBattleReports)?s.bossBattleReports:[],'bossBattleReport',s);
  s.coupleBattleReports=dedupeById(Array.isArray(s.coupleBattleReports)?s.coupleBattleReports:[],'coupleBattleReport',s);
  s.reports=dedupeById(Array.isArray(s.reports)?s.reports:[],'report',s);
  s.reportSnapshots=dedupeById(Array.isArray(s.reportSnapshots)?s.reportSnapshots:[],'reportSnapshot',s);
  s.coupleTitles=dedupeById(Array.isArray(s.coupleTitles)?s.coupleTitles:[],'coupleTitle',s);
  s.bossItems=dedupeById(Array.isArray(s.bossItems)?s.bossItems:[],'bossItem',s);
  s.coupleStats=withMeta({id:'couple_stats_main',myTodayCompleted:0,partnerTodayCompleted:0,myWeeklyRate:0,partnerWeeklyRate:0,leader:'tie',secretCompleted:0,weeklyTitle:'默契練習中',...(s.coupleStats||{})},'coupleStats',s);
  s.assignedTasks=dedupeById(Array.isArray(s.assignedTasks)?s.assignedTasks:[],'assignedTask',s);
  s.rescueTemplates=dedupeById(Array.isArray(s.rescueTemplates)?s.rescueTemplates:[],'rescueTemplate',s);
  s.rescueLogs=dedupeById(Array.isArray(s.rescueLogs)?s.rescueLogs:[],'rescueLog',s);
  s.taskSwapLogs=dedupeById(Array.isArray(s.taskSwapLogs)?s.taskSwapLogs:[],'taskSwapLog',s);
  s.itemUseLogs=dedupeById(Array.isArray(s.itemUseLogs)?s.itemUseLogs:[],'itemUseLog',s);
  s.mapInventory=dedupeById(Array.isArray(s.mapInventory)?s.mapInventory:[],'mapInventory',s);
  s.mapInventoryLogs=dedupeById(Array.isArray(s.mapInventoryLogs)?s.mapInventoryLogs:[],'mapInventoryLog',s);
  s.mapExploreDailyLogs=dedupeById(Array.isArray(s.mapExploreDailyLogs)?s.mapExploreDailyLogs:[],'mapExploreDailyLog',s);
  s.activeItemEffects=dedupeById(Array.isArray(s.activeItemEffects)?s.activeItemEffects:[],'activeItemEffect',s);
  s.habitRewardRules=dedupeById(Array.isArray(s.habitRewardRules)?s.habitRewardRules:[],'habitRewardRule',s);
  s.habitRewardLogs=dedupeById(Array.isArray(s.habitRewardLogs)?s.habitRewardLogs:[],'habitRewardLog',s);
  s.assignedTaskChangeRequests=dedupeById(Array.isArray(s.assignedTaskChangeRequests)?s.assignedTaskChangeRequests:[],'assignedTaskChangeRequest',s);
  s.assignedTaskRewards=dedupeById(Array.isArray(s.assignedTaskRewards)?s.assignedTaskRewards:[],'assignedTaskReward',s);
  s.assignedTaskLogs=dedupeById(Array.isArray(s.assignedTaskLogs)?s.assignedTaskLogs:[],'assignedTaskLog',s);
  s.legacyRewardPlans=dedupeById(Array.isArray(s.legacyRewardPlans)?s.legacyRewardPlans:[],'legacyRewardPlan',s);
  // Phase 11B: enrich legacy items with usage metadata.
  s.gameItems=(s.gameItems||[]).map(it=>({...it,usageType:it.usageType||inferItemUsage(it.name||it.id),description:it.description||itemDescription(it.name||it.id),usableTarget:it.usableTarget||itemUsableTarget(it.name||it.id)}));
  s.supportLogs=dedupeById(Array.isArray(s.supportLogs)?s.supportLogs:[],'support',s);
  s.coupleTasks=dedupeById(Array.isArray(s.coupleTasks)?s.coupleTasks:coupleTasks,'coupleTask',s);
  s.relationshipLogs=dedupeById(Array.isArray(s.relationshipLogs)?s.relationshipLogs:[],'relationship',s);
  s.closeTodayCards=dedupeById(Array.isArray(s.closeTodayCards)&&s.closeTodayCards.length>=1000?s.closeTodayCards:closeTodayCards,'closeTodayCard',s);
  s.chemistryChallengeCards=dedupeById(Array.isArray(s.chemistryChallengeCards)&&s.chemistryChallengeCards.length>=1000?s.chemistryChallengeCards:chemistryChallengeCards,'chemistryChallengeCard',s);
  s.dateIdeaCards=dedupeById(Array.isArray(s.dateIdeaCards)&&s.dateIdeaCards.length>=1000?s.dateIdeaCards:dateIdeaCards,'dateIdeaCard',s);
  s.deepTalkCards=dedupeById(Array.isArray(s.deepTalkCards)&&s.deepTalkCards.length>=1000?s.deepTalkCards:deepTalkCards,'deepTalkCard',s);
  s.relationshipStats=withMeta({id:'relationship_stats_main',intimacy:0,chemistry:0,heartbeat:0,companionship:0,closeTodayStreak:0,lastCloseTodayDate:'',...(isObj(s.relationshipStats)?s.relationshipStats:{})},'relationshipStats',s);
  s.relationshipStats.heartbeat=Number(s.relationshipStats.heartbeat ?? s.relationshipStats.companionship ?? 0)||0;
  s.relationshipStats.companionship=Number(s.relationshipStats.companionship||0)||0;
  s.coupleWishPool=dedupeById(Array.isArray(s.coupleWishPool)?s.coupleWishPool:[],'coupleWish',s).map(w=>{
    const reqIntimacy=Number(w.requiredIntimacy??w.targetIntimacy??Math.round(Number(w.targetCouplePoints||300)*0.4))||120;
    const invIntimacy=Number(w.investedIntimacy??0)||0;
    const reqChemistry=Number(w.requiredChemistry??w.targetChemistry??Math.round(Number(w.targetCouplePoints||300)*0.25))||80;
    const invChemistry=Number(w.investedChemistry??0)||0;
    const reqHeartbeat=Number(w.requiredHeartbeat??w.targetHeartbeat??Math.round(Number(w.targetCouplePoints||300)*0.35))||100;
    const invHeartbeat=Number(w.investedHeartbeat??0)||0;
    const statusMap={open:'想做',active:'累積中',ready:'已達標',completed:'已完成'};
    const ready=invIntimacy>=reqIntimacy&&invChemistry>=reqChemistry&&invHeartbeat>=reqHeartbeat;
    const invested=invIntimacy+invChemistry+invHeartbeat;
    const status=statusMap[w.status]||w.status|| (ready?'已達標':invested>0?'累積中':'想做');
    return {...w,description:w.description||w.content||'',category:w.category||'其他',requiredIntimacy:reqIntimacy,investedIntimacy:invIntimacy,requiredChemistry:reqChemistry,investedChemistry:invChemistry,requiredHeartbeat:reqHeartbeat,investedHeartbeat:invHeartbeat,excitementLevel:w.excitementLevel||w.expectation||w.level||'3',status};
  });
  s.coupleWishLogs=dedupeById(Array.isArray(s.coupleWishLogs)?s.coupleWishLogs:[],'coupleWishLog',s);
  s.relationshipChests=dedupeById(Array.isArray(s.relationshipChests)?s.relationshipChests:[],'relationshipChest',s);
  s.relationshipChestLogs=dedupeById(Array.isArray(s.relationshipChestLogs)?s.relationshipChestLogs:[],'relationshipChestLog',s);
  s.relationshipReviews=dedupeById(Array.isArray(s.relationshipReviews)?s.relationshipReviews:[],'relationshipReview',s);
  s.relationshipReviewSnapshots=dedupeById(Array.isArray(s.relationshipReviewSnapshots)?s.relationshipReviewSnapshots:[],'relationshipReviewSnapshot',s);
  s.cardDrawLogs=dedupeById(Array.isArray(s.cardDrawLogs)?s.cardDrawLogs:[],'cardDrawLog',s);
  s.cardCollectionLogs=dedupeById(Array.isArray(s.cardCollectionLogs)?s.cardCollectionLogs:[],'cardCollectionLog',s);
  normalizeRelationshipAsyncTables(s);
  s.currentRelationshipCards={date:'',closeTodayId:'',closeTodaySwapped:false,chemistryId:'',chemistryChoiceId:'',letterPromptId:'',dateIdeaId:'',deepTalkId:'',...(isObj(s.currentRelationshipCards)?s.currentRelationshipCards:{})};
  s.adventure.logs=dedupeById(s.adventure.logs,'adventure',s);
  s.importedStats=dedupeById(Array.isArray(s.importedStats)?s.importedStats:[],'importedStat',s);
  return mirrorLegacyTables(s);
}

function inferItemUsage(name){name=String(name||'');if(name.includes('寶箱'))return 'openChest';if(['火焰球','冰凍彈','破盾券','追加攻擊券','Boss 弱點卡'].includes(name))return 'bossAttack';if(name==='能量藥水')return 'energySupport';if(name==='補救券')return 'rescue';if(name==='加倍卡')return 'taskBoost';if(name==='跳過券')return 'skipTask';if(name==='換卡券')return 'swapTask';if(name==='地圖換算券')return 'mapBoost';if(name==='抽獎券')return 'flip';if(name==='轉盤機會')return 'wheel';if(name==='星光碎片')return 'craft';if(name==='商店折價券')return 'discount';return 'info'}
function itemDescription(name){name=String(name||'');const m={'抽獎券':'前往翻牌使用。','轉盤機會':'前往轉盤使用。','補救券':'隔天補救昨天未完成的習慣。','加倍卡':'選擇使用後，下一個任務點數加倍。','跳過券':'在可跳過任務卡使用，今天免做不拿點。','換卡券':'本期彈性任務第二次以上換卡使用。','商店折價券':'兌換商店獎勵時使用。','火焰球':'對本週 Boss 造成傷害。','冰凍彈':'對 Boss 造成傷害，並啟用今日任務傷害加成。','破盾券':'對 Boss 破盾並造成傷害。','追加攻擊券':'下一次 Boss 攻擊加倍。','Boss 弱點卡':'本週某類任務 Boss 傷害加成。','能量藥水':'恢復挑戰能量或轉成雙人點數。','星光碎片':'集滿 5 個可合成銀寶箱。','地圖換算券':'啟用地圖步數加成。'};if(name.includes('寶箱'))return '開啟後取得點數、券、徽章或道具。';return m[name]||'可用道具。'}
function itemUsableTarget(name){name=String(name||'');if(['火焰球','冰凍彈','破盾券','追加攻擊券','Boss 弱點卡'].includes(name))return 'boss';if(['補救券'].includes(name))return 'rescue';if(['加倍卡','跳過券','換卡券'].includes(name))return 'task';if(name==='地圖換算券')return 'map';if(name.includes('寶箱'))return 'chest';if(name==='星光碎片')return 'craft';return 'game'}

function readAnyStored(){if(typeof localStorage==='undefined')return null;for(const k of [KEY,...LEGACY_KEYS]){const raw=localStorage.getItem(k);if(raw){try{return JSON.parse(raw)}catch{}}}return null}
export function loadState(){try{return migrate(readAnyStored()||defaultState())}catch(e){console.warn('loadState failed',e);return defaultState()}}

export function saveState(options={}){const {touch=true,emit=true,source='local'}=options;state=migrate(state);state.version=APP_VERSION;if(!state.createdAt)state.createdAt=nowIso();if(touch)state.updatedAt=nowIso();state.syncMeta={...state.syncMeta,lastLocalSaveAt:nowIso(),updatedAt:nowIso(),source,version:APP_VERSION,dirty:touch?true:(state.syncMeta?.dirty||false)};mirrorLegacyTables(state);if(typeof localStorage!=='undefined')localStorage.setItem(KEY,JSON.stringify(state));if(emit&&typeof window!=='undefined'){try{window.dispatchEvent(new CustomEvent('habit-state-saved',{detail:{updatedAt:state.updatedAt,source}}))}catch{}}}
export function replaceState(next,options={}){const {touch=false,emit=false,source='replace'}=options;state=migrate(next);saveState({touch,emit,source})}
export function resetState(){state=defaultState();saveState({source:'reset'})}

export function markRecord(record){return withMeta({...record,updatedAt:nowIso()},record?.type||'rec',state)}
export function upsertById(table,row,type=table){if(!Array.isArray(state[table]))state[table]=[];const next=withMeta(row,type,state);next.updatedAt=nowIso();const idx=state[table].findIndex(x=>x.id===next.id);if(idx>=0)state[table][idx]={...state[table][idx],...next};else state[table].push(next);return next}
export function addGameLog(action,description='',payload={}){return upsertById('gameLogs',{id:uid('gameLog'),date:todayKey(),action,description,payload},'gameLog')}
export function ensureDailyPackRecord(date=todayKey(),dailyIds=[],flexIds=[]){const id=`pack_${date}`;return upsertById('dailyPacks',{id,date,dailyTaskIds:[...dailyIds],flexTaskIds:[...flexIds],status:'active',source:'generated'},'dailyPack')}
export function ensureMissionTaskRows(type,date,ids=[]){const table=type==='daily'?'dailyTasks':'flexTasks';ids.forEach((taskId,slot)=>{const id=`${type}_${date}_${slot}`;upsertById(table,{id,date,slot,taskId,status:'active',swapHistory:state[table]?.find(x=>x.id===id)?.swapHistory||[],source:'generated'},type==='daily'?'dailyTask':'flexTask')})}
export function setMissionTaskStatus(type,taskId,status,extra={}){const table=type==='daily'?'dailyTasks':'flexTasks';let row=(state[table]||[]).find(x=>x.taskId===taskId&&x.date===(type==='daily'?state.missions.daily.date:state.missions.flex.date));if(row){row.status=status;Object.assign(row,extra,{updatedAt:nowIso()})}}
export function recordSwap(type,slot,fromTaskId,toTaskId){const table=type==='daily'?'dailyTasks':'flexTasks';const date=type==='daily'?state.missions.daily.date:state.missions.flex.date;let row=(state[table]||[]).find(x=>x.date===date&&Number(x.slot)===Number(slot));if(!row){row=upsertById(table,{id:`${type}_${date}_${slot}`,date,slot,taskId:toTaskId,status:'active',swapHistory:[]},type==='daily'?'dailyTask':'flexTask')}row.taskId=toTaskId;row.swapHistory=Array.isArray(row.swapHistory)?row.swapHistory:[];row.swapHistory.push({date,slot,fromTaskId,toTaskId,swappedAt:nowIso()});row.updatedAt=nowIso();return row}

export function logKey(taskId,date=todayKey()){return `${date}:${taskId}`}
export function isDone(taskId,date=todayKey()){return !!state.logs[logKey(taskId,date)]}
export function addLog(task,extra={}){const date=extra.date||todayKey();const key=logKey(task.id,date);if(state.logs[key])return false;let basePoints=Number(extra.points??task.points)||0;let multiplier=1;if(basePoints>0&&state.settings?.activeEffects?.doubleNext){multiplier=2;state.settings.activeEffects.doubleNext=false;addGameLog('useDoubleCard',`加倍卡生效：${task.title}`,{taskId:task.id,basePoints,multiplier});}const finalPoints=Math.round(basePoints*multiplier);const row=withMeta({id:uid('habitLog'),date,habitId:task.habitId||task.id,taskId:task.id,title:task.title,points:finalPoints,basePoints,multiplier,periodKey:extra.periodKey||'',periodLabel:extra.periodLabel||'',type:extra.type||'task',frequencyRule:task.frequencyRule||null,frequencyDescription:extra.frequencyDescription||'',status:extra.status||'completed',completedAt:nowIso(),partialRatio:extra.partialRatio||1,amount:extra.amount||'',targetAmount:extra.targetAmount||''},'habitLog',state);state.habitLogs.unshift(row);state.logs[key]=row;if(finalPoints)addPoints(finalPoints,extra.type||'task',`${multiplier>1?'加倍':''}完成任務：${task.title}`,task.id);grantExp(Math.max(5,Math.round(finalPoints||Number(task.points)||5)),extra.type||'task',`完成任務：${task.title}`,task.id);addAttributeFromTask(task,extra.type||'task');updateQuestProgress(task);unlockStoryChapters();checkAchievements();try{applyBossDamage(damageFor(extra.type||'habit',1,task),extra.type||'habit',`個人任務攻擊 Boss：${task.title}`,{taskId:task.id,pack:task.pack||task.type||''})}catch{}try{applyMapStepsFromTask(task,{...extra,sourceLogId:row.id})}catch{}return true}
export function removeTodayLog(taskId){const key=logKey(taskId);const old=state.logs[key];if(!old)return false;delete state.logs[key];const row=state.habitLogs.find(l=>l.id===old.id||((l.taskId===taskId||l.habitId===taskId)&&l.date===todayKey()&&!l.deletedAt));if(row){row.deletedAt=nowIso();row.updatedAt=nowIso();row.status='undone';revertAdventureBySource(row.id,{revertedBy:currentUserOf(state),revertReason:`恢復上一步：${row.title||old.title||taskId}`})}else if(old.id){revertAdventureBySource(old.id,{revertedBy:currentUserOf(state),revertReason:`恢復上一步：${old.title||taskId}`})}if(Number(old.points))addPoints(-Number(old.points),'undo',`恢復上一步：${old.title}`,taskId);return true}
export function addPoints(amount,source,description,relatedId=''){amount=Number(amount)||0;if(!amount)return;state.pointsLedger.unshift(withMeta({id:uid('point'),date:todayKey(),amount,source,description,relatedId},'point',state))}
export function spendPoints(cost,description){state.pointsLedger.unshift(withMeta({id:uid('spend'),date:todayKey(),amount:-Math.abs(Number(cost)||0),source:'reward',description},'point',state))}
export function currentPoints(){return state.pointsLedger.reduce((s,x)=>s+Number(x.amount||0),0)}
export function todayPoints(){return state.pointsLedger.filter(x=>x.date===todayKey()).reduce((s,x)=>s+Number(x.amount||0),0)}
export function adjustItem(name,delta){let it=state.gameItems.find(x=>x.name===name||x.id===name);if(!it){it=withMeta({id:uid('item'),name,quantity:0},'gameItem',state);state.gameItems.push(it)}it.quantity=Math.max(0,Number(it.quantity||0)+delta);it.updatedAt=nowIso();state.items=state.gameItems;return it}
export function itemQuantity(name){const it=state.gameItems.find(x=>x.name===name||x.id===name);return Number(it?.quantity||0)}
export function consumeItem(name,qty=1){const it=state.gameItems.find(x=>x.name===name||x.id===name);qty=Number(qty)||1;if(!it||Number(it.quantity||0)<qty)return false;it.quantity=Number(it.quantity||0)-qty;it.updatedAt=nowIso();state.items=state.gameItems;return true}
export function grantItem(name,qty=1,type='item'){const it=adjustItem(name,qty);it.itemType=it.itemType||type;return it}
export function countCompletionsInPeriod(task,pk){return state.habitLogs.filter(l=>(l.habitId===task.id||l.taskId===task.id)&&l.periodKey===pk&&!l.deletedAt).length}
export function flexTaskKey(task,date=new Date()){return `${task.id}:${periodKey(task.frequencyRule,date)}`}

function levelNeed(level){return Math.max(100,level*level*60)}
function titleForLevel(level){let t=levelTitles[0]?.title||'新手冒險者';for(const row of levelTitles){if(level>=row.level)t=row.title}return t}
export function grantExp(amount,source='task',description='',relatedId=''){
  amount=Number(amount)||0;if(amount<=0)return;
  const ld=state.levelData||{id:'level_main',level:1,exp:0,totalExp:0,title:'新手冒險者'};
  ld.exp=Number(ld.exp||0)+amount;ld.totalExp=Number(ld.totalExp||0)+amount;
  while(ld.exp>=levelNeed(ld.level||1)){ld.exp-=levelNeed(ld.level||1);ld.level=Number(ld.level||1)+1;addGameLog('levelUp',`升級到 Lv.${ld.level} ${titleForLevel(ld.level)}`,{level:ld.level,source});}
  ld.title=titleForLevel(ld.level||1);ld.nextLevelExp=levelNeed(ld.level||1);ld.updatedAt=nowIso();state.levelData=withMeta(ld,'levelData',state);
  state.pointsLedger.unshift(withMeta({id:uid('exp'),date:todayKey(),amount:0,source:'exp',description:`EXP +${amount}：${description}`,relatedId,exp:amount},'point',state));
}
export function addAttributeFromTask(task,source='task'){
  const key=attributeByCategory[task.category]||attributeByCategory[task.type]||'discipline';
  const amount=Math.max(1,Math.round((Number(task.points)||5)/5));
  state.attributes=state.attributes||{health:0,knowledge:0,discipline:0,finance:0,relationship:0};
  state.attributes[key]=Number(state.attributes[key]||0)+amount;
  state.attributeLogs.unshift(withMeta({id:uid('attr'),date:todayKey(),attribute:key,amount,source,taskId:task.id,title:task.title,category:task.category||''},'attributeLog',state));
}
function countGameAction(action){return state.gameLogs.filter(x=>x.action===action&&!x.deletedAt).length}
function pointsEarned(){return state.pointsLedger.filter(x=>Number(x.amount)>0).reduce((a,b)=>a+Number(b.amount||0),0)}
function achievementProgress(a){const c=a.condition||{};if(c.type==='habitLogs')return state.habitLogs.filter(x=>!x.deletedAt&&x.status!=='undone').length;if(c.type==='streak')return calculateStreak();if(c.type==='pointsEarned')return pointsEarned();if(c.type==='redemptions')return state.rewardRedemptions.filter(x=>!x.deletedAt).length;if(c.type==='gameAction')return countGameAction(c.action);if(c.type==='coupleLogs')return state.relationshipLogs.length;return 0}
export function checkAchievements(){for(const a of state.achievements){const target=Number(a.condition?.target||1);const progress=achievementProgress(a);a.progress=progress;a.target=target;if(!a.unlocked&&progress>=target){a.unlocked=true;a.unlockedAt=nowIso();a.updatedAt=nowIso();const r=a.reward||{};if(r.points)addPoints(r.points,'achievement',`成就解鎖：${a.name}`,a.id);if(r.exp)grantExp(r.exp,'achievement',`成就解鎖：${a.name}`,a.id);if(r.item)grantItem(r.item,1,'achievement');addGameLog('achievementUnlock',`解鎖成就：${a.name}`,{achievementId:a.id,reward:r});}}
}
function questMatches(q,task){const tags=q.tags||[];if(!tags.length)return true;const text=`${task.category||''} ${task.title||''} ${task.description||''}`;return tags.some(t=>text.includes(t))}
export function ensureQuestProgress(){for(const q of state.quests){if(!state.questProgress.some(p=>p.questId===q.id&&!p.deletedAt)){state.questProgress.push(withMeta({id:`progress_${q.id}`,questId:q.id,status:'not_started',progress:0,target:q.target||1,startedAt:'',completedAt:'',endedAt:'',title:q.title},'questProgress',state));}}
}
export function startQuest(questId){ensureQuestProgress();const p=state.questProgress.find(x=>x.questId===questId&&!x.deletedAt);if(!p)return false;p.status='active';p.startedAt=p.startedAt||nowIso();p.updatedAt=nowIso();return true}
export function abandonQuest(questId){const p=state.questProgress.find(x=>x.questId===questId&&!x.deletedAt);if(!p)return false;p.status='abandoned';p.endedAt=nowIso();p.updatedAt=nowIso();return true}
export function addCustomQuest(title,target=7,category='自訂'){
  const id=uid('quest');const q=withMeta({id,title,category,durationDays:30,target:Number(target)||7,description:'自訂任務線',reward:{points:60,exp:80,item:'木寶箱',badge:'自訂任務線完成'},tags:[category]},'quest',state);state.quests.push(q);state.questProgress.push(withMeta({id:`progress_${id}`,questId:id,status:'not_started',progress:0,target:q.target,startedAt:'',completedAt:'',title:q.title},'questProgress',state));return q;
}
export function updateQuestProgress(task){ensureQuestProgress();for(const p of state.questProgress){if(p.status!=='active')continue;const q=state.quests.find(x=>x.id===p.questId);if(!q||!questMatches(q,task))continue;p.progress=Math.min(Number(p.target||q.target||1),Number(p.progress||0)+1);p.updatedAt=nowIso();if(p.progress>=Number(p.target||q.target||1)){p.status='completed';p.completedAt=nowIso();const r=q.reward||{};if(r.points)addPoints(r.points,'questComplete',`完成任務線：${q.title}`,q.id);if(r.exp)grantExp(r.exp,'questComplete',`完成任務線：${q.title}`,q.id);if(r.item)grantItem(r.item,1,'quest');if(r.badge){const ach=withMeta({id:`quest_badge_${q.id}`,name:r.badge,description:`完成任務線：${q.title}`,unlocked:true,unlockedAt:nowIso(),source:'quest',condition:{type:'quest',target:1},progress:1,target:1,reward:{}},'achievement',state);state.achievements.unshift(ach);}addGameLog('questComplete',`完成任務線：${q.title}`,{questId:q.id,reward:r});}}
}
export function unlockStoryChapters(){for(const c of state.storyChapters){if(c.unlocked)continue;const ok=(Number(state.levelData?.level||1)>=Number(c.requiredLevel||1))&&(Number(state.adventure?.soloStep||0)>=Number(c.requiredSoloStep||0));if(ok){c.unlocked=true;c.unlockedAt=nowIso();c.updatedAt=nowIso();addGameLog('storyUnlock',`解鎖劇情：${c.title}`,{storyId:c.id});}}
}

export function upsertReport(reportType,periodKey,text,sourceDataSummary={}){
  const id=`report_${reportType}_${periodKey}`;
  const row=withMeta({id,reportType,periodKey,latestText:text,generatedAt:nowIso(),updatedAt:nowIso(),sourceDataSummary},'report',state);
  upsertById('reports',row,'report');
  return row;
}
export function deleteReportSnapshot(snapshotId){const s=state.reportSnapshots.find(x=>x.id===snapshotId);if(!s)return false;s.deletedAt=nowIso();s.updatedAt=nowIso();return true}
export function copyQuestLine(questId){const q=state.quests.find(x=>x.id===questId&&!x.deletedAt);if(!q)return null;const id=uid('quest');const cp=withMeta({...q,id,title:`${q.title||'任務線'}（複製）`,status:'not_started',createdAt:nowIso(),updatedAt:nowIso()},'quest',state);state.quests.unshift(cp);state.questProgress.unshift(withMeta({id:`progress_${id}`,questId:id,status:'not_started',progress:0,target:cp.target||1,startedAt:'',completedAt:'',endedAt:'',title:cp.title},'questProgress',state));return cp}
export function deleteQuestLine(questId){const q=state.quests.find(x=>x.id===questId&&!x.deletedAt);if(!q)return false;q.deletedAt=nowIso();q.enabled=false;q.updatedAt=nowIso();const p=state.questProgress.find(x=>x.questId===questId&&!x.deletedAt);if(p){p.deletedAt=nowIso();p.status='deleted';p.updatedAt=nowIso();}return true}
export function generateWeeklyReview(){const now=new Date();const day=now.getDay()||7;const start=new Date(now);start.setDate(now.getDate()-day+1);const end=new Date(start);end.setDate(start.getDate()+6);const sid=todayKey(start),eid=todayKey(end);const id=`weekly_${sid}`;const logs=state.habitLogs.filter(l=>!l.deletedAt&&l.date>=sid&&l.date<=eid);const points=state.pointsLedger.filter(p=>p.date>=sid&&p.date<=eid).reduce((a,b)=>a+Number(b.amount||0),0);const by={};for(const l of logs){by[l.title]=(by[l.title]||0)+1}const stable=Object.entries(by).sort((a,b)=>b[1]-a[1])[0]?.[0]||'尚無';const rescued=logs.filter(l=>l.type==='rescue').length;const badges=state.achievements.filter(a=>a.unlockedAt&&a.unlockedAt.slice(0,10)>=sid&&a.unlockedAt.slice(0,10)<=eid).map(a=>a.name);const activeQuests=state.questProgress.filter(p=>p.status==='active'||p.status==='completed').map(p=>`${p.title||p.questId} ${p.progress||0}/${p.target||0}`);const text=`本週戰報（${sid}～${eid}）\n完成任務：${logs.length}\n本週點數：${points}\n最穩定習慣：${stable}\n補救次數：${rescued}\n解鎖徽章：${badges.join('、')||'無'}\n任務線進度：${activeQuests.join('、')||'無'}`;const row=withMeta({id,weekStart:sid,weekEnd:eid,completedCount:logs.length,points,mostStableHabit:stable,mostFailedHabit:'需更多資料',rescueCount:rescued,unlockedBadges:badges,questProgress:activeQuests,text,generatedAt:nowIso()},'weeklyReview',state);upsertById('weeklyReviews',row,'weeklyReview');upsertReport('weekly',sid,text,{weekStart:sid,weekEnd:eid,completedCount:logs.length,points});return row}


export function generateMonthlyReport(){
  const now=new Date();
  const monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const start=`${monthKey}-01`;
  const endDate=new Date(now.getFullYear(),now.getMonth()+1,0);
  const end=todayKey(endDate);
  const logs=state.habitLogs.filter(l=>!l.deletedAt&&String(l.date||'')>=start&&String(l.date||'')<=end);
  const points=state.pointsLedger.filter(p=>String(p.date||'')>=start&&String(p.date||'')<=end).reduce((a,b)=>a+Number(b.amount||0),0);
  const attrGrowth={};
  for(const row of state.attributeLogs||[]){if(String(row.date||'')>=start&&String(row.date||'')<=end)attrGrowth[row.attribute]=(attrGrowth[row.attribute]||0)+Number(row.amount||0)}
  const byTitle={};
  for(const l of logs){byTitle[l.title]=(byTitle[l.title]||0)+1}
  const stable=Object.entries(byTitle).sort((a,b)=>b[1]-a[1])[0]?.[0]||'尚無';
  const questSummary=(state.questProgress||[]).filter(q=>q.status==='active'||q.status==='completed').map(q=>`${q.title||q.questId} ${q.progress||0}/${q.target||0}`);
  const achievements=(state.achievements||[]).filter(a=>a.unlockedAt&&a.unlockedAt.slice(0,7)===monthKey).map(a=>a.name);
  const redemptions=(state.rewardRedemptions||[]).filter(r=>String(r.date||'').slice(0,7)===monthKey).map(r=>r.name);
  const adventureProgress={soloStep:state.adventure?.soloStep||0,coupleStep:state.adventure?.coupleStep||0,explores:(state.adventureLogs||[]).filter(a=>String(a.date||'')>=start&&String(a.date||'')<=end).length};
  const coupleSummary={relationshipLogs:(state.relationshipLogs||[]).filter(r=>String(r.date||'').slice(0,7)===monthKey).length,coupleStep:adventureProgress.coupleStep};
  const completionRate=Math.min(100,Math.round((logs.length/Math.max(1,endDate.getDate()*3))*100));
  const text=`${monthKey} 人生報告\n完成率：${completionRate}%\n完成任務：${logs.length}\n本月點數：${points}\n最穩定習慣：${stable}\n屬性成長：${Object.entries(attrGrowth).map(([k,v])=>`${k}+${v}`).join('、')||'無'}\n任務線：${questSummary.join('、')||'無'}\n解鎖成就：${achievements.join('、')||'無'}\n獎勵兌換：${redemptions.join('、')||'無'}\n冒險進度：個人 ${adventureProgress.soloStep} 格，共同 ${adventureProgress.coupleStep} 格\n雙人摘要：關係任務 ${coupleSummary.relationshipLogs} 次`;
  const row=withMeta({id:`monthly_${monthKey}`,monthKey,startDate:start,endDate:end,completionRate,taskCount:logs.length,points,attributeGrowth:attrGrowth,mostStableHabit:stable,mostFailedHabit:'需更多長期資料',questSummary,achievements,redemptions,adventureProgress,coupleSummary,text,generatedAt:nowIso()},'monthlyReport',state);
  upsertById('monthlyReports',row,'monthlyReport');
  upsertReport('monthly',monthKey,text,{monthKey,taskCount:logs.length,points,completionRate});
  return row;
}


export function mapProgressFor(mode='solo'){let p=state.mapProgress?.find(x=>x.mode===mode&&!x.deletedAt);if(!p){p=withMeta({id:`map_progress_${mode}`,mode,currentSteps:0,currentNodeId:`${mode}_node_01`,unlockedNodeIds:[`${mode}_node_01`]},'mapProgress',state);state.mapProgress.push(p)}return p}
function ensureMapProgressSync(s=state){for(const mode of ['solo','couple']){let p=s.mapProgress?.find(x=>x.mode===mode&&!x.deletedAt);if(!p)continue;const nodes=(s.mapNodes||[]).filter(n=>n.mode===mode&&!n.deletedAt).sort((a,b)=>Number(a.requiredSteps||0)-Number(b.requiredSteps||0));const total=nodes.length?Number(nodes[nodes.length-1].requiredSteps||0):0;const step=Math.max(0,Number(p.currentSteps||0));p.totalSteps=total;p.unlockedNodeIds=nodes.filter(n=>Number(n.requiredSteps||0)<=step).map(n=>n.id);p.currentNodeId=(nodes.filter(n=>Number(n.requiredSteps||0)<=step).pop()||nodes[0]||{}).id||`${mode}_node_01`;p.updatedAt=p.updatedAt||nowIso();if(mode==='solo')s.adventure.soloStep=step;else s.adventure.coupleStep=step;}}
export function addMapSteps(mode='solo',steps=0,source='task',description='地圖前進',payload={}){
  mode=mode==='couple'?'couple':'solo';
  steps=Math.max(0,Math.round(Number(steps)||0));
  if(!steps)return 0;
  const p=mapProgressFor(mode);
  const before=Number(p.currentSteps||0);
  const fromNodeId=p.currentNodeId||`${mode}_node_01`;
  p.currentSteps=before+steps;
  p.updatedAt=nowIso();
  ensureMapProgressSync(state);
  const toNodeId=p.currentNodeId||fromNodeId;
  const sourceType=payload.sourceType||source||'task';
  const sourceLogId=payload.sourceLogId||payload.logId||payload.relatedId||payload.taskId||'';
  const row=withMeta({
    id:uid('mapStep'),date:todayKey(),userId:currentUserOf(state),roomId:state.firebase?.roomId||state.roomId||'',
    sourceType,sourceLogId,taskId:payload.taskId||payload.habitId||payload.challengeId||payload.questId||'',
    mapType:mode==='couple'?'couple':'single',mode,steps,fromStep:before,toStep:p.currentSteps,beforeSteps:before,afterSteps:p.currentSteps,
    fromNodeId,toNodeId,reason:description,description,source,createdAt:nowIso(),updatedAt:nowIso(),deletedAt:null,version:state.version||APP_VERSION,
    revertedAt:null,revertedBy:'',revertReason:'',...payload
  },'adventureLog',state);
  state.adventureLogs.unshift(row);
  state.adventure.logs=state.adventureLogs;
  state.mapTravelLogs=Array.isArray(state.mapTravelLogs)?state.mapTravelLogs:[];
  state.mapTravelLogs.unshift(withMeta({id:uid('mapTravel'),date:todayKey(),adventureLogId:row.id,mapType:row.mapType,mode,steps,fromStep:before,toStep:p.currentSteps,fromNodeId,toNodeId,sourceType,sourceLogId,reason:description},'mapTravelLog',state));
  addGameLog('mapProgress',description,{adventureLogId:row.id,mapType:row.mapType,steps,sourceType,sourceLogId});
  return steps
}
export function revertAdventureBySource(sourceLogId,opts={}){
  if(!sourceLogId)return 0;
  const now=nowIso();let reverted=0;
  const logs=(state.adventureLogs||[]).filter(l=>!l.deletedAt&&!l.revertedAt&&String(l.sourceLogId||'')===String(sourceLogId));
  for(const l of logs){
    const mode=(l.mapType==='couple'||l.mode==='couple')?'couple':'solo';
    const p=mapProgressFor(mode);
    const steps=Math.max(0,Number(l.steps||0));
    p.currentSteps=Math.max(0,Number(p.currentSteps||0)-steps);
    p.updatedAt=now;
    l.revertedAt=now;l.revertedBy=opts.revertedBy||currentUserOf(state);l.revertReason=opts.revertReason||'恢復上一步';l.updatedAt=now;
    reverted+=steps;
  }
  if(logs.length){ensureMapProgressSync(state);state.adventure.logs=state.adventureLogs;addGameLog('mapProgressReverted',opts.revertReason||'恢復上一步撤銷冒險進度',{sourceLogId,steps:reverted,logs:logs.map(x=>x.id)});}
  return reverted;
}
function mapStepForTask(task,extra={}){const pack=task.pack||task.type||extra.type||'';if(extra.type==='dailyMission')return 2;if(extra.type==='flexMission')return 3;if(pack==='main')return Number(task.mapStepValue||8);if(pack==='side')return Number(task.mapStepValue||4);if(pack==='bonus')return Number(task.mapStepValue||2);if(extra.type==='rescue')return 1;return Number(task.mapStepValue||2)}
export function applyMapStepsFromTask(task,extra={}){let steps=mapStepForTask(task,extra);const coupon=(state.mapTravelCoupons||[]).find(c=>c.status==='active'&&!c.deletedAt);if(coupon){steps=Math.max(1,Math.round(steps*1.5));coupon.status='used';coupon.usedAt=nowIso();coupon.taskId=task.id;coupon.sourceLogId=extra.sourceLogId||'';}return addMapSteps('solo',steps,extra.type||'task',`完成任務推進地圖：${task.title}`,{sourceType:extra.type||'task',sourceLogId:extra.sourceLogId||'',taskId:task.id,habitId:task.habitId||task.id,pack:task.pack||task.type||''})}

export function calculateStreak(){let streak=0;for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);const k=todayKey(d);const has=state.habitLogs.some(l=>l.date===k&&!l.deletedAt);if(has)streak++;else if(i>0)break}return streak}

export function currentUserName(){return state.firebase?.user?.name||state.firebase?.user?.email||state.users?.find(u=>u.id===state.currentUserId)?.name||'我'}
function hashCode(s){let h=0;for(let i=0;i<String(s).length;i++)h=((h<<5)-h)+String(s).charCodeAt(i)|0;return h}
function addDays(date,days){const d=new Date(date);d.setDate(d.getDate()+days);return d}
function mondayOf(date=new Date()){const d=new Date(date);const day=d.getDay()||7;d.setHours(0,0,0,0);d.setDate(d.getDate()-day+1);return d}
function sundayOf(date=new Date()){return addDays(mondayOf(date),6)}
function scopeBaseDays(scope){return scope==='daily'?1:scope==='weekly'?7:scope==='tenDays'?10:scope==='biweekly'?14:scope==='monthly'?30:scope==='quarterly'?90:scope==='total'?365:7}
function ceilThird(n){return Math.ceil(Number(n||1)/3)}
export function sharedTaskDates(task,date=new Date()){const base=Number(task.periodDays||scopeBaseDays(task.scope));const total=Number(task.totalDays||base+ceilThird(base));const start=new Date(date);start.setHours(0,0,0,0);const end=addDays(start,total-1);return {periodKey:`${task.id||task.scope||'shared'}_${todayKey(start)}`,periodStart:todayKey(start),periodEnd:todayKey(end),baseDays:base,totalDays:total,dayIndex:1,remainingDays:total}}
function recentCompletionCount(days=7){const since=todayKey(addDays(new Date(),-days));return state.habitLogs.filter(l=>!l.deletedAt&&String(l.date||'')>=since&&l.status!=='undone').length+state.relationshipLogs.filter(l=>!l.deletedAt&&String(l.date||'')>=since).length}
function estimateBossHp(tpl){const recent=recentCompletionCount(7);const predicted=(recent||10)*9+120;const scaled=Math.round(predicted*(0.75+((Math.abs(hashCode(todayKey(mondayOf())))%15)/100)));return Math.max(Number(tpl.baseHp||tpl.maxHp||140),Math.min(900,scaled))}
function bossRewardDeadline(weekStart){return todayKey(addDays(new Date(weekStart),13))}
export function settlePastBosses(){const thisWeek=todayKey(mondayOf());for(const b of state.coupleBosses){if(b.deletedAt)continue;if(b.weekStart&&b.weekStart<thisWeek&&b.status==='active'){b.status='pendingReward';b.settledAt=nowIso();b.battleReportId=generateBossBattleReport(b).id;const ratio=1-Number(b.hp||0)/Math.max(1,Number(b.maxHp||1));const reward=withMeta({id:`boss_reward_${b.id}`,bossId:b.id,weekKey:b.weekKey,weekStart:b.weekStart,status:'pending',ratio,claimable:ratio>=0.5||b.hp<=0,couplePoints:b.hp<=0?120:ratio>=0.8?60:ratio>=0.5?30:0,item:b.hp<=0?'雙人寶箱':ratio>=0.8?'Boss 碎片':'',createdAt:nowIso()},'bossReward',state);if(!state.bossRewards.some(r=>r.id===reward.id))state.bossRewards.unshift(reward);}}}
export function ensureCoupleWeekBoss(){settlePastBosses();const monday=mondayOf();const weekStart=todayKey(monday);let boss=state.coupleBosses.find(b=>b.weekStart===weekStart&&!b.deletedAt);if(!boss){const tpl=bossPool[Math.abs(hashCode(weekStart))%bossPool.length];const hp=estimateBossHp(tpl);boss=withMeta({id:`boss_${weekStart}`,weekKey:weekStart,weekStart,weekEnd:todayKey(sundayOf()),rewardClaimDeadline:bossRewardDeadline(weekStart),bossId:tpl.id,name:tpl.name,emoji:tpl.emoji,description:tpl.description,weakness:tpl.weakness||'',maxHp:hp,hp:hp,status:'active',damageLogs:[],myDamage:0,partnerDamage:0,sharedQuestDamage:0,challengeDamage:0,habitDamage:0,secretTaskDamage:0,adventureDamage:0,itemDamage:0,defeatedAt:'',settledAt:'',rewardClaimedBy:[],battleReportId:''},'coupleBoss',state);state.coupleBosses.unshift(boss)}return boss}
export function bossDayInfo(boss=ensureCoupleWeekBoss()){const start=new Date(boss.weekStart);const now=new Date();const day=Math.min(7,Math.max(1,Math.floor((now-start)/86400000)+1));return {day,total:7,remaining:Math.max(0,8-day)}}
export function addCouplePoints(amount,source,description,relatedId=''){amount=Number(amount)||0;if(!amount)return;state.couplePointsLedger.unshift(withMeta({id:uid('couplePoint'),date:todayKey(),amount,source,description,relatedId},'couplePoint',state))}
export function currentCouplePoints(){return state.couplePointsLedger.reduce((s,x)=>s+Number(x.amount||0),0)}
function damageFor(source,amount=1,task={}){const pack=task.pack||task.type||'';if(source==='habit'||source==='userHabit'){return pack==='main'?10:pack==='bonus'?7:5}if(source==='dailyMission')return 4*amount;if(source==='flexMission')return 8*amount;if(source==='flexComplete')return 30;if(source==='sharedQuest')return 12*amount;if(source==='sharedQuestComplete')return 80;if(source==='coupleChallenge')return 120*amount;if(source==='secretTask')return 22*amount;if(source==='adventure')return 15*amount;if(source==='bossItem')return amount;return Math.max(5,Number(amount)*8)}
export function applyBossDamage(amount,source='task',description='攻擊 Boss',payload={}){const boss=ensureCoupleWeekBoss();if(boss.status!=='active')return null;amount=Math.max(0,Math.round(Number(amount)||0));if(!amount)return null;const before=Number(boss.hp||0);boss.hp=Math.max(0,before-amount);const uidNow=currentUserOf(state);boss.myDamage=Number(boss.myDamage||0)+amount;boss.damageLogs=Array.isArray(boss.damageLogs)?boss.damageLogs:[];const row=withMeta({id:uid('bossDmg'),date:todayKey(),bossId:boss.id,weekKey:boss.weekKey,amount,source,description,beforeHp:before,afterHp:boss.hp,actorId:uidNow,...payload},'bossDamageLog',state);boss.damageLogs.unshift(row);state.bossDamageLogs.unshift(row);if(source.includes('shared'))boss.sharedQuestDamage=Number(boss.sharedQuestDamage||0)+amount;else if(source.includes('challenge'))boss.challengeDamage=Number(boss.challengeDamage||0)+amount;else if(source.includes('secret'))boss.secretTaskDamage=Number(boss.secretTaskDamage||0)+amount;else if(source.includes('adventure'))boss.adventureDamage=Number(boss.adventureDamage||0)+amount;else if(source.includes('item'))boss.itemDamage=Number(boss.itemDamage||0)+amount;else boss.habitDamage=Number(boss.habitDamage||0)+amount;if(boss.hp<=0&&!boss.defeatedAt){boss.status='defeated';boss.defeatedAt=nowIso();addGameLog('coupleBossDefeated',`擊敗 ${boss.name}`,{bossId:boss.id});}boss.updatedAt=nowIso();return row}
function rewardSharedTask(q,p){const r=q.reward||{};if(r.couplePoints)addCouplePoints(r.couplePoints,'sharedQuestComplete',`完成共同任務：${q.title}`,q.id);if(r.item)grantItem(r.item,1,'sharedQuest');if(r.bossDamage)applyBossDamage(r.bossDamage,'sharedQuestComplete',`共同任務完成：${q.title}`,{questId:q.id});addMapSteps('couple',Number(q.mapSteps||r.mapSteps||6),'sharedTaskComplete',`共同任務達標推進雙人地圖：${q.title}`,{sourceType:'sharedTaskComplete',sourceLogId:p.id,questId:q.id,taskId:q.id});addGameLog('sharedQuestComplete',`完成共同任務：${q.title}`,{questId:q.id,reward:r,progress:p.progress,target:p.target});}
function comfortSharedTask(q,p){const ratio=Number(p.progress||0)/Math.max(1,Number(p.target||q.target||1));const c=q.comfortReward||{};if(ratio>=0.8){if(c.min80)addCouplePoints(c.min80,'sharedQuestComfort',`共同任務 80% 安慰獎勵：${q.title}`,q.id);if(c.item80)grantItem(c.item80,1,'comfort')}else if(ratio>=0.3&&c.min30){addCouplePoints(c.min30,'sharedQuestComfort',`共同任務部分完成獎勵：${q.title}`,q.id)}}
export function ensureSharedTasks(){const active=[];for(const q of state.sharedTasks||state.sharedQuests||[]){const meta=sharedTaskDates(q);let p=state.sharedTaskProgress.find(x=>x.questId===q.id&&x.periodKey===meta.periodKey&&!x.deletedAt);if(!p){p=withMeta({id:`shared_progress_${q.id}_${meta.periodKey}`,questId:q.id,title:q.title,scope:q.scope,status:'active',progress:0,target:q.target||1,myProgress:0,partnerProgress:0,periodKey:meta.periodKey,periodStart:meta.periodStart,periodEnd:meta.periodEnd,totalDays:meta.totalDays,completedAt:'',dayIndex:1,completedCount:0,swapHistory:[],settledAt:null,replacedAt:null},'sharedTaskProgress',state);state.sharedTaskProgress.push(p)}if(p.status==='active'&&new Date()>addDays(new Date(p.periodEnd),1)){p.status=p.progress>=p.target?'completed':'expired';p.settledAt=nowIso();if(p.status==='expired')comfortSharedTask(q,p)}active.push(p)}state.sharedQuestProgress=state.sharedTaskProgress;return active}
export function contributeCoupleProgress(amount=1,source='task',description='雙人貢獻',payload={}){amount=Number(amount)||1;addCouplePoints(Math.max(1,amount*3),source,description,payload.relatedId||'');ensureSharedTasks();for(const p of state.sharedTaskProgress){const q=state.sharedTasks.find(x=>x.id===p.questId)||state.sharedQuests.find(x=>x.id===p.questId)||p;if(p.status!=='active')continue;p.progress=Math.min(Number(p.target||q.target||1),Number(p.progress||0)+amount);p.myProgress=Number(p.myProgress||0)+amount;p.updatedAt=nowIso();applyBossDamage(damageFor('sharedQuest',amount), 'sharedQuest', `共同任務進度：${q.title}`, {questId:q.id,progress:p.progress,target:p.target});if(p.progress>=Number(p.target||q.target||1)){p.status='completed';p.completedAt=nowIso();rewardSharedTask(q,p)}}
  for(const c of state.coupleChallenges){if(c.status==='completed'||c.status==='abandoned')continue;c.progress=Math.min(Number(c.target||1),Number(c.progress||0)+amount);c.myProgress=Number(c.myProgress||0)+amount;c.updatedAt=nowIso();if(c.progress>=Number(c.target||1)){c.status='completed';c.completedAt=nowIso();const r=c.reward||{};if(r.couplePoints)addCouplePoints(r.couplePoints,'coupleChallenge',`完成雙人挑戰：${c.title}`,c.id);if(r.item)grantItem(r.item,1,'coupleChallenge');if(r.title)state.coupleTitles.unshift(withMeta({id:`title_${c.id}`,title:r.title,source:'challenge',unlockedAt:nowIso()},'coupleTitle',state));applyBossDamage(damageFor('coupleChallenge',1),'coupleChallenge',`雙人挑戰完成：${c.title}`,{challengeId:c.id});}}
  updateCoupleStats();}
export function updateCoupleStats(){ensureSharedTasks();const today=todayKey();const logs=state.habitLogs.filter(l=>l.date===today&&!l.deletedAt);const my=logs.filter(l=>l.userId===currentUserOf(state)||!l.userId||l.userId==='me').length;const secret=state.coupleSecretTasks.filter(t=>t.date===today&&t.status==='completed'&&!t.deletedAt).length;const boss=ensureCoupleWeekBoss();const shared=(state.sharedTaskProgress||[]).filter(p=>p.status==='active').map(p=>`${p.title||p.questId} ${p.progress||0}/${p.target||0}`);state.coupleStats={...state.coupleStats,myTodayCompleted:my,partnerTodayCompleted:Number(state.coupleStats?.partnerTodayCompleted||0),leader:my>Number(state.coupleStats?.partnerTodayCompleted||0)?'me':my<Number(state.coupleStats?.partnerTodayCompleted||0)?'partner':'tie',secretCompleted:secret,weeklyTitle:state.coupleTitles[0]?.title||'默契練習中',bossHp:boss.hp,bossMaxHp:boss.maxHp,sharedProgress:shared,bossStatus:boss.status,updatedAt:nowIso()};}
export function createDailySecretTask(){const today=todayKey();let t=state.coupleSecretTasks.find(x=>x.date===today&&!x.deletedAt);if(!t){const titles=['偷偷整理：整理一件對方會開心的小事','健康守護：完成一個能讓自己狀態更好的健康任務','感謝筆記：記下一句想感謝對方的話','生活整理：完成一個讓生活更清爽的小整理','小驚喜：準備一個不造成壓力的小驚喜'];const title=titles[Math.abs(hashCode(today))%titles.length];const d=new Date(today+'T00:00:00');d.setDate(d.getDate()+1);const revealDate=todayKey(d);t=withMeta({id:`secret_${today}`,date:today,title,publicTitle:'完成秘密任務，明天揭曉',publicDescription:'',status:'active',revealed:false,revealDate,revealedAt:'',visibleToPartnerAfterComplete:true,partnerCanSeeTitle:false,partnerCanSeeContent:false,completedAt:''},'coupleSecretTask',state);state.coupleSecretTasks.unshift(t)}return t}
export function completeSecretTask(){const t=createDailySecretTask();if(t.status==='completed')return false;t.status='completed';t.completedAt=nowIso();t.publicTitle='已完成秘密任務，明天揭曉';t.partnerCanSeeTitle=false;t.partnerCanSeeContent=false;addCouplePoints(20,'secretTask','完成秘密任務',t.id);state.relationshipLogs.unshift(withMeta({id:uid('rel'),date:todayKey(),title:t.title,secret:true,publicTitle:'已完成秘密任務，明天揭曉',revealDate:t.revealDate,intimacy:20,harmony:5},'relationshipLog',state));contributeCoupleProgress(1,'secretTask','完成秘密任務',{relatedId:t.id});applyBossDamage(damageFor('secretTask',1),'secretTask','秘密任務攻擊 Boss',{taskId:t.id});return true}
export function redeemSharedReward(rewardId){const r=state.sharedRewards.find(x=>x.id===rewardId&&!x.deletedAt);if(!r)return false;if(currentCouplePoints()<Number(r.cost||0))return false;state.sharedRewardRedemptions.unshift(withMeta({id:uid('sharedRedeem'),rewardId:r.id,name:r.name,cost:Number(r.cost||0),date:todayKey(),used:false,usedAt:'',note:''},'sharedRewardRedemption',state));addCouplePoints(-Number(r.cost||0),'sharedReward',`兌換雙人獎勵：${r.name}`,r.id);return true}
export function generateBossBattleReport(boss=ensureCoupleWeekBoss()){const ratio=Math.round((1-Number(boss.hp||0)/Math.max(1,Number(boss.maxHp||1)))*100);const text=`Boss 戰報：${boss.name}\n期間：${boss.weekStart}～${boss.weekEnd}\n狀態：${boss.hp<=0?'已擊敗':boss.status==='pendingReward'?'已結算':'戰鬥中'}\n傷害比例：${ratio}%\n個人習慣傷害：${boss.habitDamage||0}\n共同任務傷害：${boss.sharedQuestDamage||0}\n雙人挑戰傷害：${boss.challengeDamage||0}\n秘密任務傷害：${boss.secretTaskDamage||0}\n冒險傷害：${boss.adventureDamage||0}\n道具傷害：${boss.itemDamage||0}`;const row=withMeta({id:`boss_report_${boss.id}`,bossId:boss.id,weekKey:boss.weekKey||boss.weekStart,scope:'boss',date:todayKey(),text,bossResult:{name:boss.name,hp:boss.hp,maxHp:boss.maxHp,status:boss.status,ratio},generatedAt:nowIso()},'bossBattleReport',state);upsertById('bossBattleReports',row,'bossBattleReport');return row}
export function generateCoupleBattleReport(scope='daily'){updateCoupleStats();const today=todayKey();const boss=ensureCoupleWeekBoss();const secret=state.coupleSecretTasks.filter(t=>t.date===today&&t.status==='completed');const yesterday=(()=>{const d=new Date(today+'T00:00:00');d.setDate(d.getDate()-1);return todayKey(d)})();const revealed=(state.coupleSecretTasks||[]).filter(t=>t.date===yesterday&&t.status==='completed'&&!t.deletedAt).map(t=>`昨日秘密任務揭曉：${t.title}`).join('\n')||'昨日沒有可揭曉的秘密任務';const text=`雙人${scope==='weekly'?'每週':'每日'}戰報\n我的今日完成：${state.coupleStats.myTodayCompleted}\n對方今日完成：${state.coupleStats.partnerTodayCompleted}\n目前領先：${state.coupleStats.leader==='me'?'我':state.coupleStats.leader==='partner'?'對方':'平手'}\n秘密任務：${secret.length} 個\n${revealed}\n共同任務：${(state.coupleStats.sharedProgress||[]).join('、')||'尚無'}\n本週稱號：${state.coupleStats.weeklyTitle}\nBoss：${boss.name} HP ${boss.hp}/${boss.maxHp}`;const row=withMeta({id:`couple_report_${scope}_${today}`,date:today,scope,text,myTodayCompleted:state.coupleStats.myTodayCompleted,partnerTodayCompleted:state.coupleStats.partnerTodayCompleted,secretCount:secret.length,sharedProgress:state.coupleStats.sharedProgress,bossResult:{name:boss.name,hp:boss.hp,maxHp:boss.maxHp,status:boss.status},generatedAt:nowIso()},'coupleBattleReport',state);upsertById('coupleBattleReports',row,'coupleBattleReport');upsertById('reports',withMeta({id:`report_couple_${scope}_${today}`,reportType:`couple_${scope}`,periodKey:today,latestText:text,generatedAt:nowIso(),sourceDataSummary:{bossId:boss.id}},'report',state),'report');return row}
export function claimBossReward(bossId){const boss=state.coupleBosses.find(b=>b.id===bossId)||ensureCoupleWeekBoss();if(!boss)return false;if(boss.status==='claimed')return false;const reward=state.bossRewards.find(r=>r.bossId===boss.id)||withMeta({id:`boss_reward_${boss.id}`,bossId:boss.id,status:'pending',ratio:1-Number(boss.hp||0)/Math.max(1,Number(boss.maxHp||1)),couplePoints:boss.hp<=0?120:40,item:boss.hp<=0?'雙人寶箱':'Boss 碎片'},'bossReward',state);if(!state.bossRewards.some(r=>r.id===reward.id))state.bossRewards.unshift(reward);if(reward.couplePoints)addCouplePoints(reward.couplePoints,'bossReward',`領取 Boss 獎勵：${boss.name}`,boss.id);if(reward.item)grantItem(reward.item,1,'bossReward');boss.status='claimed';boss.rewardClaimedBy=[...(boss.rewardClaimedBy||[]),currentUserOf(state)];reward.status='claimed';reward.claimedAt=nowIso();addGameLog('bossRewardClaimed',`領取 Boss 獎勵：${boss.name}`,{bossId:boss.id,reward});return true}
export function useBossItem(itemName){const map={'火焰球':30,'冰凍彈':20,'破盾券':50,'追加攻擊券':80,'Boss 弱點卡':60,'能量藥水':25};if(!consumeItem(itemName,1))return false;const dmg=map[itemName]||30;applyBossDamage(dmg,'bossItem',`使用 ${itemName} 攻擊 Boss`,{itemName});state.itemUseLogs.unshift(withMeta({id:uid('itemUse'),date:todayKey(),item:itemName,itemName,quantity:1,effect:`Boss -${dmg} HP`,target:'boss'},'itemUseLog',state));addGameLog('useBossItem',`使用 ${itemName}：Boss -${dmg} HP`,{itemName,dmg});return true}
export function saveReportSnapshot(reportId,name='快照'){const candidates=[...state.reports,...state.weeklyReviews.map(r=>({...r,latestText:r.text})),...state.monthlyReports.map(r=>({...r,latestText:r.text})),...state.coupleBattleReports.map(r=>({...r,latestText:r.text})),...state.bossBattleReports.map(r=>({...r,latestText:r.text}))];const r=candidates.find(x=>x.id===reportId)||candidates[0];if(!r)return null;const snap=withMeta({id:uid('reportSnap'),reportId:r.id,snapshotName:name,text:r.latestText||r.text||'',createdAt:nowIso()},'reportSnapshot',state);state.reportSnapshots.unshift(snap);return snap}

