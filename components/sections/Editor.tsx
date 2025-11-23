import React, { useRef, useState, useEffect } from 'react';
import { NeuCard, NeuButton, NeuInput, NeuSlider, NeuSelect, NeuMultiSelect, NeuTextArea } from '../NeuComponents';
import { editImageWithMask } from '../../services/geminiService';
import { downloadImage } from '../../utils/storage';
import { ViewType, MaterialType, ImageStyle } from '../../types';
import { Eraser, Pen, X, Loader, Download, Trash2 } from 'lucide-react';

export const Editor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<string | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [mode, setMode] = useState<'brush' | 'eraser'>('brush'); 
  
  // Input Params
  const [prompt, setPrompt] = useState('');
  const [negPrompt, setNegPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [view, setView] = useState(ViewType.FRONTAL);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [customStyle, setCustomStyle] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hasMask, setHasMask] = useState(false);
  
  // Cursor State
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [showCursor, setShowCursor] = useState(false);
  
  // Popup state
  const [showPopup, setShowPopup] = useState(false);

  // Load image transferred from Creator
  useEffect(() => {
      const transferred = localStorage.getItem('editor_transfer');
      if (transferred) {
          loadImageFromBase64(transferred);
          localStorage.removeItem('editor_transfer');
      }
  }, []);

  // Determine Aspect Ratio string
  const getRatioString = (w: number, h: number) => {
     const ratio = w / h;
     if (Math.abs(ratio - 0.5625) < 0.1) return "9:16";
     if (Math.abs(ratio - 1.777) < 0.1) return "16:9";
     if (Math.abs(ratio - 0.75) < 0.1) return "3:4";
     if (Math.abs(ratio - 1.333) < 0.1) return "4:3";
     return "1:1";
  };

  const loadImageFromBase64 = (base64: string) => {
    const img = new Image();
    img.onload = () => {
       setImage(base64);
       // Set default AR but allow user to change it
       setAspectRatio(getRatioString(img.width, img.height));
       if(canvasRef.current) {
           canvasRef.current.width = img.width;
           canvasRef.current.height = img.height;
           const ctx = canvasRef.current.getContext('2d');
           if(ctx) ctx.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
       }
       setHasMask(false);
    };
    img.src = base64;
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        loadImageFromBase64(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      draw(e);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize * scaleX; // Adjust for canvas scale

    if (mode === 'brush') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255, 0, 0, 1)'; 
    } else {
        ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setHasMask(true);
  };

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    ctx.beginPath();
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    try {
        let maskData = null;
        if (hasMask && canvasRef.current) {
            maskData = canvasRef.current.toDataURL('image/png');
        }
        
        // Include custom style if selected
        const finalStyles = [...selectedStyles];
        if (selectedStyles.includes(ImageStyle.OTHER) && customStyle) {
            finalStyles.push(customStyle);
        }

        const res = await editImageWithMask(
            image, 
            maskData, 
            prompt, 
            negPrompt,
            view,
            finalStyles,
            selectedMaterials,
            aspectRatio
        );
        if(res.length > 0) setResult(res[0]);
    } catch (e) {
        alert("Falha na edição");
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
    <div className="flex flex-col gap-6">
        {!image ? (
            <NeuCard className="h-64 flex items-center justify-center">
                 <label className="cursor-pointer flex flex-col items-center">
                    <div className="bg-neu-base shadow-neu-out p-6 rounded-full mb-4 text-neu-accent">
                        <Pen size={32} />
                    </div>
                    <span className="font-bold text-neu-text">Carregar Imagem para Editar</span>
                    <input type="file" className="hidden" onChange={handleUpload} accept="image/*"/>
                 </label>
            </NeuCard>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <NeuCard className="relative p-0 overflow-hidden flex justify-center bg-neu-base items-center">
                         {/* Layer container */}
                         <div 
                            ref={containerRef}
                            className="relative max-w-full cursor-none" 
                            style={{ maxHeight: '600px'}}
                            onMouseEnter={() => setShowCursor(true)}
                            onMouseLeave={() => { setShowCursor(false); stopDrawing(); }}
                            onMouseMove={handleMouseMove}
                         >
                            <img src={image} alt="Target" className="max-w-full max-h-[600px] block" />
                            <canvas 
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseUp={stopDrawing}
                                className="absolute top-0 left-0 w-full h-full touch-none opacity-60"
                            />
                            
                            {/* Custom Cursor Overlay */}
                            {showCursor && (
                                <div 
                                    className="pointer-events-none absolute border-2 border-neu-accent rounded-full bg-neu-accent/20 z-50"
                                    style={{
                                        width: brushSize,
                                        height: brushSize,
                                        left: cursorPos.x - brushSize / 2,
                                        top: cursorPos.y - brushSize / 2,
                                    }}
                                />
                            )}
                         </div>
                    </NeuCard>
                </div>
                <div className="space-y-6">
                    <NeuCard title="Ferramentas">
                        <div className="flex gap-4 mb-4">
                            <NeuButton active={mode === 'brush'} onClick={() => setMode('brush')} className="flex-1">
                                <Pen size={18} /> Pincel
                            </NeuButton>
                            <NeuButton active={mode === 'eraser'} onClick={() => setMode('eraser')} className="flex-1">
                                <Eraser size={18} /> Borracha
                            </NeuButton>
                        </div>
                        <NeuSlider 
                            label="Tamanho" 
                            min={5} max={100} step={5} 
                            value={brushSize} 
                            onChange={(e: any) => setBrushSize(Number(e.target.value))} 
                        />
                    </NeuCard>
                    
                    <NeuCard title="Configuração Visual">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
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
                                <NeuSelect 
                                    label="Vista (Prioritário)"
                                    value={view}
                                    onChange={(e: any) => setView(e.target.value)}
                                    options={Object.values(ViewType).map(v => ({label: v, value: v}))}
                                />
                            </div>

                            <NeuMultiSelect 
                                label="Materiais / Texturas"
                                options={Object.values(MaterialType)}
                                selected={selectedMaterials}
                                onChange={setSelectedMaterials}
                                placeholder="Selecione materiais..."
                            />

                            <NeuMultiSelect 
                                label="Estilos Artísticos"
                                options={Object.values(ImageStyle)}
                                selected={selectedStyles}
                                onChange={setSelectedStyles}
                                placeholder="Selecione estilos..."
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
                        </div>
                    </NeuCard>

                    <NeuCard title="Ação">
                        <div className="space-y-3 mb-4">
                            <NeuTextArea 
                                placeholder={hasMask ? "O que gerar na área pintada?" : "Instrução de edição (sem máscara)"}
                                value={prompt}
                                onChange={(e: any) => setPrompt(e.target.value)}
                                rows={4}
                            />
                            <NeuInput 
                                placeholder="Prompt Negativo (O que evitar)"
                                value={negPrompt}
                                onChange={(e: any) => setNegPrompt(e.target.value)}
                            />
                        </div>
                        <NeuButton onClick={handleEdit} disabled={loading} className="w-full text-neu-accent">
                            {loading ? <Loader className="animate-spin" /> : "Gerar Edição"}
                        </NeuButton>
                    </NeuCard>

                    {result && (
                        <NeuCard title="Resultado">
                            <div 
                                className="rounded-xl overflow-hidden shadow-neu-in relative cursor-pointer group"
                                onClick={() => setShowPopup(true)}
                            >
                                <img src={result} className="w-full object-cover" alt="Result"/>
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            
                            <div className="flex justify-center gap-4 mt-4">
                                <NeuButton 
                                    onClick={() => downloadImage(result, `edited_${Date.now()}.png`)} 
                                    className="w-10 h-10 !p-0 rounded-full flex items-center justify-center !shadow-neu-out text-neu-text hover:!text-green-600"
                                >
                                    <Download size={18} />
                                </NeuButton>
                                <NeuButton 
                                    onClick={() => setResult(null)} 
                                    className="w-10 h-10 !p-0 rounded-full flex items-center justify-center !shadow-neu-out text-neu-text hover:!text-red-500"
                                >
                                    <Trash2 size={18} />
                                </NeuButton>
                            </div>
                        </NeuCard>
                    )}
                </div>
            </div>
        )}
    </div>

    {/* Popup Modal for Editor Result */}
    {result && showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neu-base/90 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
            <div className="bg-neu-base shadow-neu-out rounded-3xl p-2 max-w-4xl w-full max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => setShowPopup(false)}
                    className="absolute -top-4 -right-4 bg-neu-base text-red-500 shadow-neu-out p-3 rounded-full z-10 hover:text-red-700"
                >
                    <X size={24} />
                </button>

                <div className="flex-1 overflow-hidden rounded-2xl flex justify-center bg-black/5 relative">
                        <img 
                        src={result} 
                        alt="Edited Result" 
                        className="max-w-full max-h-[70vh] object-contain"
                        />
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <p className="text-sm text-neu-text text-center">Edição: {prompt}</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <NeuButton onClick={() => downloadImage(result, `edited_popup_${Date.now()}.png`)}>
                            <Download size={20} /> Download
                        </NeuButton>
                        <NeuButton onClick={() => setResult(null)} className="text-red-500">
                            <Trash2 size={20} /> Excluir
                        </NeuButton>
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};