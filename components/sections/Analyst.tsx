import React, { useState, useEffect } from 'react';
import { NeuCard, NeuButton, NeuTextArea } from '../NeuComponents';
import { analyzeImage } from '../../services/geminiService';
import { Loader, ArrowRight, Copy, Trash2 } from 'lucide-react';

export const Analyst = () => {
  const [image, setImage] = useState<string | null>(null);
  const [posAnalysis, setPosAnalysis] = useState('');
  const [negAnalysis, setNegAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  // Persistence: Load from localStorage on mount
  useEffect(() => {
      const savedImage = localStorage.getItem('analyst_image');
      const savedPos = localStorage.getItem('analyst_pos');
      const savedNeg = localStorage.getItem('analyst_neg');
      
      if (savedImage) setImage(savedImage);
      if (savedPos) setPosAnalysis(savedPos);
      if (savedNeg) setNegAnalysis(savedNeg);
  }, []);

  // Persistence: Save to localStorage on change
  useEffect(() => {
      if (image) localStorage.setItem('analyst_image', image);
      else localStorage.removeItem('analyst_image');
      
      localStorage.setItem('analyst_pos', posAnalysis);
      localStorage.setItem('analyst_neg', negAnalysis);
  }, [image, posAnalysis, negAnalysis]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearData = () => {
      setImage(null);
      setPosAnalysis('');
      setNegAnalysis('');
      localStorage.removeItem('analyst_image');
      localStorage.removeItem('analyst_pos');
      localStorage.removeItem('analyst_neg');
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await analyzeImage(image);
      setPosAnalysis(result.positive);
      setNegAnalysis(result.negative);
    } catch (e) {
      setPosAnalysis("Erro na análise.");
      setNegAnalysis("Erro na análise.");
    } finally {
      setLoading(false);
    }
  };

  const transferToCreator = (pos: string, neg: string) => {
      // Save to persistent storage so Creator can pick it up even if unmounted
      localStorage.setItem('transfer_pending', JSON.stringify({ positive: pos, negative: neg }));
      alert("Prompts transferidos! Vá para a aba 'Criador' para ver.");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
      <div className="space-y-6">
        <NeuCard title="Upload para Análise">
             <div className="flex flex-col items-center gap-4">
                <div className={`w-full h-64 rounded-xl shadow-neu-in flex items-center justify-center overflow-hidden bg-neu-base ${!image ? 'p-8' : ''}`}>
                    {image ? (
                        <img src={image} alt="Analyze" className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-neu-dark">Selecione uma imagem...</span>
                    )}
                </div>
                <div className="flex w-full gap-4">
                    <label className="flex-1">
                        <div className="bg-neu-base shadow-neu-out hover:shadow-neu-pressed text-neu-text font-bold py-3 px-6 rounded-xl text-center cursor-pointer transition-all">
                            Escolher Arquivo
                        </div>
                        <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                    </label>
                    {image && (
                        <NeuButton onClick={clearData} className="!shadow-neu-out text-red-500 px-4">
                            <Trash2 size={20} />
                        </NeuButton>
                    )}
                </div>
             </div>
        </NeuCard>
        <NeuButton onClick={handleAnalyze} disabled={!image || loading} className="w-full py-4 text-neu-accent">
            {loading ? <Loader className="animate-spin" /> : "Analisar com Imagine Imagem"}
        </NeuButton>
      </div>

      <div className="space-y-6">
        <NeuCard title="Prompt Positivo (Detalhes Visual)" className="flex flex-col gap-4">
            <NeuTextArea 
                value={posAnalysis} 
                onChange={(e: any) => setPosAnalysis(e.target.value)} 
                rows={5} 
                placeholder="A descrição detalhada aparecerá aqui..." 
            />
            <div className="flex gap-2">
                <NeuButton onClick={() => navigator.clipboard.writeText(posAnalysis)} className="flex-1 text-xs">
                    <Copy size={14} /> Copiar
                </NeuButton>
                <NeuButton onClick={() => transferToCreator(posAnalysis, "")} className="flex-1 text-xs text-neu-accent">
                    <ArrowRight size={14} /> Transferir
                </NeuButton>
            </div>
        </NeuCard>

        <NeuCard title="Prompt Negativo (O que evitar)" className="flex flex-col gap-4">
            <NeuTextArea 
                value={negAnalysis} 
                onChange={(e: any) => setNegAnalysis(e.target.value)} 
                rows={5} 
                placeholder="Falhas e elementos negativos aparecerão aqui..." 
            />
            <div className="flex gap-2">
                <NeuButton onClick={() => navigator.clipboard.writeText(negAnalysis)} className="flex-1 text-xs">
                    <Copy size={14} /> Copiar
                </NeuButton>
                <NeuButton onClick={() => transferToCreator("", negAnalysis)} className="flex-1 text-xs text-neu-accent">
                    <ArrowRight size={14} /> Transferir
                </NeuButton>
            </div>
        </NeuCard>
        
        {/* Bulk Transfer Button */}
        {(posAnalysis || negAnalysis) && (
            <NeuButton onClick={() => transferToCreator(posAnalysis, negAnalysis)} className="w-full text-neu-accent font-bold">
                Transferir TUDO para Criador
            </NeuButton>
        )}
      </div>
    </div>
  );
};