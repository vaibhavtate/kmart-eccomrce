'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Check, 
  Truck, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { deliveryService } from '../services/delivery';
import { DeliverySlotItem, ScheduleDayOption } from '../types';

interface ScheduleOrderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSlotSelected?: (slot: DeliverySlotItem) => void;
}

export const ScheduleOrderModal: React.FC<ScheduleOrderModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSlotSelected,
}) => {
  const {
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    selectedSlot,
    setSelectedSlot,
    activeStore,
    deliveryFee
  } = useApp();

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : isScheduleModalOpen;
  const handleClose = propOnClose || (() => setIsScheduleModalOpen(false));

  const [days, setDays] = useState<ScheduleDayOption[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [tempSelectedSlot, setTempSelectedSlot] = useState<DeliverySlotItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load 10-day schedule whenever modal opens
  useEffect(() => {
    if (!isModalOpen) return;

    let isMounted = true;
    setIsLoading(true);

    deliveryService.get10DaySchedule(activeStore?.id).then((schedule) => {
      if (!isMounted) return;
      setDays(schedule);
      setIsLoading(false);

      // Match initial selection with currently active selectedSlot date, if possible
      if (selectedSlot && schedule.length > 0) {
        const foundDayIndex = schedule.findIndex((d) => d.date === selectedSlot.date);
        const dayIdx = foundDayIndex >= 0 ? foundDayIndex : 0;
        setSelectedDayIndex(dayIdx);

        // Find available slot for this day
        const daySlots = schedule[dayIdx]?.slots || [];
        const matchingSlot = daySlots.find((s) => s.id === selectedSlot.id && s.isAvailable);
        const fallbackAvailable = daySlots.find((s) => s.isAvailable) || daySlots[0];
        setTempSelectedSlot(matchingSlot || fallbackAvailable || null);
      } else if (schedule.length > 0) {
        setSelectedDayIndex(0);
        const firstAvailable = schedule[0].slots.find((s) => s.isAvailable) || schedule[0].slots[0];
        setTempSelectedSlot(firstAvailable || null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isModalOpen, activeStore?.id]);

  // Handle day switch
  const handleSelectDay = (index: number) => {
    setSelectedDayIndex(index);
    const day = days[index];
    if (!day) return;

    // Pick matching slot name or first available slot for the new day
    const currentSlotName = tempSelectedSlot?.name || 'Morning';
    const match = day.slots.find((s) => s.name === currentSlotName && s.isAvailable);
    const firstAvailable = day.slots.find((s) => s.isAvailable) || day.slots[0];
    setTempSelectedSlot(match || firstAvailable || null);
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!tempSelectedSlot) return;
    if (!tempSelectedSlot.isAvailable) {
      alert(`The selected slot (${tempSelectedSlot.name}) is no longer available. Please select an available slot.`);
      return;
    }

    setSelectedSlot(tempSelectedSlot);
    if (onSlotSelected) {
      onSlotSelected(tempSelectedSlot);
    }
    handleClose();
  };

  if (!isModalOpen) return null;

  const activeDay = days[selectedDayIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#E11A22] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="schedule-modal-title" className="font-black text-base sm:text-lg text-[#0A2540]">
                  Schedule Delivery
                </h2>
                <span className="text-[10px] font-extrabold uppercase bg-red-100 text-[#E11A22] px-2 py-0.5 rounded-full">
                  Up to 10 Days
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose your preferred date and slot for {activeStore?.name || 'K MART'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#E11A22] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Loading 10-day delivery calendar...</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: 10-DAY DATE STRIP */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#E11A22]" />
                    <span>Select Date (Next 10 Days)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {activeDay?.dayLabel}
                  </span>
                </div>

                {/* Horizontal scrollable date pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-gray-300">
                  {days.map((day, idx) => {
                    const isSelected = selectedDayIndex === idx;
                    const hasAvailableSlot = day.slots.some((s) => s.isAvailable);

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => handleSelectDay(idx)}
                        className={`shrink-0 flex flex-col items-center justify-center min-w-[70px] sm:min-w-[76px] py-2.5 px-2 rounded-xl border-2 transition-all cursor-pointer text-center relative ${
                          isSelected
                            ? 'bg-[#E11A22] border-[#E11A22] text-white shadow-md shadow-red-500/20 scale-102'
                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-800'
                        }`}
                      >
                        {/* Day of Week Label */}
                        <span className={`text-[10px] font-extrabold uppercase tracking-wide ${
                          isSelected ? 'text-red-100' : 'text-gray-400'
                        }`}>
                          {day.isToday ? 'TODAY' : day.isTomorrow ? 'TOM' : day.dayOfWeek}
                        </span>

                        {/* Date Number */}
                        <span className={`text-base sm:text-lg font-black leading-tight my-0.5 ${
                          isSelected ? 'text-white' : 'text-gray-900'
                        }`}>
                          {day.dayOfMonth}
                        </span>

                        {/* Month */}
                        <span className={`text-[10px] font-semibold ${
                          isSelected ? 'text-red-100' : 'text-gray-500'
                        }`}>
                          {day.monthShort}
                        </span>

                        {/* Status dot */}
                        <span 
                          className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                            isSelected 
                              ? 'bg-white' 
                              : hasAvailableSlot 
                              ? 'bg-emerald-500' 
                              : 'bg-gray-300'
                          }`} 
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: SLOTS FOR THE SELECTED DATE */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#E11A22]" />
                    <span>Select Time Slot ({activeDay?.dayLabel})</span>
                  </label>
                  <span className="text-[11px] text-gray-500">2 Daily Slots</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeDay?.slots.map((slot) => {
                    const isSelected = tempSelectedSlot?.id === slot.id && tempSelectedSlot?.date === activeDay.date;
                    const isAvailable = slot.isAvailable;

                    return (
                      <div
                        key={`${slot.id}-${activeDay.date}`}
                        onClick={() => {
                          if (isAvailable) {
                            setTempSelectedSlot({
                              ...slot,
                              date: activeDay.date,
                              dayLabel: activeDay.dayLabel,
                            });
                          }
                        }}
                        className={`p-3.5 rounded-xl border-2 transition-all flex items-start justify-between ${
                          !isAvailable
                            ? 'opacity-50 border-gray-200 bg-gray-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-[#E11A22] bg-red-50/40 shadow-xs cursor-pointer'
                            : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`p-2 rounded-lg mt-0.5 ${
                            isSelected ? 'bg-[#E11A22] text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-gray-900">
                                {slot.name.endsWith('Slot') ? slot.name : `${slot.name} Slot`}
                              </p>
                              {slot.unavailableReason ? (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                  {slot.unavailableReason}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Available
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 font-medium">{slot.time}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {deliveryFee === 0 ? 'Free delivery' : `₹${deliveryFee} delivery`}
                            </p>
                          </div>
                        </div>

                        {isSelected && isAvailable && (
                          <div className="w-5 h-5 rounded-full bg-[#E11A22] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {activeDay && activeDay.slots.every((s) => !s.isAvailable) && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      All delivery slots for {activeDay.dayLabel} are closed. Please select another date from the calendar above.
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 3: SELECTION SUMMARY BOX */}
              {tempSelectedSlot && tempSelectedSlot.isAvailable && (
                <div className="p-3.5 bg-gradient-to-r from-red-50/50 to-orange-50/30 border border-red-100 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-red-200 flex items-center justify-center text-[#E11A22] shrink-0 shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        Scheduled Delivery: {activeDay?.dayLabel} ({tempSelectedSlot.date})
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {tempSelectedSlot.name} Slot • {tempSelectedSlot.time}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: TRUST BADGE */}
              <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                <Truck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  Delivered on time directly by our local store team. You will receive live updates once your order is confirmed.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!tempSelectedSlot || !tempSelectedSlot.isAvailable}
            className="px-5 py-2.5 rounded-xl bg-[#E11A22] hover:bg-[#c8141b] disabled:bg-gray-300 text-white font-bold text-xs cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Delivery Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};
