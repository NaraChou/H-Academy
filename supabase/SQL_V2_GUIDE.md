# HsinYu 資料庫安全腳本 (v2.0) 詳細說明文件

本文件旨在解釋 `hsinyu_final_security_v2.sql` 的內部邏輯、資安防禦機制以及日常維運操作。本腳本遵循 **Kiki Design System v2.0.0** 的 P0 安全標準開發。

---

## 1. 核心模組解析

### 1.1 公告系統 (Announcements)
*   **邏輯**：重建 `announcements` 資料表，並強制開啟 **RLS (Row Level Security)**。
*   **安全防線**：
    *   **Public Read**：允許所有人（含訪客）讀取公告，確保補習班資訊透明。
    *   **Admin Manage**：使用「雙重判定邏輯」檢查使用者的 JWT。只要 `role` 標籤為 `admin`，即可執行增刪改查。
*   **優化點**：解決了 Supabase 不同版本間 `role` 存放路徑（JWT root vs app_metadata）不一致的問題。

### 1.2 自動同步機制 (Trigger)
*   **邏輯**：建立一個資料庫觸發器 `on_profile_role_update`。
*   **功能**：當你在 `public.profiles` 修改某人的 `role` 時，系統會自動將此變更寫入 Supabase Auth 的 `raw_app_meta_data`。
*   **資安意義**：消除了「資料庫權限」與「登入憑證」不同步的風險，確保管理員權限在全站（含 Edge Functions）的一致性。

### 1.3 資料完整性 (Foreign Key Cascade)
*   **邏輯**：重新定義 `profiles` 與 `auth.users` 的關聯。
*   **功能**：設定 `ON DELETE CASCADE`（連動刪除）。
*   **意義**：當管理員從後端刪除一個帳號時，該使用者的個人檔案會自動清空，防止產生無效的孤兒資料，維持資料庫整潔。

---

## 2. 維運操作指南

### 2.1 如何新增一位管理員 (老師)
1.  請老師先在網頁完成註冊（或由你發送邀請信）。
2.  在 Supabase SQL Editor 執行以下指令：
    ```sql
    update public.profiles 
    set role = 'admin', status = 'active' 
    where email = 'teacher@example.com';
    ```
3.  **請老師登出並重新登入**，權限即可生效。

### 2.2 如何停用帳號
為了資料安全性，建議不要直接刪除帳號，而是修改狀態：
```sql
update public.profiles set status = 'suspended' where email = 'student@example.com';
```
*註：前端 Dashboard 已設有防線，`status` 非 `active` 的帳號會被強制登出。*

---

## 3. 資安風險評估 (Security Audit)

| 項目 | 狀態 | 說明 |
| :--- | :--- | :--- |
| **API Key 洩漏** | **安全** | 腳本不含任何 Key，可放心上傳 GitHub。 |
| **越權攻擊** | **已防禦** | RLS 嚴格限制非 admin 帳號無法寫入公告表。 |
| **身分偽造** | **已防禦** | 權限判定基於伺服器簽署的 JWT，前端無法竄改。 |
| **資料遺失** | **注意** | 執行此腳本會重建公告表，請確保已備份重要公告。 |

---

## 4. 交付物清單
*   `hsinyu_final_security_v2.sql`：核心執行腳本。
*   `SQL_V2_GUIDE.md`：本說明文件。

---
**欣育文理 HsinYu — 首席視覺轉譯工程師 Manus 製作**
