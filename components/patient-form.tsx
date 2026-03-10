'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTranslation } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
import { User, Calendar, Users, MapPin, Phone, Loader2 } from 'lucide-react';
import type { Patient } from '@/types';

interface PatientFormProps {
  initialData?: Partial<Patient>;
  onSubmit: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PatientForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading = false,
  className 
}: PatientFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    age: initialData?.age?.toString() || '',
    gender: initialData?.gender || 'male' as const,
    village: initialData?.village || '',
    phone: initialData?.phone || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < 0 || age > 120) {
      newErrors.age = 'Valid age is required';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    onSubmit({
      name: formData.name.trim(),
      age: parseInt(formData.age),
      gender: formData.gender,
      village: formData.village.trim() || undefined,
      phone: formData.phone || undefined,
    });
  }, [formData, validate, onSubmit]);

  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  return (
    <div className={cn('glass-panel overflow-hidden', className)}>
      <div className="p-4 border-b border-[#1F2A36]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
            <User className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <h3 className="font-semibold text-foreground">Patient Information</h3>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              {t('patientName')} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter patient name"
              className={cn(
                'h-12 text-base bg-[var(--secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]',
                errors.name && 'border-[var(--risk-red)]'
              )}
            />
            {errors.name && <p className="text-sm text-[var(--risk-red)]">{errors.name}</p>}
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age" className="flex items-center gap-2 text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {t('patientAge')} *
            </Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              placeholder="Enter age"
              className={cn(
                'h-12 text-base bg-[var(--secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]',
                errors.age && 'border-[var(--risk-red)]'
              )}
              min={0}
              max={120}
            />
            {errors.age && <p className="text-sm text-[var(--risk-red)]">{errors.age}</p>}
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-muted-foreground" />
              {t('patientGender')} *
            </Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => handleChange('gender', value)}
              className="flex gap-3"
            >
              {[
                { value: 'male', label: t('male') },
                { value: 'female', label: t('female') },
                { value: 'other', label: t('other') },
              ].map((option) => (
                <div 
                  key={option.value}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all cursor-pointer',
                    formData.gender === option.value
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  )}
                  onClick={() => handleChange('gender', option.value)}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value} 
                    className="h-5 w-5 border-[var(--primary)] text-[var(--primary)]" 
                  />
                  <Label htmlFor={option.value} className="text-base cursor-pointer text-foreground">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Village */}
          <div className="space-y-2">
            <Label htmlFor="village" className="flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {t('village')}
            </Label>
            <Input
              id="village"
              value={formData.village}
              onChange={(e) => handleChange('village', e.target.value)}
              placeholder="Enter village name"
              className="h-12 text-base bg-[var(--secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {t('phone')}
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="10-digit phone number"
              className={cn(
                'h-12 text-base bg-[var(--secondary)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]',
                errors.phone && 'border-[var(--risk-red)]'
              )}
              maxLength={10}
            />
            {errors.phone && <p className="text-sm text-[var(--risk-red)]">{errors.phone}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-14 text-base border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10"
                disabled={isLoading}
              >
                {t('cancel')}
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 h-14 text-base font-semibold gradient-button border-0 text-[#0B0F14]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                t('submit')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
