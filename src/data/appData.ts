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
      { label: '分校位置', href: '/campus#locations' },
      { label: '榮譽榜', href: '/campus#honors' },
      { label: '環境藝廊', href: '/campus#gallery' }
    ]
  },
  { label: '數位諮詢', href: '/#contact' },
];

export const COURSE_CATEGORIES = ['全科輔導', '國小部', '國中部', '高中部', '英文類', '數理類', '語文類', '科學類'];

export const COURSES_DATA = [
  {
    id: 'course-01',
    title: '基礎數理班',
    category: '數理類',
    level: '國小部',
    desc: '深入淺出的數學邏輯引導，帶領孩子從生活中發現數理的奧秘。',
    features: ['觀念釐清', '實作應用', '小班輔導'],
    colorToken: 'bg-blue-50 text-blue-700 border-blue-200',
    teachers: ['台大物理碩士團隊', '資深國小教師'],
    price: 'NT$ 4,500 / 8堂',
    syllabus: ['第一週：數與運算的奧秘', '第二週：幾何圖形的應用', '第三週：邏輯思考與應用題', '第四週：學習成效評量']
  },
  {
    id: 'course-03',
    title: '英文閱讀班',
    category: '英文類',
    level: '國小部',
    desc: '針對初學者設計的閱讀引導，透過故事與會話，建立孩子自信的語言能力。',
    features: ['互動式教學', '情境式閱讀', '口說應用'],
    colorToken: 'bg-amber-50 text-amber-700 border-amber-200',
    teachers: ['外籍教師', '留美語文專家'],
    price: 'NT$ 5,200 / 10堂',
    syllabus: ['第一週：基礎發音與單字', '第二週：簡單句型架構', '第三週：繪本故事導讀', '第四週：期末成果發表']
  },
  {
    id: 'junior-01',
    title: '國中全科卓越班',
    category: '全科輔導',
    level: '國中部',
    desc: '針對國中課程進行全方位的重點整理與複習，幫助學生穩紮穩打，應對各項考試。',
    features: ['全科涵蓋', '重點筆記', '考前衝刺'],
    colorToken: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    teachers: ['欣育名師團隊'],
    price: 'NT$ 12,000 / 學期',
    syllabus: ['國文：古文精析', '數學：代數與幾何', '英文：文法與閱讀', '理化：實驗與觀念']
  },
  {
    id: 'junior-02',
    title: '國中理化專修班',
    category: '科學類',
    level: '國中部',
    desc: '專為國二、國三學生設計，將抽象的理化觀念具體化，透過實驗引導加深理解。',
    features: ['實驗引導', '觀念突破', '精準解題'],
    colorToken: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    teachers: ['資深理化名師'],
    price: 'NT$ 6,000 / 12堂',
    syllabus: ['第一週：基本測量與物質', '第二週：波動與聲音', '第三週：光學現象', '第四週：熱學與溫度']
  }
];

export const SENIOR_HIGH_DATA = [
  {
    id: 'senior-01',
    title: '高中數學頂標衝刺',
    category: '數理類',
    level: '高中部',
    desc: '針對大考趨勢進行深度解析，建立完整數學架構，從容應對各大考點。',
    features: ['考點精析', '深度解題', '觀念複習'],
    colorToken: 'bg-neutral-50 text-neutral-800 border-neutral-300',
    teachers: ['建中物理碩士名師'],
    price: 'NT$ 8,000 / 12堂',
    syllabus: ['第一週：三角函數與向量', '第二週：空間向量與多項式', '第三週：機率與統計複習', '第四週：大考模擬練習']
  },
  {
    id: 'senior-02',
    title: '英文作文深度解析',
    category: '英文類',
    level: '高中部',
    desc: '解析學測與指考命題趨勢，建立寫作邏輯架構，提升詞彙量與語句變化。',
    features: ['精準批改', '趨勢解析', '高頻詞彙'],
    colorToken: 'bg-slate-50 text-slate-800 border-slate-300',
    teachers: ['Amanda 英文專家'],
    price: 'NT$ 7,500 / 10堂',
    syllabus: ['第一週：引導寫作架構', '第二週：學測高頻詞彙解析', '第三週：範文賞析與實作', '第四週：全真模擬測驗']
  }
];

export const EDUCATION_STAGES = [
  {
    id: 'elementary',
    title: '國小部',
    watermark: 'ELEMENTARY',
    desc: '啟蒙教育，點亮無限未來',
    data: COURSES_DATA.filter(c => c.level === '國小部'),
    theme: 'light'
  },
  {
    id: 'junior',
    title: '國中部',
    watermark: 'JUNIOR',
    desc: '穩紮穩打，打造升學優勢',
    data: COURSES_DATA.filter(c => c.level === '國中部'),
    theme: 'light'
  },
  {
    id: 'senior',
    title: '高中部',
    watermark: 'SENIOR',
    desc: '衝刺夢想，成就卓越人生',
    data: SENIOR_HIGH_DATA,
    theme: 'monochrome'
  }
];

export const FOOTER_LINKS = [
  { label: '人才招募', href: '/#jobs' },
  { label: '隱私權條款', href: '/#privacy' },
];

export const HISTORY_DATA = [
  { year: '2016', title: '欣育文理創立', desc: '以「溫暖陪伴、卓越成長」為宗旨，於台中市成立第一家校區。' },
  { year: '2018', title: '導入 AI 系統', desc: '率先採用智慧化學習管理系統，提供學子精準的學習分析與進度追蹤。' },
  { year: '2020', title: '線上轉型', desc: '在疫情期間迅速啟動線上教學課程，保障學子學習不中斷。' },
  { year: '2022', title: '深耕素養教育', desc: '對接 108 課綱，開發多元素養課程，幫助學生發展全方位能力。' },
  { year: '2024', title: '全台佈點', desc: '在台中、台北、桃園等地陸續擴展，成為家長信賴的教育品牌。' },
];

export const GALLERY_DATA = [
  { id: 'g1', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop', alt: '欣育舒適的學習空間' },
  { id: 'g2', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop', alt: '熱情專業的教師團隊' },
  { id: 'g3', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop', alt: '現代化的教學設備' },
  { id: 'g4', url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=800&auto=format&fit=crop', alt: '豐富的圖書資源' },
];

export const ADVANTAGES_DATA = [
  { num: '01', title: '精準適性教學', desc: '根據學子程度調整進度，循序漸進引導學習，建立學子自信與學習熱忱。' },
  { num: '02', title: 'AI 學習輔助', desc: '導入深度學習分析系統，為每位學子提供個人化的弱點分析與強化路徑。' },
  { num: '03', title: '沉浸式學習環境', desc: '以極簡高質感的空間設計，讓孩子在無壓力的環境中專注於學習。' },
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
      name: '台中西屯總校',
      address: '台中市西屯區台灣大道三段 100 號',
      tel: '04-2345-6789',
      mapUrl: 'https://maps.google.com/?q=台中市西屯區台灣大道三段100號',
      features: ['高中部', '國中部', 'AI 教室']
    },
    {
      id: 'c2',
      name: '台北南港分校',
      address: '台北市南港區忠孝東路七段 200 號',
      tel: '02-8901-2345',
      mapUrl: 'https://maps.google.com/?q=台北市南港區忠孝東路七段200號',
      features: ['國小部', '國中部', '科學實驗室']
    }
  ],
  honors: [
    { year: '2024', title: '錄取台大醫學系', name: '李○華', desc: '在校期間表現優異，學測全滿級分。' },
    { year: '2024', title: '考取北一女中', name: '王○璇', desc: '會考成績 5A++，順利錄取志願。' },
    { year: '2023', title: '錄取清大電機', name: '張○明', desc: '數理能力優異，獲奧林匹亞金牌。' },
    { year: '2023', title: '錄取建國中學', name: '陳○宏', desc: '全校第一名畢業，表現極為優異。' },
    { year: '2023', title: '錄取台師大附中', name: '林○潔', desc: '語文競賽優選，表現全方位發展。' },
    { year: '2022', title: '錄取交通大學', name: '劉○君', desc: '數理競賽獲獎，表現優異。' },
  ],
  gallery: [
    { id: 'cg1', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop', alt: '舒適的學習環境', title: '自習空間' },
    { id: 'cg2', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop', alt: '熱情的教師團隊', title: '課後討論' },
    { id: 'cg3', url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop', alt: '現代化的硬體設施', title: 'AI 教室' },
    { id: 'cg4', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop', alt: '豐富的圖書資源', title: '閱覽室' },
    { id: 'cg5', url: 'https://images.unsplash.com/photo-1588075592446-265fd1e6e76f?q=80&w=800&auto=format&fit=crop', alt: '明亮的走廊空間', title: '校區環境' },
    { id: 'cg6', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop', alt: '整潔的辦公空間', title: '行政櫃台' },
  ]
};
