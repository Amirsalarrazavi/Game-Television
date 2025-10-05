import { useState } from 'react';
import { Smartphone, Tv, Users, HelpCircle, ArrowRight } from 'lucide-react';
import { t } from '../../lib/translations';
import type { Language } from '../../lib/types';

interface OnboardingTourProps {
  language: Language;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ language, onComplete, onSkip }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Smartphone className="w-24 h-24 text-blue-500" />,
      title: t('onboarding.step1', language),
      description: language === 'fa'
        ? 'موبایل شما مثل دسته بازی کار می‌کنه'
        : 'Use your phone like a game controller',
    },
    {
      icon: <Tv className="w-24 h-24 text-purple-500" />,
      title: t('onboarding.step2', language),
      description: language === 'fa'
        ? 'همه چیز روی تلویزیون نشون داده میشه'
        : 'Everything appears on the TV screen',
    },
    {
      icon: <Users className="w-24 h-24 text-green-500" />,
      title: t('onboarding.step3', language),
      description: language === 'fa'
        ? 'نوبتی با دوستات بازی کن'
        : 'Take turns with your friends',
    },
    {
      icon: <HelpCircle className="w-24 h-24 text-orange-500" />,
      title: t('onboarding.step4', language),
      description: language === 'fa'
        ? 'همیشه می‌تونی از دکمه راهنما استفاده کنی'
        : 'Help is always available with ? button',
    },
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6 animate-bounce">
            {currentStep.icon}
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {currentStep.title}
          </h2>
          <p className="text-xl text-gray-600">
            {currentStep.description}
          </p>
        </div>

        <div className="flex gap-2 justify-center mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-3 rounded-full transition-all ${
                index === step
                  ? 'w-8 bg-blue-500'
                  : 'w-3 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onSkip}
            className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-300 transition text-lg"
          >
            {t('onboarding.skip', language)}
          </button>
          <button
            onClick={nextStep}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 rounded-2xl hover:shadow-xl transition text-lg flex items-center justify-center gap-2"
          >
            {step === steps.length - 1
              ? t('onboarding.start', language)
              : <><span>{language === 'fa' ? 'بعدی' : 'Next'}</span><ArrowRight className="w-5 h-5" /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
