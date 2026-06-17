'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';

const FLAG_TO_NAME: Record<string, string> = {
  '🇯🇵': '日本',
  '🇺🇸': '美国',
  '🇨🇳': '中国',
  '🇭🇰': '香港',
  '🇹🇼': '台湾',
  '🇸🇬': '新加坡',
  '🇰🇷': '韩国',
  '🇬🇧': '英国',
  '🇩🇪': '德国',
  '🇫🇷': '法国',
  '🇨🇦': '加拿大',
  '🇦🇺': '澳大利亚',
  '🇳🇱': '荷兰',
  '🇷🇺': '俄罗斯',
  '🇧🇷': '巴西',
  '🇮🇳': '印度',
  '🇮🇩': '印尼',
  '🇻🇳': '越南',
  '🇹🇭': '泰国',
  '🇵🇭': '菲律宾',
  '🇲🇾': '马来西亚',
  '🇳🇿': '新西兰',
  '🇮🇹': '意大利',
  '🇪🇸': '西班牙',
  '🇸🇪': '瑞典',
  '🇳🇴': '挪威',
  '🇫🇮': '芬兰',
  '🇩🇰': '丹麦',
  '🇵🇱': '波兰',
  '🇺🇦': '乌克兰',
  '🇿🇦': '南非',
  '🇦🇪': '阿联酋',
  '🇮🇱': '以色列',
  '🇹🇷': '土耳其',
  '🇨🇭': '瑞士',
  '🇦🇹': '奥地利',
  '🇧🇪': '比利时',
  '🇮🇪': '爱尔兰',
  '🇵🇹': '葡萄牙',
  '🇬🇷': '希腊',
  '🇨🇿': '捷克',
  '🇭🇺': '匈牙利',
  '🇷🇴': '罗马尼亚',
  '🇦🇷': '阿根廷',
  '🇲🇽': '墨西哥',
  '🇪🇬': '埃及',
  '🇸🇦': '沙特',
};

function formatRegion(raw: string): { flag: string; name: string } {
  const flagMatch = raw.match(
    /^([\u{1F1E6}-\u{1F1FF}]{2})/u
  );
  if (flagMatch) {
    const flag = flagMatch[1];
    const rest = raw.slice(flag.length).trim();
    const knownName = FLAG_TO_NAME[flag];
    const name = rest || knownName || flag;
    return { flag, name };
  }
  return { flag: '', name: raw };
}

interface RegionSelectProps {
  regions: string[];
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
  regionCounts?: Record<string, number>;
}

export const RegionSelect: React.FC<RegionSelectProps> = ({
  regions,
  selectedRegion,
  onRegionChange,
  regionCounts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const currentSelection = selectedRegion || '全部地区';
  const currentDisplay = selectedRegion ? formatRegion(selectedRegion) : null;
  const listItems = [null, ...regions];

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setActiveIndex(-1);
  }, [isOpen]);

  const handleSelect = (region: string | null) => {
    onRegionChange(region);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) { setIsOpen(true); break; }
        setActiveIndex((prev) => Math.min(prev + 1, listItems.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        if (isOpen && activeIndex >= 0) {
          event.preventDefault();
          handleSelect(listItems[activeIndex]);
        }
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 px-4 py-2 bg-muted/60 rounded-full hover:bg-muted transition-colors min-w-[140px] justify-between focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {currentDisplay ? `${currentDisplay.flag} ${currentDisplay.name}` : currentSelection}
          </span>
          {selectedRegion && regionCounts?.[selectedRegion] !== undefined && (
            <span className="text-[10px] text-muted-foreground font-mono">{regionCounts[selectedRegion]}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white dark:bg-[#2c2c2c] border border-hairline rounded-2xl shadow-lg z-50 max-h-60 overflow-y-auto animate-scale-in"
          role="listbox"
          aria-label="选择地区"
        >
          <button
            onClick={() => handleSelect(null)}
            onMouseEnter={() => setActiveIndex(0)}
            className={`w-full px-3 py-2 text-left flex items-center justify-between group transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
              activeIndex === 0 ? 'bg-secondary/50' : 'hover:bg-secondary/50'
            }`}
            role="option"
            aria-selected={selectedRegion === null}
          >
            <span className="text-sm">全部地区</span>
            {selectedRegion === null && (
              <Check className="h-4 w-4 text-primary animate-fade-in" />
            )}
          </button>

          {regions.length > 0 && (
            <div className="border-t border-border my-1" />
          )}

          {regions.map((region, index) => {
            const { flag, name } = formatRegion(region);
            return (
            <button
              key={region}
              onClick={() => handleSelect(region)}
              onMouseEnter={() => setActiveIndex(index + 1)}
              className={`w-full px-3 py-2 text-left flex items-center justify-between group transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                activeIndex === index + 1 ? 'bg-secondary/50' : 'hover:bg-secondary/50'
              }`}
              role="option"
              aria-selected={selectedRegion === region}
            >
              <span className="text-sm">{flag ? `${flag} ${name}` : name}</span>
              <div className="flex items-center gap-1.5">
                {regionCounts?.[region] !== undefined && (
                  <span className="text-[10px] text-muted-foreground font-mono">{regionCounts[region]}</span>
                )}
                {selectedRegion === region && (
                  <Check className="h-4 w-4 text-primary animate-fade-in" />
                )}
              </div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
};