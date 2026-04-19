export const NAV_ITEMS = [
  { label: '關於欣育', href: '/about' },
  { 
    label: '課程體系', 
    href: '/education',
    children: [
      { label: '國小部', href: '/education#elementary' },
      { label: '國中部', href: '/education#junior' },
      { label: '高中部', href: '/education#senior' }
    ]
  },
  { 
    label: '分校榮譽', 
    href: '/campus',
    children: [
      { label: '分校據點', href: '/campus#locations' },
      { label: '英雄榜', href: '/campus#honors' },
      { label: '活動集錦', href: '/campus#gallery' }
    ]
  },
  { label: '聯絡我們', href: '/#contact' },
];

export const COURSE_CATEGORIES = ['全部課程', '國小', '國中', '高中', '英文', '數學', '自然'];

export const COURSES_DATA = [
  {
    id: 'course-01',
    title: '基礎數學',
    category: '數學',
    level: '國小',
    desc: '紮實的數學邏輯基礎，引導孩子從生活中發現數學的樂趣。',
    features: ['邏輯推演', '生活應用', '數感培養'],
    colorToken: 'bg-blue-50 text-blue-700 border-blue-200',
    teachers: ['王大明 王牌講師', '李小華 助教'],
    price: 'NT$ 4,500 / 8堂',
    syllabus: [
      '第一週：數的運算與邏輯',
      '第二週：圖形與空間概念',
      '第三週：生活中的應用題',
      '第四週：期中評量統整'
    ]
  },
  {
    id: 'course-03',
    title: '雙語素養',
    category: '英文',
    level: '國小',
    desc: '接軌國際視野的語言培育，跳脫背誦，強化情境口語表達能力。',
    features: ['情境式對話', '跨領域閱讀', '文法應用'],
    colorToken: 'bg-amber-50 text-amber-700 border-amber-200',
    teachers: ['Sarah 外籍教師', '林老師 中師'],
    price: 'NT$ 5,500 / 12堂',
    syllabus: [
      '第一週：生活情境對話練習',
      '第二週：中西方文化差異探索',
      '第三週：短篇故事閱讀與討論',
      '第四週：成果發表與口說演練'
    ]
  },
  {
    id: 'course-02',
    title: '進階理化',
    category: '自然',
    level: '國中',
    desc: '結合數位模擬解析物理化學現象，建構清晰的立體科學知識網。',
    features: ['數位實驗', '觀念統整', '素養考題'],
    colorToken: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    teachers: ['陳博士 理化名師'],
    price: 'NT$ 6,000 / 10堂',
    syllabus: [
      '第一週：力學基礎與牛頓定律',
      '第二週：電學現象與應用',
      '第三週：化學反應與計量',
      '第四週：模擬段考解析'
    ]
  },
  {
    id: 'course-04',
    title: '國中英文專攻',
    category: '英文',
    level: '國中',
    desc: '會考全方位解析，將文法觀念化繁為簡，結合深度閱讀測驗訓練。',
    features: ['會考解析', '單字字根', '閱讀素養'],
    colorToken: 'bg-rose-50 text-rose-700 border-rose-200',
    teachers: ['張名師 英文總召'],
    price: 'NT$ 5,800 / 10堂',
    syllabus: [
      '第一週：核心文法總複習',
      '第二週：歷屆試題深度解析',
      '第三週：長篇閱讀技巧訓練',
      '第四週：考前衝刺與心理建設'
    ]
  }
];

export const SENIOR_HIGH_DATA = [
  {
    id: 'senior-01',
    title: '頂標數學專攻',
    category: '數學',
    level: '高中',
    desc: '針對學測與分科測驗，建立極致高視野的代數與幾何運算能力。',
    features: ['學測趨勢', '難題解析', '邏輯推演'],
    colorToken: 'bg-neutral-50 text-neutral-800 border-neutral-300', // 高中黑白對比冷靜調性
    teachers: ['林高明 數學總召'],
    price: 'NT$ 8,000 / 12堂',
    syllabus: [
      '第一週：三角函數進階',
      '第二週：向量與空間幾何',
      '第三週：微積分先修',
      '第四週：學測模擬考'
    ]
  },
  {
    id: 'senior-02',
    title: '大考英文閱讀與寫作',
    category: '英文',
    level: '高中',
    desc: '拆解長篇閱讀測驗邏輯，建立學術寫作框架，徹底掌握大考英文要點。',
    features: ['結構寫作', '長篇閱讀', '時事單字'],
    colorToken: 'bg-slate-50 text-slate-800 border-slate-300', // 冷靜理性的 Slate 灰黑調性
    teachers: ['Amanda 英文專家'],
    price: 'NT$ 7,500 / 10堂',
    syllabus: [
      '第一週：論說文寫作架構',
      '第二週：長篇時事文章拆解',
      '第三週：翻譯與克漏字實戰',
      '第四週：歷屆大考全真模擬'
    ]
  }
];

export const EDUCATION_STAGES = [
  {
    id: 'elementary',
    title: '國小部',
    watermark: 'ELEMENTARY',
    desc: '啟蒙發展，探索無限未來',
    data: COURSES_DATA.filter(c => c.level === '國小'),
    theme: 'light' // 活潑
  },
  {
    id: 'junior',
    title: '國中部',
    watermark: 'JUNIOR',
    desc: '穩健前行，打穩會考基礎',
    data: COURSES_DATA.filter(c => c.level === '國中'),
    theme: 'light' // 穩重
  },
  {
    id: 'senior',
    title: '高中部',
    watermark: 'SENIOR',
    desc: '頂標衝刺，決勝學測分科',
    data: SENIOR_HIGH_DATA,
    theme: 'monochrome' // 冷靜、黑白灰高對比
  }
];

export const FOOTER_LINKS = [
  { label: '人才招募', href: '/#jobs' },
  { label: '聯絡我們', href: '/#contact' },
];

export const HISTORY_DATA = [
  { year: '2016', title: '欣育文理創立', desc: '秉持「啟發取代填鴨」的理念，於台北設立首家旗艦校區。' },
  { year: '2018', title: '導入 AI 診斷', desc: '首創全智動弱點分析系統，針對學生盲點進行精準打擊。' },
  { year: '2020', title: '鼠年大吉，無懼挑戰', desc: '推出全面數位化線上課程，確保學習不中斷，開啟虛實融合教育。' },
  { year: '2022', title: '雙語素養躍進', desc: '接軌 108 課綱核心素養，拓展情境式英語培力專案。' },
  { year: '2024', title: '版圖擴張', desc: '拓展至新北、桃園，累計培育超過萬名新世代學子。' },
];

export const GALLERY_DATA = [
  { id: 'g1', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop', alt: '明亮通透的學習空間' },
  { id: 'g2', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop', alt: '活潑的師生互動' },
  { id: 'g3', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop', alt: '極簡現代的品牌招牌' },
  { id: 'g4', url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=800&auto=format&fit=crop', alt: '寧靜的自習區' },
];

export const ADVANTAGES_DATA = [
  { num: '01', title: '頂尖師資團隊', desc: '嚴選頂尖學府菁英，具備多年教學經驗，精準掌握升學趨勢與核心素養。' },
  { num: '02', title: 'AI 智能診斷', desc: '導入深度學習分析系統，為每位學生量身打造專屬的弱點突破與培力計畫。' },
  { num: '03', title: '沉浸式學習環境', desc: '以最高規格打造無壓光明空間，讓孩子在充滿美感的環境中自在學習。' },
];

export const SOCIAL_LINKS = [
  { label: 'Facebook', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'YouTube', href: '#' },
];

export const CAMPUS_DATA = {
  locations: [
    {
      id: 'c1',
      name: '台北信義旗艦校',
      address: '台北市信義區忠孝東路五段 100 號',
      tel: '02-2345-6789',
      mapUrl: 'https://maps.google.com/?q=台北市信義區忠孝東路五段100號',
      features: ['高中部', '國中部', 'AI 教室']
    },
    {
      id: 'c2',
      name: '新北板橋精英校',
      address: '新北市板橋區文化路一段 200 號',
      tel: '02-8901-2345',
      mapUrl: 'https://maps.google.com/?q=新北市板橋區文化路一段200號',
      features: ['國小部', '國中部', '科學實驗室']
    }
  ],
  honors: [
    { year: '2024', title: '建中科學班', name: '王O明', desc: '全國競賽金牌得主，高分錄取' },
    { year: '2024', title: '北一女中', name: '林O華', desc: '英文科滿級分，會考 5A++' },
    { year: '2023', title: '師大附中', name: '陳O宇', desc: '數理資優班，科展特優' },
    { year: '2023', title: '成功高中', name: '張O安', desc: '理化滿級分，模擬考榜首' },
    { year: '2023', title: '中山女高', name: '李O柔', desc: '語文資優班，雙語演講冠軍' },
    { year: '2022', title: '建國中學', name: '吳O傑', desc: '會考全科滿分' },
  ],
  gallery: [
    { id: 'cg1', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop', alt: '明亮通透的學習空間', title: '自習室' },
    { id: 'cg2', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop', alt: '活潑的師生互動', title: '課堂討論' },
    { id: 'cg3', url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop', alt: '現代化多媒體設備', title: 'AI 數位教室' },
    { id: 'cg4', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop', alt: '寧靜的閱讀角', title: '圖書角' },
    { id: 'cg5', url: 'https://images.unsplash.com/photo-1588075592446-265fd1e6e76f?q=80&w=800&auto=format&fit=crop', alt: '鼓勵發表的講台', title: '發表訓練' },
    { id: 'cg6', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop', alt: '極簡現代的品牌招牌', title: '校園意象' },
  ]
};
