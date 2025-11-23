import React, { useState, useEffect } from 'react';
import { NeuCard, NeuButton, NeuInput, NeuTextArea, NeuSelect, NeuSlider, NeuMultiSelect } from '../NeuComponents';
import { ViewType, MaterialType, GeneratedImage, ImageStyle, LogoStyle, AppSection } from '../../types';
import { generateImage, checkApiKeyStatus, testConnection } from '../../services/geminiService';
import { saveImageToDB, generateUniqueId, downloadImage, getHistory, deleteImageFromDB } from '../../utils/storage';
import { Loader, Download, Image as ImageIcon, Trash2, X, RefreshCcw, ScanEye, Edit3, Shirt, AlertTriangle, CheckCircle, Info, Wifi } from 'lucide-react';

interface CreatorProps {
    onNavigate?: (section: AppSection) => void;
}

export const Creator: React.FC<CreatorProps> = ({ onNavigate }) => {
  // State Initialization
  const [prompt, setPrompt] = useState('');
  const [negPrompt, setNegPrompt] = useState('');
  const [refImage, setRefImage] = useState<string | null>(null);
  const [poseImage, setPoseImage] = useState<string | null>(null);
  
  const [styleInfluence, setStyleInfluence] = useState(0.5);
  const [poseInfluence, setPoseInfluence] = useState(0.5);
  
  const [view, setView] = useState(ViewType.FRONTAL);
  
  // Multi-select States
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [logoStyles, setLogoStyles] = useState<string[]>([]);
  
  // Background State
  const [bgType, setBgType] = useState<'neutral' | 'descriptive'>('neutral');
  const [bgDescription, setBgDescription] = useState('');

  // Custom inputs
  const [customStyle, setCustomStyle] = useState('');
  const [customLogoStyle, setCustomLogoStyle] = useState('');

  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  // Key Diagnostic State
  const [keyStatus, setKeyStatus] = useState<{status: string, message: string} | null>(null);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
      // Check Key Status immediately on mount
      setKeyStatus(checkApiKeyStatus());

      const loadImages = async () => {
        const history = await getHistory();
        setGeneratedImages(history);
    };
    loadImages();

    // Check Transfer first
    const transferData = localStorage.getItem('transfer_pending');
    if (transferData) {
        try {
            const { positive, negative } = JSON.parse(transferData);
            if (positive) setPrompt(positive);
            if (negative) setNegPrompt(negative);
            localStorage.removeItem('transfer_pending');
        } catch (e) {}
    } else {
        // Load Persisted State
        const savedState = localStorage.getItem('creator_state_v2');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                setPrompt(parsed.prompt || '');
                setNegPrompt(parsed.negPrompt || '');
                setRefImage(parsed.refImage || null);
                setPoseImage(parsed.poseImage || null);
                setStyleInfluence(parsed.styleInfluence ?? 0.5);
                setPoseInfluence(parsed.poseInfluence ?? 0.5);
                setView(parsed.view || ViewType.FRONTAL);
                
                setSelectedMaterials(parsed.selectedMaterials || []);
                setSelectedStyles(parsed.selectedStyles || []);
                setLogoStyles(parsed.logoStyles || []);
                
                setBgType(parsed.bgType || 'neutral');
                setBgDescription(parsed.bgDescription || '');

                setAspectRatio(parsed.aspectRatio || '9:16');
                setCount(parsed.count || 1);
                setCustomStyle(parsed.customStyle || '');
                setCustomLogoStyle(parsed.customLogoStyle || '');
            } catch(e) {}
        }
    }
  }, []);

  // Save State on Change
  useEffect(() => {
      const state = {
          prompt, negPrompt, refImage, poseImage, styleInfluence, poseInfluence,
          view, selectedMaterials, selectedStyles, logoStyles,
          bgType, bgDescription,
          aspectRatio, count, customStyle, customLogoStyle
      };
      localStorage.setItem('creator_state_v2', JSON.stringify(state));
  }, [prompt, negPrompt, refImage, poseImage, styleInfluence, poseInfluence, view, selectedMaterials, selectedStyles, logoStyles, bgType, bgDescription, aspectRatio, count, customStyle, customLogoStyle]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'ref' | 'pose') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          if (type === 'ref') setRefImage(reader.result as string);
          else setPoseImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConnectionTest = async () => {
      setTestResult({ success: false, message: 'Testando...' });
      const result = await testConnection();
      setTestResult(result);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setLastError(null);
    try {
      // Consolidate styles
      const finalStyles = [...selectedStyles];
      if (selectedStyles.includes(ImageStyle.OTHER) && customStyle) {
          finalStyles.push(customStyle);
      }
      
      // Handle Logo Sub-styles
      if (selectedStyles.includes(ImageStyle.LOGO)) {
          finalStyles.push(...logoStyles);
          if (logoStyles.includes(LogoStyle.OTHER) && customLogoStyle) {
              finalStyles.push(customLogoStyle);
          }
      }

      const finalPrompt = `Vista OBRIGATÓRIA: ${view}. ${prompt}.`;
      
      const images = await generateImage(
          finalPrompt, 
          negPrompt, 
          aspectRatio, 
          count, 
          refImage || undefined,
          poseImage || undefined,
          styleInfluence,
          poseInfluence,
          finalStyles,
          selectedMaterials,
          bgType,
          bgDescription
      );
      
      const newImages = await Promise.all(images.map(async (url) => {
        const id = generateUniqueId();
        const imgData: GeneratedImage = {
            id,
            url,
            prompt: finalPrompt,
            timestamp: Date.now(),
            width: 1024,
            height: 1024
        };
        await saveImageToDB(imgData);
        return imgData;
      }));

      setGeneratedImages(prev => [...newImages, ...prev]);
    } catch (err: any) {
      console.error("Erro na geração:", err);
      setLastError(err.message || 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const success = await deleteImageFromDB(id);
      if (success) {
          setGeneratedImages(prev => prev.filter(img => img.id !== id));
          if (selectedImage?.id === id) setSelectedImage(null);
      }
  };

  const handleVariation = () => {
      if (!selectedImage) return;
      setRefImage(selectedImage.url);
      setStyleInfluence(0.8);
      setPrompt(`Variação de: ${selectedImage.prompt.split('.')[0]}`);
      setSelectedImage(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTransfer = (target: 'analyst' | 'editor' | 'swapper') => {
      if (!selectedImage || !onNavigate) return;
      const key = target === 'analyst' ? 'analyst_transfer' : target === 'editor' ? 'editor_transfer' : 'swapper_transfer';
      localStorage.setItem(key, selectedImage.url);
      setSelectedImage(null);
      if (target === 'analyst') onNavigate(AppSection.ANALYST);
      else if (target === 'editor') onNavigate(AppSection.EDITOR);
      else if (target === 'swapper') onNavigate(AppSection.SWAPPER);
  };

  return (
    <>
        {/* API Key Diagnostics Bar */}
        {keyStatus && (
            <div className={`
                p-4 mb-6 rounded-xl border-l-4 shadow-neu-out flex flex-col md:flex-row items-start md:items-center gap-4 justify-between
                ${keyStatus.status === 'success' ? 'bg-green-100 border-green-500 text-green-800' : ''}
                ${keyStatus.status === 'error' ? 'bg-red-100 border-red-500 text-red-800' : ''}
                ${keyStatus.status === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : ''}
            `}>
                <div className="flex items-center gap-3">
                    {keyStatus.status === 'success' ? <CheckCircle size={24}/> : <AlertTriangle size={24}/>}
                    <div>
                        <h4 className="font-bold text-sm uppercase">Status da Chave API</h4>
                        <p className="text-sm font-mono mt-1">{keyStatus.message}</p>
                    </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={handleConnectionTest}
                        className="px-4 py-2 bg-white/50 hover:bg-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-black/10"
                    >
                        <Wifi size={16}/> Testar Conexão
                    </button>
                </div>
            </div>
        )}
        
        {/* Test Result Feedback */}
        {testResult && (
            <div className={`p-3 mb-6 rounded-lg text-sm font-mono border ${testResult.success ? 'bg-blue-100 border-blue-400 text-blue-900' : 'bg-red-100 border-red-400 text-red-900'}`}>
                <strong>Resultado do Teste:</strong> {testResult.message}
            </div>
        )}

        {/* Error Feedback */}
        {lastError && (
            <div className="p-4 mb-6 rounded-xl bg-red-100 border border-red-400 text-red-900 shadow-neu-out animate-pulse">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-1" />
                    <div className="overflow-hidden w-full">
                        <h3 className="font-bold mb-1">Erro na Geração</h3>
                        <pre className="text-xs whitespace-pre-wrap font-mono bg-white/50 p-2 rounded border border-red-200 overflow-x-auto">
                            {lastError}
                        </pre>
                        <p className="text-xs mt-2 opacity-80">Se o erro for 429 (Cota), aguarde 1 minuto. Se for 403 (Chave), verifique a Vercel.</p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
            <NeuCard title="Configuração">
            <div className="space-y-4">
                <NeuTextArea 
                placeholder="Prompt Positivo (Descreva sua imaginação...)" 
                value={prompt} 
                onChange={(e: any) => setPrompt(e.target.value)} 
                />
                <NeuInput 
                placeholder="Prompt Negativo (O que evitar...)" 
                value={negPrompt} 
                onChange={(e: any) => setNegPrompt(e.target.value)} 
                />
                
                {/* Background Selection */}
                <div className="flex flex-col gap-2">
                     <span className="text-xs font-bold text-neu-dark ml-2">Fundo (Background)</span>
                     <div className="flex gap-4">
                        <NeuButton 
                            active={bgType === 'neutral'} 
                            onClick={() => setBgType('neutral')}
                            className="flex-1 text-sm py-2"
                        >
                            Neutro
                        </NeuButton>
                        <NeuButton 
                            active={bgType === 'descriptive'} 
                            onClick={() => setBgType('descriptive')}
                            className="flex-1 text-sm py-2"
                        >
                            Descritivo
                        </NeuButton>
                     </div>
                     {bgType === 'descriptive' && (
                         <NeuTextArea 
                            placeholder="Descreva o fundo (ex: floresta mágica, cidade cyberpunk...)"
                            value={bgDescription}
                            onChange={(e: any) => setBgDescription(e.target.value)}
                            rows={2}
                         />
                     )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <NeuSelect 
                        label="Proporção"
                        value={aspectRatio}
                        onChange={(e: any) => setAspectRatio(e.target.value)}
                        options={[
                        {label: '9:16 (Stories)', value: '9:16'},
                        {label: '1:1 (Quadrado)', value: '1:1'},
                        {label: '16:9 (Widescreen)', value: '16:9'},
                        {label: '4:3 (Foto)', value: '4:3'},
                        {label: '3:4 (Retrato)', value: '3:4'}
                        ]}
                    />
                    <div className="flex flex-col gap-2">
                         <span className="text-xs font-bold text-neu-dark ml-2">Quantidade (Cuidado: Limite RPM)</span>
                         <div className="relative">
                            <select
                                value={count}
                                onChange={(e: any) => setCount(Number(e.target.value))}
                                className="w-full bg-neu-base shadow-neu-out rounded-xl px-4 py-3 outline-none text-neu-text appearance-none cursor-pointer focus:text-neu-accent"
                            >
                                <option value={1}>1 (Recomendado)</option>
                                <option value={2}>2 (Risco 429)</option>
                                <option value={3}>3 (Alto Risco)</option>
                                <option value={4}>4 (Perigo 429)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neu-dark">▼</div>
                        </div>
                    </div>
                </div>

                <NeuSelect 
                    label="Vista (Prioritário)"
                    value={view}
                    onChange={(e: any) => setView(e.target.value)}
                    options={Object.values(ViewType).map(v => ({label: v, value: v}))}
                />

                <NeuMultiSelect 
                    label="Materiais / Texturas"
                    options={Object.values(MaterialType)}
                    selected={selectedMaterials}
                    onChange={setSelectedMaterials}
                    placeholder="Selecione os materiais..."
                />

                <div className="border-t border-neu-dark/10 pt-4 mt-2 space-y-4">
                    <NeuMultiSelect 
                        label="Estilos Artísticos"
                        options={Object.values(ImageStyle)}
                        selected={selectedStyles}
                        onChange={setSelectedStyles}
                        placeholder="Selecione os estilos..."
                    />

                    {selectedStyles.includes(ImageStyle.OTHER) && (
                        <div className="mt-1">
                            <NeuInput 
                                placeholder="Descreva outros estilos..." 
                                value={customStyle} 
                                onChange={(e: any) => setCustomStyle(e.target.value)} 
                            />
                        </div>
                    )}

                    {selectedStyles.includes(ImageStyle.LOGO) && (
                        <div className="pl-4 border-l-2 border-neu-accent/50 space-y-2">
                             <NeuMultiSelect 
                                label="Tipos de Logomarca"
                                options={Object.values(LogoStyle)}
                                selected={logoStyles}
                                onChange={setLogoStyles}
                                placeholder="Estilo do Logo..."
                             />
                            
                            {logoStyles.includes(LogoStyle.OTHER) && (
                                <div className="mt-2">
                                    <NeuInput 
                                        placeholder="Descreva o tipo de logo..." 
                                        value={customLogoStyle} 
                                        onChange={(e: any) => setCustomLogoStyle(e.target.value)} 
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </NeuCard>

            <NeuCard title="Referências">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <label className="cursor-pointer w-full">
                        <div className="bg-neu-base shadow-neu-in rounded-xl p-4 text-center hover:text-neu-accent transition-colors text-sm">
                            {refImage ? "Estilo/Ref Carregada (Trocar)" : "Upload Referência Visual"}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'ref')} />
                    </label>
                </div>
                {refImage && (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden shadow-neu-in">
                        <img src={refImage} alt="Ref" className="w-full h-full object-cover opacity-70" />
                        <button onClick={() => setRefImage(null)} className="absolute top-1 right-1 text-red-500 bg-white/80 rounded-full p-1 shadow-neu-out"><X size={12}/></button>
                    </div>
                )}
                
                <NeuSlider 
                    label="Influência do Estilo"
                    min={0} max={2} step={0.05}
                    value={styleInfluence}
                    onChange={(e: any) => setStyleInfluence(Number(e.target.value))}
                />
                
                <div className="h-px bg-neu-dark/20 my-2" />

                <div className="flex items-center gap-4">
                    <label className="cursor-pointer w-full">
                        <div className="bg-neu-base shadow-neu-in rounded-xl p-4 text-center hover:text-neu-accent transition-colors text-sm">
                            {poseImage ? "Pose Carregada (Trocar)" : "Upload ControlNet Pose"}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'pose')} />
                    </label>
                </div>
                {poseImage && (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden shadow-neu-in">
                        <img src={poseImage} alt="Pose" className="w-full h-full object-cover opacity-70" />
                        <button onClick={() => setPoseImage(null)} className="absolute top-1 right-1 text-red-500 bg-white/80 rounded-full p-1 shadow-neu-out"><X size={12}/></button>
                    </div>
                )}

                <NeuSlider 
                    label="Influência da Pose"
                    min={0} max={2} step={0.05}
                    value={poseInfluence}
                    onChange={(e: any) => setPoseInfluence(Number(e.target.value))}
                />
            </div>
            </NeuCard>

            <NeuButton onClick={handleGenerate} disabled={loading} className="w-full py-4 text-lg text-neu-accent">
            {loading ? <Loader className="animate-spin" /> : "GERAR"}
            </NeuButton>
        </div>

        {/* Right Column: Gallery */}
        <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedImages.map((img) => (
                    <NeuCard key={img.id} className="p-3 relative group cursor-pointer transition-transform hover:scale-[1.01]">
                        <div className="rounded-xl overflow-hidden shadow-neu-in relative aspect-[9/16]" onClick={() => setSelectedImage(img)}>
                            <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        
                        <div className="flex justify-between items-center mt-3 px-1">
                            <div className="text-xs text-neu-text truncate max-w-[150px]">{img.prompt}</div>
                            <div className="flex gap-3">
                                <NeuButton 
                                    onClick={(e) => { e?.stopPropagation(); downloadImage(img.url, `${img.id}.png`); }} 
                                    className="w-10 h-10 !p-0 rounded-full flex items-center justify-center !shadow-neu-out text-neu-text hover:!text-green-600"
                                >
                                    <Download size={18} />
                                </NeuButton>
                                <NeuButton 
                                    onClick={(e) => handleDelete(img.id, e)} 
                                    className="w-10 h-10 !p-0 rounded-full flex items-center justify-center !shadow-neu-out text-neu-text hover:!text-red-500"
                                >
                                    <Trash2 size={18} />
                                </NeuButton>
                            </div>
                        </div>
                    </NeuCard>
                ))}
                {generatedImages.length === 0 && !loading && (
                    <div className="col-span-2 flex flex-col items-center justify-center h-64 text-neu-dark opacity-50">
                        <ImageIcon size={48} className="mb-4" />
                        <p>Nenhuma imagem gerada ainda.</p>
                    </div>
                )}
            </div>
        </div>
        </div>

        {/* Image Popup / Modal */}
        {selectedImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neu-base/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                <div className="bg-neu-base shadow-neu-out rounded-3xl p-2 max-w-5xl w-full max-h-[95vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-4 -right-4 bg-neu-base text-red-500 shadow-neu-out p-3 rounded-full z-10 hover:text-red-700"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex-1 overflow-hidden rounded-2xl flex justify-center bg-black/5 relative">
                         <img 
                            src={selectedImage.url} 
                            alt={selectedImage.prompt} 
                            className="max-w-full max-h-[60vh] object-contain"
                         />
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                        <p className="text-xs text-neu-text line-clamp-2 text-center opacity-70">{selectedImage.prompt}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <NeuButton onClick={() => downloadImage(selectedImage.url, `${selectedImage.id}.png`)}>
                                <Download size={18} /> Baixar
                            </NeuButton>
                            <NeuButton onClick={() => handleVariation()} className="text-neu-text">
                                <RefreshCcw size={18} /> Variação
                            </NeuButton>
                            
                            <NeuButton onClick={() => handleTransfer('analyst')} className="text-neu-accent">
                                <ScanEye size={18} /> Analisar
                            </NeuButton>
                            <NeuButton onClick={() => handleTransfer('editor')} className="text-neu-accent">
                                <Edit3 size={18} /> Editar
                            </NeuButton>
                            <NeuButton onClick={() => handleTransfer('swapper')} className="text-neu-accent md:col-span-2">
                                <Shirt size={18} /> Trocar Roupa
                            </NeuButton>
                            
                            <NeuButton onClick={() => handleDelete(selectedImage.id)} className="text-red-500 md:col-span-2">
                                <Trash2 size={18} /> Excluir
                            </NeuButton>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
