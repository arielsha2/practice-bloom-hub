import { MessageCircle, Search, Stethoscope, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DiagnosisStepperProps {
  currentStage: number;
}

const steps = [
  { stage: 1, icon: MessageCircle, labelKey: 'stepper.diagnosisOpening' },
  { stage: 2, icon: Search, labelKey: 'stepper.diagnosisExploration' },
  { stage: 3, icon: Stethoscope, labelKey: 'stepper.diagnosisResult' },
  { stage: 4, icon: ArrowRight, labelKey: 'stepper.diagnosisNextStep' },
];

export function DiagnosisStepper({ currentStage }: DiagnosisStepperProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStage > step.stage;
          const isActive = currentStage === step.stage;

          return (
            <div key={step.stage} className="flex items-center flex-1 last:flex-initial">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isActive && 'bg-primary/20 text-primary ring-2 ring-primary/40',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    isActive && 'text-primary',
                    isCompleted && 'text-primary/70',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {t(step.labelKey)}
                </span>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 mt-[-1rem] transition-all duration-300',
                    currentStage > step.stage ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
