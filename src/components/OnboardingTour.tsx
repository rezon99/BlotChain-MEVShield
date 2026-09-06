import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, Layers, ShieldAlert, Rotate3d, CheckCircle2, EyeOff } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchMode?: (mode: '2d' | '3d' | 'vr' | 'threat3d') => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  targetMode?: '2d' | '3d' | 'vr' | 'threat3d';
  tips: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to BlotChain!',
    subtitle: 'Multi-dimensional Liquidity & MEV Security Monitoring',
    description: 'BlotChain combines real-time crypto analytics with advanced visualization across 2D Canvas, 3D WebGL Space, WebXR VR, and a specialized MEV Intent Threat detection engine.',
    icon: Sparkles,
    iconColor: 'text-blue-400',
    tips: [
      'Live data streaming from CoinGecko API with an autonomous fallback simulator if offline',
      'Interface panels are collapsed or docked by default to maximize viewport visibility'
    ]
  },
  {
    title: '4 Visualization Modes',
    subtitle: 'Seamless switcher in the top navigation bar',
    description: 'Toggle effortlessly between 2D Dashboard, 3D Space, VR Space, and the dedicated THREAT 3D view for intent mempool and sandwich attack telemetry.',
    icon: Layers,
    iconColor: 'text-indigo-400',
    targetMode: 'threat3d',
    tips: [
      'The "MEV / THREAT 3D" button is located immediately beside the VR toggle',
      'In collapsed header mode, quick buttons allow 1-click switching between 2D, 3D, VR, and MEV'
    ]
  },
  {
    title: '3D Camera & Spatial Navigation',
    subtitle: 'Interactive OrbitControls',
    description: 'In 3D Space and Threat 3D modes, freely explore the topological graphs of inter-pool contagion and intent payloads.',
    icon: Rotate3d,
    iconColor: 'text-cyan-400',
    tips: [
      'Click and drag with Left Mouse Button to rotate the spatial scene',
      'Use the mouse scroll wheel or pinch gesture to zoom in and out',
      'Click on any sphere node to inspect full transaction and pool telemetry'
    ]
  },
  {
    title: 'MEV Threat Detection (ThreatVisualizer3D)',
    subtitle: 'Real-time detection of sandwich attacks, frontrunning, and toxic flow',
    description: 'The ThreatVisualizer3D engine continuously evaluates block risk. When risk exceeds your trigger threshold (riskThreshold ≥ 0.70), an interactive Threat HUD alerts you with protective measures.',
    icon: ShieldAlert,
    iconColor: 'text-red-400',
    targetMode: 'threat3d',
    tips: [
      'Pulsing red nodes represent detected MEV searcher bots and compromised liquidity pools',
      'The interactive Attack Simulator allows 1-click testing of sandwiching, frontrunning, and JIT flows'
    ]
  },
  {
    title: 'Streamlined, Uncluttered Interface',
    subtitle: 'Docked and collapsible controls',
    description: 'Legends, category filters, attack scenario selectors, and feed controls are neatly minimized into floating badges. Click any badge to expand.',
    icon: EyeOff,
    iconColor: 'text-emerald-400',
    tips: [
      'Click the "User Guide" button anytime to view full architectural documentation',
      'You can re-launch this walkthrough tour anytime via the Sparkles icon in the header'
    ]
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onSwitchMode }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;
  const isFirst = currentStepIndex === 0;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('blotchain_onboarding_completed', 'true');
      onClose();
    } else {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextStep = TOUR_STEPS[nextIndex];
      if (nextStep.targetMode && onSwitchMode) {
        onSwitchMode(nextStep.targetMode);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      const prevStep = TOUR_STEPS[prevIndex];
      if (prevStep.targetMode && onSwitchMode) {
        onSwitchMode(prevStep.targetMode);
      }
    }
  };

  const handleSkip = () => {
    localStorage.setItem('blotchain_onboarding_completed', 'true');
    onClose();
  };

  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Top Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 flex">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= currentStepIndex ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-slate-800 border border-slate-700 ${currentStep.iconColor}`}>
                <StepIcon size={24} />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleSkip}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="text-xs font-semibold text-indigo-400 mb-2">
            {currentStep.subtitle}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {currentStep.description}
          </p>

          {/* Key Tips */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2 mb-6">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Key Highlights:
            </div>
            {currentStep.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-blue-400 font-bold">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
            >
              Skip
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all"
              >
                {isLast ? (
                  <>Get Started <CheckCircle2 size={14} /></>
                ) : (
                  <>Next <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
