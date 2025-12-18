import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, CalendarPlus, FileEdit } from 'lucide-react';
import { IcsGenerationResult } from '../types';
import Button from './Button';

interface ResultCardProps {
  result: IcsGenerationResult;
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');

  // Initialize filename when result loads
  useEffect(() => {
    if (result.filename) {
      setFileName(result.filename.replace(/\.ics$/i, ''));
    }
  }, [result.filename]);

  const getFullFileName = () => {
    const cleanName = fileName.trim() || 'calendar_event';
    return cleanName.toLowerCase().endsWith('.ics') ? cleanName : `${cleanName}.ics`;
  };

  const handleDownload = () => {
    const name = getFullFileName();
    const blob = new Blob([result.icsContent], { type: 'text/calendar;charset=utf-8' });
    
    // Create URL
    const url = URL.createObjectURL(blob);
    
    // Create anchor
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    
    // Force download behavior
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Use a small timeout to ensure DOM is ready and event loops clear
    // This often helps with Safari/iOS specific glitches
    setTimeout(() => {
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }, 0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.icsContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dataUri = `data:text/calendar;charset=utf8,${encodeURIComponent(result.icsContent)}`;

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#E6E1D6] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-[#F2F0EB] bg-[#FAF9F6]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <h2 className="text-lg font-serif font-medium text-[#383528]">Event Ready</h2>
          
          {/* Filename Editor */}
          <div className="flex items-center gap-2 bg-white border border-[#E6E1D6] rounded-lg px-3 py-1.5 focus-within:border-[#D97757] focus-within:ring-1 focus-within:ring-[#D97757]/30 transition-all shadow-sm">
            <FileEdit size={14} className="text-[#8F8A7D]" />
            <input 
                type="text" 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="text-xs font-mono text-[#383528] bg-transparent focus:outline-none w-32 sm:w-48 placeholder-[#C4C0B5]"
                placeholder="filename"
            />
            <span className="text-xs font-mono text-[#8F8A7D] select-none">.ics</span>
          </div>
        </div>
        <p className="text-[#666053] text-sm">
            {result.summary || "Your event has been processed."}
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={handleDownload} className="w-full" icon={<Download size={18} />}>
                Download File
            </Button>
            <a 
                href={dataUri} 
                download={getFullFileName()}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm tracking-wide bg-[#383528] hover:bg-[#2C2920] text-[#F7F5F2] shadow-sm"
            >
                <CalendarPlus size={18} className="mr-2"/>
                Add to Calendar
            </a>
        </div>
        
        <div className="relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <button 
                    onClick={handleCopy}
                    className="p-1.5 bg-white text-[#666053] rounded-lg shadow-sm border border-[#E6E1D6] hover:text-[#D97757] hover:border-[#D97757]"
                    title="Copy content"
                 >
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                 </button>
            </div>
            <pre className="bg-[#2C2920] text-[#EBE8E1] p-5 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed max-h-64 border border-[#383528] custom-scrollbar shadow-inner">
                {result.icsContent}
            </pre>
        </div>

        <div className="pt-2 text-center">
             <button onClick={onReset} className="text-sm text-[#8F8A7D] hover:text-[#D97757] transition-colors font-medium">
                Process another file
             </button>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;