
import { GoogleGenAI, Type } from "@google/genai";
import { PHOTO_ANGLES, LENS_LOOKS, BRAND_PRESETS } from "./constants";

export class GeminiService {
  /**
   * Orchestrator to compile high-fidelity prompts with brand intelligence.
   * Integrates chaos, stylization, and quality settings.
   */
  async compilePrompt(data: any, hasReferences: boolean): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const brandMappings: Record<string, string> = {
      'NIKE': 'High-energy athletic aesthetic, high-contrast dramatic shadows, performance textures, sweat and intensity, gritty high-performance lighting. Focus on energy and mood, do not add any brand-specific products.',
      'Apple': 'Ultra-clean minimalism, soft studio lighting, high-tech elegance, neutral gray and white backgrounds, perfect reflections. Focus on the pristine aesthetic, do not add any brand-specific products.',
      'North Face': 'Rugged adventure, earthy natural tones, overcast mountain lighting, waterproof textures, durability and utility. Focus on the outdoor atmosphere, do not add any brand-specific products.',
      'Liquid Death': 'Gritty punk-rock aesthetic, heavy metal aesthetic, aggressive lighting, high contrast, dark and edgy visual style. Focus on the lighting and mood, do not add any brand-specific products.',
      'Malbon Golf': 'Vintage golf heritage, casual luxury lifestyle, lush greens, soft morning sun, sophisticated casual vibe. Focus on the heritage atmosphere, do not add any brand-specific products.'
    };

    const styleOnlyInstruction = data.styleOnly 
      ? "STYLE-ONLY MODE ACTIVE: Use ONLY the visual aesthetic (lighting, color, mood) of the brand. DO NOT include any physical objects, logos, or products associated with that brand. If the style is 'Liquid Death', do NOT add cans. If 'Nike', do NOT add shoes."
      : "INTEGRATED BRANDING: Blend the brand's aesthetic with the subject naturally.";

    const brandInstruction = data.brandPreset !== 'None' ? `AESTHETIC STYLE PRESET: ${brandMappings[data.brandPreset]}` : '';
    const fidelityInstruction = data.creativeDeviation 
      ? "Creativity encouraged: Experiment with composition and lighting while keeping the core subject recognizable. Do not add new products or brands."
      : "100% FIDELITY LOCK: Absolutely zero deviation from reference images. Replicate every zipper, seam, logo, and texture precisely. DO NOT add any new objects, logos, or products that are not in the reference.";

    const systemInstruction = `You are a World-Class Creative Director and Technical Photographer.
    Generate a literal, physical description for 8K rendering.
    Focus on Material Physics, Light Interaction, and Visual Aesthetic.
    ${fidelityInstruction}
    ${brandInstruction}
    ${styleOnlyInstruction}
    
    CRITICAL NEGATIVE CONSTRAINTS:
    - DO NOT include any brand logos, specific brand products, or unrelated items associated with the style preset.
    - DO NOT add any cans, bottles, shoes, computers, or other objects that are not in the reference image.
    - If the style is "Liquid Death", do NOT add any cans or water bottles.
    - If the style is "Nike", do NOT add any shoes or swoosh logos.
    - If the style is "Apple", do NOT add any computers or apple logos.
    - ONLY stylize the subject provided in the reference image.
    
    STYLIZATION: level ${data.stylization}/100.
    CHAOS: level ${data.chaos}/100.`;

    const config: any = {
      systemInstruction: systemInstruction,
      temperature: Math.max(0.1, data.chaos / 100),
    };

    if (data.thinkingMode) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response = await ai.models.generateContent({
      model: data.modelSelection || "gemini-3-pro-preview",
      contents: `RECONSTRUCT THIS SCENE IN ${data.quality} FIDELITY:
      Subject: ${data.subjectType}
      User Prompt Addition: ${data.userPrompt}
      Camera: ${data.angle}, Lens: ${data.lens}
      Lighting: ${data.lighting}
      Style: ${data.style}, Location: ${data.scene}.
      
      Requirements: Photorealistic, 8K details, raw texture synthesis, exact material match.
      
      NEGATIVE CONSTRAINTS: No extra objects, no brand products, no logos, no hallucinations.`,
      config: config
    });
    
    return response.text?.trim() || "A hyper-realistic 8K professional product photo.";
  }

  /**
   * Photo Generation using gemini-3-pro-image-preview.
   * Generates 4 distinct variations to satisfy user requirement.
   */
  async generatePhotos(prompt: string, aspectRatio: string, references: string[]): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const apiAspectRatioMap: Record<string, any> = {
      '1:1': '1:1',
      '3:4': '3:4',
      '4:3': '4:3',
      '9:16': '9:16',
      '16:9': '16:9',
      '2:3': '3:4',
      '3:2': '4:3',
      '21:9': '16:9'
    };

    // To get 4 distinct variants, we make 4 concurrent calls with slightly varied seed instructions implicitly
    const generateVariant = async (index: number) => {
      const parts: any[] = [{ text: `VARIANT ${index + 1}: 8K MASTERPIECE, PIXEL-PERFECT FIDELITY: ${prompt}` }];
      
      references.forEach(ref => {
        const parts_arr = ref.split(',');
        if (parts_arr.length > 1) {
          const mimeType = ref.split(';')[0].split(':')[1];
          const base64Data = parts_arr[1];
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: parts },
        config: {
          imageConfig: {
            aspectRatio: apiAspectRatioMap[aspectRatio] || '1:1',
            imageSize: "1K"
          },
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    };

    const variantsPromises = [0, 1, 2, 3].map(i => generateVariant(i));
    const variantUrls = await Promise.all(variantsPromises);
    return variantUrls.filter(u => u !== null) as string[];
  }

  async editImage(base64Image: string, editPrompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const mimeType = base64Image.split(';')[0].split(':')[1];
    const base64Data = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: `Edit this image based on the following instruction: ${editPrompt}. Maintain as much original fidelity as possible.` }
        ]
      }
    });

    let imageUrl = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    return imageUrl;
  }

  async generateVideo(prompt: string, aspectRatio: string, references: string[], styleOnly: boolean = false): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'veo-3.1-generate-preview';
    const targetAspect = aspectRatio === '9:16' ? '9:16' : '16:9';
    
    const styleOnlyPrompt = styleOnly 
      ? "STYLE-ONLY MODE: Apply ONLY lighting and mood. DO NOT add any new objects, cans, or logos. " 
      : "";

    const config: any = {
      model: model,
      prompt: `${styleOnlyPrompt}100% PRODUCT FIDELITY MOTION, NO DISTORTION, NO HALLUCINATIONS, NO EXTRA OBJECTS, NO BRAND LOGOS: ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: targetAspect
      }
    };

    if (references.length > 0) {
      const ref = references[0];
      config.image = {
        imageBytes: ref.split(',')[1],
        mimeType: ref.split(';')[0].split(':')[1]
      };
    }

    let operation = await ai.models.generateVideos(config);
    let attempts = 0;
    while (!operation.done && attempts < 120) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      if (operation.error) throw new Error(`Veo Generation Error: ${operation.error.message}`);
      attempts++;
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video output produced.");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async createTruthSheet(url: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze ${url}. Extract physical specifications, materials, and logos. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            materials: { type: Type.ARRAY, items: { type: Type.STRING } },
            tone: { type: Type.ARRAY, items: { type: Type.STRING } },
            features: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['name', 'materials', 'tone', 'features']
        }
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return {};
    }
  }

  /**
   * 3D Reconstruction Analysis.
   * Uses 8 reference photos to create a high-fidelity reconstruction plan.
   */
  async generate3DRecon(photos: { angle: string; url: string }[]): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [
      { text: "Analyze these 8 angles of the subject. Create a 100% Identity Lock Reconstruction Plan for a high-fidelity 3D model. Identify every texture, seam, logo, and material detail from all angles." }
    ];

    photos.forEach(p => {
      const parts_arr = p.url.split(',');
      if (parts_arr.length > 1) {
        const mimeType = p.url.split(';')[0].split(':')[1];
        const base64Data = parts_arr[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reconstructionId: { type: Type.STRING },
            materialAnalysis: { type: Type.ARRAY, items: { type: Type.STRING } },
            geometryComplexity: { type: Type.STRING },
            textureMaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            identityLockStatus: { type: Type.STRING },
            iphoneIntegrationReady: { type: Type.BOOLEAN }
          },
          required: ['reconstructionId', 'materialAnalysis', 'geometryComplexity', 'textureMaps', 'identityLockStatus', 'iphoneIntegrationReady']
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      return { error: "Reconstruction failed" };
    }
  }
}

export const gemini = new GeminiService();
