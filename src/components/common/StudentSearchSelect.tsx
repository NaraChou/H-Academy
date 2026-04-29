import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, ChevronDown, X, Loader2, UserCheck } from 'lucide-react';

/**
 * [A] 視覺資訊備註
 * 元件角色：學生搜尋選單 (StudentSearchSelect)
 * 用途：新增成績 Modal 中，取代手動輸入 UUID 的輸入框
 * 互動：
 *   1. 點擊 → 展開下拉，聚焦搜尋框
 *   2. 輸入姓名或學號 → 即時 debounce 查詢 Supabase profiles
 *   3. 選取學生 → 回傳 { id, full_name, student_no, class_name }
 *   4. 點 X → 清除選取
 *   5. 點選單外 → 收合
 *
 * 視覺語言：Kiki Design System v2 — 1px Border、高對比、圓角 rounded-2xl
 */

export interface StudentOption {
  id: string;
  full_name: string | null;
  student_no: string | null;
  class_name: string | null;
}

interface StudentSearchSelectProps {
  value: StudentOption | null;
  onChange: (student: StudentOption | null) => void;
  disabled?: boolean;
}

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  // 觸發器（選取前/後）
  trigger:
    'relative flex items-center justify-between w-full mb-6 px-4 py-3 bg-transparent border border-[var(--ui-border)] text-sm text-[var(--text-main)] outline-none transition-colors cursor-pointer hover:border-black focus:border-black theme-transition',
  triggerPlaceholder: 'text-[var(--text-sub)]',
  triggerSelected:    'flex items-center gap-2 font-medium text-[var(--text-main)]',
  triggerBadge:       'px-2 py-0.5 bg-[var(--ui-border)] rounded text-[10px] font-bold tracking-wider text-[var(--text-sub)] uppercase',
  clearBtn:           'flex items-center justify-center p-1 rounded transition-colors hover:bg-[var(--ui-border)]',

  // 下拉面板
  dropdown:
    'absolute left-0 right-0 top-full z-[200] mt-1 bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-xl overflow-hidden',

  // 搜尋框
  searchWrap:  'flex items-center gap-2 px-4 py-3 border-b border-[var(--ui-border)]',
  searchInput: 'flex-1 bg-transparent text-sm text-[var(--text-main)] placeholder-[var(--text-sub)] outline-none',

  // 結果清單
  list:       'max-h-56 overflow-y-auto',
  item:       'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--ui-border)]/60',
  itemActive: 'bg-[var(--ui-border)]/80',
  itemName:   'text-sm font-bold text-[var(--text-main)]',
  itemMeta:   'text-[10px] tracking-wider text-[var(--text-sub)] uppercase mt-0.5',
  itemIcon:   'mt-0.5 shrink-0 text-[var(--hsinyu-blue)]',

  // 狀態列
  stateRow:   'flex items-center justify-center gap-2 px-4 py-6 text-sm text-[var(--text-sub)]',
} as const;

export const StudentSearchSelect: React.FC<StudentSearchSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen,    setIsOpen]    = useState(false);
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState<StudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [touched,   setTouched]   = useState(false);

  const wrapRef   = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 點選元件外部 → 收合
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 展開時自動聚焦搜尋框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setTouched(false);
    }
  }, [isOpen]);

  // debounce 查詢
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setTouched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!supabase) return;
      setIsLoading(true);
      setTouched(true);

      const q = query.trim();
      // 同時搜尋 full_name 與 student_no（ilike 不分大小寫）
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, student_no, class_name')
        .eq('role', 'student')
        .eq('status', 'active')
        .or(`full_name.ilike.%${q}%,student_no.ilike.%${q}%`)
        .order('full_name', { ascending: true })
        .limit(20);

      setIsLoading(false);
      if (!error && data) setResults(data as StudentOption[]);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, isOpen]);

  const handleSelect = (student: StudentOption) => {
    onChange(student);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* ── 觸發器 ────────────────────────────────────────────── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={STYLES.trigger}
      >
        {value ? (
          <span className={STYLES.triggerSelected}>
            <UserCheck size={14} className="text-[var(--hsinyu-blue)]" aria-hidden="true" />
            <span>{value.full_name ?? '（未填姓名）'}</span>
            {value.student_no && (
              <span className={STYLES.triggerBadge}>{value.student_no}</span>
            )}
            {value.class_name && (
              <span className={STYLES.triggerBadge}>{value.class_name}</span>
            )}
          </span>
        ) : (
          <span className={STYLES.triggerPlaceholder}>搜尋學生姓名 或 學號…</span>
        )}

        <span className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <span
              role="button"
              tabIndex={0}
              aria-label="清除選取"
              onClick={handleClear}
              onKeyDown={(e) => { if (e.key === 'Enter') handleClear(e as any); }}
              className={STYLES.clearBtn}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-[var(--text-sub)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* ── 下拉面板 ──────────────────────────────────────────── */}
      {isOpen && (
        <div className={STYLES.dropdown} role="listbox" aria-label="學生搜尋結果">

          {/* 搜尋框 */}
          <div className={STYLES.searchWrap}>
            <Search size={14} className="text-[var(--text-sub)] shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="輸入姓名或學號…"
              className={STYLES.searchInput}
              aria-label="搜尋學生"
            />
            {isLoading && <Loader2 size={14} className="animate-spin text-[var(--text-sub)] shrink-0" />}
          </div>

          {/* 結果清單 */}
          <ul className={STYLES.list}>
            {/* 搜尋中 */}
            {isLoading && (
              <li className={STYLES.stateRow}>
                <Loader2 size={14} className="animate-spin" /> 搜尋中…
              </li>
            )}

            {/* 尚未輸入 */}
            {!isLoading && !touched && (
              <li className={STYLES.stateRow}>
                輸入關鍵字以搜尋學生
              </li>
            )}

            {/* 無結果 */}
            {!isLoading && touched && results.length === 0 && (
              <li className={STYLES.stateRow}>
                找不到符合的學生
              </li>
            )}

            {/* 結果列表 */}
            {!isLoading && results.map((student) => {
              const isSelected = value?.id === student.id;
              return (
                <li
                  key={student.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(student)}
                  className={`${STYLES.item} ${isSelected ? STYLES.itemActive : ''}`}
                >
                  {isSelected && (
                    <UserCheck size={14} className={STYLES.itemIcon} aria-hidden="true" />
                  )}
                  <div className="flex flex-col">
                    <span className={STYLES.itemName}>
                      {student.full_name ?? '（未填姓名）'}
                    </span>
                    <span className={STYLES.itemMeta}>
                      {[student.student_no, student.class_name].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
