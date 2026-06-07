import React, { useState, useEffect } from 'react';
import { 
  ArrowUpDown, 
  Copy, 
  Share2, 
  Delete, 
  Moon, 
  Sun, 
  WalletCards,
  ChevronDown
} from 'lucide-react';

interface Currency {
  code: string;
  flag: string;
  symbol: string;
  name: string;
}

const availableCurrencies: Record<string, Currency> = {
  'USD': { code: 'USD', flag: '🇺🇸', symbol: '$', name: 'Dólar' },
  'VES': { code: 'VES', flag: '🇻🇪', symbol: 'Bs.', name: 'Bolívar' },
  'EUR': { code: 'EUR', flag: '🇪🇺', symbol: '€', name: 'Euro' }
};

const baseRates: Record<string, number> = {
  'USD': 1,
  'VES': 558.64,
  'EUR': 0.92
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [topCurrency, setTopCurrency] = useState('USD');
  const [bottomCurrency, setBottomCurrency] = useState('VES');
  const [activeBox, setActiveBox] = useState<'top' | 'bottom'>('top');
  
  const [topValue, setTopValue] = useState('1.00');
  const [bottomValue, setBottomValue] = useState('558.64');
  
  const [isCustomRate, setIsCustomRate] = useState(false);
  const [customRateStr, setCustomRateStr] = useState('558.64');

  const [topDropdownOpen, setTopDropdownOpen] = useState(false);
  const [bottomDropdownOpen, setBottomDropdownOpen] = useState(false);
  
  const [shouldReplace, setShouldReplace] = useState(true);

  // Reset replace flag when active box or currencies change
  useEffect(() => {
    setShouldReplace(true);
  }, [activeBox, topCurrency, bottomCurrency]);

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Recalculate values when rate changes
  useEffect(() => {
    const rate = getExchangeRate();
    if (activeBox === 'top') {
      const topNum = parseFloat(topValue) || 0;
      setBottomValue((topNum * rate).toFixed(2));
    } else {
      const bottomNum = parseFloat(bottomValue) || 0;
      setTopValue(rate > 0 ? (bottomNum / rate).toFixed(2) : '0.00');
    }
  }, [topCurrency, bottomCurrency, isCustomRate, customRateStr]);

  const getExchangeRate = () => {
    if (isCustomRate) {
      return parseFloat(customRateStr) || 0;
    }
    return baseRates[bottomCurrency] / baseRates[topCurrency];
  };

  const toFloatString = (digits: string) => {
    const padded = digits.padStart(3, '0');
    const integerPart = padded.slice(0, -2);
    const decimalPart = padded.slice(-2);
    return `${integerPart}.${decimalPart}`;
  };

  const handleKeypad = (char: string) => {
    let activeVal = activeBox === 'top' ? topValue : bottomValue;

    if (char === 'C') {
      activeVal = '0.00';
      setShouldReplace(false);
    } else if (char === 'DEL') {
      if (shouldReplace) {
        activeVal = '0.00';
        setShouldReplace(false);
      } else {
        const digits = activeVal.replace(/[^0-9]/g, '');
        const newDigits = digits.slice(0, -1);
        activeVal = toFloatString(newDigits);
      }
    } else if (char === '.' || char === ',') {
      // Ignore decimal/comma since decimals are fixed at 2
      return;
    } else if (char === '+' || char === '-') {
      return;
    } else {
      const digits = shouldReplace ? '' : activeVal.replace(/[^0-9]/g, '');
      // Limit to 12 digits (10 billion)
      if (digits.length < 12) {
        const newDigits = digits + char;
        activeVal = toFloatString(newDigits);
      }
      setShouldReplace(false);
    }

    const rate = getExchangeRate();
    const parsedActive = parseFloat(activeVal) || 0;

    if (activeBox === 'top') {
      setTopValue(activeVal);
      setBottomValue((parsedActive * rate).toFixed(2));
    } else {
      setBottomValue(activeVal);
      setTopValue(rate > 0 ? (parsedActive / rate).toFixed(2) : '0.00');
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input (e.g. custom rate)
      if (e.target instanceof HTMLInputElement) return;

      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        handleKeypad(key);
      } else if (key === ',' || key === '.') {
        handleKeypad('.');
      } else if (key === 'Backspace') {
        handleKeypad('DEL');
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        handleKeypad('C');
      } else if (key === '+') {
        handleKeypad('+');
      } else if (key === '-') {
        handleKeypad('-');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const swapCurrencies = () => {
    setActiveBox(activeBox === 'top' ? 'bottom' : 'top');
    setTopCurrency(bottomCurrency);
    setBottomCurrency(topCurrency);
    setTopValue(bottomValue);
    setBottomValue(topValue);
    
    // adjust custom rate if active to inverted
    if (isCustomRate) {
      const currentRate = parseFloat(customRateStr) || 1;
      setCustomRateStr((1 / currentRate).toFixed(4));
    }
  };

  const formatCurrencyLabel = (val: string, cur: string) => {
    const num = parseFloat(val || '0');
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }



  const handleCopy = () => {
    const val = activeBox === 'top' ? topValue : bottomValue;
    navigator.clipboard.writeText(val);
  };

  const currentRateNum = getExchangeRate();

  return (
    <div className="min-h-screen bg-[#f9f9f9] dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 font-sans flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 lg:px-12 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-[#131313] shadow-sm dark:border dark:border-gray-800">
          <WalletCards size={20} className="text-black dark:text-white" />
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-full bg-white dark:bg-[#131313] shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent dark:border-gray-800"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 p-6 w-full max-w-6xl mx-auto">
        
        {/* Left Container: Calculator Card */}
        <div className="w-full max-w-[460px] bg-white dark:bg-[#0e0e0e] rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-800 relative isolation">
          
          {/* Top Section */}
          <div 
            className={`flex flex-col gap-3 transition-opacity ${activeBox !== 'top' ? 'opacity-50 hover:opacity-100' : 'opacity-100'} cursor-text pt-2`}
            onClick={() => setActiveBox('top')}
          >
            <div className="relative inline-flex items-center gap-2 bg-gray-100 dark:bg-[#1c1b1b] rounded-lg px-3 py-1.5 w-max z-20">
              <span className="text-base leading-none" role="img" aria-label="Flag">{availableCurrencies[topCurrency].flag}</span>
              <button 
                title="Select Currency"
                className="flex items-center bg-transparent outline-none text-sm font-medium text-gray-700 dark:text-gray-300 border-l border-gray-300 dark:border-gray-600 pl-2 cursor-pointer gap-2"
                onClick={(e) => { e.stopPropagation(); setTopDropdownOpen(!topDropdownOpen); setBottomDropdownOpen(false); }}
              >
                <span>{topCurrency === 'VES' ? 'Bs.' : topCurrency}</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>
              
              {topDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setTopDropdownOpen(false); }} />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#1c1b1b] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-40 overflow-hidden outline-none">
                    {Object.values(availableCurrencies).map((cur) => (
                      <button
                        key={cur.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTopCurrency(cur.code);
                          setTopDropdownOpen(false);
                          setTimeout(() => setBottomValue(((parseFloat(topValue) || 0) * (isCustomRate ? (parseFloat(customRateStr) || 0) : baseRates[bottomCurrency] / baseRates[cur.code])).toFixed(2)), 0);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors
                          ${topCurrency === cur.code ? 'bg-gray-50 dark:bg-[#2a2a2a]' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg leading-none">{cur.flag}</span>
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">{cur.code}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 leading-none">{cur.name}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{cur.symbol}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-baseline">
              <span className="text-4xl lg:text-[56px] font-bold tracking-tighter mr-2 lg:mr-3 text-gray-400 dark:text-gray-500">
                {availableCurrencies[topCurrency].symbol}
              </span>
              <span className="text-5xl lg:text-[64px] font-bold tracking-tighter break-all leading-none">
                {formatCurrencyLabel(topValue, topCurrency)}
              </span>
            </div>
          </div>

          <div className="my-8 relative flex items-center justify-center">
            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full absolute"></div>
            <button 
              className="z-10 w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black hover:scale-105 active:scale-95 transition-transform shadow-md"
              onClick={swapCurrencies}
              aria-label="Swap active currency"
            >
              <ArrowUpDown size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Bottom Section */}
          <div 
            className={`flex flex-col gap-3 mb-8 transition-opacity ${activeBox !== 'bottom' ? 'opacity-50 hover:opacity-100' : 'opacity-100'} cursor-text relative`}
            onClick={() => setActiveBox('bottom')}
          >
            <div className="relative inline-flex items-center gap-2 bg-gray-100 dark:bg-[#1c1b1b] rounded-lg px-3 py-1.5 w-max z-20">
              <span className="text-base leading-none" role="img" aria-label="Flag">{availableCurrencies[bottomCurrency].flag}</span>
              <button 
                title="Select Currency"
                className="flex items-center bg-transparent outline-none text-sm font-medium text-gray-700 dark:text-gray-300 border-l border-gray-300 dark:border-gray-600 pl-2 cursor-pointer gap-2"
                onClick={(e) => { e.stopPropagation(); setBottomDropdownOpen(!bottomDropdownOpen); setTopDropdownOpen(false); }}
              >
                <span>{bottomCurrency === 'VES' ? 'Bs.' : bottomCurrency}</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>
              
              {bottomDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setBottomDropdownOpen(false); }} />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#1c1b1b] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-40 overflow-hidden outline-none">
                    {Object.values(availableCurrencies).map((cur) => (
                      <button
                        key={cur.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          setBottomCurrency(cur.code);
                          setBottomDropdownOpen(false);
                          setTimeout(() => setBottomValue(((parseFloat(topValue) || 0) * (isCustomRate ? (parseFloat(customRateStr) || 0) : baseRates[cur.code] / baseRates[topCurrency])).toFixed(2)), 0);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors
                          ${bottomCurrency === cur.code ? 'bg-gray-50 dark:bg-[#2a2a2a]' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg leading-none">{cur.flag}</span>
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">{cur.code}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 leading-none">{cur.name}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-400 dark:text-gray-500">{cur.symbol}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-baseline pr-24">
              <span className="text-4xl lg:text-[48px] font-bold tracking-tighter mr-2 text-gray-400 dark:text-gray-500">
                {availableCurrencies[bottomCurrency].symbol}
              </span>
              <span className="text-5xl lg:text-[64px] font-bold tracking-tighter break-all leading-none">
                {formatCurrencyLabel(bottomValue, bottomCurrency)}
              </span>
            </div>

            {/* Sub-actions only visible near VES usually, based on image */}
            <div className="absolute right-0 bottom-1 flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-[#1c1b1b] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Copy"
              >
                <Copy size={18} />
              </button>
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-[#1c1b1b] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Share"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 w-full mb-8"></div>

          {/* Rate Settings */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${isCustomRate ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                onClick={() => setIsCustomRate(!isCustomRate)}
                aria-label="Toggle custom rate"
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white dark:bg-black transition-transform duration-200 ${isCustomRate ? 'translate-x-5' : 'translate-x-0'}`} 
                />
              </button>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tasa personalizada
              </span>
            </div>

            {isCustomRate && (
              <div className="w-full max-w-[200px]">
                <input 
                  type="number"
                  className="w-full text-center py-2 px-3 bg-white dark:bg-[#131313] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
                  value={customRateStr}
                  onChange={(e) => setCustomRateStr(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="flex flex-col items-center mt-2">
              <span className="font-mono font-medium text-sm text-gray-800 dark:text-gray-200">
                1 {topCurrency} = {currentRateNum < 1 ? currentRateNum.toFixed(4) : currentRateNum.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {bottomCurrency}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-1 dark:text-gray-500">
                Actualizado 3 Jun. a las 12:00 A. M.
              </span>
            </div>
          </div>

        </div>

        {/* Right Container: Numpad */}
        <div className="w-full max-w-[320px] lg:max-w-[360px] grid grid-cols-4 gap-3 lg:gap-4">
          {[
            '1', '2', '3', 'C',
            '4', '5', '6', '+',
            '7', '8', '9', '-',
            ',', '0', '', 'DEL'
          ].map((key, idx) => {
            if (key === '') return <div key={idx} className="bg-transparent" />; // Empty slot
            
            return (
              <button
                key={idx}
                onClick={() => {
                  if (key === ',') handleKeypad('.');
                  else if (key === '+') { /* Optional: setup math operators later */ }
                  else if (key === '-') { /* Optional: setup math operators later */ }
                  else handleKeypad(key);
                }}
                className={`flex items-center justify-center h-16 lg:h-20 text-2xl font-semibold rounded-2xl transition-colors
                  ${['C', '+', '-'].includes(key) ? 'bg-gray-100 hover:bg-gray-200 dark:bg-[#1c1b1b] dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300' : 
                    'bg-[#f4f4f4] hover:bg-[#ebebeb] dark:bg-[#201f1f] dark:hover:bg-[#2a2a2a] text-gray-900 dark:text-white'}
                  active:scale-95 touch-manipulation`}
              >
                {key === 'DEL' ? <Delete size={24} /> : key}
              </button>
            )
          })}
        </div>

      </main>
    </div>
  );
}

