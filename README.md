# 習慣任務｜v15.0.0-stable

本物件包為 Phase 10A～10D、Phase 11A～11F、Phase 12A～12G、Phase 13A～13G、Phase 14A～14F 總驗收後輸出的穩定版。系統保留個人習慣、今天任務、雙人頁、關係頁、冒險地圖、錢包、挑戰、戰報、統計、設定、備份、CSV / JSON、Firebase 多文件同步與 PWA。

## 版本資訊

- App version：`v15.0.0-stable`
- Service worker cache：`habit-mission-v15-stable-v1`
- 同步架構：多文件 `meta + table chunks`
- 內建卡池：靜態資料，不背景同步到 Firebase

## 頁面總覽

- **今天頁**：每日任務包、今日特殊任務、秘密任務、本期彈性任務；任務完成可連動點數、Boss、地圖與紀錄，恢復上一步會撤銷冒險進度。
- **習慣頁**：新增 / 編輯 / 複製 / 刪除習慣，支援 frequencyRule、固定欄位獎勵規則、補救、加倍、長期獎勵、雙人公開設定。
- **雙人頁**：雙人戰況、雙人挑戰、共同任務、指派任務、雙人點數與雙人獎勵、雙人戰報；雙人願望池已移到關係頁。
- **關係頁**：關係數值總覽、今日靠近一點、默契挑戰、約會靈感卡 / 深聊卡、雙人願望池、關係回顧與關係寶箱。
- **冒險頁**：單人 / 雙人地圖、地點 modal、探索物件、支線、冒險紀錄、撤銷紀錄顯示切換。
- **錢包頁**：個人點數、雙人點數、親密值 / 默契值 / 心動值、道具庫分類、點數與道具紀錄。
- **挑戰頁**：個人挑戰、雙人挑戰、系統挑戰、已完成、已放棄；雙人挑戰與雙人頁共用同一份資料。
- **戰報頁**：查看完整戰報歷史與快照；統計頁只顯示每種最新一筆摘要。
- **設定頁**：帳號登入、同步狀態、Firebase 狀態、外觀、房間、進階同步診斷。
- **備份頁**：JSON 完整備份、CSV 分表備份、匯入前備份、清空資料。

## GitHub Pages 部署

1. 解壓縮本 ZIP。
2. 將所有檔案上傳到 GitHub repository 根目錄。
3. Repository → Settings → Pages。
4. Source 選 `Deploy from a branch`，branch 選 `main`，folder 選 `/root`。
5. 部署完成後開啟 GitHub Pages 網址。
6. 若手機仍顯示舊版，請刪除主畫面 PWA、清除網站資料後重新加入。

## Firebase 設定

本版使用 Firebase Authentication + Cloud Firestore。同步路徑如下：

```text
users/{uid}/habitMissionMeta/main
users/{uid}/habitMissionTables/{tableName}/chunks/{chunkId}
rooms/{roomId}/habitMissionMeta/main
rooms/{roomId}/habitMissionTables/{tableName}/chunks/{chunkId}
```

本版不再主動寫入舊大文件：

```text
users/{uid}/app/habitMission
```

舊資料只作讀取與遷移相容。詳細設定請看 `FIREBASE_SETUP_GUIDE.md`。

## 備份建議

- 改版前先到備份頁匯出 JSON。
- JSON 適合完整還原。
- CSV 適合分表留存、Excel / Notion 查看或單表資料整理。
- 匯入 JSON / CSV 前，系統會建立匯入前備份，可在備份頁還原。

## 驗收文件

- `TESTING_CHECKLIST.md`：最終測試清單。
- `FINAL_REQUIREMENTS_VALIDATION.md`：逐項需求驗收狀態。
- `FINAL_VALIDATION.md`：總驗收、靜態檢查與需實機測試項目。
- `CHANGELOG.md`：版本更新紀錄。
- `FIREBASE_SETUP_GUIDE.md`：Firebase 設定與同步說明。

## 已知需實機測試

- Google 登入與 Firestore rules。
- 兩台裝置同房間同步。
- iPhone Safari / Android Chrome 的 PWA 快取與檔案匯入。
- 跨日、跨週、跨月自動任務更新。
