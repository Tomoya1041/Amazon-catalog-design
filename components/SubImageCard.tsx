
import React from 'react';
import { RefreshCw, Download, Image as ImageIcon, AlertCircle, Upload, X, Link as LinkIcon, Sparkles, ArrowRight, Edit, Palette, MessageSquarePlus, ChevronLeft, ChevronRight, ZoomIn, Layers } from 'lucide-react';
import { SubImageConfig } from '../types';

interface SubImageCardProps {
  config: SubImageConfig;
  index: number;
  onUpdateAppeal: (id: number, text: string) => void;
  onUpdateFeedback: (id: number, text: string) => void;
  onGenerate: (id: number) => void;
  disabled: boolean;
  onUploadProduct: (id: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveProduct: (id: number, imageId: string) => void;
  onUploadStyle: (id: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveStyle: (id: number) => void;
  onToggleMatchStyle: (id: number) => void;
  onToggleUseOriginalImage: (id: number) => void; // New Handler
  onRefineCopy: (id: number) => void;
  onApplyCopy: (id: number) => void;
  onEdit: (id: number) => void;
  onHistoryChange?: (id: number, direction: 'prev' | 'next') => void;
  onImageClick?: (url: string) => void;
}

const SubImageCard: React.FC<SubImageCardProps> = ({
  config,
  index,
  onUpdateAppeal,
  onUpdateFeedback,
  onGenerate,
  disabled,
  onUploadProduct,
  onRemoveProduct,
  onUploadStyle,
  onRemoveStyle,
  onToggleMatchStyle,
  onToggleUseOriginalImage,
  onRefineCopy,
  onApplyCopy,
  onEdit,
  onHistoryChange,
  onImageClick
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative group/card hover:shadow-md transition-shadow">
      
      {/* Loading Overlay */}
      {config.isLoading && (
        <div className="absolute inset-0 z-50 bg-white/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mb-4" />
          <p className="text-slate-800 font-semibold animate-pulse">{config.statusMessage || '処理中...'}</p>
          <p className="text-xs text-slate-500 mt-2">Gemini 3 Proが作業中です</p>
        </div>
      )}

      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 flex items-center">
          画像 {index + 1}
          {index > 0 && config.matchStyleWithImage1 && (
            <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              画像1連動中
            </span>
          )}
        </h3>
        {config.generatedImageUrl && (
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onEdit(config.id)}
              className="text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center space-x-1 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium"
              title="クリックした箇所をAIで修正"
            >
              <Edit size={14} />
              <span>部分修正</span>
            </button>
             <a 
               href={config.generatedImageUrl} 
               download={`amazon-sub-image-${index + 1}.png`}
               className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center space-x-1 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium"
               title="ダウンロード"
             >
               <Download size={14} />
               <span>保存</span>
             </a>
          </div>
        )}
      </div>

      <div className="p-4 flex-grow flex flex-col space-y-5">
        
        {/* Appeal Point Input */}
        <div className={config.generatedImageUrl ? "opacity-100" : ""}>
          <div className="flex justify-between items-end mb-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              訴求内容 / ポイント
            </label>
            {!config.generatedImageUrl && (
              <button
                onClick={() => onRefineCopy(config.id)}
                disabled={disabled || !config.appealPoint.trim() || config.isRefiningCopy}
                className={`text-xs flex items-center space-x-1 px-2 py-1 rounded transition-colors
                  ${!config.appealPoint.trim() ? 'text-slate-300 cursor-not-allowed' : 'text-purple-600 hover:bg-purple-50'}
                `}
                title="AIでキャッチコピーを磨く"
              >
                <Sparkles size={12} className={config.isRefiningCopy ? "animate-spin" : ""} />
                <span>{config.isRefiningCopy ? "作成中..." : "AIコピー提案"}</span>
              </button>
            )}
          </div>
          
          <textarea
            value={config.appealPoint}
            onChange={(e) => onUpdateAppeal(config.id, e.target.value)}
            placeholder="例：防水の質感をクローズアップで見せる、利用シーンなど..."
            className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none h-16 !bg-white !text-slate-900 placeholder:text-slate-300"
          />

          {/* AI Suggestion Area */}
          {config.suggestedCopy && (
            <div className="mt-2 bg-purple-50 border border-purple-100 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start space-x-2">
                <Sparkles size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800 font-medium">
                  {config.suggestedCopy}
                </div>
              </div>
              <button
                onClick={() => onApplyCopy(config.id)}
                className="flex-shrink-0 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md flex items-center transition-colors"
              >
                適用 <ArrowRight size={10} className="ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* Style Settings Area - Always Visible for Regeneration */}
        <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in">
             {/* Style Matching Checkbox (Index > 0) */}
            {index > 0 && (
              <div className="flex items-center space-x-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                <input
                  type="checkbox"
                  id={`match-style-${config.id}`}
                  checked={config.matchStyleWithImage1}
                  onChange={() => onToggleMatchStyle(config.id)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor={`match-style-${config.id}`} className="text-sm text-slate-700 cursor-pointer select-none flex items-center font-medium">
                  <Palette size={14} className="mr-1.5 text-blue-500" />
                  画像1の色味に合わせる
                </label>
              </div>
            )}

            {/* Specific Style Reference */}
            {(!config.matchStyleWithImage1 || index === 0) && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide flex items-center">
                  <Palette size={12} className="mr-1" />
                  この画像のスタイル参考 <span className="text-[10px] ml-1 normal-case text-slate-400">(任意)</span>
                </label>
                {config.specificStyleReference ? (
                   <div className="relative group w-full h-24 rounded-md overflow-hidden border border-slate-200">
                    <img src={config.specificStyleReference.previewUrl} alt="Style Ref" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors pointer-events-none" />
                    <button
                      onClick={() => onRemoveStyle(config.id)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] rounded font-medium">
                      参考画像
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors bg-white group">
                    <Palette size={16} className="text-slate-400 group-hover:text-slate-600 mb-1" />
                    <span className="text-[10px] text-slate-500">個別スタイル画像をアップロード</span>
                    <input type="file" accept="image/*" onChange={(e) => onUploadStyle(config.id, e)} className="hidden" />
                  </label>
                )}
              </div>
            )}
        </div>
        
        {/* Specific Product Images - Always Visible */}
        <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center">
                追加素材 <span className="text-[10px] ml-1 normal-case text-slate-400">(この画像専用)</span>
              </label>
            </div>

            {/* Use Original Image Toggle */}
            <div className="mb-3 flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id={`use-original-${config.id}`}
                  checked={config.useOriginalImage}
                  onChange={() => onToggleUseOriginalImage(config.id)}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor={`use-original-${config.id}`} className="text-xs text-slate-700 cursor-pointer select-none flex items-center font-bold">
                  <Layers size={14} className="mr-1.5 text-orange-500" />
                  商品画像をそのまま合成 (デザインのみ生成)
                </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {config.specificProductImages && config.specificProductImages.map((img) => (
                <div key={img.id} className="relative group w-14 h-14 rounded-md overflow-hidden border border-slate-200">
                  <img src={img.previewUrl} alt="Product" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemoveProduct(config.id, img.id)}
                    className="absolute top-0 right-0 bg-black/50 text-white rounded-bl-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center w-14 h-14 border border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 transition-colors bg-white group">
                <Upload size={16} className="text-slate-400 group-hover:text-slate-600 mb-0.5" />
                <span className="text-[9px] text-slate-400">追加</span>
                <input type="file" multiple accept="image/*" onChange={(e) => onUploadProduct(config.id, e)} className="hidden" />
              </label>
            </div>
        </div>

        {/* Preview Area */}
        <div className={`flex-grow bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group/preview ${config.generatedImageUrl ? 'min-h-[250px]' : 'min-h-[200px]'}`}>
          {config.generatedImageUrl ? (
            <div 
              className="relative w-full h-full flex flex-col cursor-zoom-in group/image"
              onClick={() => onImageClick && onImageClick(config.generatedImageUrl!)}
            >
              <img 
                src={config.generatedImageUrl} 
                alt={`Generated ${index + 1}`} 
                className="w-full h-full object-contain"
              />
              
              {/* Hover Zoom Hint */}
              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover/image:opacity-100 pointer-events-none">
                <ZoomIn className="text-white drop-shadow-md opacity-80" size={32} />
              </div>

              {/* History Controls Overlay - stopPropagation needed to prevent opening zoom when clicking controls */}
              {config.history.length > 1 && onHistoryChange && (
                 <div 
                   className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center bg-white/90 backdrop-blur-md rounded-full shadow-md border border-slate-200 px-2 py-1 space-x-2"
                   onClick={(e) => e.stopPropagation()}
                 >
                   <button 
                     onClick={() => onHistoryChange(config.id, 'prev')}
                     disabled={config.historyIndex <= 0}
                     className="p-1 rounded-full hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                   >
                     <ChevronLeft size={14} className="text-slate-700" />
                   </button>
                   <span className="text-[10px] font-bold text-slate-600 tabular-nums">
                     {config.historyIndex + 1} / {config.history.length}
                   </span>
                   <button 
                     onClick={() => onHistoryChange(config.id, 'next')}
                     disabled={config.historyIndex >= config.history.length - 1}
                     className="p-1 rounded-full hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                   >
                     <ChevronRight size={14} className="text-slate-700" />
                   </button>
                 </div>
              )}
            </div>
          ) : config.error ? (
            <div className="text-center p-4">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-red-500">{config.error}</p>
            </div>
          ) : (
            <div className="text-center text-slate-400 px-6">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-xs">
                {index > 0 && config.matchStyleWithImage1 
                  ? "画像1の色合いを継承して生成" 
                  : config.specificStyleReference 
                    ? "個別のスタイル画像を元に生成"
                    : "設定完了後、生成ボタンを押してください"}
              </p>
            </div>
          )}
        </div>
      
        {/* Regeneration Feedback Area */}
        {config.generatedImageUrl && (
           <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2">
             <label className="text-xs font-bold text-orange-800 mb-1.5 flex items-center">
               <MessageSquarePlus size={12} className="mr-1.5" />
               再生成への指示・フィードバック
             </label>
             <textarea
               value={config.feedback}
               onChange={(e) => onUpdateFeedback(config.id, e.target.value)}
               placeholder="例：もっと文字を大きく、背景を青く、商品を中央に..."
               className="w-full text-sm p-2 border border-orange-200 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white h-16 resize-none placeholder:text-orange-200"
             />
           </div>
        )}

      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <button
          onClick={() => onGenerate(config.id)}
          disabled={disabled || config.isLoading || !config.appealPoint.trim()}
          className={`w-full py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm transform active:scale-[0.98]
            ${disabled || !config.appealPoint.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : config.generatedImageUrl 
                ? 'bg-white border border-orange-500 text-orange-600 hover:bg-orange-50'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-200 hover:shadow-orange-300'
            }
          `}
        >
          {config.generatedImageUrl ? (
            <>
              <RefreshCw size={16} />
              <span>{config.feedback.trim() ? "指示を反映して再生成" : "再生成する"}</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>画像を生成</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SubImageCard;
