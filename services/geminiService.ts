
import { GoogleGenAI } from "@google/genai";

// Helper to convert File to base64 with MIME detection
export const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result format: "data:image/jpeg;base64,/9j/4AAQ..."
      const match = result.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        resolve({
          mimeType: match[1],
          base64: match[2]
        });
      } else {
        // Fallback if pattern doesn't match
        const base64 = result.split(',')[1];
        resolve({ 
          mimeType: file.type || 'image/jpeg', 
          base64: base64 || result 
        });
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

interface GenerateParams {
  apiKey: string;
  productDescription: string;
  appealPoint: string;
  productImages: File[];
  brandLogo?: File | null; // New: Optional brand logo
  referenceImage: File | null;
  specificReferenceImage?: File | null; // New: Per-card reference
  aspectRatio: string;
  // New params
  styleReferenceBase64?: string | null; // From Image 1
  competitorUrl?: string;
  feedback?: string; // New: Regeneration instruction
  useOriginalImage?: boolean; // New: Keep original image mode
  onProgress?: (message: string) => void;
}

// --- Text Generation Service for Copywriting ---
export const generateAppealCopy = async ({
  apiKey,
  productDescription,
  currentAppeal,
  competitorUrl
}: {
  apiKey: string;
  productDescription: string;
  currentAppeal: string;
  competitorUrl?: string;
}): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
あなたはAmazonの商品ページ最適化の専門家（コピーライター）です。
以下の商品情報と、ユーザーが考えている「訴求ポイント」を元に、
商品画像内に配置するのに最適な、短く、キャッチーで、購買意欲をそそるキャッチコピーを1つだけ提案してください。

【商品概要】
${productDescription}

【競合/参考URL】
${competitorUrl || 'なし'}

【現在の訴求ポイント案】
${currentAppeal}

【制約事項】
- 画像内に入れるテキストなので、長すぎないこと（15文字以内推奨、最大2行）。
- 具体的でベネフィットが伝わる内容にすること。
- 出力は提案するキャッチコピーのテキストのみを返してください。説明は不要です。
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Copy generation failed:", error);
    throw new Error("コピーの生成に失敗しました。");
  }
};

// --- Image Generation Service ---
export const generateAmazonImage = async ({
  apiKey,
  productDescription,
  appealPoint,
  productImages,
  brandLogo,
  referenceImage,
  specificReferenceImage,
  aspectRatio,
  styleReferenceBase64,
  competitorUrl,
  feedback,
  useOriginalImage,
  onProgress
}: GenerateParams): Promise<string> => {
  
  if (!apiKey) {
    throw new Error("APIキーが選択されていません。");
  }
  
  const reportProgress = (msg: string) => {
    if (onProgress) onProgress(msg);
  };

  reportProgress("AIを準備中...");

  // Generate a random seed for variety
  const requestSeed = Math.floor(Math.random() * 2147483647);

  // Initialize AI with the specific user-selected key
  const ai = new GoogleGenAI({ apiKey });

  // Prepare input parts
  const parts: any[] = [];

  // 1. System/Role Definition
  let promptIntro = `
    Request ID: ${requestSeed}
    あなたはAmazonの商品カタログ画像作成のスペシャリストです。
    以下の指示に従い、コンバージョン率の高い魅力的な商品画像を生成してください。
    ${competitorUrl ? `\n競合他社・参考URL: ${competitorUrl} (この製品の市場トレンドやよくある見せ方を参考にしてください)` : ''}

    **重要: 多様性と新規性 (Variety & Freshness)**
    このリクエストは新しい提案を求めています。
    - **ゼロベース思考**: 過去の生成パターンやキャッシュ、一般的なテンプレートに依存せず、この訴求ポイントに最適な構図を「ゼロから」考案してください。
    - **前回の記憶を消去**: 以前に似た画像を生成していたとしても、それを意図的に無視し、全く異なるアプローチでデザインしてください。
    - **バリエーション**: 再生成のたびに異なるレイアウト、カメラアングル、背景の演出を試みてください。
  `;

  // Apply "Use Original Image" Strict Mode
  if (useOriginalImage && (productImages.length > 0)) {
    promptIntro += `
    \n【重要: 商品画像をそのまま使用するモード (Keep Original Asset Mode)】
    **ユーザーは提供された商品画像の「完全な維持」を求めています。**
    
    1. **商品の変更禁止**: アップロードされた商品画像を変形、再描画、色変更、フィルター適用などを**一切行わないでください**。
    2. **合成アプローチ**: 提供された商品画像を「切り抜いて、新しい背景の上に置く」ようなイメージで生成してください。
    3. **背景のみ生成**: あなたの創造性は「背景デザイン」「テキスト配置」「装飾」のみに発揮してください。商品は固定されたアセットとして扱ってください。
    4. **リアルさ**: 商品が背景から浮かないように、影（ドロップシャドウ）などは自然に追加しても構いませんが、商品自体のピクセルは変更しないでください。
    `;
  }

  parts.push({ text: promptIntro });

  reportProgress("画像を解析・処理中...");

  // 2. Style Reference Logic
  if (styleReferenceBase64) {
    parts.push({ text: `
【デザイン統一指示: 色味とトンマナのみ継承 (Color & Tone Only)】
画像1（参照画像）から**配色と雰囲気（トーン＆マナー）のみ**を抽出し、今回の画像に適用してください。

**✅ 抽出・反映すべき要素 (EXTRACT ONLY)**:
- **配色カラー**: ベースカラー、メインカラー、アクセントカラー。これらをスポイトで吸い取るように再現してください。
- **トーン**: 全体の明るさや雰囲気（例：高級感、ポップ、ナチュラル）。

**⛔️ 絶対に無視・除外すべき要素 (ABSOLUTELY IGNORE)**:
- **商品素材**: 画像1に写っている商品は、今回の商品とは異なります。画像1の商品は**絶対に描画しないでください**。
- **文字・テキスト**: 画像1に含まれる文字情報は**すべて無視**してください。一文字たりともコピーしないでください。
- **画像素材・オブジェクト**: 画像1に写っている商品、人物、装飾素材は**すべて無視**してください。
- **構図**: 前の画像と同じ構図に**しないでください**。

**指示**: 画像1は「色と雰囲気の見本」としてのみ扱い、中身は完全に新規作成してください。
` });
    // Strip prefix if present for raw data
    const cleanBase64 = styleReferenceBase64.replace(/^data:image\/\w+;base64,/, "");
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: "image/png",
      },
    });
  } else if (specificReferenceImage) {
    parts.push({ text: `
【最重要: 個別スタイル参考画像の取り扱い (STRICT STYLE GUIDE)】
ユーザーがアップロードしたこの画像は、以下の「配色情報」と「雰囲気」を抽出するためだけのものです。
**画像内のコンテンツ（文字、商品、人物、物体、レイアウト）は100%ノイズとして扱い、完全に無視してください。**

**✅ 抽出する配色パラメータ (EXTRACT ONLY)**:
1. **ベースカラー**: 背景色や基調となる色。
2. **メインカラー**: 主体となる色。
3. **アクセントカラー**: 強調色。
4. **トンマナ**: 高級感、ポップ、シンプル、ナチュラルなどの雰囲気。

**⛔️ 禁止事項: 以下の要素は絶対に生成画像に含めないでください (ABSOLUTELY FORBIDDEN)**:
- ❌ **商品素材 (Product Material)**: 参考画像に写っている商品は、今回の商品とは無関係です。**絶対に描画しないでください**。
- ❌ **文字・テキスト**: 参考画像にある文字は、たとえ一文字でもコピーしないでください。
- ❌ **人物・モデル**: 参考画像に写っている人物は無視してください。
- ❌ **図形・装飾**: 参考画像独自のグラフィック要素は無視してください。

**指示**:
この参考画像の「色」と「雰囲気」だけを借りて、**全く別の商品（今回アップロードされた商品）**の画像をゼロから作成してください。
` });
    const { base64, mimeType } = await fileToBase64(specificReferenceImage);
    parts.push({
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    });

  } else if (referenceImage) {
    parts.push({ text: `
【最重要: 全体共通スタイル参考画像の取り扱い (STRICT STYLE GUIDE)】
ユーザーがアップロードしたこの画像は、以下の「配色情報」と「雰囲気」を抽出するためだけのものです。
**画像内のコンテンツ（文字、商品、人物、物体、レイアウト）は100%ノイズとして扱い、完全に無視してください。**

**✅ 抽出する配色パラメータ (EXTRACT ONLY)**:
1. **ベースカラー**: 背景色や基調となる色。
2. **メインカラー**: 主体となる色。
3. **アクセントカラー**: 強調色。
4. **トンマナ**: 高級感、ポップ、シンプル、ナチュラルなどの雰囲気。

**⛔️ 禁止事項: 以下の要素は絶対に生成画像に含めないでください (ABSOLUTELY FORBIDDEN)**:
- ❌ **商品素材 (Product Material)**: 参考画像に写っている商品は、今回の商品とは無関係です。**絶対に描画しないでください**。
- ❌ **文字・テキスト**: 参考画像にある文字は、たとえ一文字でもコピーしないでください。
- ❌ **人物・モデル**: 参考画像に写っている人物は無視してください。
- ❌ **図形・装飾**: 参考画像独自のグラフィック要素は無視してください。

**指示**:
この参考画像の「色」と「雰囲気」だけを借りて、**全く別の商品（今回アップロードされた商品）**の画像をゼロから作成してください。
` });
    const { base64, mimeType } = await fileToBase64(referenceImage);
    parts.push({
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    });
  }

  // 3. Brand Logo (Optional)
  if (brandLogo) {
    parts.push({ text: `
【ブランドロゴ (Brand Logo)】
以下の画像を「ブランドロゴ」として使用してください。
- **配置**: デザイン内の視認性の良い位置（例：隅やヘッダー部分など）に自然に配置してください。
- **変形禁止**: ロゴの縦横比や形状は維持してください。
` });
    const { base64, mimeType } = await fileToBase64(brandLogo);
    parts.push({
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    });
  }

  // 4. Product Images (Subject)
  if (productImages.length > 0) {
    parts.push({ text: `
【商品画像 (Main Subject)】
**最重要**: 以下の画像をメインの被写体として使用してください。
${useOriginalImage 
  ? '- **合成モード**: この画像をそのまま使用してください。再描画禁止。ピクセルを維持してください。' 
  : '- **形状維持**: 商品の形状、比率、ロゴ、ディテールを**絶対に歪ませたり変更したりしないでください**。アップロードされた写真素材の見た目を維持してください。'}
- **写真優先**: 可能な限り提供された写真素材そのものを使用し、背景やエフェクトのみを生成・合成するアプローチをとってください。
` });
    for (const file of productImages) {
      const { base64, mimeType } = await fileToBase64(file);
      parts.push({
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      });
    }
  } else {
    parts.push({ text: `
【商品画像について】
**注意**: 商品画像素材が提供されていません。
「商品説明」のテキスト情報に基づいて、商品の外観をリアルに描画・生成してください。
Amazonの商品画像として違和感のない、高品質なプロダクトCGを生成してください。
` });
  }

  // 5. Feedback / Regeneration Instruction
  if (feedback && feedback.trim() !== "") {
    parts.push({ text: `
【ユーザーからの修正指示 (Feedback/Correction)】
**最優先事項 (High Priority)**:
ユーザーは前回の生成結果に対して修正を求めています。以下の指示を**最優先**で反映して再生成してください。
指示内容: 「${feedback}」
` });
  }

  // 6. Specific Instructions
  const promptDetails = `
    【制作要件】
    - 商品説明: ${productDescription}
    - 画像内のキャッチコピー/訴求内容: ${appealPoint}
    
    【生成ステップ】
    1. **配色適用**: 参考画像から抽出したカラーパレット（ベース・メイン・アクセント）を適用。
    2. **商品配置**: ${useOriginalImage ? '提供された商品画像をそのまま配置（再描画禁止）。' : '商品画像を魅力的に配置。'} ${brandLogo ? 'ブランドロゴも配置。' : ''}
    3. **テキスト配置**: 訴求内容を視認性高く配置。
    4. **デザイン生成**: 商品を引き立てる背景とエフェクトを生成。
    ${feedback ? '5. **修正反映**: ユーザーの修正指示を反映。' : ''}
    
    Amazonの商品画像として、商品の魅力が伝わる高品質な画像を出力してください。
  `;

  parts.push({ text: promptDetails });

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      reportProgress(attempt === 0 ? "画像を生成中..." : `再試行中 (${attempt + 1}/${maxRetries})...`);

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: parts,
        },
        config: {
          seed: requestSeed,
          imageConfig: {
            aspectRatio: aspectRatio, 
            imageSize: "1K", 
          },
        },
      });

      const candidate = response.candidates?.[0];
      
      // Extract image
      for (const part of candidate?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64EncodeString}`;
        }
      }

      // Check if there was text output (error explanation from model)
      const textPart = candidate?.content?.parts?.find(p => p.text);
      if (textPart?.text) {
        const text = textPart.text;
        console.warn("Model returned text:", text);
        if (text.includes("Finish what you were doing") || text.includes("unexpected error")) {
          throw new Error("モデル処理エラー");
        }
        throw new Error(`モデルからの応答: ${text}`);
      }
      
      throw new Error("画像データがありませんでした。");

    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;

      const isRetryable = 
        error.message?.includes("500") || 
        error.message?.includes("503") || 
        error.message?.includes("internal") ||
        error.message?.includes("overloaded") ||
        error.status === 500;

      if (error.message?.includes("400") || error.message?.includes("INVALID_ARGUMENT")) {
         throw new Error("画像サイズ超過等のエラー(400)です。画像を減らすかサイズを小さくしてください。");
      }

      if (!isRetryable) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        reportProgress(`サーバー混雑のため待機中... (${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, 5000 * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error("生成失敗");
};

// --- Image Editing Service ---
export const editAmazonImage = async ({
  apiKey,
  base64Image,
  instruction,
  clickX,
  clickY,
  aspectRatio
}: {
  apiKey: string;
  base64Image: string;
  instruction: string;
  clickX: number;
  clickY: number;
  aspectRatio: string;
}): Promise<string> => {
  if (!apiKey) throw new Error("APIキーがありません");

  const ai = new GoogleGenAI({ apiKey });
  
  // Extract pure base64
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `
【画像編集モード (Advanced Image Editing)】
ユーザーが指定した座標周辺の要素に対して、指示に基づいた修正を行ってください。

【ターゲット位置】
画像全体の左上を(0,0)、右下を(100,100)とした座標:
**X: ${clickX.toFixed(1)}%, Y: ${clickY.toFixed(1)}%**
AIはこの座標にある「テキスト」または「オブジェクト」を特定して操作してください。

【ユーザーの指示】
"${instruction}"

【実行パターン】
指示の内容に応じて、以下の処理を適切に実行してください。

1. **テキストの編集・削除**:
   - 「削除/消して」: 背景を自動生成(Inpainting)して文字を綺麗に消去。
   - 「変更/変えて」: 元のフォントデザイン、色、サイズを可能な限り維持しつつ、内容だけ書き換え。
   - 「色変更」: テキストの色だけを変更。

2. **オブジェクトの追加・変更**:
   - 「追加」: 指定位置に新しい要素（アイコン、光、装飾など）を自然に合成。
   - 「変更」: 既存のオブジェクトを別のものに置換。

3. **色味・スタイルの調整**:
   - 指定部分の色味（カラー）を変更、または明るさを調整。

**厳守事項**:
- **商品の形状維持**: 商品本体の形状が崩れないように注意してください。
- **デザイン再現**: 元画像のフォントスタイルやデザインの雰囲気を壊さないでください。
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: cleanBase64, mimeType: 'image/png' } }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${base64EncodeString}`;
      }
    }
    
    throw new Error("編集後の画像が生成されませんでした。");
  } catch (error: any) {
    console.error("Edit failed:", error);
    throw new Error(error.message || "画像の編集に失敗しました。");
  }
};

// --- Image Resize Service (NEW) ---
export const resizeAmazonImage = async ({
  apiKey,
  originalImage,
  targetAspectRatio,
  onProgress
}: {
  apiKey: string;
  originalImage: File;
  targetAspectRatio: string;
  onProgress?: (message: string) => void;
}): Promise<string> => {
  if (!apiKey) throw new Error("APIキーが選択されていません。");

  const reportProgress = (msg: string) => {
    if (onProgress) onProgress(msg);
  };

  reportProgress("AIを準備中...");
  const ai = new GoogleGenAI({ apiKey });

  const { base64, mimeType } = await fileToBase64(originalImage);

  const prompt = `
【画像リサイズ・レイアウト調整 (Smart Design Resize)】
提供されたデザイン画像を、指定されたアスペクト比に合わせて再構成してください。

**厳格なルール (STRICT RULES)**:
1. **要素の維持**: 画像内の商品写真、ロゴ、テキスト、装飾要素は**そのまま維持**してください。
2. **歪み禁止**: 画像を引き伸ばしたり（ストレッチ）、押しつぶしたりしないでください。アスペクト比が変わる場合は、背景を拡張(Outpainting)するか、要素の配置を自然に調整(Smart Layout)してください。
3. **デザイン保持**: 元のデザインの雰囲気、色味、フォントスタイルを完全に再現してください。
4. **余白の処理**: アスペクト比の変更により生じる余白は、元の背景デザインに合わせて自然に拡張して埋めてください。単色で埋めるのではなく、デザインパターンを継続させてください。

**目標**:
元のデザインデータを、新しいサイズ用のキャンバスに移植したような、自然で高品質なリサイズ画像を作成すること。
`;

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      reportProgress(attempt === 0 ? "リサイズ実行中..." : `再試行中 (${attempt + 1}/${maxRetries})...`);

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType: mimeType } }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: targetAspectRatio,
            imageSize: "1K",
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64EncodeString}`;
        }
      }
      
      throw new Error("画像データが生成されませんでした。");

    } catch (error: any) {
      console.error(`Resize attempt ${attempt + 1} failed:`, error);
      lastError = error;

      // Logic for retries similar to generation
      const isRetryable = error.message?.includes("500") || error.status === 500;
      if (!isRetryable) throw error;

      if (attempt < maxRetries - 1) {
        reportProgress(`サーバー待機中... (${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, 5000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("リサイズ失敗");
};
