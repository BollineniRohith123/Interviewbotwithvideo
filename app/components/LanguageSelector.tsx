'use client';
import React, { useState } from 'react';
import Image from 'next/image';

interface Language {
  id: string;
  name: string;
}

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  languages, 
  selectedLanguage, 
  onSelectLanguage,
  disabled = false
}) => {
  const [hoveredLanguage, setHoveredLanguage] = useState<string | null>(null);

  // Language icons with custom styling
  const languageIcons: Record<string, { icon: string, bgClass: string, shadowClass: string }> = {
    'python': {
      icon: '🐍',
      bgClass: 'bg-gradient-to-br from-blue-100 to-green-100',
      shadowClass: 'shadow-blue-200'
    },
    'java': {
      icon: '☕',
      bgClass: 'bg-gradient-to-br from-orange-100 to-red-50',
      shadowClass: 'shadow-orange-200'
    },
    'javascript': {
      icon: '📜',
      bgClass: 'bg-gradient-to-br from-yellow-100 to-amber-50',
      shadowClass: 'shadow-yellow-200'
    },
    'csharp': {
      icon: '#️⃣',
      bgClass: 'bg-gradient-to-br from-purple-100 to-indigo-50',
      shadowClass: 'shadow-purple-200'
    }
  };
  
  return (
    <div data-testid="language-selector">
      <div className="flex items-center mb-4">
        <div className="w-1.5 h-8 bg-deep-purple rounded-full mr-3"></div>
        <h2 className="text-xl font-bold text-gradient-purple">Select Programming Language</h2>
      </div>
      
      <p className="text-sm text-medium-purple mb-6 pl-5">
        Choose a programming language to begin your personalized interview session.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-6">
        {languages.map((language) => {
          const isSelected = selectedLanguage === language.id;
          const isHovered = hoveredLanguage === language.id;
          const iconStyle = languageIcons[language.id] || { 
            icon: '💻', 
            bgClass: 'bg-gradient-to-br from-gray-100 to-gray-50',
            shadowClass: 'shadow-gray-200'
          };
          
          return (
            <button
              key={language.id}
              onClick={() => onSelectLanguage(language.id)}
              onMouseEnter={() => setHoveredLanguage(language.id)}
              onMouseLeave={() => setHoveredLanguage(null)}
              disabled={disabled}
              aria-pressed={isSelected}
              data-testid={`language-option-${language.id}`}
              className={`
                relative group flex flex-col items-center justify-center p-5 rounded-xl border-2 
                transition-all duration-300
                ${isSelected 
                  ? 'border-medium-purple bg-lavender text-deep-purple shadow-lg scale-105 z-10' 
                  : 'border-lavender hover:border-medium-purple hover:bg-neutral-bg text-medium-purple hover:shadow-md'}
                ${disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer transform hover:-translate-y-1'}
                focus:outline-none focus:ring-2 focus:ring-medium-purple focus:ring-opacity-50
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-deep-purple text-white text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              
              {/* Language icon with animated background */}
              <div 
                className={`
                  w-16 h-16 rounded-full mb-4 flex items-center justify-center
                  ${iconStyle.bgClass} ${isSelected ? `shadow-lg ${iconStyle.shadowClass}` : ''}
                  transition-all duration-300 
                  ${isSelected || isHovered ? 'scale-110' : ''}
                  overflow-hidden relative
                `}
              >
                {/* Animated ring for selected language */}
                {isSelected && (
                  <div className="absolute inset-0 border-4 border-medium-purple rounded-full animate-[spin_8s_linear_infinite]"></div>
                )}
                <span className="text-4xl relative z-10">{iconStyle.icon}</span>
              </div>
              
              {/* Language name with highlight effect on selected */}
              <span className={`
                font-medium transition-all duration-300
                ${isSelected ? 'text-deep-purple text-lg' : 'text-medium-purple group-hover:text-deep-purple'}
              `}>
                {language.name}
              </span>
              
              {/* Little decorative element */}
              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-t-full bg-medium-purple"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Selected language indicator */}
      {selectedLanguage && (
        <div className="mt-6 px-4 py-2 bg-neutral-bg/50 border border-lavender rounded-lg inline-block animate-[fadeIn_0.5s_ease]">
          <span className="text-xs uppercase tracking-wide text-deep-purple font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {languages.find(lang => lang.id === selectedLanguage)?.name} selected
          </span>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
