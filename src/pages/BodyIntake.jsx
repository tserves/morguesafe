import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { Baby, User, Truck } from 'lucide-react';
import AdultIntakeForm from '@/components/intake/AdultIntakeForm';
import BabyIntakeForm from '@/components/intake/BabyIntakeForm';
import ReferredIntakeForm from '@/components/intake/ReferredIntakeForm';

const CATEGORIES = [
  {
    id: 'adult',
    icon: User,
    label: 'Adult Intake',
    description: 'For adults received from a ward, unit, or department',
    cardClass: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconClass: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'baby',
    icon: Baby,
    label: 'Baby Intake',
    description: 'For neonates, infants, and stillbirths',
    cardClass: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    iconClass: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'referred',
    icon: Truck,
    label: 'Referred Intake',
    description: 'For referrals or transfers from external facilities',
    cardClass: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    iconClass: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

export default function BodyIntake() {
  const [category, setCategory] = useState(null);

  if (category === 'adult') return <AdultIntakeForm onBack={() => setCategory(null)} />;
  if (category === 'baby') return <BabyIntakeForm onBack={() => setCategory(null)} />;
  if (category === 'referred') return <ReferredIntakeForm onBack={() => setCategory(null)} />;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <PageHeader
        title="Body Intake"
        subtitle="Select the intake category to begin"
      />
      <div className="space-y-4 mt-2">
        {CATEGORIES.map(({ id, icon: Icon, label, description, cardClass, iconClass, iconColor }) => (
          <button
            key={id}
            onClick={() => setCategory(id)}
            className={`w-full text-left border-2 rounded-xl p-5 transition-all flex items-center gap-4 ${cardClass}`}
          >
            <div className={`p-3 rounded-xl ${iconClass} shrink-0`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">{label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
            <span className="text-xl text-muted-foreground">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}