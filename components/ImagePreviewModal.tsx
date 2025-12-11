import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageUrl,
  onClose
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-[210]"
        onClick={onClose}
        aria-label="Close preview"
      >
        <X size={24} />
      </button>
      <div 
        className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center p-4 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="Full Preview" 
          className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;