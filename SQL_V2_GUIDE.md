# HsinYu 資料庫安全與功能腳本 (v2.0) 全方位教學手冊

本文件旨在解釋 HsinYu 專案中所有 SQL 腳本的內部邏輯、資安防禦機制以及日常維運操作。本手冊遵循 **Kiki Design System v2.0.0** 的 P0 安全標準，整合了核心安全地基與各項業務功能。

---

## 1. 核心安全模組 (Security Foundation)

### 1.1 公告系統與雙重判定 (Announcements)
*   **邏輯**：重建 `announcements` 表並強制開啟 **RLS (Row Level Security)**。
*   **安全防線**：
    *   **Public Read**：允許所有人（含訪客）讀取公告，確保補習班資訊透明。
    *   **Admin Manage**：使用「雙重判定邏輯」同時檢查 JWT 根目錄與 `app_metadata`。只要 `role` 為 `admin` 即可管理。
*   **優化點**：解決了 Supabase 不同版本間角色路徑不一致的問題。

### 1.2 自動角色同步機制 (Trigger)
*   **邏輯**：建立 `on_profile_role_update` 觸發器。
*   **功能**：當你在 `public.profiles` 修改 `role` 時，系統自動同步至 Supabase Auth 的 `raw_app_meta_data`。
*   **意義**：消除權限不同步風險，確保管理員權限在全站（含 Edge Functions）的一致性。

### 1.3 資料完整性 (Foreign Key Cascade)
*   **邏輯**：定義 `profiles` 與 `auth.users` 的 `ON DELETE CASCADE` 關聯。
*   **功能**：當管理員刪除帳號時，個人檔案會自動清空，防止產生無效的孤兒資料，維持資料庫整潔。

---

## 2. 功能模組解析 (Functional Modules)

### 2.1 學生與教職員簽到系統 (Attendance)
*   **學生打卡** (`attendance_logs`)：支援「櫃檯模式」，允許管理員幫學生代打卡，學生本人僅能查看紀錄。
*   **教職員簽到** (`staff_attendance`)：支援經緯度記錄 (`location_lat/lng`)，可用於特定校區簽到驗證。

### 2.2 成績管理系統 (Grade Records)
*   **權限細分**：學生唯讀本人成績；老師與管理員擁有完整的增刪改查權限。
*   **RLS 保護**：嚴格限制橫向越權，確保學生成績隱私。

### 2.3 操作日誌系統 (Audit Logs)
*   **功能**：自動記錄所有關鍵資料變更（如成績修改/刪除）。
*   **維運價值**：提供 `old_data` 與 `new_data` 對照，作為誤刪還原或責任追蹤的依據。

---

## 3. 維運操作指南 (Operation Guide)

### 3.1 如何新增管理員或老師
1.  請使用者完成註冊。
2.  在 SQL Editor 執行指令：
    ```sql
    -- 設為管理員
    update public.profiles set role = 'admin', status = 'active' where email = 'admin@example.com';
    
    -- 設為老師
    update public.profiles set role = 'teacher', status = 'active' where email = 'teacher@example.com';
    ```
3.  **重要：請使用者「登出再重新登入」以更新權限鑰匙 (JWT)。**

### 3.2 如何停用帳號 (Suspension)
為了安全性，建議不要直接刪除帳號，而是修改狀態：
```sql
update public.profiles set status = 'suspended' where email = 'student@example.com';
```
*註：前端 Dashboard 已設有防線，`status` 非 `active` 的帳號會被強制登出。*

---

## 4. 資安風險評估 (Security Audit)

| 項目 | 狀態 | 說明 |
| :--- | :--- | :--- |
| **API Key 安全** | **安全** | 腳本不含任何私密密鑰，可安全上傳 GitHub。 |
| **越權攻擊** | **已防禦** | 所有表格均開啟 RLS，非 admin 帳號無法寫入敏感資料。 |
| **身分偽造** | **已防禦** | 權限判定基於伺服器簽署的 JWT，前端無法竄改。 |
| **資料遺失** | **注意** | 執行 `final_security_v2` 會重建公告表，請先備份重要公告。 |

---
*文件版本：2024-04-27 v2.1 (深度整合版)*
