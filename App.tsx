
import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, LayoutTemplate, Settings2, Package, Sparkles, Link as LinkIcon, AlertCircle, RotateCcw, AlertTriangle, Stamp, Crop, Layers } from 'lucide-react';
import ApiKeySelector from './components/ApiKeySelector';
import SubImageCard from './components/SubImageCard';
import ImageEditorModal from './components/ImageEditorModal';
import ImagePreviewModal from './components/ImagePreviewModal';
import ResizerTool from './components/ResizerTool'; // Import New Tool
import { generateAmazonImage, generateAppealCopy, editAmazonImage } from './services/geminiService';
import { SubImageConfig, AspectRatio, ProductImageInput, ASPECT_RATIO_MAP } from './types';

type Tab = 'creator' | 'resizer';

function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>('creator');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  
  // Settings
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT_1000_1500);
  const [productDescription, setProductDescription] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  
  // Assets
  const [productImages, setProductImages] = useState<ProductImageInput[]>([]);
  const [brandLogo, setBrandLogo] = useState<ProductImageInput | null>(null);
  const [referenceImage, setReferenceImage] = useState<ProductImageInput | null>(null);

  // Sub-Images Config: Initialize with 8 panels
  const [subImages, setSubImages] = useState<SubImageConfig[]>(
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      appealPoint: '',
      feedback: '',
      generatedImageUrl: null,
      history: [],
      historyIndex: -1,
      isLoading: false,
      error: null,
      specificProductImages: [],
      specificStyleReference: null, 
      matchStyleWithImage1: i > 0, // Default to true for 2-8
      useOriginalImage: false, // Default: allow creative regeneration
      suggestedCopy: null,
      isRefiningCopy: false,
    }))
  );

  // Editing State
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  
  // Preview State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // --- Handlers ---
  
  const handleKeySelected = (key?: string) => {
    if (key) {
      setApiKey(key);
    } else {
      // Fallback for AI Studio environment where key is injected
      setApiKey(process.env.API_KEY || '');
    }
    setApiKeyReady(true);
  };

  const handleProductUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      const newImages = await Promise.all(filesArray.map(async (file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file)
      })));
      setProductImages(prev => [...prev, ...newImages]);
    }
  };

  const removeProductImage = (id: string) => {
    setProductImages(prev => prev.filter(img => img.id !== id));
  };

  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBrandLogo({
        id: 'logo',
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReferenceImage({
        id: 'ref',
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }
  };

  const handleSubImageUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      const newImages = await Promise.all(filesArray.map(async (file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file)
      })));
      
      setSubImages(prev => prev.map(img => 
        img.id === id ? { ...img, specificProductImages: [...(img.specificProductImages || []), ...newImages] } : img
      ));
    }
  };

  const removeSubImageProduct = (subImageId: number, imageId: string) => {
    setSubImages(prev => prev.map(img => 
        img.id === subImageId ? { 
            ...img, 
            specificProductImages: (img.specificProductImages || []).filter(p => p.id !== imageId) 
        } : img
    ));
  };

  const handleSubImageStyleUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newImage = {
        id: 'style-' + Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file)
      };
      
      setSubImages(prev => prev.map(img => 
        img.id === id ? { ...img, specificStyleReference: newImage } : img
      ));
    }
  };

  const removeSubImageStyle = (id: number) => {
    setSubImages(prev => prev.map(img => 
      img.id === id ? { ...img, specificStyleReference: null } : img
    ));
  };

  const updateSubImageAppeal = (id: number, text: string) => {
    setSubImages(prev => prev.map(img => 
      img.id === id ? { ...img, appealPoint: text } : img
    ));
  };

  const updateSubImageFeedback = (id: number, text: string) => {
    setSubImages(prev => prev.map(img => 
      img.id === id ? { ...img, feedback: text } : img
    ));
  };

  const toggleMatchStyle = (id: number) => {
    setSubImages(prev => prev.map(img => 
      img.id === id ? { ...img, matchStyleWithImage1: !img.matchStyleWithImage1 } : img
    ));
  };

  const toggleUseOriginalImage = (id: number) => {
    setSubImages(prev => prev.map(img => 
      img.id === id ? { ...img, useOriginalImage: !img.useOriginalImage } : img
    ));
  };

  const handleHistoryChange = (id: number, direction: 'prev' | 'next') => {
    setSubImages(prev => prev.map(img => {
      if (img.id !== id) return img;
      if (img.history.length === 0) return img;

      let newIndex = img.historyIndex + (direction === 'next' ? 1 : -1);
      // Clamp
      newIndex = Math.max(0, Math.min(newIndex, img.history.length - 1));

      return {
        ...img,
        historyIndex: newIndex,
        generatedImageUrl: img.history[newIndex]
      };
    }));
  };

  // --- Reset Feature ---
  const performReset = () => {
    setProductDescription('');
    setCompetitorUrl('');
    setAspectRatio(AspectRatio.PORTRAIT_1000_1500);
    setProductImages([]);
    setBrandLogo(null);
    setReferenceImage(null);
    setEditingImageId(null);
    setPreviewImageUrl(null);
    
    setSubImages(
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        appealPoint: '',
        feedback: '',
        generatedImageUrl: null,
        history: [],
        historyIndex: -1,
        isLoading: false,
        error: null,
        specificProductImages: [],
        specificStyleReference: null, 
        matchStyleWithImage1: i > 0, 
        useOriginalImage: false,
        suggestedCopy: null,
        isRefiningCopy: false,
      }))
    );
    setIsResetConfirmOpen(false);
  };

  // --- AI Copy Features ---
  const handleRefineCopy = async (id: number) => {
    const target = subImages.find(s => s.id === id);
    if (!target || !target.appealPoint.trim() || !apiKeyReady) return;
    
    // Only warn if description is missing, but try anyway
    if (!productDescription) {
      if(!confirm("商品の説明が入力されていませんが、キャッチコピーを生成しますか？精度が下がる可能性があります。")) return;
    }

    setSubImages(prev => prev.map(img => img.id === id ? { ...img, isRefiningCopy: true, suggestedCopy: null } : img));

    try {
      const suggestion = await generateAppealCopy({
        apiKey: apiKey,
        productDescription,
        competitorUrl,
        currentAppeal: target.appealPoint
      });

      setSubImages(prev => prev.map(img => img.id === id ? { ...img, isRefiningCopy: false, suggestedCopy: suggestion } : img));
    } catch (e) {
      alert("コピーの生成に失敗しました。");
      setSubImages(prev => prev.map(img => img.id === id ? { ...img, isRefiningCopy: false } : img));
    }
  };

  const applySuggestedCopy = (id: number) => {
    setSubImages(prev => prev.map(img => 
      img.id === id && img.suggestedCopy 
        ? { ...img, appealPoint: img.suggestedCopy, suggestedCopy: null } 
        : img
    ));
  };

  // --- Image Editing Logic ---
  const handleEditClick = (id: number) => {
    setEditingImageId(id);
  };

  const handleEditSubmit = async (instruction: string, x: number, y: number) => {
    if (editingImageId === null) return;
    
    const targetConfig = subImages.find(img => img.id === editingImageId);
    if (!targetConfig || !targetConfig.generatedImageUrl) return;

    setSubImages(prev => prev.map(img => 
      img.id === editingImageId ? { ...img, isLoading: true, statusMessage: 'AIが部分修正中...' } : img
    ));

    try {
      const newImageUrl = await editAmazonImage({
        apiKey: apiKey,
        base64Image: targetConfig.generatedImageUrl,
        instruction,
        clickX: x,
        clickY: y,
        aspectRatio: ASPECT_RATIO_MAP[aspectRatio]
      });

      setSubImages(prev => prev.map(img => {
        if (img.id !== editingImageId) return img;
        // Append to history
        const newHistory = [...img.history.slice(0, img.historyIndex + 1), newImageUrl];
        
        return { 
          ...img, 
          isLoading: false, 
          generatedImageUrl: newImageUrl,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          statusMessage: undefined 
        };
      }));

    } catch (error: any) {
      console.error(error);
      alert(`修正に失敗しました: ${error.message}`);
      setSubImages(prev => prev.map(img => 
        img.id === editingImageId ? { ...img, isLoading: false, statusMessage: undefined } : img
      ));
    }
  };

  // --- Generation Logic ---

  const handleGenerate = async (id: number) => {
    if (!productDescription) {
      alert("商品の説明を入力してください。");
      return;
    }

    const targetConfig = subImages.find(img => img.id === id);
    if (!targetConfig) return;

    // Check style matching requirement
    let styleReferenceBase64: string | null = null;
    if (id > 0 && targetConfig.matchStyleWithImage1) {
      const image1 = subImages[0];
      if (!image1.generatedImageUrl) {
        alert("「画像1の雰囲気に合わせる」が有効ですが、画像1がまだ生成されていません。先に画像1を生成してください。");
        return;
      }
      styleReferenceBase64 = image1.generatedImageUrl;
    }

    const combinedProductImages = [
      ...productImages.map(p => p.file),
      ...(targetConfig.specificProductImages || []).map(p => p.file)
    ];

    // Check if "Original Image Mode" is requested but no images exist
    if (targetConfig.useOriginalImage && combinedProductImages.length === 0) {
      alert("「商品画像をそのまま合成」モードを使用するには、商品素材画像（全体または個別）をアップロードしてください。");
      return;
    }

    setSubImages(prev => prev.map(img =>
      img.id === id ? { ...img, isLoading: true, statusMessage: 'Generating...', error: null } : img
    ));

    try {
      const imageUrl = await generateAmazonImage({
        apiKey: apiKey,
        productDescription,
        appealPoint: targetConfig.appealPoint,
        productImages: combinedProductImages,
        brandLogo: brandLogo?.file || null,
        referenceImage: referenceImage?.file || null,
        specificReferenceImage: targetConfig.specificStyleReference?.file || null,
        aspectRatio: ASPECT_RATIO_MAP[aspectRatio],
        styleReferenceBase64: styleReferenceBase64,
        competitorUrl,
        feedback: targetConfig.feedback,
        useOriginalImage: targetConfig.useOriginalImage // Pass flag
      });

      setSubImages(prev => prev.map(img => {
        if (img.id !== id) return img;
        // Append to history
        const newHistory = [...img.history.slice(0, img.historyIndex + 1), imageUrl];

        return { 
          ...img, 
          isLoading: false, 
          generatedImageUrl: imageUrl,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          statusMessage: undefined, 
          feedback: '' 
        };
      }));
    } catch (error: any) {
      console.error(error);
      setSubImages(prev => prev.map(img =>
        img.id === id ? { ...img, isLoading: false, error: error.message || "生成エラー" } : img
      ));
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-[#f3f4f6] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Amazon商品サブ画像作成ツール</h1>
              <p className="text-xs text-slate-500">Powered by Gemini 3 Pro</p>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
             <button
               onClick={() => setActiveTab('creator')}
               className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-bold transition-all
                 ${activeTab === 'creator' 
                   ? 'bg-white text-slate-800 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                 }
               `}
             >
               <Layers size={16} />
               <span className="hidden sm:inline">画像作成</span>
             </button>
             <button
               onClick={() => setActiveTab('resizer')}
               className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-bold transition-all
                 ${activeTab === 'resizer' 
                   ? 'bg-white text-slate-800 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                 }
               `}
             >
               <Crop size={16} />
               <span className="hidden sm:inline">リサイズツール</span>
             </button>
          </div>

          <div className="flex items-center space-x-4">
             {activeTab === 'creator' && (
                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="flex items-center space-x-1 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors text-xs font-bold"
                  title="入力内容と生成画像をリセット"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">リセット</span>
                </button>
             )}
          </div>
        </div>
        
        {/* API Key warning if not set */}
        {!apiKeyReady && (
          <div className="bg-blue-50 border-b border-blue-100 py-2 px-4 text-center">
             <span className="text-xs text-blue-700">APIキーを設定するとツールが有効になります</span>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto">
        
        {/* API Key Selector - Shared */}
        <div className="max-w-4xl mx-auto px-4 py-6">
           <ApiKeySelector onKeySelected={handleKeySelected} />
        </div>

        {/* --- Tab Content: Creator --- */}
        {activeTab === 'creator' && (
          <div className="px-4 animate-in fade-in">
            {/* Global Settings Panel */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
                <Settings2 className="text-slate-400" />
                <h2 className="text-lg font-bold text-slate-700">基本設定 (Common Settings)</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      商品の説明・特徴 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder="例：オーガニックコットンのベビー用タオル。肌に優しく、吸水性が高い。ギフトにも最適で、3色展開。サイズは..."
                      className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      競合/参考URL <span className="text-xs font-normal text-slate-400">(任意)</span>
                    </label>
                    <div className="flex">
                      <div className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg px-3 flex items-center justify-center text-slate-400">
                        <LinkIcon size={16} />
                      </div>
                      <input
                        type="text"
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                        placeholder="https://amazon.co.jp/..."
                        className="w-full p-2.5 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      作成する画像サイズ (Aspect Ratio)
                    </label>
                    
                    {/* Standard Catalog Images */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <label className={`
                        relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all
                        ${aspectRatio === AspectRatio.PORTRAIT_1000_1500 ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                      `}>
                        <input 
                          type="radio" 
                          name="aspectRatio" 
                          className="absolute opacity-0"
                          checked={aspectRatio === AspectRatio.PORTRAIT_1000_1500}
                          onChange={() => setAspectRatio(AspectRatio.PORTRAIT_1000_1500)}
                        />
                        <div className="w-8 h-12 border-2 border-current rounded mb-2 opacity-50" />
                        <span className="text-sm font-bold">縦長①</span>
                        <span className="text-xs text-slate-500">1000×1500 (2:3)</span>
                      </label>

                      <label className={`
                        relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all
                        ${aspectRatio === AspectRatio.PORTRAIT_1200_1500 ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                      `}>
                        <input 
                          type="radio" 
                          name="aspectRatio" 
                          className="absolute opacity-0"
                          checked={aspectRatio === AspectRatio.PORTRAIT_1200_1500}
                          onChange={() => setAspectRatio(AspectRatio.PORTRAIT_1200_1500)}
                        />
                        <div className="w-10 h-12 border-2 border-current rounded mb-2 opacity-50" />
                        <span className="text-sm font-bold">縦長②</span>
                        <span className="text-xs text-slate-500">1200×1500 (4:5)</span>
                      </label>

                      <label className={`
                        relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all
                        ${aspectRatio === AspectRatio.SQUARE_1000_1000 ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                      `}>
                        <input 
                          type="radio" 
                          name="aspectRatio" 
                          className="absolute opacity-0"
                          checked={aspectRatio === AspectRatio.SQUARE_1000_1000}
                          onChange={() => setAspectRatio(AspectRatio.SQUARE_1000_1000)}
                        />
                        <div className="w-10 h-10 border-2 border-current rounded mb-2 opacity-50" />
                        <span className="text-sm font-bold">正方形</span>
                        <span className="text-xs text-slate-500">1000×1000 (1:1)</span>
                      </label>
                    </div>

                    {/* A+ Content Section */}
                    <label className="block text-xs font-bold text-slate-500 mb-2 mt-4 border-t border-slate-100 pt-3">
                      商品紹介コンテンツ (A+ Content)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`
                        relative flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all
                        ${aspectRatio === AspectRatio.APLUS_PREMIUM_DESKTOP ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                      `}>
                        <input 
                          type="radio" 
                          name="aspectRatio" 
                          className="absolute opacity-0"
                          checked={aspectRatio === AspectRatio.APLUS_PREMIUM_DESKTOP}
                          onChange={() => setAspectRatio(AspectRatio.APLUS_PREMIUM_DESKTOP)}
                        />
                        <span className="text-xs font-bold text-center">Premium完全画像 (PC)</span>
                        <span className="text-[10px] text-slate-500">1464×600</span>
                      </label>

                      <label className={`
                        relative flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all
                        ${aspectRatio === AspectRatio.APLUS_PREMIUM_MOBILE ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                      `}>
                        <input 
                          type="radio" 
                          name="aspectRatio" 
                          className="absolute opacity-0"
                          checked={aspectRatio === AspectRatio.APLUS_PREMIUM_MOBILE}
                          onChange={() => setAspectRatio(AspectRatio.APLUS_PREMIUM_MOBILE)}
                        />
                        <span className="text-xs font-bold text-center">Premium完全画像 (SP)</span>
                        <span className="text-[10px] text-slate-500">600×450</span>
                      </label>

                      <label className={`
                        relative flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all
                        ${aspectRatio === AspectRatio.APLUS_IMAGE_TEXT ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                      `}>
                        <input 
                          type="radio" 
                          name="aspectRatio" 
                          className="absolute opacity-0"
                          checked={aspectRatio === AspectRatio.APLUS_IMAGE_TEXT}
                          onChange={() => setAspectRatio(AspectRatio.APLUS_IMAGE_TEXT)}
                        />
                        <span className="text-xs font-bold text-center">テキスト付き画像</span>
                        <span className="text-[10px] text-slate-500">650×350</span>
                      </label>

                      <label className={`
                        relative flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all
                        ${aspectRatio === AspectRatio.APLUS_HQ_IMAGE_TEXT ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}
                      `}>
                        <input 
                          type="radio" 
                          name="aspectRatio" 
                          className="absolute opacity-0"
                          checked={aspectRatio === AspectRatio.APLUS_HQ_IMAGE_TEXT}
                          onChange={() => setAspectRatio(AspectRatio.APLUS_HQ_IMAGE_TEXT)}
                        />
                        <span className="text-xs font-bold text-center">テキストを含む高画質</span>
                        <span className="text-[10px] text-slate-500">800×600</span>
                      </label>
                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          商品素材画像 <span className="text-xs font-normal text-slate-400">(任意)</span>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {productImages.map((img) => (
                            <div key={img.id} className="relative w-16 h-16 group rounded overflow-hidden border border-slate-200">
                              <img src={img.previewUrl} alt="Product" className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeProductImage(img.id)}
                                className="absolute top-0 right-0 bg-black/50 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                          <Upload size={20} className="text-slate-400 mb-1" />
                          <span className="text-xs text-slate-500 font-medium">画像を追加</span>
                          <input type="file" multiple accept="image/*" onChange={handleProductUpload} className="hidden" />
                        </label>
                    </div>

                    {/* Reference Images & Brand Logo */}
                    <div className="space-y-3">
                      {/* Style Reference */}
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            全体スタイル参考 <span className="text-xs font-normal text-slate-400">(任意)</span>
                          </label>
                          {referenceImage ? (
                            <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 group">
                              <img src={referenceImage.previewUrl} alt="Style Ref" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                              <button
                                  onClick={() => setReferenceImage(null)}
                                  className="absolute top-1 right-1 bg-white/80 hover:bg-white text-slate-700 rounded-full p-1 shadow-sm"
                                >
                                  <X size={14} />
                                </button>
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                                  Style Master
                                </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                              <LayoutTemplate size={20} className="text-slate-400 mb-1" />
                              <span className="text-xs text-slate-500 font-medium text-center">統一したい雰囲気</span>
                              <input type="file" accept="image/*" onChange={handleReferenceUpload} className="hidden" />
                            </label>
                          )}
                      </div>

                      {/* Brand Logo */}
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                            ブランドロゴ <span className="text-xs font-normal text-slate-400 ml-1">(任意)</span>
                          </label>
                          {brandLogo ? (
                            <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100 flex items-center justify-center">
                              <img src={brandLogo.previewUrl} alt="Brand Logo" className="max-w-full max-h-full object-contain p-2" />
                              <button
                                  onClick={() => setBrandLogo(null)}
                                  className="absolute top-1 right-1 bg-white/80 hover:bg-white text-slate-700 rounded-full p-1 shadow-sm"
                                >
                                  <X size={14} />
                                </button>
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                                  Logo
                                </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                              <Stamp size={20} className="text-slate-400 mb-1" />
                              <span className="text-xs text-slate-500 font-medium text-center">ロゴ画像</span>
                              <input type="file" accept="image/*" onChange={handleBrandLogoUpload} className="hidden" />
                            </label>
                          )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Panels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subImages.map((config, index) => (
                <SubImageCard
                  key={config.id}
                  index={index}
                  config={config}
                  onUpdateAppeal={updateSubImageAppeal}
                  onUpdateFeedback={updateSubImageFeedback}
                  onGenerate={handleGenerate}
                  disabled={!apiKeyReady}
                  onUploadProduct={handleSubImageUpload}
                  onRemoveProduct={removeSubImageProduct}
                  onUploadStyle={handleSubImageStyleUpload}
                  onRemoveStyle={removeSubImageStyle}
                  onToggleMatchStyle={toggleMatchStyle}
                  onToggleUseOriginalImage={toggleUseOriginalImage}
                  onRefineCopy={handleRefineCopy}
                  onApplyCopy={applySuggestedCopy}
                  onEdit={handleEditClick}
                  onHistoryChange={handleHistoryChange}
                  onImageClick={(url) => setPreviewImageUrl(url)}
                />
              ))}
            </div>
          </div>
        )}

        {/* --- Tab Content: Resizer --- */}
        {activeTab === 'resizer' && (
           <ResizerTool apiKey={apiKey} />
        )}
      </main>

      {/* Editor Modal (Only relevant for Creator Tab) */}
      {editingImageId !== null && activeTab === 'creator' && (
        <ImageEditorModal 
          isOpen={editingImageId !== null}
          imageUrl={subImages.find(i => i.id === editingImageId)?.generatedImageUrl || null}
          onClose={() => setEditingImageId(null)}
          onSubmit={handleEditSubmit}
        />
      )}
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImageUrl}
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full transform transition-all scale-100 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">すべてリセットしますか？</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                入力したテキスト、アップロード画像、生成された画像など、すべてのデータが消去されます。<br/>
                <span className="text-red-600 font-bold text-xs mt-2 block">※この操作は取り消せません</span>
              </p>
              <div className="flex space-x-3 w-full">
                <button 
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  キャンセル
                </button>
                <button 
                  onClick={performReset}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-colors text-sm"
                >
                  リセット実行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
