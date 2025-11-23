import React, { useState } from 'react';
import { AppSection } from './types';
import { Creator } from './components/sections/Creator';
import { Analyst } from './components/sections/Analyst';
import { Editor } from './components/sections/Editor';
import { Swapper } from './components/sections/Swapper';
import { NeuButton, NeuCard } from './components/NeuComponents';
import { ImagePlus, ScanEye, Edit3, Shirt, Box, Menu, Palette, Scissors, Layers, Zap, Maximize, PenTool, Sun, Grid, Sparkles, Smile, Pencil, MonitorPlay, Sticker, QrCode, Sofa, Brush, BrickWall, Clapperboard, UserCircle, ImageMinus, SwitchCamera, Hourglass, Grid3x3, Anchor, Film, Laugh, ShoppingBag, Briefcase, Mountain, Users, AppWindow, Gamepad2, Play, BookOpen, BarChart, Presentation, Type, Scan, Ruler, Car, Eye, Wind, Dog, FileEdit } from 'lucide-react';

const App = () => {
  const [section, setSection] = useState<AppSection>(AppSection.CREATOR);
  const [menuOpen, setMenuOpen] = useState(false);

  const renderSection = () => {
    switch (section) {
      case AppSection.CREATOR: return <Creator onNavigate={(s) => setSection(s)} />;
      case AppSection.ANALYST: return <Analyst />;
      case AppSection.EDITOR: return <Editor />;
      case AppSection.SWAPPER: return <Swapper />;
      case AppSection.EXTRAS: return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NeuCard title="Em Breve: Color Grading" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Palette size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Filtros de cinema e ajuste de cores via IA (LUTs generativos).</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Content-Aware Fill" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Scissors size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Remoção inteligente de objetos indesejados mantendo o fundo.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Editor por Camadas" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Layers size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Separação automática de background e personagem.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Batch Processor" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Zap size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Processamento em lote para e-commerce e catálogos.</p>
                </div>
            </NeuCard>
            
            {/* Previously Added Tools */}
            <NeuCard title="Em Breve: Upscale 4K" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Maximize size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Super-resolução para impressão e grandes formatos.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Vetorizador (SVG)" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <PenTool size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Converta logos e ilustrações para vetor editável.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Relighting 3D" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Sun size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Altere a direção da luz e sombras na imagem.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Estamparia IA" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Grid size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Geração de patterns contínuos (seamless) para tecidos.</p>
                </div>
            </NeuCard>

            {/* New Tools Added Request */}
            <NeuCard title="Em Breve: Prompt Magic" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Sparkles size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Otimize e enriqueça prompts simples automaticamente.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Face Restore" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Smile size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Restaure rostos antigos, borrados ou com baixa qualidade.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Sketch to Art" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Pencil size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Transforme rascunhos feitos à mão em arte final.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Video Gen (Alpha)" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <MonitorPlay size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Criação de clipes curtos animados a partir de texto.</p>
                </div>
            </NeuCard>

            {/* 8 NEW Tools requested previously */}
            <NeuCard title="Em Breve: Sticker Maker" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Sticker size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Criação de adesivos/stickers com contorno branco automático.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: QR Code Art" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <QrCode size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">QR Codes funcionais camuflados em arte visual incrível.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Interior Design" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Sofa size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Redecore ambientes mantendo a estrutura do cômodo.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Colorização" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Brush size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Colorir fotos preto e branco automaticamente.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Texturas PBR" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <BrickWall size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Gerador de mapas de textura (Normal, Specular) para 3D.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Anime Converter" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Clapperboard size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Transforme fotos reais em estilo Anime/Mangá.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Criador de Avatar" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <UserCircle size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Geração de avatares consistentes para redes sociais.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Removedor de Fundo" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <ImageMinus size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Remoção de fundo profissional com 1 clique.</p>
                </div>
            </NeuCard>

            {/* 8 LATEST Tools requested */}
            <NeuCard title="Em Breve: Face Swap" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <SwitchCamera size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Troque rostos entre fotos com realismo.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Máquina do Tempo" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Hourglass size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Veja como você ficará mais velho ou mais jovem.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Pixel Art" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Grid3x3 size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Converta imagens em arte 8-bit ou 16-bit.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Tattoo Studio" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Anchor size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Simule tatuagens na pele antes de fazer.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Storyboard" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Film size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Crie sequências narrativas para vídeos.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Meme Maker" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Laugh size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Crie memes virais com legendas automáticas.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Foto de Produto" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <ShoppingBag size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Cenários de estúdio perfeitos para e-commerce.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Brand Kit" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Briefcase size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Gere paletas e mockups de marca completos.</p>
                </div>
            </NeuCard>
            
            {/* 16 NEWEST Tools requested */}
            <NeuCard title="Em Breve: Gerador de Paisagens" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Mountain size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Criação de ambientes naturais e urbanos complexos.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Character Sheet" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Users size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Folha de personagem com vistas frente, costas e lado.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Ícones de App" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <AppWindow size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Gerador de ícones 3D/Flat para iOS e Android.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Game Assets" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Gamepad2 size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Sprites e texturas para desenvolvimento de jogos.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Thumbnail Maker" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Play size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Capas chamativas para vídeos do YouTube.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Comic Creator" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <BookOpen size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Geração de tirinhas e páginas de quadrinhos.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Infográficos" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <BarChart size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Transforme dados em gráficos visuais atraentes.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Slide Designer" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Presentation size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Layouts criativos para apresentações (PPT).</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Efeitos de Texto" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Type size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Tipografia 3D, neon e estilizada.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Mapa de Profundidade" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Scan size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Crie mapas de depth para 3D e paralaxe.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Blueprints" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Ruler size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Plantas baixas e esquemas técnicos arquitetônicos.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Concept Auto" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Car size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Design automotivo e de veículos futuristas.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Virtual Makeup" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Eye size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Teste maquiagens e estilos cosméticos.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Hair Styler" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Wind size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Simulação de cortes e cores de cabelo.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Pet Portraits" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <Dog size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Retratos artísticos estilizados de seus pets.</p>
                </div>
            </NeuCard>
            <NeuCard title="Em Breve: Livro de Colorir" className="opacity-70">
                <div className="flex flex-col items-center p-4 text-center">
                    <FileEdit size={48} className="text-neu-accent mb-4"/>
                    <p className="text-sm">Transforme fotos em traços (line art) para pintar.</p>
                </div>
            </NeuCard>

        </div>
      );
      default: return <Creator onNavigate={(s) => setSection(s)} />;
    }
  };

  const NavItem = ({ s, icon: Icon, label }: any) => (
    <NeuButton 
        active={section === s} 
        onClick={() => { setSection(s); setMenuOpen(false); }}
        className="w-full justify-start mb-4"
    >
        <Icon size={20} /> {label}
    </NeuButton>
  );

  return (
    <div className="min-h-screen bg-neu-base p-4 lg:p-8 font-sans text-neu-text selection:bg-neu-accent selection:text-white">
      
      {/* Header Mobile */}
      <div className="lg:hidden flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-neu-text tracking-tight">Imagine<span className="text-neu-accent">Imagem</span></h1>
        <NeuButton onClick={() => setMenuOpen(!menuOpen)} className="!p-3">
            <Menu />
        </NeuButton>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Navigation */}
        <div className={`
            lg:col-span-2 lg:block 
            ${menuOpen ? 'block' : 'hidden'}
        `}>
            <div className="hidden lg:block mb-10">
                <h1 className="text-2xl font-extrabold text-neu-text tracking-tight">Imagine<span className="text-neu-accent">Imagem</span></h1>
            </div>
            <nav>
                <NavItem s={AppSection.CREATOR} icon={ImagePlus} label="Criador" />
                <NavItem s={AppSection.ANALYST} icon={ScanEye} label="Analista" />
                <NavItem s={AppSection.EDITOR} icon={Edit3} label="Editor" />
                <NavItem s={AppSection.SWAPPER} icon={Shirt} label="Roupas" />
                <NavItem s={AppSection.EXTRAS} icon={Box} label="Extras" />
            </nav>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-10">
            {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default App;