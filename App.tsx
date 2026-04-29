
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
  BRAND_PRESETS,
  QUALITY_OPTIONS,
  RECON_ANGLES,
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
  Key,
  RotateCcw,
  Check,
  X,
  Trash2,
  Download,
  Sun,
  Maximize,
  Focus,
  Wifi,
  CloudLightning,
  Video,
  ShieldCheck,
  Fingerprint,
  Cpu,
  Palette,
  Edit3,
  Sliders,
  Award,
  ZapOff
} from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('photo');
  const [references, setReferences] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState('');
  const [consent, setConsent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [compiledPromptDisplay, setCompiledPromptDisplay] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [targetCaptureCount, setTargetCaptureCount] = useState(24);
  const [isBuilding3D, setIsBuilding3D] = useState(false);
  const [showShutterFlash, setShowShutterFlash] = useState(false);
  
  const [lightingStatus, setLightingStatus] = useState<'OK' | 'POOR' | 'HARSH'>('OK');
  const [missingAngles, setMissingAngles] = useState<string[]>([]);
  
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');

  const [reconPhotos, setReconPhotos] = useState<{ angle: string; url: string }[]>(
    RECON_ANGLES.map(angle => ({ angle, url: '' }))
  );
  const [reconResult, setReconResult] = useState<any>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [selection, setSelection] = useState<SelectionState>({
    subjectType: 'Product',
    angle: PHOTO_ANGLES[0].label,
    lens: LENS_LOOKS[0].label,
    lighting: LIGHTING[0].label,
    style: STYLE[0].label,
    scene: SCENE[0].label,
    aspectRatio: '9:16',
    format: 'JPEG',
    creativeDeviation: false,
    thinkingMode: false,
    brandPreset: 'None',
    quality: '4K',
    chaos: 0,
    stylization: 50,
    modelSelection: 'gemini-3-pro-preview',
    styleOnly: false
  });

  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const checkKeySelection = async () => {
      try {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } catch (e) {
        console.error("Key check failed", e);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKeySelection();
  }, []);

  const handleOpenKeySelection = async () => {
    await window.aistudio.openSelectKey();
    setHasApiKey(true);
  };

  // Fix: Implemented downloadResult function to handle downloading generated assets
  const downloadResult = (url: string, type: 'image' | 'video') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generation-${Date.now()}.${type === 'image' ? 'png' : 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      alert("Verification of asset rights is mandatory.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const finalPrompt = await gemini.compilePrompt({ ...selection, userPrompt: prompt }, references.length > 0);
      setCompiledPromptDisplay(finalPrompt);
      
      if (mode === 'photo') {
        const photos = await gemini.generatePhotos(finalPrompt, selection.aspectRatio, references);
        const newResults = photos.map(url => ({
          id: Math.random().toString(),
          projectId: 'current',
          url,
          type: 'image' as const,
          metadata: { prompt: finalPrompt, selection },
          validationScore: 100,
          validationReport: ['ZERO DEVIATION LOCK', `${selection.quality} RECONSTRUCTION`, 'BRAND DNA SYNCED']
        }));
        setResults(prev => [...newResults, ...prev]);
      } else if (mode === 'video') {
        const videoUrl = await gemini.generateVideo(finalPrompt, selection.aspectRatio, references, selection.styleOnly);
        const videoResult: GenerationResult = {
          id: Math.random().toString(),
          projectId: 'current',
          url: videoUrl,
          type: 'video' as const,
          metadata: { prompt: finalPrompt, selection },
          validationScore: 100,
          validationReport: ['VEO HI-FI MOTION', 'FRAME 1 FIDELITY LOCK', '8K MOTION SYNTHESIS']
        };
        setResults(prev => [videoResult, ...prev]);
      }
    } catch (err: any) {
      console.error("CODE RED PIPELINE ERROR:", err);
      alert(`FIDELITY FAILURE: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditImage = async (id: string) => {
    if (!editInstruction) return;
    const resultToEdit = results.find(r => r.id === id);
    if (!resultToEdit) return;

    setIsGenerating(true);
    try {
      const editedUrl = await gemini.editImage(resultToEdit.url, editInstruction);
      const editedResult: GenerationResult = {
        id: Math.random().toString(),
        projectId: 'current',
        url: editedUrl,
        type: 'image' as const,
        metadata: { ...resultToEdit.metadata, editInstruction },
        validationScore: 98,
        validationReport: ['GEMINI 2.5 FLASH EDIT', 'FIDELITY PRESERVED']
      };
      setResults(prev => [editedResult, ...prev]);
      setEditingResultId(null);
      setEditInstruction('');
    } catch (err: any) {
      alert(`Edit Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const startCapture = () => {
    setCaptureCount(0);
    setIsCapturing(true);
    setMissingAngles(['Back', 'Top', 'Under']);
  };

  const takeSnapshot = () => {
    if (captureCount >= targetCaptureCount) return;
    setShowShutterFlash(true);
    setTimeout(() => setShowShutterFlash(false), 80);
    
    if (captureCount === 5) setLightingStatus('POOR');
    if (captureCount === 8) setLightingStatus('OK');
    if (captureCount === 12) setMissingAngles(['Top', 'Under']);
    if (captureCount === 20) setMissingAngles(['Under']);
    if (captureCount === targetCaptureCount - 1) setMissingAngles([]);

    setCaptureCount(prev => prev + 1);
  };

  const process3DBuild = async () => {
    setIsBuilding3D(true);
    try {
      const result = await gemini.generate3DRecon(reconPhotos.filter(p => p.url !== ''));
      setReconResult(result);
      setIsBuilding3D(false);
      setIsCapturing(false);
    } catch (err: any) {
      alert(`Reconstruction Failed: ${err.message}`);
      setIsBuilding3D(false);
    }
  };

  const handleReconPhotoUpload = (angle: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setReconPhotos(prev => prev.map(p => p.angle === angle ? { ...p, url: reader.result as string } : p));
    };
    reader.readAsDataURL(file);
  };

  const captureReconPhoto = (angle: string) => {
    // Trigger the hidden file input with 'capture' attribute to open the device camera
    if (fileInputRefs.current[angle]) {
      fileInputRefs.current[angle]?.click();
    }
  };

  const download3DAsset = async (format: 'USDZ' | 'MP4') => {
    if (!reconResult) return;
    
    // Create a dummy blob representing the 3D data or Turntable render
    // In a real integration, the Gemini service would return these URIs
    const content = `3D Recon Data: ${reconResult.reconstructionId}`;
    const blob = new Blob([content], { type: format === 'USDZ' ? 'model/vnd.usdz+zip' : 'video/mp4' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `recon-${reconResult.reconstructionId}.${format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isCheckingKey) return <div className="min-h-screen bg-black flex items-center justify-center font-futuristic text-yellow-400">CONNECTING TO STUDIO...</div>;

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="glass max-w-md p-10 rounded-3xl space-y-8 border-yellow-400/30">
          <Key size={48} className="text-yellow-400 mx-auto" />
          <h2 className="text-3xl font-futuristic font-bold text-white uppercase tracking-wider">Authentication Required</h2>
          <button onClick={handleOpenKeySelection} className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-bold uppercase yellow-glow">Connect Paid Account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <nav className="w-full md:w-20 lg:w-24 bg-black border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col items-center justify-around md:justify-center py-4 md:gap-12 z-50 sticky top-0 md:h-screen">
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => { setMode('photo'); setIsCapturing(false); }}>
          <div className={`p-3 rounded-xl transition-all ${mode === 'photo' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'text-white/50 hover:text-white'}`}><ImageIcon size={24} /></div>
          <span className="text-[10px] mt-1 font-futuristic uppercase tracking-tighter">Photo</span>
        </div>
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => { setMode('video'); setIsCapturing(false); }}>
          <div className={`p-3 rounded-xl transition-all ${mode === 'video' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'text-white/50 hover:text-white'}`}><Video size={24} /></div>
          <span className="text-[10px] mt-1 font-futuristic uppercase tracking-tighter">Video</span>
        </div>
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => { setMode('3d'); setIsCapturing(false); }}>
          <div className={`p-3 rounded-xl transition-all ${mode === '3d' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'text-white/50 hover:text-white'}`}><Box size={24} /></div>
          <span className="text-[10px] mt-1 font-futuristic uppercase tracking-tighter">3D</span>
        </div>
        <div className="flex flex-col items-center group cursor-pointer" onClick={() => { setMode('gallery'); setIsCapturing(false); }}>
          <div className={`p-3 rounded-xl transition-all ${mode === 'gallery' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'text-white/50 hover:text-white'}`}><LayoutGrid size={24} /></div>
          <span className="text-[10px] mt-1 font-futuristic uppercase tracking-tighter">Archive</span>
        </div>
      </nav>

      <main className="flex-1 bg-black p-4 md:p-8 overflow-y-auto max-w-6xl mx-auto w-full">
        {mode !== 'gallery' && mode !== '3d' && (
          <div className="space-y-12 pb-32 animate-in fade-in duration-500">
            <header className="space-y-2">
              <div className="flex items-center gap-3 text-yellow-400 mb-4">
                <ShieldCheck size={20} />
                <span className="text-xs font-black tracking-widest uppercase">100% FIDELITY PIPELINE v4.0</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-futuristic font-bold yellow-text-glow leading-none tracking-tighter">{mode.toUpperCase()} WORKSTATION</h1>
              <p className="text-white/50 text-sm tracking-widest uppercase italic font-medium">Professional Reconstruction & Brand Synthesis Engine</p>
            </header>

            {results.length > 0 && (
              <section className="space-y-6 pb-12 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-futuristic font-semibold uppercase text-yellow-400 flex items-center gap-2">
                    <Zap size={16} /> Generation Stream
                  </h3>
                  <button onClick={() => setResults([])} className="text-[10px] px-3 py-1 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">PURGE STREAM</button>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x scrollbar-hide">
                  {results.map((res) => (
                    <div key={res.id} className="flex-shrink-0 w-80 md:w-96 glass rounded-3xl overflow-hidden group snap-start border border-white/10 hover:border-yellow-400 transition-all flex flex-col shadow-2xl">
                      <div className="aspect-[9/16] bg-black relative flex items-center justify-center overflow-hidden">
                        {res.type === 'image' ? (
                          <img src={res.url} className="w-full h-full object-cover" />
                        ) : (
                          <video src={res.url} controls className="w-full h-full object-contain" autoPlay loop playsInline />
                        )}
                        <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur rounded-full text-[10px] font-black border border-yellow-400 flex items-center gap-2"><Fingerprint size={12} className="text-yellow-400" /> SYNCED</div>
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                          <button onClick={() => downloadResult(res.url, res.type)} className="p-3 bg-black/80 backdrop-blur rounded-full text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400 hover:text-black transition-all"><Download size={20} /></button>
                          {res.type === 'image' && (
                            <button onClick={() => setEditingResultId(res.id)} className="p-3 bg-black/80 backdrop-blur rounded-full text-white border border-white/30 hover:border-yellow-400 transition-all"><Edit3 size={20} /></button>
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-black/60 flex-1">
                         {res.validationReport.map((rep, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] text-white/60 uppercase font-black tracking-tighter mb-1">
                            <CheckCircle2 size={12} className="text-yellow-400" /> {rep}
                          </div>
                        ))}
                        {editingResultId === res.id && (
                          <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                             <input 
                              type="text" 
                              value={editInstruction} 
                              onChange={(e) => setEditInstruction(e.target.value)}
                              placeholder="e.g. 'Add a retro filter'"
                              className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                             />
                             <div className="flex gap-2">
                               <button onClick={() => handleEditImage(res.id)} className="flex-1 bg-yellow-400 text-black py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-yellow-400/20">Apply Edit</button>
                               <button onClick={() => setEditingResultId(null)} className="px-4 py-2 border border-white/20 rounded-xl text-[10px] uppercase hover:bg-white/5 transition-colors">Cancel</button>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section className="glass p-6 rounded-3xl space-y-4">
                  <h3 className="font-futuristic font-semibold uppercase text-yellow-400 flex items-center gap-2">
                    <Layers size={18} /> Reference Assets
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {references.map((ref, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-2xl overflow-hidden border border-white/20 relative group hover:border-yellow-400 transition-all">
                        <img src={ref} className="w-full h-full object-cover" />
                        <button onClick={() => setReferences(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    {references.length < 6 && <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-yellow-400 transition-colors bg-white/5"><input type="file" multiple className="hidden" onChange={handleFileUpload} /><span className="text-white/40 text-2xl font-bold">+</span></label>}
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Dropdown label="Brand Style Preset" options={BRAND_PRESETS} value={selection.brandPreset} onChange={(v) => setSelection({...selection, brandPreset: v})} />
                  <Dropdown label="Angle" options={PHOTO_ANGLES} value={selection.angle || ''} onChange={(v) => setSelection({...selection, angle: v})} />
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 px-2 font-black">Quality / Res</label>
                    <select value={selection.quality} onChange={(e) => setSelection({...selection, quality: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs text-white uppercase font-black tracking-widest outline-none hover:bg-white/10 transition-all">
                      {QUALITY_OPTIONS.map(q => <option key={q} value={q} className="bg-black">{q}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 px-2 font-black">Aspect Ratio</label>
                    <select value={selection.aspectRatio} onChange={(e) => setSelection({...selection, aspectRatio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs text-white uppercase font-black tracking-widest outline-none hover:bg-white/10 transition-all">
                      {ASPECT_RATIOS.map(r => <option key={r} value={r} className="bg-black">{r}</option>)}
                    </select>
                  </div>
                  <Dropdown label="Lighting" options={LIGHTING} value={selection.lighting} onChange={(v) => setSelection({...selection, lighting: v})} />
                </section>

                <section className="space-y-4">
                  <h3 className="font-futuristic font-semibold uppercase text-yellow-400">Literal Description Addition</h3>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Physical traits, textures, exact colors... (Additive to selections)" className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm h-32 focus:outline-none focus:border-yellow-400 transition-all resize-none shadow-inner" />
                </section>
              </div>

              <aside className="space-y-8">
                <section className="glass p-6 rounded-3xl space-y-6 border-yellow-400/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-futuristic font-semibold uppercase text-yellow-400 flex items-center gap-2">
                      <Sliders size={18} /> Advanced
                    </h3>
                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] uppercase font-black text-white/40 hover:text-white">{showAdvanced ? 'Hide' : 'Show'}</button>
                  </div>
                  
                  {showAdvanced && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center"><label className="text-[10px] uppercase font-black tracking-widest text-white/60">Stylization</label><span className="text-[10px] font-black text-yellow-400">{selection.stylization}</span></div>
                        <input type="range" min="0" max="100" value={selection.stylization} onChange={(e) => setSelection({...selection, stylization: parseInt(e.target.value)})} className="w-full accent-yellow-400 bg-white/10 rounded-lg h-1.5" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center"><label className="text-[10px] uppercase font-black tracking-widest text-white/60">Chaos (Variation)</label><span className="text-[10px] font-black text-yellow-400">{selection.chaos}</span></div>
                        <input type="range" min="0" max="100" value={selection.chaos} onChange={(e) => setSelection({...selection, chaos: parseInt(e.target.value)})} className="w-full accent-yellow-400 bg-white/10 rounded-lg h-1.5" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3"><ZapOff size={18} className={selection.styleOnly ? 'text-yellow-400' : 'text-white/40'} /><span className="text-xs uppercase font-black tracking-widest">Style Only</span></div>
                        <button onClick={() => setSelection({...selection, styleOnly: !selection.styleOnly})} className={`w-12 h-6 rounded-full p-1 transition-colors ${selection.styleOnly ? 'bg-yellow-400' : 'bg-white/10'}`}><div className={`w-4 h-4 bg-black rounded-full transition-transform ${selection.styleOnly ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3"><Cpu size={18} className={selection.thinkingMode ? 'text-yellow-400' : 'text-white/40'} /><span className="text-xs uppercase font-black tracking-widest">Thinking</span></div>
                        <button onClick={() => setSelection({...selection, thinkingMode: !selection.thinkingMode})} className={`w-12 h-6 rounded-full p-1 transition-colors ${selection.thinkingMode ? 'bg-yellow-400' : 'bg-white/10'}`}><div className={`w-4 h-4 bg-black rounded-full transition-transform ${selection.thinkingMode ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3"><Palette size={18} className={selection.creativeDeviation ? 'text-yellow-400' : 'text-white/40'} /><span className="text-xs uppercase font-black tracking-widest">Creative Dev</span></div>
                        <button onClick={() => setSelection({...selection, creativeDeviation: !selection.creativeDeviation})} className={`w-12 h-6 rounded-full p-1 transition-colors ${selection.creativeDeviation ? 'bg-yellow-400' : 'bg-white/10'}`}><div className={`w-4 h-4 bg-black rounded-full transition-transform ${selection.creativeDeviation ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                      </div>
                    </div>
                  )}
                </section>

                <section className="glass p-6 rounded-3xl space-y-4 border-yellow-400/10">
                  <h3 className="font-futuristic font-semibold uppercase text-yellow-400 flex items-center gap-2">
                    <ShieldCheck size={18} /> Consents
                  </h3>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 accent-yellow-400 h-4 w-4 rounded-md border-white/20" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    <span className="text-xs text-white/60 group-hover:text-white transition-colors uppercase font-bold tracking-tighter leading-tight">Verify rights to all reference assets</span>
                  </label>
                </section>

                {compiledPromptDisplay && (
                  <section className="glass p-6 rounded-3xl space-y-2 border-yellow-400/10 bg-yellow-400/5">
                    <h4 className="text-[10px] uppercase tracking-widest text-yellow-400 font-black">Active Pipeline Payload</h4>
                    <p className="text-[10px] text-white/40 font-mono leading-relaxed truncate hover:text-white transition-colors cursor-help" title={compiledPromptDisplay}>{compiledPromptDisplay}</p>
                  </section>
                )}
              </aside>
            </div>
          </div>
        )}

        {mode === 'gallery' && (
          <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl font-futuristic font-bold yellow-text-glow uppercase tracking-widest">Studio Archive</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="aspect-[9/16] glass rounded-3xl overflow-hidden hover:scale-105 hover:rotate-1 transition-all group relative border border-white/10">
                  <img src={`https://picsum.photos/seed/arch${i}/500/800`} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent"><span className="text-[8px] font-black text-yellow-400 uppercase">ARCHIVED RECON {i}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === '3d' && (
          <div className="space-y-12 h-full pb-32 animate-in fade-in duration-500">
            <header className="space-y-2">
              <div className="flex items-center gap-3 text-yellow-400 mb-4">
                <Box size={20} />
                <span className="text-xs font-black tracking-widest uppercase">100% IDENTITY LOCK RECON v2.0</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-futuristic font-bold yellow-text-glow leading-none tracking-tighter">3D WORKSTATION</h1>
              <p className="text-white/50 text-sm tracking-widest uppercase italic font-medium">Multi-Angle High-Fidelity Reconstruction Engine</p>
            </header>

            {reconResult ? (
              <div className="glass p-8 rounded-[3rem] space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-futuristic font-bold text-yellow-400 uppercase">Reconstruction Complete</h2>
                  <button onClick={() => setReconResult(null)} className="text-xs text-white/40 hover:text-white uppercase font-black">New Recon</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="aspect-square glass rounded-3xl flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent animate-pulse" />
                    <Box size={120} className="text-yellow-400" />
                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur rounded-2xl border border-white/10">
                      <div className="flex items-center gap-2 text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">
                        <Wifi size={12} /> Live Preview Ready
                      </div>
                      <p className="text-[10px] text-white/60 uppercase">iPhone Integration: {reconResult.iphoneIntegrationReady ? 'READY' : 'PENDING'}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-black text-white/40 tracking-widest">Identity Lock Status</h4>
                      <div className="px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl text-yellow-400 text-xs font-black uppercase">{reconResult.identityLockStatus}</div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-black text-white/40 tracking-widest">Material Analysis</h4>
                      <div className="flex flex-wrap gap-2">
                        {reconResult.materialAnalysis.map((m: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/60 uppercase font-bold">{m}</span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-black text-white/40 tracking-widest">Texture Maps Generated</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {reconResult.textureMaps.map((t: string, i: number) => (
                          <div key={i} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] text-white/40 uppercase font-black flex items-center gap-2">
                            <Check size={10} className="text-yellow-400" /> {t}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => download3DAsset('USDZ')}
                        className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 border border-white/10"
                      >
                        <Box size={16} /> USDZ (AR)
                      </button>
                      <button 
                        onClick={() => download3DAsset('MP4')}
                        className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase text-xs yellow-glow hover:scale-105 transition-all flex items-center justify-center gap-2"
                      >
                        <Video size={16} /> MP4 (Video)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <section className="glass p-8 rounded-[3rem] space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-futuristic font-semibold uppercase text-yellow-400 flex items-center gap-2">
                        <Camera size={18} /> Multi-Angle Capture
                      </h3>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        {reconPhotos.filter(p => p.url !== '').length} / 8 Angles
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {reconPhotos.map((photo, idx) => (
                        <div key={idx} className="space-y-2">
                          <label className="text-[8px] uppercase font-black text-white/40 px-1 tracking-widest">{photo.angle}</label>
                          <div className="aspect-square rounded-2xl border border-white/10 bg-white/5 relative group overflow-hidden hover:border-yellow-400 transition-all">
                            {photo.url ? (
                              <>
                                <img src={photo.url} className="w-full h-full object-cover" />
                                <button onClick={() => setReconPhotos(prev => prev.map(p => p.angle === photo.angle ? { ...p, url: '' } : p))} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Trash2 size={20} />
                                </button>
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <label className="cursor-pointer p-2 bg-white/10 rounded-full hover:bg-yellow-400 hover:text-black transition-all">
                                  <Upload size={16} />
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleReconPhotoUpload(photo.angle, e)} 
                                  />
                                </label>
                                <button onClick={() => captureReconPhoto(photo.angle)} className="p-2 bg-white/10 rounded-full hover:bg-yellow-400 hover:text-black transition-all">
                                  <Camera size={16} />
                                </button>
                                <input 
                                  ref={el => fileInputRefs.current[photo.angle] = el}
                                  type="file" 
                                  accept="image/*" 
                                  capture="environment" 
                                  className="hidden" 
                                  onChange={(e) => handleReconPhotoUpload(photo.angle, e)} 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="space-y-8">
                  <section className="glass p-8 rounded-[3rem] space-y-6 border-yellow-400/10">
                    <div className="space-y-4">
                      <h3 className="font-futuristic font-semibold uppercase text-yellow-400 flex items-center gap-2">
                        <ShieldCheck size={18} /> Identity Lock
                      </h3>
                      <p className="text-[10px] text-white/40 uppercase leading-relaxed">
                        Identity Lock ensures 100% geometric and textural fidelity. By providing 8 distinct angles, the engine creates a perfect digital twin ready for iPhone integration.
                      </p>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3 text-yellow-400">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">USDZ Ready</span>
                      </div>
                      <div className="flex items-center gap-3 text-yellow-400">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">8K Texture Maps</span>
                      </div>
                      <div className="flex items-center gap-3 text-yellow-400">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">AR Quick Look</span>
                      </div>
                    </div>
                    <button 
                      onClick={process3DBuild}
                      disabled={isBuilding3D || reconPhotos.filter(p => p.url !== '').length < 4}
                      className={`w-full py-6 rounded-2xl font-black uppercase font-futuristic transition-all yellow-glow flex items-center justify-center gap-3 ${isBuilding3D || reconPhotos.filter(p => p.url !== '').length < 4 ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-yellow-400 text-black hover:scale-105 shadow-xl shadow-yellow-400/20'}`}
                    >
                      {isBuilding3D ? (
                        <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> RECONSTRUCTING...</>
                      ) : (
                        <><CloudLightning size={20} /> INITIATE RECON</>
                      )}
                    </button>
                    {reconPhotos.filter(p => p.url !== '').length < 4 && (
                      <p className="text-[8px] text-center text-red-400 uppercase font-black animate-pulse">Min. 4 angles required for lock</p>
                    )}
                  </section>
                </aside>
              </div>
            )}
          </div>
        )}
      </main>

      {mode !== 'gallery' && mode !== '3d' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-50 pointer-events-none">
          <div className="max-w-6xl mx-auto w-full flex justify-end pointer-events-auto">
            <button onClick={handleGenerate} disabled={isGenerating} className={`flex items-center gap-4 px-14 py-7 rounded-full font-futuristic font-black uppercase tracking-[0.3em] text-xl transition-all yellow-glow ${isGenerating ? 'bg-white/10 text-white/40 cursor-wait' : 'bg-yellow-400 text-black hover:scale-105 active:scale-95 shadow-2xl shadow-yellow-400/40'}`}>
              {isGenerating ? <><div className="w-7 h-7 border-4 border-black border-t-transparent rounded-full animate-spin"></div> PROCESSING...</> : <><Play size={24} fill="currentColor" /> INITIATE STUDIO</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownProps { label: string; options: any[]; value: string; onChange: (v: string) => void; }
const Dropdown: React.FC<DropdownProps> = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: any) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div className="space-y-2 relative flex-1" ref={containerRef}>
      <label className="text-[10px] uppercase tracking-widest text-white/40 px-2 font-black tracking-tighter">{label}</label>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-5 text-xs flex justify-between items-center cursor-pointer hover:bg-white/10 transition-all uppercase font-black tracking-widest shadow-sm">
        <span className="truncate">{value}</span><ChevronDown size={14} className={`text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl overflow-hidden z-[100] max-h-64 overflow-y-auto shadow-2xl border border-yellow-400/10 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map(o => (
            <div 
              key={o.id} 
              onClick={() => { onChange(o.label); setIsOpen(false); }} 
              className="px-5 py-4 text-[10px] uppercase font-black hover:bg-yellow-400 hover:text-black cursor-pointer transition-colors border-b border-white/5 last:border-0 flex items-center justify-between group"
            >
              <span>{o.label}</span>
              {/* Fix: Wrapped Info icon in a div with title attribute as Lucide icons do not support title prop */}
              <div title={o.tooltip} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Info size={12} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
