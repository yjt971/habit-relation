export const defaultHabits=[];

const dailyBases=[
 ['喝水 500ml','健康','補水是最基本的恢復。',5,'main'],['喝一杯無糖飲品','健康','用無糖飲品取代高糖飲料。',5,'side'],['伸展肩頸 3 分鐘','健康','適合久坐後快速放鬆。',7,'side'],['伸展腿部 3 分鐘','健康','讓身體從僵硬狀態恢復。',7,'side'],['深呼吸 10 次','健康','短時間穩定情緒。',6,'side'],['走路 500 步','健康','低門檻活動一下。',8,'side'],['站起來活動 2 分鐘','健康','中斷久坐。',6,'side'],['補充一份蛋白質','健康','幫助身體恢復。',8,'main'],['吃一份水果','健康','補充纖維與微量營養。',8,'side'],['今天少喝一杯含糖飲料','健康','完成一次飲食小選擇。',9,'bonus'],['睡前放下手機 5 分鐘','健康','降低睡前刺激。',9,'bonus'],['整理床鋪','生活','讓房間立刻變整齊。',6,'side'],['洗一個杯子','生活','很小但可完成的家務。',5,'side'],['擦一個小角落','生活','完成一個可見的小整理。',7,'side'],['丟掉一個不要的東西','生活','降低環境負擔。',7,'side'],['整理桌面 3 分鐘','生活','讓工作或生活區變清爽。',8,'main'],['收一件散落物品','生活','快速恢復秩序。',5,'side'],['把明天要用的東西放好','生活','降低明天出門阻力。',7,'main'],['檢查待辦清單','自律','確認今天真正要做的事。',6,'main'],['記下明天 1 件小任務','自律','降低明天開始阻力。',6,'main'],['完成一個 2 分鐘小待辦','自律','把小事立刻清掉。',8,'main'],['回顧今天 1 件完成的事','自律','收尾並看見成果。',6,'main'],['記一筆花費','財務','保持金錢感。',6,'side'],['檢查今日花費','財務','快速掌握支出。',7,'side'],['整理一張發票或收據','財務','減少日後整理負擔。',6,'side'],['看一頁書','學習','低門檻維持學習。',6,'side'],['學一個新單字或新概念','學習','只學一個也算前進。',7,'bonus'],['閱讀一小段文章','學習','維持輸入感。',7,'side'],['整理一則筆記','學習','把資訊變得可用。',8,'bonus'],['傳一句問候','關係','維持連結。',7,'side'],['回覆一則重要訊息','關係','避免拖延累積。',8,'main'],['對自己說一句肯定','心情','補充心理能量。',6,'secret'],['寫下一件感謝的事','心情','把注意力放回正向經驗。',7,'secret'],['做一件讓自己開心的小事','心情','小小照顧自己。',9,'bonus'],['整理手機照片 3 張','生活','減少數位雜亂。',7,'side'],['清掉一封不需要的信','生活','降低收件匣壓力。',6,'side'],['檢查行事曆','自律','確認今天與明天安排。',6,'main'],['準備一份明天提醒','自律','讓未來的自己輕鬆一點。',7,'bonus'],['做一次 1 分鐘冥想','心情','用短時間恢復穩定。',7,'secret'],['走到窗邊看遠方 1 分鐘','健康','讓眼睛休息。',5,'side']
];
const dailyVariants=['今天完成','下班後完成','午休時完成','睡前完成','起床後完成','回家後完成','打開手機前完成','吃飯後完成','通勤前完成','今天找空檔完成','用 3 分鐘完成','輕鬆完成','快速完成','溫柔完成','像破關一樣完成','先完成一次'];
export function buildDailyMissionPool(){const arr=[];let i=0;for(const base of dailyBases){for(const v of dailyVariants){arr.push({id:`daily_auto_${i++}`,title:`${v}${base[0]}`,category:base[1],description:`一天型任務：${base[2]}完成即可，不會跨日累積。`,points:base[3],pack:base[4],baseTitle:base[0],semanticKey:base[0],ideaKey:base[0]});}}for(let round=1;arr.length<1120;round++){for(const base of dailyBases){arr.push({id:`daily_extra_${round}_${arr.length}`,title:`今日任務 ${round}：${base[0]}`,category:base[1],description:`一天型任務：${base[2]}完成即可，不會跨日累積。`,points:base[3],pack:base[4],baseTitle:base[0],semanticKey:base[0],ideaKey:base[0]});if(arr.length>=1120)break}}return arr;}

const flexBases=[
 ['完成一個拖延小任務','自律','light',10,'side'],['整理一個小區域','生活','light',9,'side'],['伸展或走路 5 分鐘','健康','light',8,'side'],['閱讀或學習 10 分鐘','學習','light',9,'bonus'],['記帳或檢查花費','財務','light',8,'side'],['主動關心一個人','關係','light',9,'side'],['做一次呼吸練習','心情','light',8,'secret'],['整理照片或檔案','生活','light',9,'side'],['做一個低門檻運動','健康','medium',11,'main'],['準備一份健康食物','健康','medium',12,'main'],['完成一件家務','生活','medium',11,'side'],['寫下三個感謝','心情','medium',10,'secret'],['回覆一則重要訊息','關係','medium',10,'main'],['整理錢包或包包','生活','medium',11,'side'],['練習一個技能 15 分鐘','學習','medium',12,'bonus'],['檢查行事曆並調整安排','自律','medium',10,'main'],['規劃一次放鬆活動','心情','high',16,'bonus'],['安排一次約會或相處時間','關係','high',18,'bonus'],['整理一個收納格','生活','high',15,'side'],['完成一次完整運動','健康','high',18,'main'],['做一次深度學習 30 分鐘','學習','high',18,'bonus'],['整理一次月度預算','財務','high',18,'main'],['安排一次大型整理','生活','rare',24,'secret'],['規劃一次旅行或特別活動','關係','rare',28,'secret'],['完成一次年度回顧','自律','rare',30,'secret']
];
const cadenceByEffort={
 light:[['weekly',2],['weekly',3],['weekly',4],['tenDays',3],['tenDays',4],['biweekly',4],['biweekly',5],['monthly',6],['monthly',8]],
 medium:[['weekly',1],['weekly',2],['tenDays',2],['biweekly',2],['biweekly',3],['monthly',2],['monthly',3],['monthly',4],['quarterly',6]],
 high:[['monthly',1],['monthly',2],['quarterly',2],['quarterly',3],['yearly',4],['yearly',6]],
 rare:[['quarterly',1],['quarterly',2],['yearly',1],['yearly',2],['yearly',4]]
};
const periodLabel={weekly:'每週',tenDays:'每 10 天',biweekly:'每雙週',monthly:'每月',quarterly:'每季',yearly:'每年'};
const interval={weekly:7,tenDays:10,biweekly:14,monthly:30,quarterly:90,yearly:365};
function packByEffort(e){return e==='rare'?'secret':e==='high'?'bonus':e==='medium'?'main':'side'}
function isLongTermType(t){return t==='quarterly'||t==='yearly'}
export function buildFlexMissionPool(){
  const tones=['輕鬆','穩定','挑戰','療癒','進階','本期','勇者','閃亮'];
  const arr=[];
  let i=0;
  for(const b of flexBases){
    const list=cadenceByEffort[b[2]]||cadenceByEffort.light;
    for(const cad of list){
      for(const tone of tones){
        const type=cad[0], count=cad[1];
        arr.push({
          id:`flex_auto_${i++}`,
          title:`${tone}${periodLabel[type]}${count}次：${b[0]}`,
          category:b[1],
          description:`本期彈性任務：在${periodLabel[type]}內完成 ${count} 次即可。這個頻率已依任務難度調整，避免太高或不合理。`,
          points:b[3]+(isLongTermType(type)?4:0),
          pack:packByEffort(b[2]),
          target:count,
          longTerm:isLongTermType(type),
          baseTitle:b[0],
          semanticKey:b[0],
          ideaKey:b[0],
          frequencyRule:{type,mode:'count',count,weekdays:[],weekNumbers:[],monthDates:[],monthWeeks:[],months:[],quarters:[],quarterMonths:[],quarterDates:[],yearWeeks:[],yearDates:[],intervalDays:interval[type],startDate:'',fallbackToLastDay:true}
        });
      }
    }
  }
  for(let round=1;arr.length<1200;round++){
    for(const b of flexBases){
      const list=cadenceByEffort[b[2]]||cadenceByEffort.light;
      const cad=list[round%list.length];
      const type=cad[0], count=cad[1];
      arr.push({
        id:`flex_extra_${round}_${arr.length}`,
        title:`第${round}輪${periodLabel[type]}${count}次：${b[0]}`,
        category:b[1],
        description:`本期彈性任務：在${periodLabel[type]}內完成 ${count} 次即可。這個頻率已依任務難度調整。`,
        points:b[3]+(isLongTermType(type)?4:0),
        pack:packByEffort(b[2]),
        target:count,
        longTerm:isLongTermType(type),
        baseTitle:b[0],
        semanticKey:b[0],
        ideaKey:b[0],
        frequencyRule:{type,mode:'count',count,weekdays:[],weekNumbers:[],monthDates:[],monthWeeks:[],months:[],quarters:[],quarterMonths:[],quarterDates:[],yearWeeks:[],yearDates:[],intervalDays:interval[type],startDate:'',fallbackToLastDay:true}
      });
      if(arr.length>=1200)break;
    }
  }
  return arr;
}
export const dailyMissionPool=buildDailyMissionPool();
export const flexMissionPool=buildFlexMissionPool();



export const defaultQuests=[
  {id:'quest_7day_move',title:'7 天運動啟動',category:'健康',durationDays:7,target:7,description:'連續 7 天完成健康或運動相關任務，建立啟動感。',reward:{points:80,exp:80,item:'銀寶箱',badge:'運動啟動者'},tags:['健康','運動']},
  {id:'quest_14day_sleep',title:'14 天早睡挑戰',category:'健康',durationDays:14,target:10,description:'14 天內完成睡眠、放鬆或晚間收尾任務 10 次。',reward:{points:120,exp:140,item:'金寶箱',badge:'早睡守護者'},tags:['健康','心情','睡前']},
  {id:'quest_30day_english',title:'30 天英文養成',category:'知識',durationDays:30,target:20,description:'30 天內完成學習、閱讀、筆記或技能練習任務 20 次。',reward:{points:180,exp:240,item:'金寶箱',badge:'知識冒險家'},tags:['學習','知識']},
  {id:'quest_weekend_clean',title:'週末整理計畫',category:'生活',durationDays:7,target:3,description:'本週完成 3 次整理、家務或收納任務。',reward:{points:70,exp:80,item:'木寶箱',badge:'週末整理師'},tags:['生活','自律']}
];

export const defaultAchievements=[
  {id:'ach_complete_10',name:'任務新手',description:'累積完成 10 個任務',condition:{type:'habitLogs',target:10},reward:{exp:30,points:10}},
  {id:'ach_complete_50',name:'穩定冒險者',description:'累積完成 50 個任務',condition:{type:'habitLogs',target:50},reward:{exp:80,points:30}},
  {id:'ach_streak_7',name:'七日火苗',description:'連續完成 7 天',condition:{type:'streak',target:7},reward:{exp:70,points:25,item:'補救券'}},
  {id:'ach_points_500',name:'點數收藏家',description:'累積獲得 500 點',condition:{type:'pointsEarned',target:500},reward:{exp:80,points:30,item:'抽獎券'}},
  {id:'ach_redeem_3',name:'獎勵兌換家',description:'兌換 3 次獎勵',condition:{type:'redemptions',target:3},reward:{exp:60,points:20}},
  {id:'ach_flip_10',name:'翻牌幸運星',description:'翻牌 10 次',condition:{type:'gameAction',action:'flip',target:10},reward:{exp:60,points:20,item:'抽獎券'}},
  {id:'ach_chest_5',name:'寶箱探險家',description:'開啟 5 個寶箱',condition:{type:'gameAction',action:'openChest',target:5},reward:{exp:80,points:30,item:'銀寶箱'}},
  {id:'ach_couple_5',name:'靠近一點',description:'完成 5 次雙人或關係任務',condition:{type:'coupleLogs',target:5},reward:{exp:60,points:20,item:'雙人寶箱'}}
];

export const defaultStoryChapters=[
  {id:'story_village',title:'新手村',place:'新手村',requiredLevel:1,requiredSoloStep:0,text:'你帶著第一批任務卡出發，村口公告寫著：小小完成，也算前進。'},
  {id:'story_forest',title:'晨光森林',place:'森林',requiredLevel:2,requiredSoloStep:6,text:'森林裡的光落在任務清單上，你開始感覺到規律正在長出來。'},
  {id:'story_town',title:'月影小鎮',place:'城鎮',requiredLevel:4,requiredSoloStep:24,text:'小鎮居民說，真正的冒險不是一天衝刺，而是一次次回來。'},
  {id:'story_coast',title:'藍潮海岸',place:'海邊',requiredLevel:6,requiredSoloStep:60,text:'你在海邊整理這個月的自己，發現那些小任務已經留下路徑。'},
  {id:'story_castle',title:'願望城堡',place:'城堡',requiredLevel:10,requiredSoloStep:114,text:'城堡門打開時，你知道自己不是突然變強，而是一直沒有停下。'}
];

export const levelTitles=[
  {level:1,title:'新手冒險者'},{level:3,title:'穩定學徒'},{level:5,title:'任務騎士'},{level:8,title:'生活勇者'},{level:12,title:'習慣領主'},{level:20,title:'人生冒險王'}
];

export const attributeByCategory={
  '健康':'health','生活':'discipline','自律':'discipline','學習':'knowledge','知識':'knowledge','財務':'finance','關係':'relationship','輕量互動':'relationship','陪伴':'relationship','關心':'relationship','肯定':'relationship','約會':'relationship','心情':'discipline','其他':'discipline'
};


// Phase 11D relationship cultivation content pools. Generated deterministically so the package stays maintainable while still providing 1000+ unique entries per pool.
const intensityByIndex=['輕量','普通','深度'];
const locationByIndex=['遠距','見面','皆可'];
function titleMain(text){return String(text||'').split(/[：:]/)[0].trim()}
function cardReward(type,i){
  if(type==='closeToday')return {intimacy:8+(i%8),chemistry:0,heartbeat:5+(i%6),couplePoints:4+(i%5)};
  if(type==='chemistry')return {intimacy:2+(i%4),chemistry:10+(i%10),heartbeat:2+(i%5),couplePoints:5};
  if(type==='dateIdea')return {intimacy:12+(i%12),chemistry:3+(i%6),heartbeat:12+(i%12),couplePoints:10+(i%10)};
  return {intimacy:10+(i%10),chemistry:8+(i%9),heartbeat:4+(i%5),couplePoints:4+(i%7)};
}
function makeCard(type,prefix,category,title,content,i,extraTags=[]){const slug=`${type}_${String(i).padStart(4,'0')}`;const base=`${type}_${category}_${titleMain(title)}_${i}`.replace(/\s+/g,'_');return {id:slug,type,category,title,content,intensity:intensityByIndex[i%3],estimatedTime:5+(i%8)*5,locationType:locationByIndex[i%3],semanticKey:base,ideaKey:base,tags:[category,...extraTags],repeatCooldownDays:14,reward:cardReward(type,i),enabled:true};}
function buildCloseTodayCards(){
  const cats=['輕量互動','關心','肯定','陪伴','回憶','未來','生活支持','情緒照顧'];
  const actions=['問對方今天最累的是什麼，並好好聽他說完。','傳一句具體的關心，讓對方知道你有想到他。','告訴對方今天哪一點讓你覺得他很棒。','約一段短短的通話，只聊今天過得怎麼樣。','分享一個今天想到對方的瞬間。','問對方明天有沒有一件希望被支持的小事。','主動提出一件你可以幫忙分擔的小事。','留一段溫柔訊息，讓對方睡前可以安心一點。','傳一張今天的照片，順便說說當下的心情。','說一句謝謝，具體講出你感謝的原因。','給對方一個只屬於你們的擁抱暗號。','提醒對方今天也要好好照顧自己。','分享一首讓你想到對方的歌。','問對方今天最想被理解的是什麼。','說出今天喜歡對方的一個小地方。','約定今天睡前互道一句晚安。'];
  const focuses=['早餐','午休','下班後','睡前','通勤路上','今天最累的時候','今天最開心的瞬間','今天最想被理解的地方','這週的小目標','最近的壓力','下次見面','家裡的小角落','一件待辦','一個小願望','一個共同回憶','明天的期待'];
  const contents=['不用講很久，重點是讓對方感覺被放在心上。','可以用訊息、語音或見面時完成，不完成也不扣分。','把語氣放輕，像日常裡的小小靠近。','不用急著解決問題，先聽完就很好。'];
  const arr=[];let i=0;for(const c of cats){for(const a of actions){for(const f of focuses){arr.push(makeCard('closeToday','靠近',c,a,`${a}可以從「${f}」開始，${contents[i%contents.length]}`,i,[f]));i++;if(arr.length>=1040)return arr;}}}return arr;
}
function buildChemistryCards(){
  const cats=['飲食偏好','約會偏好','情緒需求','生活習慣','未來想像','旅行偏好','壓力處理','回憶測驗'];
  const prompts=['猜猜對方最近最想吃哪一家店。','猜猜對方休假時最想怎麼安排。','猜猜對方壓力大時最需要哪一種陪伴。','猜猜對方在家最放鬆的角落是哪裡。','猜猜對方最近最期待完成的小計畫。','猜猜對方下一次短旅行會選哪個地方。','猜猜對方吵架後最希望怎麼被修復。','猜猜對方最記得你們哪一次約會。','猜猜對方最近最想喝的飲料。','猜猜對方理想的週日會怎麼過。','猜猜對方收到什麼小禮物會最開心。','猜猜對方最近最想被稱讚的是哪一點。','猜猜對方最怕在關係裡被忽略的是什麼。','猜猜對方覺得一起生活最重要的小規則。','猜猜對方今年最想一起完成的事。','猜猜對方最想重溫哪一段共同回憶。'];
  const modes=['二選一','三選一','自由回答','排序題','先猜後問','同步回答','各自寫下','交換理由'];
  const details=['答案不用一樣，也可以用來更認識彼此。','先不要提示對方，揭曉後聊聊原因。','答錯也沒關係，重點是知道彼此怎麼想。','可以把答案留到下次約會時揭曉。'];
  const arr=[];let i=0;for(const c of cats){for(const q of prompts){for(const m of modes){arr.push(makeCard('chemistry','默契',c,q,`${m}完成。${details[i%details.length]}`,i,[m]));i++;if(arr.length>=1040)return arr;}}}return arr;
}
function buildDateIdeaCards(){
  const cats=['室內','戶外','放鬆','美食','小旅行','低預算','高儀式感','家裡也能做','拍照 / 留念','新體驗'];
  const activities=['一起挑一間最近想去的店，安排成小約會。','找一條舒服的散步路線，慢慢走完不用趕。','設計一個只屬於你們的小儀式。','一起完成一個小作品，留下今天的紀念。','安排一段半日行程，只放一到兩個重點。','一起試一件平常沒做過的新體驗。','交換彼此最近喜歡的店、歌或影片。','找一個地方拍一張你們都喜歡的照片。','一起整理一段共同回憶。','安排一段不用趕時間的放空時段。','各自準備一個小驚喜，見面時交換。','一起完成一張想吃或想去的清單。','選一個主題，做一次輕鬆的小約會。','找一個舒服角落坐下來聊天。','一起嘗試一種沒吃過的口味。','安排一個雨天也能做的約會備案。'];
  const details=['甜點','公園','夜景','早餐','書店','按摩或泡湯','電影或劇集','拍照點','市場或夜市','咖啡廳','展覽','海邊或河岸','家裡晚餐','手作體驗','小旅行路線','雨天備案'];
  const notes=['完成後各自說一個最喜歡的瞬間。','不用追求完美，舒服比豐富更重要。','可以先收藏，等有空再放進願望池。','如果今天做不到，留成下次的小期待。'];
  const arr=[];let i=0;for(const c of cats){for(const a of activities){for(const d of details){arr.push(makeCard('dateIdea','約會',c,a,`靈感主題是「${d}」。${notes[i%notes.length]}`,i,[d]));i++;if(arr.length>=1120)return arr;}}}return arr;
}
function buildDeepTalkCards(){
  const cats=['輕鬆深聊','關係深聊','未來深聊','回憶','壓力與支持','價值觀','夢想','生活期待'];
  const questions=['最近有沒有一件事讓你變開心？','最近有沒有一件事讓你覺得被支持？','你覺得我們哪件事可以一起做得更好？','什麼時候你會覺得比較有安全感？','哪一個瞬間是你最近覺得值得記住的？','未來三個月你最期待我們一起完成什麼？','當你壓力大的時候，我怎麼做會讓你比較舒服？','你心裡很珍惜但平常比較少說的是什麼？','最近有沒有一件事讓你覺得我們很有默契？','什麼安排會讓你的生活更放鬆？','哪件小事最能代表我們的關係？','你希望我們的日常可以慢慢調整哪一點？','有沒有一件事需要一點勇氣，但你想試試看？','你希望被我用什麼方式溫柔對待？','有沒有一件事是你希望我們不要忘記的？','你想把哪件平凡小事變成共同回憶？'];
  const styles=['輕鬆回答即可，不需要一次說得很完整。','可以各說一個例子，聽完再回應。','不用急著解決，只要先理解彼此。','可以用 1 到 10 分描述感受。','先說感受，再慢慢說原因。','適合睡前或散步時慢慢聊。','遠距時也可以用語音完成。','不想聊太深時，可以只回答一小段。'];
  const arr=[];let i=0;for(const c of cats){for(const q of questions){for(const st of styles){arr.push(makeCard('deepTalk','深聊',c,q,`${st}這張卡的目標是更理解彼此，不是辯論對錯。`,i,[st]));i++;if(arr.length>=1040)return arr;}}}return arr;
}
export const closeTodayCards=buildCloseTodayCards();
export const chemistryChallengeCards=buildChemistryCards();
export const dateIdeaCards=buildDateIdeaCards();
export const deepTalkCards=buildDeepTalkCards();
export const coupleTasks=closeTodayCards.map(c=>({id:c.id,title:c.title,category:c.category,description:c.content,intimacy:c.reward.intimacy,harmony:c.reward.chemistry,heartbeat:c.reward.heartbeat,companionship:c.reward.heartbeat,semanticKey:c.semanticKey,ideaKey:c.ideaKey}));
export const harmonyQuestions=chemistryChallengeCards.map(c=>c.content);
export const dateCards=dateIdeaCards.map(c=>c.content);
export const talkCards=deepTalkCards.map(c=>[c.category,c.content]);
const rawPlaces=[['🏡','新手村','整理背包','寫下今天想完成的一件小事','探索村口公告'],['🌲','晨光森林','撿拾露水','完成 5 分鐘伸展','找到森林小路'],['🌌','星光湖','觀察湖面','記錄一件感謝的事','夜晚散步 10 分鐘'],['🪨','風鳴峽谷','聽見回音','完成一個延後的小任務','收集風之石'],['🌸','花語草原','採一朵花','對自己說一句肯定','完成一次呼吸練習'],['🛤️','舊鐵道','沿線前進','清理一個待辦','拍下今日風景'],['🕯️','月影小鎮','點亮路燈','整理桌面 3 分鐘','寫一封給未來的短訊'],['☕','旅人茶館','休息補給','喝水 500ml','和某人說一句問候'],['🗼','雲端燈塔','眺望遠方','完成一件學習任務','標記下一個目標'],['🌧️','雨聲巷','聽雨前行','處理一個拖延任務','收集雨滴徽章'],['📚','古書圖書館','翻閱地圖','閱讀 3 頁或 5 分鐘','記下新學到的一句話'],['🧊','冰晶洞穴','通過冰橋','完成一次低門檻任務','找到冰晶碎片'],['🔥','暖火營地','升起營火','做一次簡單運動','分享今日小成果'],['🛶','靜河碼頭','划向對岸','完成一件生活整理','領取河岸補給'],['🏔️','遠山坡道','爬上坡道','完成困難任務的一小步','獲得山風標記'],['🏮','夜市街','尋找小吃','記錄一筆花費或飲食','和對方分享想吃的東西'],['🎡','微光樂園','啟動旋轉木馬','完成一個讓自己開心的小事','抽一張靈感卡'],['🌊','藍潮海岸','聽海浪','散步 10 分鐘','寫下想放下的一件事'],['🚪','祕密門廊','找到鑰匙','完成秘密任務','解鎖隱藏支線'],['🏰','願望城堡','抵達城門','完成今日任務包','許下一個本週願望']];
const legacyPlaces=rawPlaces.map((p,i)=>({id:`place-${i}`,emoji:p[0],name:p[1],need:i*6,side:p.slice(2),reward:{points:5+(i%5)*3,exp:8+(i%6)*4,item:i%5===0?'木寶箱':i%7===0?'抽獎券':'',badge:i%6===0?`${p[1]}探索者`:''},story:`抵達${p[1]}，完成支線後可解鎖這裡的獎勵與劇情。`}));
const legacyObjects=[['stone','🪨','神秘石頭','可能得到 1 格前進','steps'],['flower','🌸','路邊小花','獲得心情補給','blessing'],['box','🎁','補給箱','可能獲得點數','points'],['letter','✉️','故事信件','顯示一段任務提示','story'],['compass','🧭','舊指南針','標記下一個地點','steps'],['coin','🪙','幸運硬幣','可能獲得 bonus 點數','points'],['key','🔑','小鑰匙','寶箱線索','item'],['tea','🍵','熱茶','恢復今日能量','item'],['camera','📷','拍立得','留下冒險記錄','story'],['lamp','🕯️','小燈火','點亮支線任務','hidden']].map(x=>({id:x[0],emoji:x[1],name:x[2],description:x[3],effect:x[4]}));

export const defaultSharedQuests=[
  {id:'shared_daily_care',scope:'daily',periodDays:1,totalDays:2,title:'今天互相打氣',description:'兩人合計完成 2 個任務或送出支援。',target:2,reward:{couplePoints:20,bossDamage:25,item:'抽獎券'},comfortReward:{min30:6,min80:14},tags:['支援','關係','任務']},
  {id:'shared_daily_health',scope:'daily',periodDays:1,totalDays:2,title:'一起照顧身體',description:'兩人合計完成 2 個健康類任務。',target:2,reward:{couplePoints:24,bossDamage:30,item:'抽獎券'},comfortReward:{min30:8,min80:16},tags:['健康']},
  {id:'shared_weekly_tasks',scope:'weekly',periodDays:7,totalDays:10,title:'本週穩定累積',description:'本週兩人合計完成合理數量的任務，目標會依活躍度估算。',target:10,reward:{couplePoints:80,bossDamage:80,item:'雙人寶箱'},comfortReward:{min30:20,min80:45,item80:'Boss 碎片'},tags:['任務','共同']},
  {id:'shared_weekly_health',scope:'weekly',periodDays:7,totalDays:10,title:'本週健康同行',description:'本週兩人合計完成 4 個健康任務。',target:4,reward:{couplePoints:70,bossDamage:70,item:'雙人寶箱'},comfortReward:{min30:16,min80:40,item80:'Boss 碎片'},tags:['健康']},
  {id:'shared_monthly_adventure',scope:'monthly',periodDays:30,totalDays:40,title:'本月共同冒險',description:'本月共同推進地圖或完成雙人貢獻。',target:50,reward:{couplePoints:160,bossDamage:140,item:'金寶箱'},comfortReward:{min30:40,min80:90,item80:'木寶箱'},tags:['冒險','共同']}
];

const rewardCats=['美食','放鬆','小旅行','居家','新體驗','紀念日','深聊陪伴','共同成長','禮物','其他'];
const rewardActions=['一起吃','一起喝','一起看','一起散步','一起按摩','一起泡湯','一起拍照','一起整理回憶','一起完成小儀式','一起做新體驗','一起準備驚喜','一起放空','一起深聊','一起規劃週末','一起做家裡約會','一起交換推薦','一起做手作','一起去走走','一起留念','一起完成願望'];
const rewardObjects=['火鍋','甜點','咖啡','電影','夜景','溫泉','早餐','宵夜','展覽','小旅行','家裡晚餐','散步路線','按摩時間','拍貼或照片','紀念日卡片','深聊時光','新餐廳','桌遊夜','河邊約會','書店午後','手作課','花市散步','雨天行程','放鬆日','驚喜小禮物','共同歌單'];
export const defaultSharedRewards=Array.from({length:520},(_,i)=>{const c=rewardCats[i%rewardCats.length];const a=rewardActions[i%rewardActions.length];const o=rewardObjects[(i*7)%rewardObjects.length];return {id:`sr_builtin_${String(i+1).padStart(3,'0')}`,name:`${c}獎勵 ${i+1}：${a}${o}`,category:c,cost:40+((i*17)%36)*10,note:`系統內建雙人獎勵，可用雙人點數直接兌換。主題：${a}${o}`,source:'builtin'};});

export const defaultCoupleChallenges=[
  {id:'cc_day_3tasks',source:'system',scope:'daily',challengeType:'cooperate',title:'一日雙人衝刺',description:'今天兩人合計完成 3 個任務。',target:3,reward:{couplePoints:30,bossDamage:60,title:'今日默契搭檔'}},
  {id:'cc_week_20tasks',source:'system',scope:'weekly',challengeType:'cooperate',title:'一週穩定挑戰',description:'本週兩人合計完成 20 個任務。',target:20,reward:{couplePoints:120,bossDamage:160,item:'雙人寶箱',title:'本週最佳隊友'}},
  {id:'cc_month_boss',source:'system',scope:'monthly',challengeType:'dungeon',title:'月度 Boss 副本',description:'本月共同對 Boss 造成 600 傷害。',target:600,reward:{couplePoints:180,bossDamage:220,item:'金寶箱',title:'Boss 攻略組'}},
  {id:'cc_total_100',source:'system',scope:'total',challengeType:'cooperate',title:'累積 100 次靠近',description:'累積完成 100 次雙人貢獻。',target:100,reward:{couplePoints:300,bossDamage:200,item:'金寶箱',title:'長期冒險夥伴'}}
];

export const bossPool=[
  {id:'boss_slime',name:'拖延史萊姆',emoji:'🟣',baseHp:140,description:'靠完成任務打敗拖延感。',weakness:'自律'},
  {id:'boss_cloud',name:'低能量烏雲',emoji:'☁️',baseHp:160,description:'用小小完成把雲吹散。',weakness:'健康'},
  {id:'boss_dragon',name:'混亂小龍',emoji:'🐲',baseHp:220,description:'用共同任務整理生活。',weakness:'生活'},
  {id:'boss_shadow',name:'分心影獸',emoji:'🌑',baseHp:200,description:'用專注與穩定擊退分心。',weakness:'學習'},
  {id:'boss_tide',name:'疲憊浪潮',emoji:'🌊',baseHp:180,description:'用休息、照顧與互相打氣穩住節奏。',weakness:'關係'}
];

// Phase 10C Adventure Map 2.0 seeds
const soloMapNames=['晨曦起點','露草庭院','苔石小徑','星屑橋','靜風森林','月光營地','藍莓坡道','銀葉溪谷','迷霧書屋','風車高地','雨音小鎮','琥珀礦坑','雲朵驛站','燈火港灣','古鐘廣場','雪晶洞穴','橘光沙丘','海貝燈塔','紫藤花廊','祕密門廊','糖霜山丘','流星草原','翡翠古井','木靈工坊','彩虹碼頭','薄暮劇場','水晶階梯','太陽城門','星河拱橋','願望王座'];
const coupleMapNames=['雙人起點','牽手小路','暖心庭院','默契森林','花語橋','晚安湖畔','約定茶館','晴雨巷口','星火營地','月影車站','微光市集','心跳鐘樓','藍潮海岸','雲端陽台','白沙露台','祕密信箱','雙人書屋','莓果花園','相片廣場','香氣廚房','慢步河岸','夏夜樂園','晨霧山徑','銀河天台','靠近旅店','彩燈碼頭','擁抱城門','流光城堡','永恆花廳','我們的願望塔'];
const sideVerb=['擊退','收集','啟動','修復','點亮','護送','解鎖','合成','鑑定','淨化'];
const sideTarget=['小史萊姆','星塵碎片','古老機關','破損路標','微光水晶','迷路精靈','封印石門','地圖碎片','Boss 弱點','暗影藤蔓'];
const objectEmojis=['🔥','❄️','🛡️','⚡','💫','🗝️','🧪','🌟','📜','🧭','💎','🪄','🧩','🎲','🏵️','🕯️','🧿','🫧','🍀','🔮'];
const objectBase=['火焰核心','冰霜瓶','破盾徽記','追加攻擊符','星光碎片','地圖鑰匙','能量藥水','弱點卡','舊卷軸','方位羅盤','寶箱晶片','魔法筆記','拼圖石板','命運骰子','稱號花紋','小燈火','守護眼石','泡泡瓶','幸運草','水晶球'];
const rewardTypes=['fireball','iceBomb','shieldBreak','extraAttack','starlightShard','mapKey','energyPotion','weaknessCard','hiddenQuest','travelCoupon','chestShard','story','titleShard','bossItem','ability','fireball','iceBomb','travelCoupon','hiddenQuest','starlightShard'];
function mapDistance(i){return 20+((i*7)%31)}
function buildMapNodes(mode,names){let acc=0;return names.map((name,i)=>{if(i>0)acc+=mapDistance(i);const sideCount=3+(i%8);const objCount=10+(i%11);const nodeId=`${mode}_node_${String(i+1).padStart(2,'0')}`;return {id:nodeId,mode,index:i,emoji:mode==='solo'?'🗺️':'💞',name,requiredSteps:acc,story:mode==='solo'?`你來到${name}。這裡記錄著一段只屬於自己的冒險，完成遊戲支線可以拿到 Boss 道具與地圖線索。`:`你們抵達${name}。這裡的任務需要兩人一起累積，探索後可獲得雙人戰鬥道具與共同故事。`,bossWeakness:['健康','知識','自律','關係','冒險'][i%5],reward:{points:10+(i%6)*5,exp:15+(i%8)*5,item:i%4===0?'火焰球':i%5===0?'地圖換算券':i%7===0?'Boss 弱點卡':'',badge:i%6===0?`${name}探索者`:''},sideQuests:Array.from({length:sideCount},(_,j)=>({id:`${nodeId}_side_${j+1}`,nodeId,mode,index:j,title:`${name}支線 ${j+1}：${sideVerb[(i+j)%sideVerb.length]}${sideTarget[(i*2+j)%sideTarget.length]}`,description:'這是系統內遊戲支線，必須達成條件後才可領取完成。',condition:buildMapCondition(i,j),reward:{points:5+j*2,exp:8+j*3,bossDamage:10+j*3,item:j%4===0?'星光碎片':j%5===0?'火焰球':''},status:'active'})),exploreObjects:Array.from({length:objCount},(_,j)=>{const k=(i*7+j)%objectBase.length;return {id:`${nodeId}_obj_${j+1}`,nodeId,mode,index:j,emoji:objectEmojis[k],name:`${name}・${objectBase[k]} ${j+1}`,description:`${name}中的一次性探索物件，探索後不會重置。`,rewardType:rewardTypes[k],reward:buildObjectReward(rewardTypes[k],name,i,j),explored:false}})}})}
function buildMapCondition(i,j){const types=['bossDamage','flipCount','openChest','itemOwned','useItem','gameLog','collectItem','hiddenQuest','travelCoupon'];const type=types[(i+j)%types.length];if(type==='bossDamage')return {type,target:30+((i+j)%5)*10,label:`對 Boss 累積造成 ${30+((i+j)%5)*10} 傷害`};if(type==='flipCount')return {type,target:1+((i+j)%3),label:`完成翻牌 ${1+((i+j)%3)} 次`};if(type==='openChest')return {type,target:1,label:'開啟任一寶箱 1 次'};if(type==='itemOwned')return {type,item:['火焰球','冰凍彈','破盾券','星光碎片'][(i+j)%4],target:1,label:'持有指定地圖 / Boss 道具'};if(type==='useItem')return {type,item:['火焰球','冰凍彈','破盾券'][(i+j)%3],target:1,label:'使用指定 Boss 道具 1 次'};if(type==='collectItem')return {type,item:'星光碎片',target:2,label:'收集星光碎片 2 個'};if(type==='hiddenQuest')return {type,target:1,label:'解鎖 1 個地圖隱藏支線'};if(type==='travelCoupon')return {type,item:'地圖換算券',target:1,label:'持有或使用 1 張地圖換算券'};return {type,target:1,label:'完成任一遊戲紀錄'};}
function buildObjectReward(type,nodeName,i,j){const map={fireball:{item:'火焰球',qty:1},iceBomb:{item:'冰凍彈',qty:1},shieldBreak:{item:'破盾券',qty:1},extraAttack:{item:'追加攻擊券',qty:1},starlightShard:{item:'星光碎片',qty:1},mapKey:{item:'地圖鑰匙',qty:1},energyPotion:{item:'能量藥水',qty:1},weaknessCard:{item:'Boss 弱點卡',qty:1},travelCoupon:{item:'地圖換算券',qty:1},chestShard:{item:'寶箱碎片',qty:1},titleShard:{item:'稱號碎片',qty:1},bossItem:{item:['火焰球','冰凍彈','破盾券','追加攻擊券'][(i+j)%4],qty:1},ability:{ability:'下一次 Boss 傷害 +20%'},hiddenQuest:{hiddenQuestTitle:`${nodeName}隱藏支線：尋回第 ${j+1} 個線索`},story:{story:`你在${nodeName}發現一段被折起來的短劇情。`}};return map[type]||{item:'星光碎片',qty:1}}
export const mapNodesSeed=[...buildMapNodes('solo',soloMapNames),...buildMapNodes('couple',coupleMapNames)];
export const places=mapNodesSeed.filter(n=>n.mode==='solo').map((n,i)=>({id:n.id,emoji:n.emoji,name:n.name,need:n.requiredSteps,side:n.sideQuests.map(q=>q.title),reward:n.reward,story:n.story}));
export const objects=mapNodesSeed.filter(n=>n.mode==='solo')[0].exploreObjects.map(o=>({id:o.id,emoji:o.emoji,name:o.name,description:o.description,effect:o.rewardType}));
