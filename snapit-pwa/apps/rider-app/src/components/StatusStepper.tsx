/**
 * StatusStepper.tsx — Order lifecycle progress rail
 *
 * Shows the rider-side 5-step status flow:
 * RIDER_ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
 *
 * Emerald filled steps for completed, animated fill transition.
 */

import { motion } from 'framer-motion';
import { CheckCircle, Circle, Package, Bike, MapPin, ShoppingBag } from 'lucide-react';
import type { OrderStatus } from '../../../../shared/types/snapit-types';

interface Step {
  id: OrderStatus;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const RIDER_STEPS: Step[] = [
  {
    id: 'RIDER_ASSIGNED',
    label: 'Assigned',
    sublabel: 'Order assigned to you',
    icon: <ShoppingBag size={14} />,
  },
  {
    id: 'PICKED_UP',
    label: 'Picked Up',
    sublabel: 'Collected from store',
    icon: <Package size={14} />,
  },
  {
    id: 'OUT_FOR_DELIVERY',
    label: 'En Route',
    sublabel: 'Heading to customer',
    icon: <Bike size={14} />,
  },
  {
    id: 'DELIVERED',
    label: 'Delivered',
    sublabel: 'Handshake complete',
    icon: <MapPin size={14} />,
  },
];

const STATUS_ORDER: OrderStatus[] = [
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

function getStepIndex(status: OrderStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

interface StatusStepperProps {
  currentStatus: OrderStatus;
  className?: string;
}

export function StatusStepper({ currentStatus, className = '' }: StatusStepperProps) {
  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className={`${className}`}>
      <div className="relative">
        {/* Connector rail */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 z-0" />
        {/* Animated fill rail */}
        <motion.div
          className="absolute top-5 left-5 h-0.5 bg-emerald-500 z-0 origin-left"
          initial={{ scaleX: 0 }}
          animate={{
            width: currentIndex === 0
              ? 0
              : `${(currentIndex / (RIDER_STEPS.length - 1)) * (100 - (100 / RIDER_STEPS.length))}%`,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Steps */}
        <div className="relative z-10 flex justify-between">
          {RIDER_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                {/* Step node */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? [1, 1.12, 1] : 1,
                  }}
                  transition={{ duration: 0.4, ease: 'easeInOut', repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-colors duration-400
                    ${isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive
                      ? 'bg-white border-emerald-500 text-emerald-600'
                      : 'bg-white border-slate-200 text-slate-300'
                    }
                  `}
                >
                  {isCompleted
                    ? <CheckCircle size={18} className="text-white" />
                    : isActive
                    ? <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {step.icon}
                      </motion.div>
                    : <Circle size={18} className="text-slate-200" />
                  }
                </motion.div>

                {/* Step label */}
                <div className="text-center px-1">
                  <p className={`text-xs font-semibold leading-tight ${
                    isCompleted ? 'text-emerald-600' :
                    isActive ? 'text-slate-800' :
                    'text-slate-300'
                  }`}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
