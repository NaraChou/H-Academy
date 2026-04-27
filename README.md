# 欣育文理 HsinYu — 數位學習平台

> 遵循 **Kiki Design System v2.0.0** 架構規範開發。
> 一個整合 React、TypeScript 與 Supabase 的補習班管理系統，專注於極簡美學與高效能。

---

## 🌟 專案概述
欣育文理數位學習平台是一個為現代補習班設計的全方位管理解決方案。透過極簡的介面設計與強大的後端整合，提供學生、老師及管理人員流暢的數位體驗。

---

## 📂 專案架構 (精簡版)

```text
HsinYu/
├── supabase/              # 資料庫定義與 Edge Functions
│   └── migrations/        # 核心資料庫安全腳本 (SQL 備份)
├── src/
│   ├── components/        # 核心 UI 元件
│   ├── css/               # Kiki Style 五層架構樣式
│   ├── data/              # 靜態與動態資料管理 (SSOT)
│   ├── pages/             # 頁面入口
│   └── lib/               # 外部服務整合
├── SQL_V2_GUIDE.md        # 資料庫安全與維運新手教學
├── CURSOR_GUIDE.md        # 專案開發精細架構手冊 (開發者必讀)
└── README.md              # 專案概述 (本文件)
```

---

## 🛠️ 技術棧
*   **Frontend**: React + Vite + TypeScript
*   **Styling**: Tailwind CSS + GSAP (動畫)
*   **Backend**: Supabase (Database + Auth + RLS)

---

## 🚀 快速啟動

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

---

## 📖 相關文件
*   [資料庫安全與維運教學 (SQL_V2_GUIDE.md)](./SQL_V2_GUIDE.md)
*   [開發者精細架構指南 (CURSOR_GUIDE.md)](./CURSOR_GUIDE.md)

---
**欣育文理 HsinYu — 數位學習平台**
*Designed by Kiki Design System*
