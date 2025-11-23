import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface NeuCardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
}

export const NeuCard: React.FC<NeuCardProps> = ({ children, className = '', title }) => (
  <div className={`bg-neu-base shadow-neu-out rounded-3xl p-6 ${className}`}>
    {title && <h3 className="text-neu-text font-bold text-lg mb-4">{title}</h3>}
    {children}
  </div>
);

interface NeuButtonProps {
  onClick?: (e?: React.MouseEvent) => void;
  children?: React.ReactNode;
  className?: string;
  active?: boolean;
  disabled?: boolean;
}

export const NeuButton: React.FC<NeuButtonProps> = ({ onClick, children, className = '', active = false, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 select-none
      ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''}
      ${active 
        ? 'bg-neu-base shadow-neu-pressed text-neu-accent' 
        : 'bg-neu-base shadow-neu-out text-neu-text hover:text-neu-accent active:shadow-neu-pressed'}
      ${className}
    `}
  >
    {children}
  </button>
);

export const NeuInput = ({ value, onChange, placeholder, type = "text", className = '' }: any) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full bg-neu-base shadow-neu-in rounded-xl px-4 py-3 outline-none text-neu-text placeholder-neu-dark focus:text-neu-accent transition-colors ${className}`}
  />
);

export const NeuTextArea = ({ value, onChange, placeholder, rows = 3 }: any) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full bg-neu-base shadow-neu-in rounded-xl px-4 py-3 outline-none text-neu-text placeholder-neu-dark focus:text-neu-accent transition-colors resize-none"
  />
);

export const NeuSelect = ({ value, onChange, options, label }: any) => (
  <div className="flex flex-col gap-2">
    {label && <span className="text-xs font-bold text-neu-dark ml-2">{label}</span>}
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-neu-base shadow-neu-out rounded-xl px-4 py-3 outline-none text-neu-text appearance-none cursor-pointer focus:text-neu-accent"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neu-dark">▼</div>
    </div>
  </div>
);

interface NeuMultiSelectProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
}

export const NeuMultiSelect: React.FC<NeuMultiSelectProps> = ({ label, options, selected, onChange, placeholder = "Selecione..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-2 w-full relative" ref={containerRef}>
            <span className="text-xs font-bold text-neu-dark ml-2">{label}</span>
            
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full bg-neu-base rounded-xl px-4 py-3 outline-none text-left flex justify-between items-center transition-all
                    ${isOpen ? 'shadow-neu-pressed text-neu-accent' : 'shadow-neu-out text-neu-text'}
                `}
            >
                <span className="truncate text-sm">
                    {selected.length > 0 
                        ? `${selected.length} selecionado(s): ${selected.slice(0, 2).join(', ')}${selected.length > 2 ? '...' : ''}` 
                        : placeholder}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-neu-base shadow-neu-out rounded-xl z-50 max-h-60 overflow-y-auto p-2 border border-neu-light/50">
                    {options.map((option) => {
                        const isSelected = selected.includes(option);
                        return (
                            <div 
                                key={option}
                                onClick={() => toggleOption(option)}
                                className={`
                                    cursor-pointer p-3 rounded-lg text-sm flex items-center justify-between mb-1 transition-all
                                    ${isSelected ? 'bg-neu-base shadow-neu-in text-neu-accent font-bold' : 'hover:bg-white/30 text-neu-text'}
                                `}
                            >
                                <span>{option}</span>
                                {isSelected && <Check size={14} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const NeuSlider = ({ value, min, max, step, onChange, label }: any) => (
  <div className="flex flex-col gap-2 w-full">
    <div className="flex justify-between ml-2 mr-2">
        <span className="text-xs font-bold text-neu-dark">{label}</span>
        <span className="text-xs font-bold text-neu-accent">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="w-full h-2 bg-neu-base shadow-neu-in rounded-lg appearance-none cursor-pointer accent-neu-accent"
    />
  </div>
);