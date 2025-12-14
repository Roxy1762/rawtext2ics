import React, { useState } from 'react';
import { Sparkles, AlertCircle, Clock, Repeat } from 'lucide-react';
import Header from './components/Header';
import Button from './components/Button';
import ResultCard from './components/ResultCard';
import { generateIcsFromText } from './services/geminiService';
import { IcsGenerationResult, ProcessStatus } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isWeekly, setIsWeekly] = useState(false);
  const [weeklyCount, setWeeklyCount] = useState<number>(5);
  
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [result, setResult] = useState<IcsGenerationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    setStatus(ProcessStatus.PROCESSING);
    setErrorMsg(null);

    try {
      const data = await generateIcsFromText(inputText, {
        startDate: startDate || undefined,
        isWeekly: isWeekly,
        weeklyCount: isWeekly ? weeklyCount : undefined
      });
      setResult(data);
      setStatus(ProcessStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setStatus(ProcessStatus.ERROR);
      setErrorMsg(err.message || "Something went wrong processing the file.");
    }
  };

  const handleReset = () => {
    setStatus(ProcessStatus.IDLE);
    setResult(null);
    setInputText('');
    setStartDate('');
    setIsWeekly(false);
    setWeeklyCount(5);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#383528]">
      <Header />

      <main className="flex-grow container max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-10">
          
          {/* Hero Section */}
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-[#383528]">
              Clean & Format Calendar Files
            </h2>
            <p className="text-[#666053] text-lg leading-relaxed font-light">
              Paste your raw ICS data. We'll structure it for Apple Calendar, fix line endings, and let you tweak the schedule.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Input Section */}
            {status !== ProcessStatus.SUCCESS && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Main Text Input */}
                <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#E6E1D6] overflow-hidden transition-shadow focus-within:shadow-[0_4px_12px_rgba(217,119,87,0.1)] focus-within:border-[#D97757]/30">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your ICS content here..."
                    className="w-full h-48 p-6 resize-none focus:outline-none bg-transparent text-[#383528] placeholder-[#9F9A8C] font-mono text-sm leading-relaxed"
                  />
                  
                  {/* Options Bar */}
                  <div className="bg-[#FAF9F6] border-t border-[#E6E1D6] p-4 flex flex-col sm:flex-row gap-5 sm:items-center">
                    
                    {/* Date Picker */}
                    <div className="flex items-center gap-2 flex-1">
                      <Clock size={16} className="text-[#8F8A7D]" />
                      <div className="flex flex-col w-full">
                         <label className="text-[10px] uppercase tracking-wider font-semibold text-[#8F8A7D] mb-0.5">Start Date (Optional)</label>
                         <input 
                           type="datetime-local" 
                           value={startDate}
                           onChange={(e) => setStartDate(e.target.value)}
                           className="bg-transparent text-sm text-[#383528] focus:outline-none w-full font-medium placeholder-[#9F9A8C]"
                         />
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-8 bg-[#E6E1D6]"></div>

                    {/* Recurrence Control */}
                    <div className="flex flex-col w-full sm:w-auto min-w-[140px]">
                       <label className="text-[10px] uppercase tracking-wider font-semibold text-[#8F8A7D] mb-1.5">Recurrence</label>
                       <div className="flex items-center gap-3 h-[22px]">
                           <div 
                              className="flex items-center gap-2 cursor-pointer group select-none" 
                              onClick={() => setIsWeekly(!isWeekly)}
                           >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors duration-200 ${isWeekly ? 'bg-[#D97757] border-[#D97757]' : 'bg-white border-[#C4C0B5] group-hover:border-[#D97757]'}`}>
                                 {isWeekly && <Repeat size={10} className="text-white" />}
                              </div>
                              <span className={`text-sm font-medium transition-colors ${isWeekly ? 'text-[#383528]' : 'text-[#666053]'}`}>Weekly</span>
                           </div>
                           
                           {isWeekly && (
                               <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-300">
                                   <div className="h-3 w-px bg-[#E6E1D6]"></div>
                                   <span className="text-sm text-[#8F8A7D]">Count:</span>
                                   <input 
                                       type="number" 
                                       min="1" 
                                       max="99"
                                       value={weeklyCount}
                                       onChange={(e) => setWeeklyCount(parseInt(e.target.value) || 0)}
                                       className="w-10 border-b border-[#C4C0B5] bg-transparent text-center text-sm font-medium text-[#383528] focus:outline-none focus:border-[#D97757] p-0"
                                   />
                               </div>
                           )}
                       </div>
                    </div>

                  </div>
                </div>

                <div className="flex justify-center pt-2">
                    <Button 
                        onClick={handleGenerate} 
                        disabled={!inputText.trim()} 
                        isLoading={status === ProcessStatus.PROCESSING}
                        icon={<Sparkles size={18} />}
                        className="w-full sm:w-auto px-8 py-3 text-base shadow-[0_2px_8px_rgba(217,119,87,0.25)]"
                    >
                        Process File
                    </Button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {status === ProcessStatus.ERROR && (
                <div className="bg-[#FCF4F4] border border-[#F0D0D0] rounded-xl p-4 flex items-start gap-3 text-[#B04545] animate-in fade-in">
                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-medium font-serif">Processing Failed</h4>
                        <p className="text-sm mt-1 opacity-90">{errorMsg}</p>
                    </div>
                </div>
            )}

            {/* Result Section */}
            {status === ProcessStatus.SUCCESS && result && (
              <ResultCard result={result} onReset={handleReset} />
            )}
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6E1D6] py-8 mt-auto">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm text-[#8F8A7D] font-serif italic">
            Compatible with Safari, Apple Calendar & Outlook
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;