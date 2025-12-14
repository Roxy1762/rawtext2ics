import React from 'react';
import { Calendar } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#f7f5f2]/80 backdrop-blur-md border-b border-[#E6E1D6]">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-[#D97757]">
            <Calendar size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#383528] font-serif leading-none">ICS Magic</h1>
          </div>
        </div>
        <div className="text-xs font-medium text-[#8F8A7D] tracking-wide uppercase">
            File Formatter
        </div>
      </div>
    </header>
  );
};

export default Header;