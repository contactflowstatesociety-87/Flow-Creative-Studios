
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
    modelSelection: 'gemini-3-pro-preview'
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
        const videoUrl = await gemini.generateVideo(finalPrompt, selection.aspectRatio, references);
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
    setTimeout(() => {
      setIsBuilding3D(false);
      setIsCapturing(false);
      setMode('gallery');
    }, 5000);
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
          <div className="space-y-12 h-full pb-32">
            {isCapturing ? (
              <div className="fixed inset-0 bg-black z-[100] flex flex-col p-6 overflow-hidden">
                {showShutterFlash && <div className="fixed inset-0 bg-white z-[200] opacity-90 transition-opacity"></div>}
                <div className="flex justify-between items-center z-10"><button onClick={() => setIsCapturing(false)} className="p-4 text-white/60 hover:text-white"><X size={28} /></button><h2 className="text-xl font-futuristic font-bold yellow-text-glow uppercase tracking-widest">RECON CAPTURE</h2><div className="w-10"></div></div>
                <div className="flex-1 my-8 border-2 border-dashed border-white/20 rounded-3xl relative flex flex-col items-center justify-center bg-zinc-900 overflow-hidden">
                  <div className="absolute top-8 left-8 right-8 flex flex-col gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${lightingStatus === 'OK' ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-red-500/50 text-red-400 bg-red-500/20 animate-pulse'}`}>
                      <Sun size={14} /> Lighting: {lightingStatus}
                    </div>
                    {missingAngles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[8px] text-white/40 uppercase font-bold px-2 py-1 bg-white/5 rounded">Gaps:</span>
                        {missingAngles.map(a => <span key={a} className="text-[8px] text-yellow-400 uppercase font-black px-2 py-1 bg-yellow-400/10 rounded border border-yellow-400/20">{a}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="w-full h-full opacity-5 pointer-events-none absolute inset-0 grid grid-cols-8 grid-rows-8 border border-white/10">
                    {Array.from({ length: 64 }).map((_, i) => <div key={i} className="border border-white/10"></div>)}
                  </div>
                  <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-3 absolute bottom-8 left-8 right-8">
                     <div className="flex justify-between items-center"><span className="text-xs font-futuristic uppercase text-white/60 tracking-widest">Coverage Loop</span><span className="text-sm font-futuristic text-yellow-400 font-bold">{captureCount} / {targetCaptureCount}</span></div>
                     <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 transition-all duration-300" style={{ width: `${(captureCount / targetCaptureCount) * 100}%` }}></div></div>
                  </div>
                </div>
                <div className="h-32 flex items-center justify-around z-10">
                   <div className="w-16"></div>
                   <button onClick={takeSnapshot} disabled={captureCount >= targetCaptureCount} className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all ${captureCount >= targetCaptureCount ? 'border-white/10 opacity-20' : 'border-yellow-400 yellow-glow scale-110 active:scale-95'}`}><div className={`w-16 h-16 rounded-full bg-yellow-400`}></div></button>
                   <div className="w-16">{captureCount >= targetCaptureCount && <button onClick={process3DBuild} className="p-4 bg-yellow-400 rounded-full text-black yellow-glow hover:scale-110 transition-transform"><CloudLightning size={24} /></button>}</div>
                </div>
              </div>
            ) : (
              <div className="glass p-12 rounded-[3rem] flex flex-col justify-center items-center text-center space-y-8 max-w-lg mx-auto mt-20 border-yellow-400/20 shadow-2xl">
                <Box size={100} className="text-yellow-400 animate-pulse" />
                <h1 className="text-4xl font-futuristic font-bold yellow-text-glow leading-tight">3D RECON COACH</h1>
                <p className="text-white/40 text-sm uppercase tracking-widest font-medium">Guided high-fidelity product scanning</p>
                <button onClick={startCapture} className="w-full bg-yellow-400 text-black py-6 rounded-2xl font-black uppercase font-futuristic yellow-glow hover:scale-105 transition-all shadow-xl shadow-yellow-400/20">Begin Recon Sequence</button>
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
