import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Crosshair, AlertCircle, Sparkles } from 'lucide-react';

interface ImageEditorModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onSubmit: (instruction: string, x: number, y: number) => void;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onSubmit
}) => {
  const [clickPos, setClickPos] = useState<{ x: number, y: number } | null>(null);
  const [instruction, setInstruction] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setClickPos(null);
      setInstruction('');
    }
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickPos({ x, y });
  };

  const handleSubmit = () => {
    if (clickPos && instruction.trim()) {
      onSubmit(instruction, clickPos.x, clickPos.y);
      onClose(); // Close on submit
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center text-lg">
              <Crosshair className="mr-2 text-orange-500" size={20} />
              部分修正 (Beta)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              1. 画像をタップして場所を指定 → 2. 修正内容を入力してください
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          
          {/* Image Area */}
          <div className="flex-grow bg-slate-900 flex items-center justify-center p-4 relative overflow-auto">
             <div className="relative inline-block shadow-2xl">
               <img 
                 ref={imageRef}
                 src={imageUrl} 
                 alt="Editing Target" 
                 className="max-h-[50vh] md:max-h-[65vh] object-contain cursor-crosshair select-none"
                 onClick={handleImageClick}
                 draggable={false}
               />
               {clickPos && (
                 <div 
                   className="absolute w-8 h-8 border-2 border-white bg-orange-500/60 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg animate-bounce"
                   style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%` }}
                 >
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                   </div>
                 </div>
               )}
             </div>
          </div>

          {/* Sidebar / Controls */}
          <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col p-6 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)] z-10">
            <div className="mb-6">
               <label className="block text-sm font-bold text-slate-700 mb-2">
                 1. 修正箇所
               </label>
               {clickPos ? (
                 <div className="text-sm text-green-700 font-medium flex items-center bg-green-50 p-3 rounded border border-green-100">
                   <Check size={16} className="mr-2" />
                   <div>
                     選択済み <span className="text-xs text-green-600 block opacity-80">(X: {Math.round(clickPos.x)}%, Y: {Math.round(clickPos.y)}%)</span>
                   </div>
                 </div>
               ) : (
                 <div className="text-sm text-orange-700 flex items-center bg-orange-50 p-3 rounded border border-orange-100 animate-pulse">
                   <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                   画像の修正したい場所をクリックしてください
                 </div>
               )}
            </div>

            <div className="mb-6 flex-grow">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                2. 具体的な指示
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={'例：このテキストを「20%OFF」に変えて\n例：この文字を消して\n例：ここに光のエフェクトを追加して\n例：テキストの色を赤にして'}
                className="w-full h-40 p-4 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 focus:bg-white transition-colors"
                disabled={!clickPos}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!clickPos || !instruction.trim()}
              className={`w-full py-3.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 transition-all transform active:scale-95
                ${(!clickPos || !instruction.trim())
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-orange-200'
                }
              `}
            >
              <Sparkles size={18} />
              <span>AIで修正する</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
