import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

interface GestureControllerProps {
  onTriggerFirework: (x: number, y: number) => void;
  isEnabled: boolean;
}

const GestureController: React.FC<GestureControllerProps> = ({ onTriggerFirework, isEnabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mirrorVideoRef = useRef<HTMLVideoElement>(null);
  const [gestureRecognizer, setGestureRecognizer] = useState<GestureRecognizer | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  // UI States
  const [detectedGesture, setDetectedGesture] = useState<string>('None');
  const [handPosition, setHandPosition] = useState<{x: number, y: number} | null>(null);
  const [isCharged, setIsCharged] = useState(false); // Visual state for "Ready to fire"

  // Logic Refs
  const rafIdRef = useRef<number>(0);
  const lastPredictionTimeRef = useRef<number>(0);
  const lastFistTimeRef = useRef<number>(0);
  const lastFireTimeRef = useRef<number>(0);
  const isChargedRef = useRef(false); // Logic ref to avoid stale closures in loop

  // Initialize MediaPipe
  useEffect(() => {
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setGestureRecognizer(recognizer);
        setIsModelLoading(false);
      } catch (error) {
        console.error("Failed to load MediaPipe model:", error);
        setCameraError("Failed to load gesture magic.");
        setIsModelLoading(false);
      }
    };

    if (isEnabled && !gestureRecognizer) {
      loadModel();
    }
  }, [isEnabled, gestureRecognizer]);

  // Start Camera
  useEffect(() => {
    if (!isEnabled || !gestureRecognizer) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        
        // Also set the mirror video immediately if available
        if (mirrorVideoRef.current) {
          mirrorVideoRef.current.srcObject = stream;
          mirrorVideoRef.current.play();
        }

      } catch (err) {
        console.error("Camera access denied:", err);
        setCameraError("Camera access needed for magic.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isEnabled, gestureRecognizer]);

  // Detection Loop
  useEffect(() => {
    if (!isEnabled || !gestureRecognizer || !videoRef.current) return;

    const predict = () => {
      const now = Date.now();
      
      // THROTTLE: Only run detection every 80ms (~12fps) to save CPU for fireworks
      if (now - lastPredictionTimeRef.current < 80) {
        rafIdRef.current = requestAnimationFrame(predict);
        return;
      }
      lastPredictionTimeRef.current = now;

      if (videoRef.current && videoRef.current.readyState === 4) {
        const results = gestureRecognizer.recognizeForVideo(videoRef.current, now);

        if (results.gestures.length > 0) {
          const gestureName = results.gestures[0][0].categoryName;
          const landmarks = results.landmarks[0];
          
          setDetectedGesture(gestureName);

          // Get hand position (Index 9 = Middle Finger MCP)
          if (landmarks && landmarks.length > 9) {
            const mcp = landmarks[9];
            // Mirror X coordinate
            const x = (1 - mcp.x) * window.innerWidth;
            const y = mcp.y * window.innerHeight;
            setHandPosition({ x, y });
            
            // --- TRIGGER LOGIC ---
            
            // 1. CHARGING: Hand is closed
            if (gestureName === "Closed_Fist") {
              lastFistTimeRef.current = now;
              isChargedRef.current = true;
              setIsCharged(true);
            } 
            
            // 2. FIRING: Hand is open AND was closed recently (within 1 second)
            else if (gestureName === "Open_Palm") {
              const timeSinceFist = now - lastFistTimeRef.current;
              
              // We check isChargedRef to see if we came from a fist state
              // We also allow a 1000ms grace period where "None" frames might have happened in between
              if (isChargedRef.current && timeSinceFist < 1000) {
                
                // Cooldown check to prevent machine-gunning
                if (now - lastFireTimeRef.current > 600) {
                  onTriggerFirework(x, y);
                  lastFireTimeRef.current = now;
                  
                  // Reset charge after firing
                  isChargedRef.current = false; 
                  setIsCharged(false);
                }
              } else {
                // If it's been too long since fist, lose charge
                if (timeSinceFist > 1000) {
                   isChargedRef.current = false;
                   setIsCharged(false);
                }
              }
            }
          }
        } else {
          // No hand detected
          setDetectedGesture('None');
          setHandPosition(null);
          // Don't immediately reset charge, allow for brief tracking loss
          if (Date.now() - lastFistTimeRef.current > 1000) {
             isChargedRef.current = false;
             setIsCharged(false);
          }
        }
      }
      rafIdRef.current = requestAnimationFrame(predict);
    };

    rafIdRef.current = requestAnimationFrame(predict);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [isEnabled, gestureRecognizer, onTriggerFirework]);

  if (!isEnabled) return null;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
      {/* Hidden Video for MediaPipe Processing */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Loading Indicator */}
      {isModelLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#D4AF37] font-serif text-xl animate-pulse bg-black/80 p-4 rounded-xl border border-[#D4AF37]">
          Conjuring Spirits...
        </div>
      )}

      {/* Error Message */}
      {cameraError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-red-400 bg-black/80 px-4 py-2 rounded border border-red-900 font-serif">
          {cameraError}
        </div>
      )}

      {/* Scrying Mirror (Always Visible if no error) */}
      {!cameraError && !isModelLoading && (
        <div className="absolute bottom-6 left-6 w-36 h-36 sm:w-48 sm:h-48 rounded-full border-[3px] border-[#D4AF37]/60 overflow-hidden shadow-[0_0_25px_rgba(212,175,55,0.2)] bg-black/80 backdrop-blur-md pointer-events-auto transition-all duration-300 hover:scale-105 hover:border-[#D4AF37]">
          <video 
            ref={mirrorVideoRef}
            className="w-full h-full object-cover transform scale-x-[-1] opacity-70 mix-blend-screen" 
            playsInline 
            muted 
          />
          {/* Decorative Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 border-[4px] border-black/20 rounded-full pointer-events-none" />
          <div className="absolute bottom-3 w-full text-center text-[9px] text-[#F7E7CE] font-serif uppercase tracking-[0.2em] drop-shadow-lg opacity-90">
            Scrying Mirror
          </div>
        </div>
      )}

      {/* Magical Cursor */}
      {handPosition && !cameraError && (
        <div 
          className="absolute w-16 h-16 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out flex items-center justify-center"
          style={{ left: handPosition.x, top: handPosition.y }}
        >
          {/* Outer Ring - Spins based on charge */}
          <div className={`absolute inset-0 rounded-full border border-[#D4AF37] opacity-60 transition-all duration-300 
            ${isCharged ? 'scale-75 border-2 animate-spin' : 'scale-100 animate-spin-slow'}`} 
          />
          
          {/* Core - Pulses when charging */}
          <div className={`rounded-full bg-[#F7E7CE] shadow-[0_0_20px_#D4AF37] transition-all duration-300
            ${isCharged ? 'w-4 h-4 scale-125 bg-red-200' : 'w-2 h-2 scale-100'}`} 
          />

          {/* Particle Effects (CSS only for cursor) */}
          <div className={`absolute inset-0 rounded-full border border-[#D4AF37]/30 scale-150 animate-ping opacity-20`} />
          
          {/* State Text */}
          <div className={`absolute top-full mt-3 text-[10px] font-serif tracking-widest whitespace-nowrap transition-colors duration-300
            ${isCharged ? 'text-[#F7E7CE] drop-shadow-[0_0_5px_#D4AF37]' : 'text-[#D4AF37]/70'}`}>
            {isCharged ? 'RELEASE TO FIRE' : 'HOLD FIST'}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestureController;