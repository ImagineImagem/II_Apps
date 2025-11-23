import React, { useState, useEffect } from 'react';
import { NeuCard, NeuButton, NeuInput } from '../NeuComponents';
import { swapClothing, GarmentRequest } from '../../services/geminiService';
import { downloadImage } from '../../utils/storage';
import { Shirt, Loader, Upload, X, Download, Trash2 } from 'lucide-react';

interface Garment {
    id: string;
    type: string;
    description: string;
    refImage?: string;
    active: boolean;
}

export const Swapper = () => {
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [garments, setGarments] = useState<Garment[]>([
      { id: '1', type: 'Camisa/Blusa', description: '', active: false },
      { id: '2', type: 'Calça/Short', description: '', active: false },
      { id: '6', type: 'Vestido', description: '', active: false }, // Added Dress
      { id: '3', type: 'Sapatos', description: '', active: false },
      { id: '4', type: 'Jaqueta', description: '', active: false },
      { id: '5', type: 'Acessórios', description: '', active: false },
      { id: '7', type: 'Óculos', description: '', active: false },
      { id: '8', type: 'Chapéu/Boné', description: '', active: false },
      { id: '9', type: 'Bolsa/Mochila', description: '', active: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  // Check for transferred image
  useEffect(() => {
      const transferred = localStorage.getItem('swapper_transfer');
      if (transferred) {
          setMainImage(transferred);
          localStorage.removeItem('swapper_transfer');
      }
  }, []);

  const toggleGarment = (id: string) => {
      // Create deep copy to modify safely
      let newGarments = garments.map(g => ({...g}));
      const targetIndex = newGarments.findIndex(g => g.id === id);
      if (targetIndex === -1) return;

      // Toggle target
      newGarments[targetIndex].active = !newGarments[targetIndex].active;
      const isActive = newGarments[targetIndex].active;
      const type = newGarments[targetIndex].type;

      // Exclusivity Logic: Dress vs (Top + Bottom)
      if (isActive) {
          if (type === 'Vestido') {
              // If Dress is active, disable Top and Bottom
              newGarments = newGarments.map(g => 
                  (g.type === 'Camisa/Blusa' || g.type === 'Calça/Short') 
                  ? { ...g, active: false } 
                  : g
              );
          } else if (type === 'Camisa/Blusa' || type === 'Calça/Short') {
              // If Top or Bottom is active, disable Dress
              newGarments = newGarments.map(g => 
                  (g.type === 'Vestido') 
                  ? { ...g, active: false } 
                  : g
              );
          }
      }
      
      setGarments(newGarments);
  };

  const updateDesc = (id: string, val: string) => {
      setGarments(garments.map(g => g.id === id ? {...g, description: val} : g));
  };

  const handleUploadGarment = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.onload = () => {
             setGarments(garments.map(g => g.id === id ? {...g, refImage: reader.result as string} : g));
          }
          reader.readAsDataURL(file);
      }
  };

  const removeGarmentRef = (id: string) => {
      setGarments(garments.map(g => g.id === id ? {...g, refImage: undefined} : g));
  };

  const handleSwap = async () => {
      if(!mainImage) return;
      setLoading(true);
      
      // Prepare payload with mapped types for clarity to the AI
      const activeGarments: GarmentRequest[] = garments
          .filter(g => g.active)
          .map(g => ({
              // Map 'Vestido' to a descriptive instruction to replace the whole outfit
              type: g.type === 'Vestido' ? 'VESTIDO COMPLETO (substituindo Torso e Pernas)' : g.type,
              description: g.description,
              refImage: g.refImage
          }));
      
      if(activeGarments.length === 0) {
          alert("Selecione pelo menos uma peça.");
          setLoading(false);
          return;
      }

      try {
          // Calculate aspect ratio of main image roughly
          const img = new Image();
          img.src = mainImage;
          await img.decode();
          const ratio = img.width / img.height;
          let ar = "3:4";
          if(Math.abs(ratio - 1) < 0.1) ar = "1:1";
          else if (Math.abs(ratio - 0.5625) < 0.1) ar = "9:16";

          const res = await swapClothing(mainImage, activeGarments, ar);
          if(res.length > 0) setResult(res[0]);
      } catch (e) {
          alert("Erro na troca de roupa");
      } finally {
          setLoading(false);
      }
  };

  return (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <NeuCard title="Modelo Base">
                <label className="block w-full h-64 bg-neu-base shadow-neu-in rounded-xl overflow-hidden cursor-pointer relative group">
                    {mainImage ? (
                        <img src={mainImage} className="w-full h-full object-cover" alt="Base" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-neu-dark font-bold">Upload Corpo Inteiro</div>
                    )}
                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <Upload size={32}/>
                     </div>
                    <input type="file" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if(f) {
                            const r = new FileReader();
                            r.onload = () => setMainImage(r.result as string);
                            r.readAsDataURL(f);
                        }
                    }} />
                </label>
            </NeuCard>

            <NeuCard title="Peças e Acessórios">
                <div className="space-y-4">
                    {garments.map(g => (
                        <div key={g.id} className={`p-4 rounded-xl transition-all ${g.active ? 'shadow-neu-in bg-gray-100/50' : 'shadow-neu-out'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={g.active} 
                                        onChange={() => toggleGarment(g.id)} 
                                        className="w-5 h-5 accent-neu-accent"
                                    />
                                    <span className={`font-bold ${g.active ? 'text-neu-accent' : 'text-neu-text'}`}>{g.type}</span>
                                </div>
                                
                                {g.active && (
                                    <div className="flex items-center gap-2">
                                        {g.refImage ? (
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-md border border-white">
                                                <img src={g.refImage} className="w-full h-full object-cover" alt="ref" />
                                                <button onClick={() => removeGarmentRef(g.id)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100">
                                                    <X size={12}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer text-neu-dark hover:text-neu-accent p-1">
                                                <Upload size={18}/>
                                                <input type="file" className="hidden" onChange={(e) => handleUploadGarment(g.id, e)} accept="image/*"/>
                                            </label>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {g.active && (
                                <NeuInput 
                                    placeholder={`Descreva detalhadamente ${g.type}`} 
                                    value={g.description} 
                                    onChange={(e: any) => updateDesc(g.id, e.target.value)} 
                                />
                            )}
                        </div>
                    ))}
                </div>
            </NeuCard>
            
            <NeuButton onClick={handleSwap} disabled={loading || !mainImage} className="w-full py-4 text-neu-accent">
                {loading ? <Loader className="animate-spin"/> : <><Shirt className="mr-2"/> Trocar Roupas</>}
            </NeuButton>
          </div>

          <div className="h-full">
             <NeuCard title="Resultado" className="h-full min-h-[500px] flex items-center justify-center flex-col">
                {result ? (
                     <>
                        <div 
                            className="rounded-xl overflow-hidden shadow-neu-in relative cursor-pointer group max-h-[500px]"
                            onClick={() => setShowPopup(true)}
                        >
                            <img src={result} className="max-w-full max-h-full object-contain" alt="Res" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex justify-center gap-4 mt-6 w-full">
                                <NeuButton 
                                    onClick={() => downloadImage(result, `swapped_${Date.now()}.png`)} 
                                    className="w-12 h-12 !p-0 rounded-full flex items-center justify-center !shadow-neu-out text-neu-text hover:!text-green-600"
                                >
                                    <Download size={20} />
                                </NeuButton>
                                <NeuButton 
                                    onClick={() => setResult(null)} 
                                    className="w-12 h-12 !p-0 rounded-full flex items-center justify-center !shadow-neu-out text-neu-text hover:!text-red-500"
                                >
                                    <Trash2 size={20} />
                                </NeuButton>
                        </div>
                     </>
                ) : (
                    <span className="opacity-50 text-center">
                        <Shirt size={48} className="mx-auto mb-2 opacity-20"/>
                        Aguardando geração...
                    </span>
                )}
             </NeuCard>
          </div>
      </div>

      {/* Popup for Swapper */}
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
                        alt="Swap Result" 
                        className="max-w-full max-h-[70vh] object-contain"
                        />
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <p className="text-sm text-neu-text text-center">Troca de Roupa Realizada</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <NeuButton onClick={() => downloadImage(result, `swap_popup_${Date.now()}.png`)}>
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