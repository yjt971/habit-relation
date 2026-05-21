import { state, saveState, replaceState, PHASE1_TABLES, KEY, nowIso } from './state.js';

export const firebaseConfig={apiKey:'',authDomain:'',projectId:'',storageBucket:'',messagingSenderId:'',appId:''};

let app=null,auth=null,db=null,modules=null,authBound=false;
let applyingRemote=false,syncTimer=null,autoTimer=null,inFlight=null;
const PRE_SYNC_KEY=`${KEY}_preSyncBackup`;
const CLOUD_SCHEMA_VERSION='phase13F-multidoc-chunk-sync';
const CHUNK_TARGET_BYTES=560*1024;
const BATCH_LIMIT=420;

const STATIC_TABLES=new Set(['closeTodayCards','chemistryChallengeCards','dateIdeaCards','deepTalkCards','builtInCoupleRewards']);
const MONTHLY_TABLES=new Set(['habitLogs','pointsLedger','couplePointsLedger','gameLogs','relationshipLogs','coupleWishLogs','cardDrawLogs','cardCollectionLogs','bossDamageLogs','mapExploreLogs','mapInventoryLogs','mapExploreDailyLogs','itemUseLogs','taskSwapLogs','rescueLogs','rewardRedemptions','sharedRewardRedemptions','coupleBattleReports','bossBattleReports','reports','reportSnapshots','relationshipReviews','relationshipReviewSnapshots','weeklyReviews','monthlyReports','adventureLogs','attributeLogs','habitRewardLogs','assignedTaskLogs']);

function hasConfig(){return !!firebaseConfig.apiKey&&!!firebaseConfig.projectId}
function ts(v){return Date.parse(v||'')||0}
function clone(v){return JSON.parse(JSON.stringify(v??{}))}
function currentUser(){return auth?.currentUser||null}
function canSync(){return hasConfig()&&!!auth?.currentUser&&!!modules&&!!db}
function safeId(v){return String(v||'default').replace(/[^A-Za-z0-9_-]/g,'_').slice(0,140)||'default'}
export function estimateJsonSize(obj){try{return new TextEncoder().encode(JSON.stringify(obj??null)).length}catch{return JSON.stringify(obj??null).length*2}}
function isRecord(v){return v&&typeof v==='object'&&!Array.isArray(v)}
function tableList(){return PHASE1_TABLES.filter(t=>!STATIC_TABLES.has(t))}
function now(){return nowIso()}
function readableError(e){
  const msg=String(e?.message||e||'');
  if(!hasConfig())return '找不到 Firebase 設定，已保存於本機。';
  if(!currentUser())return '尚未登入，已保存於本機。';
  if(/permission|PERMISSION_DENIED|Missing or insufficient permissions/i.test(msg))return '權限不足，請檢查 Firestore rules。';
  if(/maximum allowed size|1,048,576|exceeds/i.test(msg))return '雲端寫入失敗：單一文件超過 1 MiB，請確認已更新為多文件同步版本並清除舊快取。';
  if(/network|offline|unavailable/i.test(msg))return '網路不穩，稍後會自動重試。';
  if(/getDoc|read/i.test(msg))return '雲端讀取失敗。';
  if(/setDoc|write|batch/i.test(msg))return '雲端寫入失敗。';
  return msg||'同步失敗。';
}
function updateSyncMeta(patch={}){state.syncMeta={...(state.syncMeta||{}),...patch,updatedAt:now(),version:state.version}}
function setStatus(syncStatus,syncError='',extra={}){state.firebase={...(state.firebase||{}),syncStatus,syncError,lastSyncAt:syncStatus==='同步中'?(state.firebase?.lastSyncAt||''):now(),lastSyncReason:extra.reason||state.firebase?.lastSyncReason||''};updateSyncMeta(extra.syncMeta||{});try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
export function firebaseSummary(){if(!hasConfig())return '本機模式｜尚未填 Firebase 設定';if(!state.firebase?.user)return 'Firebase 已設定｜未登入';const base=`已登入 ${state.firebase.user.email||state.firebase.user.name||''}`;return `${base}｜${state.firebase.syncStatus||'等待同步'}`}
async function loadModules(){if(modules)return modules;modules={...(await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js')),...(await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js')),...(await import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js'))};return modules}
export function isApplyingRemote(){return applyingRemote}
export function isSyncing(){return !!inFlight}
function withAuth(next){const u=currentUser();return {...next,firebase:{...(next.firebase||{}),user:u?{uid:u.uid,email:u.email,name:u.displayName}:next.firebase?.user,lastSyncAt:now(),syncStatus:'已同步',syncError:''}}}
function userId(){return currentUser()?.uid||state.firebase?.user?.uid||state.currentUserId||'local'}
function baseCollection(scope='user',roomCode=''){
  if(scope==='room'){const code=roomCode||state.room?.inviteCode||state.room?.id;return modules.collection(db,'rooms',safeId(code),'habitMissionTables')}
  return modules.collection(db,'users',userId(),'habitMissionTables')
}
function metaDoc(scope='user',roomCode=''){
  if(scope==='room'){const code=roomCode||state.room?.inviteCode||state.room?.id;return modules.doc(db,'rooms',safeId(code),'habitMissionMeta','main')}
  return modules.doc(db,'users',userId(),'habitMissionMeta','main')
}
function chunkDoc(scope,tableName,chunkId,roomCode=''){
  if(scope==='room'){const code=roomCode||state.room?.inviteCode||state.room?.id;return modules.doc(db,'rooms',safeId(code),'habitMissionTables',safeId(tableName),'chunks',safeId(chunkId))}
  return modules.doc(db,'users',userId(),'habitMissionTables',safeId(tableName),'chunks',safeId(chunkId))
}
function legacyUserRef(){const u=currentUser();return u?modules.doc(db,'users',u.uid,'app','habitMission'):null}

function roomCode(){return state.room?.inviteCode||state.room?.id||state.firebase?.roomId||''}
function roomRef(code=roomCode()){return code?modules.doc(db,'rooms',safeId(code)):null}
function roomPartnerUid(){
  const me=userId();
  const room=state.room||{};
  const ids=[...(room.memberIds||[]),...(Array.isArray(room.members)?room.members.map(x=>x?.uid||x?.id||x):[]),...(isRecord(room.members)?Object.keys(room.members):[]),...(state.users||[]).map(u=>u?.id||u?.uid)].filter(Boolean).map(String);
  return ids.find(id=>id&&id!==me&&id!=='me'&&id!=='local'&&id!=='user2')||'';
}
function setRoomMembershipDiagnostic(patch={}){
  state.syncMeta={...(state.syncMeta||{}),roomMembership:{...(state.syncMeta?.roomMembership||{}),...patch,checkedAt:now()},updatedAt:now(),version:state.version};
}
export async function ensureRoomDocument(code=roomCode()){
  if(!canSync()||!currentUser()||!code){setRoomMembershipDiagnostic({roomId:code||'',hasRoomDoc:false,currentUid:userId(),currentUidInMembers:false,currentUidInMemberIds:false,partnerUid:roomPartnerUid(),partnerUidKnown:!!roomPartnerUid(),partnerUidInMembers:false,safeRulesReady:false,message:!code?'尚未建立或加入房間':'尚未登入或 Firebase 未設定'});return false}
  try{
    const ref=roomRef(code);const uid=userId();const partner=roomPartnerUid();
    const snap=await modules.getDoc(ref);const existing=snap.exists()?(snap.data()||{}):{};
    const members={...(isRecord(existing.members)?existing.members:{}),...(isRecord(state.room?.members)?state.room.members:{})};
    members[uid]=true;if(partner)members[partner]=true;
    const existingIds=Array.isArray(existing.memberIds)?existing.memberIds:[];
    const stateIds=Array.isArray(state.room?.memberIds)?state.room.memberIds:[];
    const memberIds=[...new Set([...existingIds,...stateIds,...Object.keys(members),uid,partner].filter(Boolean).map(String))];
    const payload={roomId:String(code),members,memberIds,updatedAt:now(),version:state.version};
    if(!existing.createdAt)payload.createdAt=now();
    await modules.setDoc(ref,payload,{merge:true});
    state.room={...(state.room||{}),id:state.room?.id||String(code),inviteCode:state.room?.inviteCode||String(code),members,memberIds,updatedAt:now()};
    setRoomMembershipDiagnostic({roomId:String(code),hasRoomDoc:true,currentUid:uid,currentUidInMembers:members[uid]===true,currentUidInMemberIds:memberIds.includes(uid),partnerUid:partner,partnerUidKnown:!!partner,partnerUidInMembers:partner?members[partner]===true:false,partnerUidInMemberIds:partner?memberIds.includes(partner):false,safeRulesReady:!!(members[uid]===true&&memberIds.includes(uid)&&partner&&members[partner]===true&&memberIds.includes(partner)),message:partner?'已補齊 room membership':'已補齊目前使用者，等待對方登入 / 加入房間'});
    return true;
  }catch(e){console.warn('ensureRoomDocument failed',e);setRoomMembershipDiagnostic({roomId:String(code),hasRoomDoc:false,currentUid:userId(),partnerUid:roomPartnerUid(),error:readableError(e),safeRulesReady:false,message:'room membership 檢查失敗，目前仍可使用寬鬆 rules 同步'});return false}
}
export async function ensureRoomMembership(code=roomCode()){return ensureRoomDocument(code)}
export async function repairRoomMembershipIfMissing(code=roomCode()){return ensureRoomDocument(code)}

export async function initFirebase(){
  if(!hasConfig()){setStatus('本機模式','找不到 Firebase 設定，已保存於本機。');return false}
  try{
    const m=await loadModules();
    if(!app)app=m.initializeApp(firebaseConfig);
    auth=m.getAuth(app);db=m.getFirestore(app);
    if(!authBound){
      authBound=true;
      auth.onAuthStateChanged(async u=>{
        if(u){
          state.firebase={...(state.firebase||{}),user:{uid:u.uid,email:u.email,name:u.displayName},syncStatus:'登入後同步中',syncError:''};
          saveState({touch:false,emit:false,source:'auth'});
          startAutoSync();
          await ensureRoomMembership();
          await syncLatestWithCloud('login');
          window.dispatchEvent(new CustomEvent('habit-remote-updated',{detail:{reason:'login'}}));
        }else{
          stopAutoSync();
          state.firebase={...(state.firebase||{}),user:null,syncStatus:'已登出',syncError:''};
          saveState({touch:false,emit:false,source:'auth'});
          window.dispatchEvent(new CustomEvent('habit-remote-updated',{detail:{reason:'logout'}}));
        }
      });
    }
    return true;
  }catch(e){console.warn(e);setStatus('Firebase 初始化失敗',readableError(e));return false}
}
export async function signInWithGoogle(){if(!await initFirebase())return false;const m=await loadModules();const res=await m.signInWithPopup(auth,new m.GoogleAuthProvider());state.firebase={...(state.firebase||{}),user:{uid:res.user.uid,email:res.user.email,name:res.user.displayName},syncStatus:'登入後同步中',syncError:''};saveState({touch:false,emit:false,source:'auth'});startAutoSync();await ensureRoomMembership();await syncLatestWithCloud('signin');window.dispatchEvent(new CustomEvent('habit-remote-updated',{detail:{reason:'signin'}}));return true}
export async function signOutGoogle(){stopAutoSync();if(auth)await auth.signOut();state.firebase={...(state.firebase||{}),user:null,syncStatus:'已登出',syncError:''};saveState({touch:false,emit:false,source:'auth'})}

function makePreSyncBackup(){try{localStorage.setItem(PRE_SYNC_KEY,JSON.stringify({createdAt:now(),state:clone(state)}));updateSyncMeta({hasPreSyncBackup:true,preSyncBackupAt:now()});return true}catch{return false}}
export function hasPreSyncBackup(){return !!localStorage.getItem(PRE_SYNC_KEY)}
export function restorePreSyncBackup(){try{const raw=localStorage.getItem(PRE_SYNC_KEY);if(!raw)return false;const parsed=JSON.parse(raw);if(!parsed?.state)return false;applyingRemote=true;replaceState(parsed.state,{touch:true,emit:false,source:'restorePreSyncBackup'});applyingRemote=false;setStatus('已還原同步前備份','');window.dispatchEvent(new CustomEvent('habit-remote-updated',{detail:{reason:'restorePreSyncBackup'}}));return true}catch(e){console.warn(e);setStatus('同步失敗','還原同步前備份失敗');return false}}

function recordTime(r){return Math.max(ts(r?.updatedAt),ts(r?.createdAt),0)}
function pickRecord(local,remote){if(!local)return clone(remote);if(!remote)return clone(local);const localDeleted=!!local.deletedAt,remoteDeleted=!!remote.deletedAt;if(localDeleted||remoteDeleted){const ld=ts(local.deletedAt||local.updatedAt),rd=ts(remote.deletedAt||remote.updatedAt);return clone(ld>=rd?local:remote)}const lt=recordTime(local),rt=recordTime(remote);if(lt>rt)return clone(local);if(rt>lt)return clone(remote);const lv=String(local.version||''),rv=String(remote.version||'');return clone(lv>=rv?local:remote)}
function mergeArrayById(localArr=[],remoteArr=[]){const map=new Map();for(const r of Array.isArray(localArr)?localArr:[])if(r?.id)map.set(r.id,clone(r));for(const r of Array.isArray(remoteArr)?remoteArr:[])if(r?.id)map.set(r.id,pickRecord(map.get(r.id),r));return [...map.values()].sort((a,b)=>recordTime(b)-recordTime(a))}
function mergeObjectRecord(localObj={},remoteObj={}){return pickRecord(isRecord(localObj)?localObj:{},isRecord(remoteObj)?remoteObj:{})}
export function smartMergeState(localState={},cloudState={}){const local=clone(localState),remote=clone(cloudState||{}),merged={...local,...remote};merged.version=local.version||remote.version||state.version;merged.createdAt=local.createdAt||remote.createdAt||now();merged.updatedAt=new Date(Math.max(ts(local.updatedAt),ts(remote.updatedAt))||Date.now()).toISOString();for(const t of PHASE1_TABLES){if(STATIC_TABLES.has(t)){merged[t]=local[t];continue}const l=local[t],r=remote[t];if(Array.isArray(l)||Array.isArray(r))merged[t]=mergeArrayById(l||[],r||[]);else if(isRecord(l)||isRecord(r))merged[t]=mergeObjectRecord(l||{},r||{});else merged[t]=r!==undefined?r:l}for(const t of STATIC_TABLES)merged[t]=local[t];merged.syncMeta={...(local.syncMeta||{}),...(merged.syncMeta||{}),dirty:false,lastSyncResult:'多文件 smartMerge 完成',updatedAt:now()};return merged}

function shouldSyncTable(tableName){return !STATIC_TABLES.has(tableName)}
function extractBaseState(s){const out=clone(s);for(const t of PHASE1_TABLES)delete out[t];for(const t of STATIC_TABLES)delete out[t];delete out.logs;delete out.items;out.staticPoolsExcluded=true;out.cloudSchemaVersion=CLOUD_SCHEMA_VERSION;return out}
function restoreStateFromParts(baseState={},tables={}){const out={...(baseState||{})};for(const [k,v] of Object.entries(tables||{}))out[k]=v;return out}
function getRecordDate(record){return record?.date||record?.completedAt||record?.createdAt||record?.updatedAt||''}
function monthKeyFromRecord(record){const raw=getRecordDate(record);const d=raw?new Date(raw):new Date();if(Number.isNaN(d.getTime()))return 'unknown';return `${d.getFullYear()}_${String(d.getMonth()+1).padStart(2,'0')}`}
export function getChunkId(tableName,record){if(MONTHLY_TABLES.has(tableName))return `${safeId(tableName)}_${monthKeyFromRecord(record)}`;return `${safeId(tableName)}_default`}
function makeChunkDoc(tableName,chunkId,mode,records,value){const payload={tableName,chunkId,mode,updatedAt:now(),version:state.version||'',count:Array.isArray(records)?records.length:(value!==undefined?1:0),records:Array.isArray(records)?records:[]};if(value!==undefined)payload.value=value;payload.sizeEstimate=estimateJsonSize(payload);return payload}
function packRecords(tableName,baseId,records){const chunks=[];let current=[];let seq=1;const flush=()=>{if(!current.length)return;const id=current.length===records.length?baseId:`${baseId}_${String(seq).padStart(3,'0')}`;chunks.push(makeChunkDoc(tableName,id,'array',current));current=[];seq++};for(const rec of records){const candidate=[...current,rec];const test=makeChunkDoc(tableName,`${baseId}_${String(seq).padStart(3,'0')}`,'array',candidate);if(current.length&&test.sizeEstimate>CHUNK_TARGET_BYTES)flush();current.push(rec);if(makeChunkDoc(tableName,`${baseId}_${String(seq).padStart(3,'0')}`,'array',current).sizeEstimate>CHUNK_TARGET_BYTES&&current.length===1)flush()}flush();return chunks}
export function splitTableIntoChunks(tableName,recordsOrValue){if(Array.isArray(recordsOrValue)){const buckets=new Map();for(const rec of recordsOrValue){const base=getChunkId(tableName,rec);if(!buckets.has(base))buckets.set(base,[]);buckets.get(base).push(rec)}let out=[];for(const [base,records] of buckets.entries()){out=out.concat(packRecords(tableName,base,records))}return out}const chunk=makeChunkDoc(tableName,`${safeId(tableName)}_value`,'value',[],recordsOrValue??null);return [chunk]}
export function mergeChunksToTable(chunks=[]){const sorted=[...chunks].sort((a,b)=>String(a.chunkId).localeCompare(String(b.chunkId)));if(sorted.some(c=>c.mode==='value')){const last=sorted.filter(c=>c.mode==='value').sort((a,b)=>ts(b.updatedAt)-ts(a.updatedAt))[0];return clone(last?.value??null)}return sorted.flatMap(c=>Array.isArray(c.records)?c.records:[])}
function buildCloudParts(s){const baseState=extractBaseState(s);const chunksByTable={},tableIndex={},warnings=[];for(const t of tableList()){const chunks=splitTableIntoChunks(t,s[t]);chunksByTable[t]=chunks;tableIndex[t]=chunks.map(c=>c.chunkId);for(const c of chunks){if(c.sizeEstimate>900*1024)warnings.push(`${t}/${c.chunkId} 接近或超過安全大小：${c.sizeEstimate} bytes`)}}return {baseState,chunksByTable,tableIndex,warnings}}
async function commitInBatches(writes){for(let i=0;i<writes.length;i+=BATCH_LIMIT){const batch=modules.writeBatch(db);for(const w of writes.slice(i,i+BATCH_LIMIT)){batch.set(w.ref,w.data,{merge:true})}await batch.commit()}}
async function readStateFromCloudMultiDoc(scope='user',roomCode=''){
  const snap=await modules.getDoc(metaDoc(scope,roomCode));
  updateSyncMeta({lastCloudReadAt:now()});
  if(!snap.exists())return null;
  const meta=snap.data()||{};
  const tableIndex=meta.tableIndex||{};
  const tables={};let chunkCount=0,totalSize=0;
  for(const [tableName,chunkIds] of Object.entries(tableIndex)){const docs=await Promise.all((chunkIds||[]).map(id=>modules.getDoc(chunkDoc(scope,tableName,id,roomCode))));const chunks=docs.filter(d=>d.exists()).map(d=>d.data());chunkCount+=chunks.length;totalSize+=chunks.reduce((s,c)=>s+Number(c.sizeEstimate||estimateJsonSize(c)),0);tables[tableName]=mergeChunksToTable(chunks)}
  updateSyncMeta({lastCloudUpdatedAt:meta.updatedAt||'',lastCloudVersion:meta.cloudSchemaVersion||'',lastCloudChunkCount:chunkCount,lastCloudSizeEstimate:totalSize,cloudPath:scope==='room'?`rooms/${roomCode||state.room?.inviteCode}/habitMission...`:`users/${userId()}/habitMission...`});
  return restoreStateFromParts(meta.baseState||{},tables);
}
async function writeStateToCloudMultiDoc(nextState=state,scope='user',roomCode=''){
  if(!canSync())return false;
  const {baseState,chunksByTable,tableIndex,warnings}=buildCloudParts(nextState);
  const chunkCount=Object.values(tableIndex).reduce((s,a)=>s+a.length,0);
  const estimatedSyncSize=estimateJsonSize(baseState)+Object.values(chunksByTable).flat().reduce((s,c)=>s+Number(c.sizeEstimate||0),0);
  const meta={cloudSchemaVersion:CLOUD_SCHEMA_VERSION,schemaVersion:CLOUD_SCHEMA_VERSION,updatedAt:nextState.updatedAt||now(),savedAt:now(),appVersion:nextState.version||'',staticPoolsExcluded:true,baseState,tableIndex,chunkCount,estimatedSyncSize,syncWarnings:warnings};
  const writes=[];for(const [tableName,chunks] of Object.entries(chunksByTable)){for(const c of chunks)writes.push({ref:chunkDoc(scope,tableName,c.chunkId,roomCode),data:c})}writes.push({ref:metaDoc(scope,roomCode),data:meta});
  await commitInBatches(writes);
  updateSyncMeta({lastCloudWriteAt:now(),lastCloudVersion:CLOUD_SCHEMA_VERSION,lastCloudUpdatedAt:meta.updatedAt,lastCloudChunkCount:chunkCount,estimatedSyncSize,syncWarnings:warnings,cloudPath:scope==='room'?`rooms/${roomCode||state.room?.inviteCode}/habitMission...`:`users/${userId()}/habitMission...`});
  return true;
}
async function readLegacyUserState(){try{const ref=legacyUserRef();if(!ref)return null;const snap=await modules.getDoc(ref);if(!snap.exists())return null;const data=snap.data();return data?.state||null}catch(e){console.warn('legacy read failed',e);return null}}
async function readRemoteUserState(){if(!canSync())return null;const remote=await readStateFromCloudMultiDoc('user');if(remote)return remote;const legacy=await readLegacyUserState();if(legacy){updateSyncMeta({migratedFromLegacy:true,legacyReadAt:now()});return legacy}return null}
async function writeRemoteUserState(nextState=state){return writeStateToCloudMultiDoc(nextState,'user')}
async function readRoomState(code){if(!canSync()||!code)return null;return readStateFromCloudMultiDoc('room',code)}
async function writeRoomState(code,nextState=state){if(!canSync()||!code)return false;return writeStateToCloudMultiDoc(nextState,'room',code)}

export async function syncLatestWithCloud(reason='manual'){
  if(inFlight)return inFlight;
  inFlight=(async()=>{try{
    if(!await initFirebase()){setStatus('本機模式','找不到 Firebase 設定，已保存於本機。',{reason});return false}
    if(!currentUser()){setStatus('本機模式','尚未登入，已保存於本機。',{reason});return false}
    if(applyingRemote)return false;
    await ensureRoomMembership();
    setStatus('同步中','',{reason,syncMeta:{syncing:true,lastSyncStartAt:now()}});
    makePreSyncBackup();
    const remote=await readRemoteUserState();
    let merged=clone(state);let mode='push-new-multidoc';
    if(remote){merged=smartMergeState(state,withAuth(remote));const localTime=ts(state.updatedAt),remoteTime=ts(remote.updatedAt);mode=remoteTime>localTime?'merge-cloud-newer':localTime>remoteTime?'merge-local-newer':'merge-same-time'}
    applyingRemote=true;replaceState(withAuth(merged),{touch:false,emit:false,source:'smartMergeMultiDoc'});applyingRemote=false;
    await writeRemoteUserState(state);
    updateSyncMeta({dirty:false,syncing:false,lastSyncResult:remote?`已同步：${mode}`:'已同步：建立多文件雲端資料',lastSuccessfulSyncAt:now()});
    state.firebase={...(state.firebase||{}),lastSyncAt:now(),syncStatus:remote?'已同步':'已同步：建立多文件雲端資料',syncError:'',lastSyncReason:reason};
    saveState({touch:false,emit:false,source:'syncStatus'});
    window.dispatchEvent(new CustomEvent('habit-sync-complete',{detail:{reason,mode}}));
    return true;
  }catch(e){console.warn('syncLatestWithCloud failed',e);applyingRemote=false;updateSyncMeta({syncing:false,lastSyncResult:'同步失敗',lastSyncError:readableError(e)});state.firebase={...(state.firebase||{}),syncStatus:'同步失敗',syncError:readableError(e),lastSyncReason:reason};saveState({touch:false,emit:false,source:'syncError'});return false}finally{inFlight=null}})();return inFlight}
export function scheduleCloudSync(reason='change',delay=1200){if(applyingRemote)return;updateSyncMeta({dirty:true,nextDebounceAt:new Date(Date.now()+delay).toISOString(),lastDirtyReason:reason});clearTimeout(syncTimer);syncTimer=setTimeout(()=>{syncLatestWithCloud(reason).catch(console.warn)},delay)}
export function startAutoSync(){if(autoTimer)return;autoTimer=setInterval(()=>{syncLatestWithCloud('interval-30s').catch(console.warn)},30000)}
export function stopAutoSync(){if(autoTimer){clearInterval(autoTimer);autoTimer=null}clearTimeout(syncTimer)}
export async function lifecycleSync(){return syncLatestWithCloud('lifecycle')}
export async function syncAllNow(){const userOk=await syncLatestWithCloud('manual');const roomOk=await pushRoomToCloud();return userOk||roomOk}
export async function pullUserFromCloud(){const remote=await readRemoteUserState();if(!remote)return false;makePreSyncBackup();applyingRemote=true;replaceState(withAuth(smartMergeState(state,remote)),{touch:false,emit:false,source:'cloudMultiDoc'});applyingRemote=false;window.dispatchEvent(new CustomEvent('habit-remote-updated',{detail:{reason:'pullUser'}}));return true}
export async function pushUserToCloud(){if(!await initFirebase()||!currentUser())return false;makePreSyncBackup();await writeRemoteUserState(state);setStatus('已同步：本機覆蓋雲端','');return true}
export async function pushRoomToCloud(){if(applyingRemote)return false;if(!await initFirebase()||!currentUser()||!state.room?.inviteCode)return false;try{await ensureRoomMembership(state.room.inviteCode);return await writeRoomState(state.room.inviteCode,state)}catch(e){console.warn(e);setStatus('同步失敗',readableError(e));return false}}
export async function pullRoomFromCloud(code){if(!await initFirebase()||!currentUser()||!code)return false;await ensureRoomMembership(code);const remote=await readRoomState(code);if(remote){makePreSyncBackup();applyingRemote=true;replaceState(withAuth(smartMergeState(state,remote)),{touch:false,emit:false,source:'roomMultiDoc'});applyingRemote=false;window.dispatchEvent(new CustomEvent('habit-remote-updated',{detail:{reason:'room'}}));return true}return false}
