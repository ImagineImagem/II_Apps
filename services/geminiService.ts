import { GoogleGenAI } from "@google/genai";

// Initialize API client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const apiKey = process.env.API_KEY;

// Debug log to check if key is loaded (Masked for security)
if (!apiKey) {
    console.warn("⚠️ API Key is missing in process.env.API_KEY");
} else {
    console.log(`✅ API Key loaded: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// Using Flash models which generally provide faster inference.
const MODEL_GEN = 'gemini-2.5-flash-image'; 
const MODEL_ANALYZE = 'gemini-2.5-flash';

// Helper to parse API errors
const handleApiError = (error: any) => {
    console.error("Gemini API Error (Raw):", error);
    
    let errorMsg = error.message || error.toString();
    
    // Tenta detectar se a mensagem de erro é um JSON stringificado (comum no SDK quando retorna 429)
    try {
        if (typeof errorMsg === 'string' && (errorMsg.includes('{') || errorMsg.includes('['))) {
            // Tenta extrair a parte JSON se houver texto antes
            const jsonStart = errorMsg.indexOf('{');
            if (jsonStart !== -1) {
                const jsonStr = errorMsg.substring(jsonStart);
                const parsed = JSON.parse(jsonStr);
                
                // Verifica estrutura de erro do Google
                if (parsed.error) {
                    if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
                        throw new Error("⚠️ LIMITE DE VELOCIDADE (15 RPM). O plano gratuito permite poucas requisições por minuto. Reduza a 'Quantidade' para 1 e aguarde 60 segundos.");
                    }
                    if (parsed.error.message) {
                        // Se for outro erro, usa a mensagem interna limpa
                        errorMsg = parsed.error.message;
                    }
                }
            }
        }
    } catch (e) {
        // Falha no parse do JSON, continua com a string original
    }

    // Verifica palavras-chave na string final
    if (
        errorMsg.includes('429') || 
        errorMsg.includes('RESOURCE_EXHAUSTED') || 
        errorMsg.includes('Quota exceeded')
    ) {
        throw new Error("⚠️ COTA/VELOCIDADE EXCEDIDA. Aguarde 1 minuto. O plano gratuito tem limite de requisições por minuto (RPM).");
    }
    
    // Verifica falta de chave ou chave inválida
    if (errorMsg.includes('API Key not found') || errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('403')) {
        throw new Error("⚠️ Erro de Autenticação: Chave de API inválida. Verifique se a variável 'API_KEY' está correta no Vercel e faça um REDEPLOY.");
    }

    // Se ainda parecer um JSON sujo, lança erro genérico
    if (errorMsg.trim().startsWith('{')) {
         throw new Error("Erro de comunicação com a IA. Tente simplificar o prompt.");
    }

    throw new Error(errorMsg);
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
  if (!process.env.API_KEY) throw new Error("API Key não encontrada. Configure a API_KEY no Vercel e faça o Redeploy.");

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
    
    // Flatten results into a single array of base64 strings
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
  if (!process.env.API_KEY) throw new Error("API Key not found");
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
     if (!process.env.API_KEY) throw new Error("API Key not found");
     
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
           3. Se a imagem original tem um estilo específico (ex: desenho, foto antiga), a edição deve seguir esse mesmo estilo.
        `;

        parts.push({ text: instruction });
        parts.push({ inlineData: { data: cleanOrg, mimeType: 'image/png' } });
        parts.push({ inlineData: { data: cleanMask, mimeType: 'image/png' } });
     } else {
        // No mask, general edit based on original
        const instruction = `
            Edição da imagem mantendo a estrutura original. 
            Instrução: "${prompt}".
            
            CONTEXTO DE ESTILO:
            ${context}

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
    if (!process.env.API_KEY) throw new Error("API Key not found");

    const cleanBase = baseImageBase64.split(',')[1] || baseImageBase64;
    
    // Improved Prompt Construction logic to handle empty descriptions and reference priority
    const changes = garments.map(g => {
        const hasRef = !!g.refImage;
        let desc = g.description;
        
        // Fallback for Vestido or any garment without description but with ref
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
    
    LISTA DE ALTERAÇÕES:
    ${changes}
    
    REGRAS DE EXECUÇÃO OBRIGATÓRIAS:
    1. INTEGRIDADE ABSOLUTA: O rosto, cabelo, pose, fundo e iluminação DEVEM permanecer idênticos.
    2. VESTIDO (Se solicitado): Se a troca for "Vestido" ou "Traje Completo", você DEVE remover visualmente a blusa e a calça/saia atuais e renderizar o vestido cobrindo o corpo inteiro (torso e pernas) conforme a referência.
    3. FUSÃO PERFEITA: A nova roupa deve ter o mesmo grão, foco, resolução e direção de luz da foto original.
    4. REFERÊNCIAS: Se houver imagem de referência para a peça, copie o padrão, tecido, decote e comprimento fielmente.
    `.trim();

    const parts: any[] = [
        { text: prompt },
        { inlineData: { data: cleanBase, mimeType: 'image/png' } }
    ];

    // Add reference images for garments if they exist
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
