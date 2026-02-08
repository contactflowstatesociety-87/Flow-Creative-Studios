
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  /**
   * Orchestrator to compile high-fidelity prompts using Gemini 3 Pro.
   */
  async compilePrompt(data: any): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      Constraints: Strict fidelity, preserve logos, no hallucinations.
      
      Return ONLY the final prompt string.`,
    });
    return response.text?.trim() || "A high quality professional photo.";
  }

  /**
   * Photo Generation using gemini-3-pro-image-preview.
   * Iterates through response parts to find image data as per SDK guidelines.
   */
  async generatePhotos(prompt: string, aspectRatio: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
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
  async generateVideo(prompt: string, aspectRatio: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: (aspectRatio === '9:16' || aspectRatio === '16:9') ? aspectRatio : '16:9'
      }
    });

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
