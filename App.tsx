import React, { useState, useRef } from 'react';
import FireworkCanvas, { FireworkCanvasHandle } from './components/FireworkCanvas';
import GestureController from './components/GestureController';
import { FireworkConfig } from './types';
import { BACKGROUND_IMAGE_URL, ARCANA_PRESETS } from './constants';
import { 
  PlayIcon, 
  PauseIcon, 
  SparklesIcon,
  BookOpenIcon,
  XMarkIcon,
  HandRaisedIcon
} from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [currentConfig, setCurrentConfig] = useState<FireworkConfig>(ARCANA_PRESETS[0]);
  const [isAutoFire, setIsAutoFire] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isGestureMode, setIsGestureMode] = useState(false);

  const fireworkRef = useRef<FireworkCanvasHandle>(null);

  const handleSelectPreset = (index: number) => {
    setActiveCardIndex(index);
    setCurrentConfig(ARCANA_PRESETS[index]);
  };

  const handleGestureTrigger = (x: number, y: number) => {
    if (fireworkRef.current) {
      fireworkRef.current.launchRocket(x, y);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-gray-200 font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }}
      />
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-0 pointer-events-none" />

      {/* Main Canvas */}
      <FireworkCanvas ref={fireworkRef} currentConfig={currentConfig} isAutoFire={isAutoFire} />

      {/* Gesture Controller Layer */}
      <GestureController isEnabled={isGestureMode} onTriggerFirework={handleGestureTrigger} />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 sm:p-8">
        
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="relative border-l-4 border-[#D4AF37] pl-4 py-2 bg-black/40 backdrop-blur-md rounded-r-lg">
             <h1 className="text-4xl sm:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-[#F7E7CE] to-[#D4AF37] drop-shadow-sm tracking-widest">
               LUMIÈRE
             </h1>
             <p className="text-[#D4AF37] text-xs font-serif tracking-[0.4em] uppercase mt-1 ml-1 opacity-80">
               Grand Fireworks
             </p>
          </div>
          
          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="group relative px-4 py-2 overflow-hidden rounded-full transition-all duration-300"
          >
            <div className="absolute inset-0 w-full h-full bg-[#1a1a1a] border border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-all"></div>
            <div className="relative flex items-center gap-2 text-[#D4AF37]">
              {isPanelOpen ? (
                <>
                  <XMarkIcon className="w-5 h-5" />
                  <span className="font-serif text-sm uppercase tracking-wider">Close Grimoire</span>
                </>
              ) : (
                <>
                   <BookOpenIcon className="w-5 h-5" />
                   <span className="font-serif text-sm uppercase tracking-wider">Spells</span>
                </>
              )}
            </div>
          </button>
        </header>

        {/* Floating Controls Panel */}
        {isPanelOpen && (
          <aside className="pointer-events-auto absolute top-28 right-6 sm:right-8 w-72 md:w-80 perspective-1000 animate-in slide-in-from-right duration-500">
            <div className="relative bg-[#0a0a0c]/90 backdrop-blur-xl border border-[#D4AF37]/30 rounded-xl p-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
              
              <div className="mb-4 text-center border-b border-[#D4AF37]/20 pb-4">
                <h2 className="text-lg font-serif text-[#D4AF37] flex items-center justify-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Arcana Spells
                  <SparklesIcon className="w-4 h-4" />
                </h2>
                <p className="text-[10px] text-[#888] mt-1 font-serif uppercase tracking-widest">
                  Select a configuration
                </p>
              </div>

              {/* Spell Cards Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {ARCANA_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectPreset(idx)}
                    className={`relative group p-3 h-24 flex flex-col items-center justify-center border transition-all duration-300 rounded-lg overflow-hidden
                      ${activeCardIndex === idx 
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                        : 'border-[#333] bg-[#151515] hover:border-[#666] hover:bg-[#222]'
                      }`}
                  >
                    {/* Active Glow */}
                    {activeCardIndex === idx && (
                      <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/20 to-transparent pointer-events-none"></div>
                    )}
                    
                    <span className={`font-serif text-xs uppercase tracking-widest mb-1 z-10 ${activeCardIndex === idx ? 'text-[#F7E7CE]' : 'text-[#888] group-hover:text-[#ccc]'}`}>
                      {preset.name}
                    </span>
                    <span className="text-[9px] text-[#555] z-10">{preset.explosionType}</span>
                  </button>
                ))}
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-[#333]">
                {/* Auto Fire */}
                <button
                  onClick={() => setIsAutoFire(!isAutoFire)}
                  className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg text-xs font-bold transition-all border font-serif uppercase tracking-widest ${
                    isAutoFire 
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                      : 'bg-[#111] text-[#666] border-[#333] hover:border-[#D4AF37]/50 hover:text-[#D4AF37]'
                  }`}
                >
                  {isAutoFire ? (
                    <>
                      <PauseIcon className="w-4 h-4" />
                      <span>Ritual Active</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-4 h-4" />
                      <span>Start Ritual</span>
                    </>
                  )}
                </button>

                {/* Gesture Control */}
                <button
                  onClick={() => setIsGestureMode(!isGestureMode)}
                  className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg text-xs font-bold transition-all border font-serif uppercase tracking-widest ${
                    isGestureMode 
                      ? 'bg-[#551a8b] text-[#F7E7CE] border-[#551a8b] shadow-[0_0_15px_rgba(85,26,139,0.4)]' 
                      : 'bg-[#111] text-[#666] border-[#333] hover:border-[#551a8b]/50 hover:text-[#9370DB]'
                  }`}
                >
                  <HandRaisedIcon className="w-4 h-4" />
                  <span>{isGestureMode ? "Magic Hand On" : "Magic Hand Off"}</span>
                </button>
              </div>

            </div>
          </aside>
        )}

        {/* Footer */}
        <div className="pointer-events-none mt-auto w-full text-center">
          <p className="text-[#D4AF37]/40 text-[10px] font-serif tracking-[0.3em] uppercase">
            Click anywhere on the sky
          </p>
        </div>

      </div>
    </div>
  );
};

export default App;