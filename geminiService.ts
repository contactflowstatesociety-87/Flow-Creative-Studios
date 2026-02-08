
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  /**
   * Orchestrator to compile high-fidelity prompts using Gemini 3 Pro.
   * Now considers if references are provided to emphasize fidelity in the instructions.
   */
  async compilePrompt(data: any, hasReferences: boolean): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fidelityInstruction = hasReferences 
      ? "CRITICAL: Maintain 100% exact fidelity to the provided reference images. Do not deviate from the product's color, logo, materials, or structural details."
      : "Maintain strict realism and product consistency.";

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Compile a high-fidelity image/video generation prompt based on these inputs: 
      Subject: ${data.subjectType}
      Angle: ${data.angle}
      Lens: ${data.lens}
      Lighting: ${data.lighting}
      Style: ${data.style}
      Scene: ${data.scene}
      User Prompt: ${data.userPrompt}
      ${fidelityInstruction}
      Constraints: Preserve logos exactly, no hallucinations, zero creative deviation from physical product traits.
      
      Return ONLY the final prompt string.`,
    });
    return response.text?.trim() || "A high quality professional photo.";
  }

  /**
   * Photo Generation using gemini-3-pro-image-preview.
   * Now accepts and sends reference images (base64) to the model for image-to-image fidelity.
   */
  async generatePhotos(prompt: string, aspectRatio: string, references: string[]): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare parts: Text prompt followed by image parts
    const parts: any[] = [{ text: prompt }];
    
    // Add reference images to the request if they exist
    references.forEach(ref => {
      const mimeType = ref.split(';')[0].split(':')[1];
      const base64Data = ref.split(',')[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        },
      },
    });

    const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      }
    }
    return images;
  }

  /**
   * Video Generation using veo-3.1-fast-generate-preview.
   * Implements real polling and media retrieval logic.
   */
  async generateVideo(prompt: string, aspectRatio: string, references: string[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // For Video, we use the first reference image as a starting frame if available
    const videoConfig: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: (aspectRatio === '9:16' || aspectRatio === '16:9') ? aspectRatio : '16:9'
      }
    };

    if (references.length > 0) {
      videoConfig.image = {
        imageBytes: references[0].split(',')[1],
        mimeType: references[0].split(';')[0].split(':')[1]
      };
    }

    let operation = await ai.models.generateVideos(videoConfig);

    // Polling for video completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed: No URI returned");

    // Fetch the MP4 content with the API key appended
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  /**
   * Analyzes product URL to extract specs and brand tone for fidelity locking.
   */
  async createTruthSheet(url: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this product URL: ${url}. Extract canonical name, materials, key features, and brand tone. Return as JSON.`,
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
}

export const gemini = new GeminiService();
