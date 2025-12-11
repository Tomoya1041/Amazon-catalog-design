
import React, { useEffect, useState } from 'react';
import { Key, Save, Trash2, ExternalLink, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface ApiKeySelectorProps {
  onKeySelected: (key?: string) => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [hasAiStudio, setHasAiStudio] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Manual Input State
  const [inputKey, setInputKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 1. Check for AI Studio environment
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        setHasAiStudio(true);
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) {
          onKeySelected(); // Use process.env.API_KEY implicitly
        }
      } else {
        // 2. Check Local Storage for manual key
        const localKey = localStorage.getItem('gemini_api_key');
        if (localKey) {
          setSavedKey(localKey);
          onKeySelected(localKey);
        }
      }
      setLoading(false);
    };

    init();
    
    // Polling for AI Studio key selection
    if (window.aistudio) {
      const interval = setInterval(async () => {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const selected = await window.aistudio.hasSelectedApiKey();
          if (selected !== hasKey) {
            setHasKey(selected);
            if (selected) onKeySelected();
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [hasKey]); // Re-run if hasKey changes via polling

  const handleAiStudioSelect = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      onKeySelected();
    }
  };

  const handleManualSave = () => {
    if (!inputKey.trim()) return;
    localStorage.setItem('gemini_api_key', inputKey.trim());
    setSavedKey(inputKey.trim());
    onKeySelected(inputKey.trim());
    setInputKey('');
  };

  const handleManualDelete = () => {
    if (confirm('保存されたAPIキーを削除しますか？')) {
      localStorage.removeItem('gemini_api_key');
      setSavedKey(null);
      window.location.reload(); // Reload to reset app state safely
    }
  };

  if (loading) return null;

  // --- AI Studio Environment ---
  if (hasAiStudio) {
    if (hasKey) {
      return (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md flex justify-between items-center mb-6 animate-in fade-in">
          <span className="text-sm font-medium flex items-center">
            <Key size={16} className="mr-2" />
            APIキーが有効です (AI Studio)
          </span>
          <button 
            onClick={handleAiStudioSelect}
            className="text-xs underline hover:text-green-800"
          >
            キーを変更
          </button>
        </div>
      );
    }
    return (
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-blue-900 mb-2">APIキーが必要です</h2>
        <p className="text-blue-700 mb-4 text-sm">
          <strong>Nano Banana Pro</strong> を使用するには、有料の Google Cloud プロジェクトの API キーを選択してください。
        </p>
        <button
          onClick={handleAiStudioSelect}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-colors shadow-md"
        >
          APIキーを選択
        </button>
      </div>
    );
  }

  // --- Deployment Environment (Manual Input) ---
  
  // Case: Key is already saved
  if (savedKey) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm flex items-center justify-between animate-in fade-in max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg">
             <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">APIキー設定済み</h3>
            <p className="text-slate-500 text-sm">
              ブラウザに保存されたキーを使用して生成可能です。
            </p>
          </div>
        </div>
        <button 
          onClick={handleManualDelete}
          className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors flex flex-col items-center"
          title="キーを削除してリセット"
        >
          <Trash2 size={20} />
          <span className="text-[10px] mt-1">削除</span>
        </button>
      </div>
    );
  }

  // Case: No key saved (Input UI)
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-xl mb-8 shadow-sm animate-in fade-in max-w-4xl mx-auto">
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="bg-orange-100 p-3 rounded-lg shrink-0 w-fit h-fit">
          <Key className="text-orange-600" size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            APIキーの設定
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            このツールを使用するには、Google Gemini APIキーが必要です。<br/>
            キーはブラウザ内にのみ保存され、外部サーバーに送信されることはありません。
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full p-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none text-slate-700 font-mono text-base transition-all bg-white"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        onClick={handleManualSave}
        disabled={!inputKey}
        className="w-full bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 rounded-lg text-base shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        利用を開始する
      </button>

      <div className="text-center pt-2">
        <span className="text-xs text-slate-500">
          APIキーをお持ちでない方は <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 hover:underline"
          >
            Google AI Studio
          </a> から無料で取得できます。
        </span>
      </div>
    </div>
  );
};

export default ApiKeySelector;
