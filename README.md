# 習慣任務｜v15.1.0-stable

本版本為 Phase 15A～15D 關係互動功能總驗收後的穩定版輸出。系統保留既有今天頁、習慣頁、雙人頁、關係頁、冒險頁、錢包頁、挑戰頁、戰報頁、統計頁、設定頁、備份頁、CSV / JSON、Firebase 多文件同步與 PWA。

## 版本資訊

- App version：`v15.1.0-stable`
- Service worker cache：`habit-mission-v15-1-stable-v1`
- 同步架構：多文件 `meta + table chunks`
- 內建題庫：靜態資料，不背景同步 Firebase

## Phase 15 關係互動重點

### 關係頁同步狀態

關係頁已改為共用全域 top status / sync header，不再因局部區塊 render 失敗而顯示「畫面更新失敗」。未登入時顯示本機模式；已登入時顯示登入與同步狀態。

### 默契挑戰 4 選 1

默契挑戰已改為四選一非同步答題：

- 題庫 `chemistryChoiceCards` 共 2304 題。
- 題庫為靜態資料，不同步到 Firebase。
- 第一個回答的人建立 session。
- 對方之後讀取同一題 session 作答。
- 雙方都有答案後自動比對。
- 答案相同給主要獎勵；答案不同不扣分。
- 一方可連續建立多題，另一方可依序回答待答題。

同步資料表：

- `chemistryChallengeSessions`
- `chemistryChallengeAnswers`

### 今日小信箱

今日小信箱支援開放式問答與信件：

- 題庫 `relationshipLetterPrompts` 共 2304 題。
- 題庫為靜態資料，不同步到 Firebase。
- 可送出給對方。
- 對方可已讀、收藏、回覆。
- 信件、回覆與操作紀錄可 JSON / CSV 匯出入。

同步資料表：

- `coupleLetters`
- `coupleLetterReplies`
- `coupleLetterLogs`

### Firebase room members

Phase 15D 已加入 room membership 準備：

- `ensureRoomDocument()`
- `ensureRoomMembership()`
- `repairRoomMembershipIfMissing()`

上傳後仍可先使用目前寬鬆 rules。確認雙方登入並補齊 `rooms/{roomId}.members` 後，再依 `FIREBASE_RULES_SAFE.md` 選擇是否改成安全版 rules。

## 部署方式

1. 解壓縮本 ZIP。
2. 將所有檔案上傳到 GitHub repository 根目錄。
3. GitHub repository → Settings → Pages。
4. Source 選 `Deploy from a branch`。
5. branch 選 `main`，folder 選 `/root`。
6. 部署完成後開啟 GitHub Pages 網址。
7. 若手機 PWA 顯示舊版，請刪除主畫面 App、清除網站資料後重新加入。

## 必讀文件

- `USER_GUIDE.md`：使用說明。
- `TESTING_CHECKLIST.md`：最終測試清單。
- `FINAL_PHASE15_VALIDATION.md`：Phase 15 逐項驗收。
- `FINAL_VALIDATION.md`：穩定版總驗收。
- `CHANGELOG.md`：更新紀錄。
- `FIREBASE_SETUP_GUIDE.md`：Firebase 設定。
- `FIREBASE_RULES_SAFE.md`：安全版 rules。
