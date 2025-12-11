
import React, { useState } from 'react';
import { Upload, X, ArrowRight, Download, RefreshCw, AlertCircle, Scan, Crop, Maximize, Sparkles } from 'lucide-react';
import { AspectRatio, ASPECT_RATIO_MAP } from '../types';
import { resizeAmazonImage } from '../services/geminiService';

interface ResizerToolProps {
  apiKey: string;
}

const ResizerTool: React.FC<ResizerToolProps> = ({ apiKey }) => {
  const [originalImage, setOriginalImage] = useState<{ file: File; preview: string } | null>(null);
  const [targetRatio, setTargetRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT_1000_1500);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOriginalImage({
        file,
        preview: URL.createObjectURL(file)
      });
      setResultImage(null);
      setError(null);
    }
  };

  const handleResize = async () => {
    if (!originalImage || !apiKey) return;

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const url = await resizeAmazonImage({
        apiKey,
        originalImage: originalImage.file,
        targetAspectRatio: ASPECT_RATIO_MAP[targetRatio],
        onProgress: setStatusMessage
      });
      setResultImage(url);
    } catch (err: any) {
      setError(err.message || "リサイズに失敗しました");
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50">
          <div className="bg-orange-100 p-2 rounded-lg">
             <Crop className="text-orange-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">リサイズツール (Design Preserved)</h2>
            <p className="text-sm text-slate-500">デザインを崩さずに、AIが背景を拡張・再配置してサイズを変更します</p>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Input */}
          <div className="space-y-8">
            
            {/* 1. Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                リサイズしたい画像
              </label>
              {originalImage ? (
                <div className="relative w-full h-64 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden group">
                  <img src={originalImage.preview} alt="Original" className="max-w-full max-h-full object-contain" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <button
                    onClick={() => { setOriginalImage(null); setResultImage(null); }}
                    className="absolute top-2 right-2 bg-white text-slate-700 p-2 rounded-full shadow-md hover:text-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Original
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-orange-300 transition-all bg-slate-50">
                  <Upload size={48} className="text-slate-300 mb-4" />
                  <span className="text-base font-bold text-slate-600">画像をアップロード</span>
                  <span className="text-sm text-slate-400 mt-1">またはドラッグ＆ドロップ</span>
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* 2. Target Size Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                変更後のサイズ
              </label>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                 <label className={`
                    relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all
                    ${targetRatio === AspectRatio.PORTRAIT_1000_1500 ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="targetRatio" 
                      className="absolute opacity-0"
                      checked={targetRatio === AspectRatio.PORTRAIT_1000_1500}
                      onChange={() => setTargetRatio(AspectRatio.PORTRAIT_1000_1500)}
                    />
                    <span className="text-sm font-bold">縦長①</span>
                    <span className="text-xs text-slate-500">1000×1500</span>
                  </label>

                  <label className={`
                    relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all
                    ${targetRatio === AspectRatio.PORTRAIT_1200_1500 ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="targetRatio" 
                      className="absolute opacity-0"
                      checked={targetRatio === AspectRatio.PORTRAIT_1200_1500}
                      onChange={() => setTargetRatio(AspectRatio.PORTRAIT_1200_1500)}
                    />
                    <span className="text-sm font-bold">縦長②</span>
                    <span className="text-xs text-slate-500">1200×1500</span>
                  </label>

                  <label className={`
                    relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all
                    ${targetRatio === AspectRatio.SQUARE_1000_1000 ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="targetRatio" 
                      className="absolute opacity-0"
                      checked={targetRatio === AspectRatio.SQUARE_1000_1000}
                      onChange={() => setTargetRatio(AspectRatio.SQUARE_1000_1000)}
                    />
                    <span className="text-sm font-bold">正方形</span>
                    <span className="text-xs text-slate-500">1000×1000</span>
                  </label>
              </div>

               <div className="grid grid-cols-3 gap-3">
                  <label className={`
                    relative flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all
                    ${targetRatio === AspectRatio.APLUS_PREMIUM_DESKTOP ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="targetRatio" 
                      className="absolute opacity-0"
                      checked={targetRatio === AspectRatio.APLUS_PREMIUM_DESKTOP}
                      onChange={() => setTargetRatio(AspectRatio.APLUS_PREMIUM_DESKTOP)}
                    />
                    <span className="text-xs font-bold text-center">Premium PC</span>
                    <span className="text-[10px] text-slate-500">1464×600</span>
                  </label>

                  <label className={`
                    relative flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all
                    ${targetRatio === AspectRatio.APLUS_PREMIUM_MOBILE ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="targetRatio" 
                      className="absolute opacity-0"
                      checked={targetRatio === AspectRatio.APLUS_PREMIUM_MOBILE}
                      onChange={() => setTargetRatio(AspectRatio.APLUS_PREMIUM_MOBILE)}
                    />
                    <span className="text-xs font-bold text-center">Premium SP</span>
                    <span className="text-[10px] text-slate-500">600×450</span>
                  </label>

                   <label className={`
                    relative flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all
                    ${targetRatio === AspectRatio.APLUS_IMAGE_TEXT ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                  `}>
                    <input 
                      type="radio" 
                      name="targetRatio" 
                      className="absolute opacity-0"
                      checked={targetRatio === AspectRatio.APLUS_IMAGE_TEXT}
                      onChange={() => setTargetRatio(AspectRatio.APLUS_IMAGE_TEXT)}
                    />
                    <span className="text-xs font-bold text-center">テキスト画像</span>
                    <span className="text-[10px] text-slate-500">650×350</span>
                  </label>
               </div>
            </div>

            {/* 3. Mode Info */}
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">
                リサイズ方法 (Mode)
               </label>
               <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start space-x-3">
                 <Sparkles className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                 <div>
                   <h4 className="font-bold text-purple-900 text-sm flex items-center justify-between">
                     AIスマートリサイズ (Smart Layout)
                     <span className="bg-purple-200 text-purple-800 text-[10px] px-2 py-0.5 rounded-full ml-2">推奨</span>
                   </h4>
                   <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                     単なる切り抜きではなく、Gemini 3 Proがデザインを理解し、背景を自然に拡張したり、要素の配置を微調整して新しいサイズに最適化します。<br/>
                     <span className="font-bold">Powered by Gemini 3 Pro (Nano Banana Pro)</span>
                   </p>
                 </div>
               </div>
               
               <div className="flex gap-2 mt-2 opacity-50 grayscale pointer-events-none select-none">
                  <div className="flex-1 border border-slate-200 p-3 rounded-lg flex items-center justify-center text-xs text-slate-400">
                    <Crop size={14} className="mr-2" /> 単純切り抜き (Crop)
                  </div>
                  <div className="flex-1 border border-slate-200 p-3 rounded-lg flex items-center justify-center text-xs text-slate-400">
                    <Maximize size={14} className="mr-2" /> 単純余白追加 (Fit)
                  </div>
               </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleResize}
              disabled={!originalImage || isLoading || !apiKey}
              className={`w-full py-4 rounded-lg font-bold text-base shadow-md transition-all flex items-center justify-center space-x-2
                ${(!originalImage || isLoading || !apiKey)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:shadow-lg'
                }
              `}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" />
                  <span>{statusMessage || "処理中..."}</span>
                </>
              ) : (
                <>
                  <Scan size={20} />
                  <span>AIでリサイズを実行</span>
                </>
              )}
            </button>
            {!apiKey && (
              <p className="text-center text-xs text-red-500 mt-2">APIキーが設定されていません</p>
            )}

          </div>

          {/* Right Column: Result */}
          <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 relative min-h-[400px]">
             {resultImage ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                  <img 
                    src={resultImage} 
                    alt="Resized Result" 
                    className="max-w-full max-h-[500px] object-contain shadow-lg rounded-lg border border-slate-200"
                  />
                  <div className="mt-6 flex space-x-4">
                     <a 
                       href={resultImage}
                       download="resized-image.png"
                       className="flex items-center space-x-2 bg-white text-slate-700 border border-slate-300 px-6 py-2.5 rounded-full font-bold hover:bg-slate-50 transition-colors shadow-sm"
                     >
                       <Download size={18} />
                       <span>保存する</span>
                     </a>
                  </div>
                </div>
             ) : error ? (
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-100 max-w-sm">
                   <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                   <h3 className="text-red-800 font-bold mb-1">エラーが発生しました</h3>
                   <p className="text-red-600 text-sm">{error}</p>
                </div>
             ) : (
                <div className="text-center text-slate-400">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                     <ArrowRight size={24} className="text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-500 text-lg mb-1">プレビューエリア</h3>
                  <p className="text-sm">左側の設定を選択して<br/>リサイズを実行してください</p>
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResizerTool;
