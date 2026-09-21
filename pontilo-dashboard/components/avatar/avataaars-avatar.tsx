"use client"

import React, { useState, useEffect } from 'react';

interface AvataaarsWrapperProps {
  config: any;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AvataaarsAvatar - Componente Robusto para React 19
 * 
 * A biblioteca 'avataaars' original possui bugs de lifecycle (UNSAFE_componentWillMount)
 * que são incompatíveis com o motor de renderização do React 19, causando o erro 
 * 'addStateChangeListener'.
 * 
 * Para garantir estabilidade total e manter o visual original solicitado, 
 * este componente utiliza a API oficial avataaars.io que gera exatamente o mesmo 
 * SVG/PNG usando os mesmos parâmetros da lib original.
 */
export default function AvataaarsAvatar({ config, className, style }: AvataaarsWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full rounded-full bg-gray-100 animate-pulse" />;
  }

  // Mapeamento de propriedades para a API oficial
  const params = new URLSearchParams({
    avatarStyle: config.avatarStyle || 'Circle',
    topType: config.topType || 'NoHair',
    accessoriesType: config.accessoriesType || 'Blank',
    hairColor: config.hairColor || 'BrownDark',
    facialHairType: config.facialHairType || 'Blank',
    clotheType: config.clotheType || 'ShirtCrewNeck',
    clotheColor: config.clotheColor || 'Blue03',
    graphicType: config.graphicType || 'Blank',
    eyeType: config.eyeType || 'Default',
    eyebrowType: config.eyebrowType || config.eyebrow || 'Default',
    mouthType: config.mouthType || 'Smile',
    skinColor: config.skinColor || 'Light',
  });

  const avatarUrl = `https://avataaars.io/?${params.toString()}`;

  return (
    <div 
      className={className} 
      style={{ 
        ...style, 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <img 
        src={avatarUrl} 
        alt="Avatar" 
        className="w-full h-full object-contain"
        loading="lazy"
        onLoad={(e) => {
          (e.target as HTMLImageElement).style.opacity = '1';
        }}
        style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
      />
    </div>
  );
}
