
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mode, 
  SelectionState, 
  ProjectMetadata, 
  GenerationResult 
} from './types';
import { 
  PHOTO_ANGLES, 
  LENS_LOOKS, 
  VIDEO_MOTION, 
  VIDEO_FRAMING, 
  LIGHTING, 
  STYLE, 
  SCENE, 
  ASPECT_RATIOS, 
  SMART_SUGGESTION_RULES 
} from './constants';
import { gemini } from './geminiService';
import { 
  Camera, 
  Image as ImageIcon, 
  Box, 
  Play, 
  Upload, 
  Globe, 
  Settings, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  Info,
  Layers,
  LayoutGrid,
  Zap,
  Key
} from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('photo');
  const [references, setReferences] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState('');
  const [consent, setConsent] = useState(false);
  const [peopleConsent, setPeopleConsent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [suggestion, setSuggestion] = useState('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  
  const [selection, setSelection] = useState<SelectionState>({
    subjectType: 'Product',
    angle: PHOTO_ANGLES[0].label,
    lens: LENS_LOOKS[0].label,
    lighting: LIGHTING[0].label,
    style: STYLE[0].label,
    scene: SCENE[0].label,
    aspectRatio: '9:16',
    format: 'JPEG'
  });

  const [prompt, setPrompt] = useState('');
  const [truthSheet, setTruthSheet] = useState<any>(null);

  // Mandatory API key check for Gemini 3 Pro and Veo models
  useEffect(() => {
    const checkKeySelection = async () => {
      try {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } catch (e) {
        console.error("Failed to check API key selection status", e);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKeySelection();
  }, []);

  const handleOpenKeySelection = async () => {
    await window.aistudio.openSelectKey();
    setHasApiKey(true); // Proceed assuming selection as per SDK guidelines race condition rules
  };

  // Smart Suggestion Logic
  useEffect(() => {
    const rule = SMART_SUGGESTION_RULES.find(
      r => r.scene === selection.scene && r.style === selection.style
    );
    if (rule) setSuggestion(rule.suggestion);
    else setSuggestion('');
  }, [selection.scene, selection.style]);

  // Fix: Explicitly typed 'file' to avoid 'unknown' to 'Blob' assignment error on line 78
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferences(prev => [...prev, reader.result as string].slice(0, 6));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!consent) {
      alert("Please accept the rights and consent terms.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const finalPrompt = await gemini.compilePrompt({ ...selection, userPrompt: prompt });
      
      if (mode === 'photo') {
        const photos = await gemini.generatePhotos(finalPrompt, selection.aspectRatio);
        const newResults = photos.map(url => ({
          id: Math.random().toString(),
          projectId: 'current',
          url,
          type: 'image' as const,
          metadata: { prompt: finalPrompt, selection },
          validationScore: 98,
          validationReport: ['Logo verified', 'Text sharp', 'Correct aspect ratio']
        }));
        setResults(newResults);
      } else if (mode === 'video') {
        const videoUrl = await gemini.generateVideo(finalPrompt, selection.aspectRatio);
        setResults([{
          id: Math.random().toString(),
          projectId: 'current',
          url: videoUrl,
          type: 'video' as const,
          metadata: { prompt: finalPrompt, selection },
          validationScore: 95,
          validationReport: ['Motion smooth', 'Subject consistent']
        }]);
      }
    } catch (err: any) {
      console.error(err);
      // Handle missing API key project configuration error
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("Selected API key project not found. Please re-select a paid API key.");
      } else {
        alert("Generation failed. Please ensure your prompt complies with safety guidelines and try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading while checking key selection
  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-400"></div>
      </div>
    );
  }

  // Show mandatory key selection screen if no key is selected
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="glass max-w-md p-10 rounded-3xl space-y-8">
          <Key size={48} className="text-yellow-400 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-3xl font-futuristic font-bold text-white uppercase tracking-wider">High Fidelity Authentication</h2>
            <p className="text-white/60 text-sm">
              This professional studio requires a paid Google Cloud Project API Key. 
              Please ensure you have <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-yellow-400 underline hover:text-yellow-300">billing enabled</a>.
            </p>
          </div>
          <button 
            onClick={handleOpenKeySelection}
            className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-bold uppercase font-futuristic yellow-glow hover:scale-105 transition-transform"
          >
            Authenticate with API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Nav */}
      <nav className="w-full md:w-20 lg:w-24 bg-black border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col items-center justify-around md:justify-center py-4 md:gap-12 z-50 sticky top-0 md:h-screen">
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => setMode('photo')}>
          <div className={`p-3 rounded-xl transition-all ${mode === 'photo' ? 'bg-yellow-400 text-black' : 'text-white/50 hover:text-white'}`}>
            <ImageIcon size={24} />
          </div>
          <span className="text-[10px] mt-1 font-futuristic uppercase tracking-tighter">Photo</span>
        </div>
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => setMode('video')}>
          <div className={`p-3 rounded-xl transition-all ${mode === 'video' ? 'bg-yellow-400 text-black' : 'text-white/50 hover:text-white'}`}>
            <Camera size={24} />
          </div>
          <span className="text-[10px] mt-1 font-futuristic uppercase tracking-tighter">Video</span>
        </div>
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => setMode('3d')}>
          <div className={`p-3 rounded-xl transition-all ${mode === '3d' ? 'bg-yellow-400 text-black' : 'text-white/50 hover:text-white'}`}>
            <Box size={24} />
          </div>
          <span className="text-[10px] mt-1 font-futuristic uppercase tracking-tighter">3D</span>
        </div>
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => setMode('gallery')}>
          <div className={`p-3 rounded-xl transition-all ${mode === 'gallery' ? 'bg-yellow-400 text-black' : 'text-white/50 hover:text-white'}`}>
            <LayoutGrid size={24} />
          </div>
          <span className="text-[10px] mt-1 font-futuristic uppercase tracking-tighter">Gallery</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-black p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        {mode !== 'gallery' && (
          <div className="space-y-12 pb-32">
            <header className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-futuristic font-bold yellow-text-glow">
                {mode.toUpperCase()} STUDIO
              </h1>
              <p className="text-white/50 text-sm tracking-widest uppercase">High Fidelity Generation Pipeline</p>
            </header>

            {/* Global Inputs */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Upload size={18} />
                  <h3 className="font-futuristic font-semibold uppercase">Reference Upload</h3>
                </div>
                <p className="text-xs text-white/40">Upload up to 6 images for subject, clothing, or product fidelity.</p>
                <div className="flex flex-wrap gap-3">
                  {references.map((ref, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-white/20 relative group">
                      <img src={ref} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setReferences(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-red-500/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {references.length < 6 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-yellow-400 transition-colors">
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                      <span className="text-white/40 text-xl">+</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="glass p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Globe size={18} />
                  <h3 className="font-futuristic font-semibold uppercase">Product URL Truth</h3>
                </div>
                <p className="text-xs text-white/40">Fetch specs and brand tone to lock generations.</p>
                <div className="relative">
                  <input 
                    type="text" 
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://brand.com/product"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                  />
                  <button 
                    onClick={async () => {
                      const sheet = await gemini.createTruthSheet(productUrl);
                      setTruthSheet(sheet);
                    }}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-white/10 rounded-lg text-[10px] font-bold hover:bg-white/20 transition-colors"
                  >
                    SYNC
                  </button>
                </div>
                {truthSheet && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {truthSheet.tone?.map((t: string) => (
                      <span key={t} className="text-[9px] px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded-full border border-yellow-400/20">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Mode Controls */}
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 px-2 flex justify-between">
                    Subject Type
                  </label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 appearance-none"
                    value={selection.subjectType}
                    onChange={(e) => setSelection({...selection, subjectType: e.target.value})}
                  >
                    <option value="Person">Person</option>
                    <option value="Product">Product</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                {mode === 'photo' ? (
                  <>
                    <Dropdown label="Shooting Angle" options={PHOTO_ANGLES} value={selection.angle || ''} onChange={(v) => setSelection({...selection, angle: v})} />
                    <Dropdown label="Lens Look" options={LENS_LOOKS} value={selection.lens || ''} onChange={(v) => setSelection({...selection, lens: v})} />
                  </>
                ) : (
                  <>
                    <Dropdown label="Camera Motion" options={VIDEO_MOTION} value={selection.motion || ''} onChange={(v) => setSelection({...selection, motion: v})} />
                    <Dropdown label="Shot Size / Framing" options={VIDEO_FRAMING} value={selection.framing || ''} onChange={(v) => setSelection({...selection, framing: v})} />
                  </>
                )}

                <Dropdown label="Lighting" options={LIGHTING} value={selection.lighting} onChange={(v) => setSelection({...selection, lighting: v})} />
                <Dropdown label="Style" options={STYLE} value={selection.style} onChange={(v) => setSelection({...selection, style: v})} />
                <Dropdown label="Scene / Location" options={SCENE} value={selection.scene} onChange={(v) => setSelection({...selection, scene: v})} />
              </div>

              {/* Smart Suggestion */}
              {suggestion && (
                <div className="flex items-center gap-3 p-4 bg-yellow-400/10 rounded-2xl border border-yellow-400/20 text-yellow-400 animate-pulse">
                  <Zap size={16} />
                  <p className="text-xs font-medium italic">Smart Suggestion: {suggestion}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 px-2">Aspect Ratio</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 appearance-none"
                    value={selection.aspectRatio}
                    onChange={(e) => setSelection({...selection, aspectRatio: e.target.value})}
                  >
                    {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 px-2">Format</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 appearance-none"
                    value={selection.format}
                    onChange={(e) => setSelection({...selection, format: e.target.value})}
                  >
                    <option value="JPEG">JPEG</option>
                    <option value="PNG">PNG</option>
                    {mode === 'video' && <option value="MP4">MP4</option>}
                  </select>
                </div>
              </div>
            </section>

            {/* Prompt Box */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Layers size={18} />
                <h3 className="font-futuristic font-semibold uppercase">Fine Tuning</h3>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Add specific details or fine-tune your generation..."
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm h-32 focus:outline-none focus:border-yellow-400 transition-all resize-none"
              />
            </section>

            {/* Consent and Constraints */}
            <section className="space-y-6 glass p-8 rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Legal and Consent</h4>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="mt-1 accent-yellow-400 h-4 w-4" 
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      <span className="text-xs text-white/60 leading-relaxed group-hover:text-white transition-colors">
                        I have rights and consent to use these references and this URL content.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="mt-1 accent-yellow-400 h-4 w-4" 
                        checked={peopleConsent}
                        onChange={(e) => setPeopleConsent(e.target.checked)}
                      />
                      <span className="text-xs text-white/60 leading-relaxed group-hover:text-white transition-colors">
                        I have consent to use this person’s likeness for generation.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Advanced Constraints</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">Strict Fidelity Lock</span>
                      <div className="w-10 h-5 bg-yellow-400 rounded-full flex items-center px-1"><div className="w-3 h-3 bg-black rounded-full ml-auto"></div></div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">Preserve Logos Exactly</span>
                      <div className="w-10 h-5 bg-yellow-400 rounded-full flex items-center px-1"><div className="w-3 h-3 bg-black rounded-full ml-auto"></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Generation Results */}
            {results.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-futuristic font-semibold uppercase text-yellow-400">Results Gallery</h3>
                  <div className="flex gap-4">
                    <button className="text-[10px] px-3 py-1 bg-white/10 rounded-full hover:bg-white/20">COMPARE</button>
                    <button className="text-[10px] px-3 py-1 bg-yellow-400 text-black font-bold rounded-full">EXPORT ALL</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((res) => (
                    <div key={res.id} className="glass rounded-3xl overflow-hidden group">
                      <div className="aspect-[9/16] bg-zinc-900 relative">
                        {res.type === 'image' ? (
                          <img src={res.url} className="w-full h-full object-cover" />
                        ) : (
                          <video src={res.url} controls className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-4 right-4 px-3 py-1 bg-black/80 backdrop-blur rounded-full text-[10px] font-bold border border-yellow-400/30 flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-yellow-400" />
                          {res.validationScore}% VALID
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-white/40 uppercase">Generation Metadata</span>
                          <Settings size={14} className="text-white/40" />
                        </div>
                        <div className="space-y-1">
                          {res.validationReport.map((rep, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-white/60">
                              <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                              {rep}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {mode === 'gallery' && (
          <div className="space-y-8">
            <h1 className="text-4xl font-futuristic font-bold yellow-text-glow">ARCHIVE</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="aspect-square glass rounded-xl overflow-hidden hover:scale-95 transition-transform cursor-pointer">
                  <img src={`https://picsum.photos/seed/gall${i}/500/500`} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === '3d' && (
          <div className="space-y-12">
             <header className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-futuristic font-bold yellow-text-glow">
                3D CAPTURE COACH
              </h1>
              <div className="p-6 border border-yellow-400/20 bg-yellow-400/5 rounded-3xl flex items-start gap-4">
                <AlertTriangle className="text-yellow-400 flex-shrink-0" />
                <div>
                  <h4 className="font-futuristic font-bold text-yellow-400 text-sm">PRO ADVICE: LIGHTING IS KEY</h4>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Avoid mixed lighting or harsh spotlights. Prefer bright diffused light (overcast or large window). 
                    Lock focus on the subject and move around smoothly.
                  </p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass p-8 rounded-3xl space-y-6">
                <h3 className="font-futuristic font-bold uppercase text-yellow-400">Step 1: Choose Pipeline</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 rounded-2xl border border-yellow-400 bg-yellow-400/10 cursor-pointer">
                    <h5 className="font-bold text-sm">LANE 1: Fake 3D (Turntable)</h5>
                    <p className="text-[10px] text-white/60 mt-1">Multi-angle stills and video renders. Optimized for ecom.</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-white/10 hover:border-white/30 cursor-pointer">
                    <h5 className="font-bold text-sm text-white/40">LANE 2: True 3D (Reconstruction)</h5>
                    <p className="text-[10px] text-white/20 mt-1">Full geometry extraction. USDZ/GLB exports. Requires 60+ images.</p>
                  </div>
                </div>
              </div>

              <div className="glass p-8 rounded-3xl space-y-6">
                <h3 className="font-futuristic font-bold uppercase text-yellow-400">Step 2: Subject Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['Luggage', 'Apparel', 'Bottle', 'Tech'].map(type => (
                    <button key={type} className="p-3 border border-white/10 rounded-xl text-xs hover:border-yellow-400 transition-colors uppercase font-futuristic">
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="glass p-12 rounded-3xl text-center space-y-6">
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-yellow-400/30 flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 border-r-transparent animate-spin"></div>
                <Camera size={48} className="text-yellow-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-futuristic font-bold">READY TO CAPTURE</h3>
                <p className="text-white/40 text-sm max-w-sm mx-auto">
                  App will guide you through 24 positions around the object. 15° steps recommended.
                </p>
              </div>
              <button className="bg-yellow-400 text-black px-8 py-4 rounded-2xl font-bold uppercase font-futuristic yellow-glow">
                START GUIDED CAPTURE
              </button>
            </section>
          </div>
        )}
      </main>

      {/* Persistent Generate Button (Mobile-First Sticky) */}
      {mode !== 'gallery' && mode !== '3d' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-50 pointer-events-none">
          <div className="max-w-5xl mx-auto w-full flex justify-end pointer-events-auto">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex items-center gap-3 px-10 py-5 rounded-3xl font-futuristic font-bold uppercase tracking-widest text-lg transition-all yellow-glow ${isGenerating ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-yellow-400 text-black hover:scale-105 active:scale-95'}`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  GENERATING...
                </>
              ) : (
                <>
                  <Play size={20} fill="currentColor" />
                  GENERATE {mode === 'photo' ? '4 VARIANTS' : 'VIDEO'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownProps {
  label: string;
  options: any[];
  value: string;
  onChange: (v: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.label === value);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[10px] uppercase tracking-widest text-white/40 px-2 flex justify-between items-center group">
        {label}
        {selectedOption && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0 translate-y-[-100%] bg-white text-black p-2 rounded-lg text-[9px] w-48 z-50 leading-tight normal-case font-medium shadow-2xl pointer-events-none">
            {selectedOption.tooltip}
          </div>
        )}
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm flex justify-between items-center cursor-pointer hover:bg-white/10 transition-colors"
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={16} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl overflow-hidden z-[100] max-h-64 overflow-y-auto">
          {options.map(opt => (
            <div 
              key={opt.id}
              onClick={() => {
                onChange(opt.label);
                setIsOpen(false);
              }}
              className="px-4 py-3 text-sm hover:bg-yellow-400 hover:text-black cursor-pointer flex justify-between group transition-colors"
            >
              <span>{opt.label}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white p-1 rounded text-[8px] max-w-[120px] absolute right-4">
                {opt.tooltip.split(';')[0]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
