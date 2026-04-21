# 欣育文理 HsinYu — 數位學習平台

> 遵循 **Kiki Design System v2.0.0** 架構規範開發。
> React + TypeScript + Tailwind CSS + GSAP + Supabase

---

## 專案目錄結構

```text
/
├── .vscode/
│   └── settings.json          # 根目錄 VS Code 設定（Deno 僅限 supabase/functions）
├── supabase/
│   └── functions/
│       ├── .vscode/
│       │   └── settings.json  # Deno 擴充套件設定
│       └── invite-student/
│           ├── deno.json      # Deno 編譯選項
│           └── index.ts       # Edge Function：邀請學生（需 service_role）
├── src/
│   ├── App.tsx                # 路由入口（含 /activate 路由）
│   ├── index.css              # 全域 CSS 載入點
│   ├── main.tsx               # React 掛載點
│   ├── vite-env.d.ts          # Vite 型別參考
│   ├── components/
│   │   ├── common/
│   │   │   ├── BackToTop.tsx
│   │   │   ├── CustomCursor.tsx
│   │   │   ├── ScrollToAnchor.tsx
│   │   │   └── ThemeSwitcher.tsx
│   │   ├── layout/
│   │   │   ├── Footer.tsx
│   │   │   └── Navbar.tsx
│   │   ├── sections/
│   │   │   ├── AdvantageList.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   ├── CourseList.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── MarqueeVision.tsx
│   │   │   └── WorkList.tsx
│   │   └── ui/
│   │       └── Loader.tsx
│   ├── css/
│   │   ├── globals.css        # Layer 0：Design Tokens（唯一真相來源）
│   │   ├── motion.css         # Layer 1：跨元件共用語意 class
│   │   └── style.css          # 結構與重置樣式
│   ├── data/
│   │   ├── appData.ts         # 導覽、課程、優勢等靜態資料
│   │   └── projectData.ts     # 作品資料（SSOT）
│   ├── lib/
│   │   └── supabase.ts        # Supabase client（anon key，前端安全）
│   ├── pages/
│   │   ├── About.tsx          # 關於欣育
│   │   ├── Activate.tsx       # 帳號啟用（邀請信連結導向）★ 新增
│   │   ├── Campus.tsx         # 分校榮譽
│   │   ├── Courses.tsx        # 課程資訊
│   │   ├── Dashboard.tsx      # 學術入口（學生 + admin）★ 改版
│   │   ├── Education.tsx      # 全齡課程
│   │   ├── Login.tsx          # 登入
│   │   └── News.tsx           # 公告中心
│   └── styles/
│       └── layout.ts          # Layer 2：佈局 Token（LAYOUT.container）
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```

---

## 架構說明

遵循 **Kiki Design System 5 Layers Architecture** 與三分離原則：

| 層次 | 職責 | 檔案 |
|---|---|---|
| Layer 0 | Design Tokens（色彩/字體/間距） | `css/globals.css` |
| Layer 1 | 語意 class（跨元件共用） | `css/motion.css` |
| Layer 2 | 佈局 Token | `styles/layout.ts` |
| Layer 3 | 元件視覺常數 `STYLES` | 各元件內部 |
| Layer 4 | GSAP 動畫鉤子 `GSAP_SELECTORS` | 各元件內部（與 STYLES 嚴格分離） |

---

## 資料庫 Schema（Supabase）

| 表格 | 說明 |
|---|---|
| `profiles` | 使用者主檔（對應 auth.users，含 role / status） |
| `attendance_logs` | 打卡紀錄（student_id / check_type: in\|out） |
| `grade_records` | 成績紀錄（student_id / term / created_by） |
| `announcements` | 公告（priority / content） |

### 帳號狀態機

```
invited ──(點邀請信 + 首次登入)──▶ active
active  ──(admin 停權)──────────▶ suspended
suspended ──(admin 解除)─────────▶ active
active  ──(畢業/停用)───────────▶ archived
```

---

## 路由一覽

| 路徑 | 元件 | 說明 |
|---|---|---|
| `/` | `Home` | 首頁 |
| `/about` | `AboutPage` | 關於欣育 |
| `/education` | `EducationPage` | 全齡課程 |
| `/campus` | `CampusPage` | 分校榮譽 |
| `/news` | `News` | 公告中心 |
| `/login` | `Login` | 登入 |
| `/activate` | `Activate` | 帳號啟用（邀請信連結） ★ |
| `/dashboard` | `Dashboard` | 學術入口（需登入 + status=active） |

---

## Edge Function 部署指令

```bash
# 1. 登入 Supabase CLI
supabase login

# 2. 連結專案（PROJECT_REF 在 Dashboard → Settings → General → Reference ID）
supabase link --project-ref <YOUR_PROJECT_REF>

# 3. 部署邀請學生 Function
supabase functions deploy invite-student

# 4. 設定 SITE_URL（開發用 localhost，正式環境換成你的域名）
supabase secrets set SITE_URL=http://localhost:3000
```

> `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY` 由 Supabase 平台自動注入，不需手動設定。

---

## 本機開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 型別檢查
npm run lint
```

在 `.env.local` 填入：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
