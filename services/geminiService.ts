import { GoogleGenAI } from "@google/genai";

// Helper para obter a chave de forma segura
const getApiKey = () => {
    return process.env.API_KEY || "";
};

// Instância Lazy (só cria quando precisa)
let aiInstance: GoogleGenAI | null = null;

const getClient = () => {
    const key = getApiKey();
    if (!key) throw new Error("API Key não encontrada. Verifique o topo da tela para diagnóstico.");
    
    if (!aiInstance) {
        aiInstance = new GoogleGenAI({ apiKey: key });
    }
    return aiInstance;
};

// Função de Diagnóstico para a UI
export const checkApiKeyStatus = () => {
    const key = getApiKey();
    if (!key) return { status: 'error', message: 'MISSING: A variável API_KEY está vazia ou undefined.' };
    if (!key.startsWith('AIza')) return { status: 'warning', message: `INVALID FORMAT: A chave lê "${key.substring(0,3)}..." mas deveria começar com "AIza".` };
    if (key.includes('"') || key.includes(' ')) return { status: 'warning', message: 'INVALID CHARS: A chave contém aspas ou espaços. Remova-os na Vercel.' };
    return { status: 'success', message: `OK: Chave carregada (${key.substring(0, 6)}...${key.substring(key.length - 4)})` };
};

// Teste simples de conexão (Texto)
export const testConnection = async () => {
    try {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: 'Responda apenas com a palavra "Conectado".' }] }
        });
        return { success: true, message: `SUCESSO: ${response.text}` };
    } catch (e: any) {
        return { success: false, message: `FALHA: ${e.message || e.toString()}` };
    }
};

// Using Flash models which generally provide faster inference.
const MODEL_GEN = 'gemini-2.5-flash-image'; 
const MODEL_ANALYZE = 'gemini-2.5-flash';

// Helper to parse API errors
const handleApiError = (error: any) => {
    console.error("Gemini API Error (Raw):", error);
    
    let errorMsg = error.message || error.toString();
    let errorCode: string | number = "UNKNOWN";

    try {
        if (typeof errorMsg === 'string' && (errorMsg.includes('{') || errorMsg.includes('['))) {
            const jsonStart = errorMsg.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = errorMsg.substring(jsonStart);
                const parsed = JSON.parse(jsonStr);
                
                if (parsed.error) {
                    errorCode = parsed.error.code || parsed.error.status;
                    errorMsg = parsed.error.message || JSON.stringify(parsed.error);
                }
            }
        }
    } catch (e) {}

    // Mensagens de erro com detalhes técnicos para o usuário debugar
    if (errorCode === 429 || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error(`⚠️ COTA EXCEDIDA (429). O Google bloqueou temporariamente esta chave. \nDetalhes técnicos: ${errorMsg}`);
    }
    
    if (errorMsg.includes('API Key not found') || errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('403')) {
        throw new Error(`⚠️ ERRO DE CHAVE (403). Chave inválida ou permissão negada. \nDetalhes: ${errorMsg}`);
    }

    if (errorMsg.includes('503') || errorMsg.includes('Overloaded')) {
         throw new Error(`⚠️ SERVIDOR SOBRECARREGADO (503). O modelo está ocupado. Tente novamente em instantes. \nDetalhes: ${errorMsg}`);
    }

    // Erro genérico com o texto original
    throw new Error(`⚠️ ERRO DA API: ${errorMsg}`);
};

export const generateImage = async (
  prompt: string,
  negativePrompt: string,
  aspectRatio: string = "1:1",
  count: number = 1,
  referenceImageBase64?: string,
  poseImageBase64?: string,
  styleInfluence: number = 0.5,
  poseInfluence: number = 0.5,
  styles: string[] = [],
  materials: string[] = [],
  backgroundType: 'neutral' | 'descriptive' = 'neutral',
  backgroundDesc: string = ''
): Promise<string[]> => {
  
  // Instancia o cliente aqui para evitar erro no load da página
  const ai = getClient();

  // Constructing a strict prompt structure
  const bgInstruction = backgroundType === 'neutral' 
    ? "FUNDO: Neutro, cor sólida, limpo, sem detalhes, estúdio." 
    : `FUNDO: ${backgroundDesc}`;
  
  const styleList = styles.join(', ');
  const matList = materials.join(', ');

  const fullPrompt = `
  ${prompt}
  
  DIRETRIZES OBRIGATÓRIAS (PRIORIDADE MÁXIMA):
  1. ${bgInstruction}
  2. ESTILOS APLICADOS: ${styleList}.
  3. MATERIAIS/TEXTURAS: ${matList}.
  
  ${negativePrompt ? `EVITAR/NEGATIVO: ${negativePrompt}` : ''}
  `.trim();
  
  try {
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      }
    };

    const parts: any[] = [{ text: fullPrompt }];

    if (referenceImageBase64) {
      const cleanBase64 = referenceImageBase64.split(',')[1] || referenceImageBase64;
      parts.push({ text: `Referência visual/estilo (Influência: ${styleInfluence}):` });
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/png'
        }
      });
    }

    if (poseImageBase64) {
        const cleanPose = poseImageBase64.split(',')[1] || poseImageBase64;
        parts.push({ text: `Referência de pose estrutural/ControlNet (Influência: ${poseInfluence}):` });
        parts.push({
            inlineData: {
                data: cleanPose,
                mimeType: 'image/png'
            }
        });
    }

    // Function to execute a single generation request
    const generateSingle = async () => {
        try {
            const response = await ai.models.generateContent({
                model: MODEL_GEN,
                contents: { parts },
                config: config
            });

            const resultImages: string[] = [];
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        resultImages.push(`data:image/png;base64,${part.inlineData.data}`);
                    }
                }
            }
            return resultImages;
        } catch (e) {
            handleApiError(e); 
            return []; 
        }
    };

    // Execute parallel requests based on 'count'
    const promises = Array.from({ length: count }).map(() => generateSingle());
    const results = await Promise.all(promises);
    
    return results.flat();

  } catch (error) {
    if (error instanceof Error) throw error;
    handleApiError(error);
    return [];
  }
};

export interface AnalysisResult {
    positive: string;
    negative: string;
}

export const analyzeImage = async (imageBase64: string): Promise<AnalysisResult> => {
  const ai = getClient();
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ANALYZE,
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
          { text: "Analise esta imagem para criação de prompt. Retorne EXATAMENTE neste formato, separando por '---SPLIT---':\n[Descrição visual detalhada e estilo]\n---SPLIT---\n[O que evitar, defeitos ou elementos negativos]" }
        ]
      }
    });
    
    const text = response.text || "";
    const parts = text.split('---SPLIT---');
    
    return {
        positive: parts[0] ? parts[0].replace(/\[|\]/g, '').trim() : "Não foi possível gerar o prompt positivo.",
        negative: parts[1] ? parts[1].replace(/\[|\]/g, '').trim() : ""
    };
  } catch (error) {
    handleApiError(error);
    return { positive: "Erro na análise", negative: "" };
  }
};

export const editImageWithMask = async (
    originalImageBase64: string,
    maskBase64: string | null,
    prompt: string,
    negativePrompt: string = '',
    view: string = '',
    styles: string[] = [],
    materials: string[] = [],
    aspectRatio: string = "1:1"
): Promise<string[]> => {
     const ai = getClient();
     const cleanOrg = originalImageBase64.split(',')[1] || originalImageBase64;
     
     const styleList = styles.join(', ');
     const matList = materials.join(', ');

     const context = `
     ESTILO VISUAL DESEJADO: ${styleList}
     MATERIAIS: ${matList}
     VISTA: ${view}
     ${negativePrompt ? `ELEMENTOS NEGATIVOS (EVITAR): ${negativePrompt}` : ''}
     `;
     
     const parts: any[] = [];
     
     if (maskBase64) {
        const cleanMask = maskBase64.split(',')[1] || maskBase64;
        
        const instruction = `
           TAREFA DE EDIÇÃO LOCAL (INPAINTING).
           Use a segunda imagem como MÁSCARA (Área Branca/Pintada = Onde editar).
           
           ALTERAÇÃO SOLICITADA: "${prompt}".
           
           CONTEXTO DE ESTILO:
           ${context}

           REGRAS RÍGIDAS DE PRESERVAÇÃO:
           1. A área fora da máscara (preta/transparente) deve permanecer 100% IDÊNTICA à imagem original. Não altere pixels fora da máscara.
           2. A área editada deve se integrar perfeitamente ao estilo, iluminação, ruído e textura da imagem original.
        `;

        parts.push({ text: instruction });
        parts.push({ inlineData: { data: cleanOrg, mimeType: 'image/png' } });
        parts.push({ inlineData: { data: cleanMask, mimeType: 'image/png' } });
     } else {
        const instruction = `
            Edição da imagem mantendo a estrutura original. 
            Instrução: "${prompt}".
            CONTEXTO DE ESTILO: ${context}
            Preserve a composição, identidade e estilo visual onde não especificado o contrário.
        `;
        parts.push({ text: instruction });
        parts.push({ inlineData: { data: cleanOrg, mimeType: 'image/png' } });
     }

     try {
        const response = await ai.models.generateContent({
            model: MODEL_GEN,
            contents: { parts },
            config: {
                imageConfig: { aspectRatio: aspectRatio as any }
            }
        });

        const images: string[] = [];
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    images.push(`data:image/png;base64,${part.inlineData.data}`);
                }
            }
        }
        return images;
     } catch (error) {
         handleApiError(error);
         return [];
     }
}

export interface GarmentRequest {
    type: string;
    description: string;
    refImage?: string;
}

export const swapClothing = async (
    baseImageBase64: string,
    garments: GarmentRequest[],
    aspectRatio: string = "3:4"
): Promise<string[]> => {
    const ai = getClient();
    const cleanBase = baseImageBase64.split(',')[1] || baseImageBase64;
    
    const changes = garments.map(g => {
        const hasRef = !!g.refImage;
        let desc = g.description;
        if (!desc && hasRef) {
            desc = "a peça de roupa mostrada exatamente na imagem de referência fornecida";
        } else if (!desc) {
            desc = "uma nova versão desta peça com estilo moderno e realista";
        }
        return `ALTERAÇÃO PRIORITÁRIA: Substituir área de ${g.type} por: ${desc}${hasRef ? ' (USAR REFERÊNCIA VISUAL ANEXADA)' : ''}`;
    }).join('. \n');
    
    const prompt = `
    MODO: EDIÇÃO ESTRUTURAL DE MODA (VIRTUAL TRY-ON).
    TAREFA: Aplicar as trocas de roupa listadas abaixo na pessoa da foto principal.
    LISTA DE ALTERAÇÕES: ${changes}
    REGRAS DE EXECUÇÃO OBRIGATÓRIAS:
    1. INTEGRIDADE ABSOLUTA: O rosto, cabelo, pose, fundo e iluminação DEVEM permanecer idênticos.
    2. FUSÃO PERFEITA: A nova roupa deve ter o mesmo grão, foco, resolução e direção de luz da foto original.
    `.trim();

    const parts: any[] = [
        { text: prompt },
        { inlineData: { data: cleanBase, mimeType: 'image/png' } }
    ];

    garments.forEach(g => {
        if (g.refImage) {
            const cleanRef = g.refImage.split(',')[1] || g.refImage;
            parts.push({ text: `REFERÊNCIA VISUAL PARA (${g.type}) - Copiar estilo e design:` });
            parts.push({ inlineData: { data: cleanRef, mimeType: 'image/png' } });
        }
    });

    try {
        const response = await ai.models.generateContent({
            model: MODEL_GEN,
            contents: { parts },
            config: {
                imageConfig: { aspectRatio: aspectRatio as any }
            }
        });

        const images: string[] = [];
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    images.push(`data:image/png;base64,${part.inlineData.data}`);
                }
            }
        }
        return images;
    } catch (error) {
        handleApiError(error);
        return [];
    }
};
