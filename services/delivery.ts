import { supabase } from '../lib/supabase/client';
import { DbDeliverySettings, DbDeliverySlot } from '../types/database';
import { DeliverySlotItem, ScheduleDayOption } from '../types';

export const deliveryService = {
  /**
   * Fetch delivery pricing configuration from delivery_settings table
   */
  async getDeliverySettings(): Promise<DbDeliverySettings | null> {
    try {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error || !data) {
        console.warn('[deliveryService] could not load delivery_settings:', error?.message);
        return {
          id: 1,
          min_order_value: 500,
          tier1_max_value: 999,
          tier1_fee: 40,
          tier2_fee: 30,
          free_delivery_order_count: 3,
        };
      }

      return data;
    } catch {
      return {
        id: 1,
        min_order_value: 500,
        tier1_max_value: 999,
        tier1_fee: 40,
        tier2_fee: 30,
        free_delivery_order_count: 3,
      };
    }
  },

  /**
   * Calculate delivery fee based on DB settings and user's order history
   */
  calculateDeliveryFee(
    subtotal: number,
    settings: DbDeliverySettings,
    pastOrderCount = 0
  ): { fee: number; isFreeDelivery: boolean; isBelowMin: boolean } {
    // If user is within their first N orders, delivery is free
    if (pastOrderCount < settings.free_delivery_order_count) {
      return {
        fee: 0,
        isFreeDelivery: true,
        isBelowMin: subtotal < settings.min_order_value,
      };
    }

    if (subtotal <= settings.tier1_max_value) {
      return {
        fee: Number(settings.tier1_fee),
        isFreeDelivery: false,
        isBelowMin: subtotal < settings.min_order_value,
      };
    }

    return {
      fee: Number(settings.tier2_fee),
      isFreeDelivery: false,
      isBelowMin: false,
    };
  },

  /**
   * Helper to format 'HH:mm:ss' or 'HH:mm' to 'h:mm A'
   */
  formatTime12Hr(timeStr: string): string {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const minPadded = m < 10 ? `0${m}` : `${m}`;
    return `${hour12}:${minPadded} ${period}`;
  },

  /**
   * Check if an order cutoff time has already passed for today
   */
  isCutoffPassed(cutoffTimeStr?: string, endTimeStr?: string): boolean {
    const timeStr = cutoffTimeStr || endTimeStr;
    if (!timeStr) return false;
    const [hStr, mStr] = timeStr.split(':');
    const cutoffH = parseInt(hStr, 10);
    const cutoffM = parseInt(mStr || '0', 10);
    if (isNaN(cutoffH)) return false;

    const now = new Date();
    const curH = now.getHours();
    const curM = now.getMinutes();

    if (curH > cutoffH) return true;
    if (curH === cutoffH && curM >= cutoffM) return true;
    return false;
  },

  /**
   * Fetch available delivery slots for a store for a specific date (defaults to today).
   * Strictly 2 slots: Morning and Evening.
   * If targetDate is today, verifies cutoff time against the current time.
   * If targetDate is in the future, slots are always open unless capacity is full.
   */
  async getAvailableSlots(storeId?: string, targetDateStr?: string): Promise<DeliverySlotItem[]> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    try {
      // 0. Ensure upcoming slots exist if DB function is installed
      try {
        await supabase.rpc('ensure_delivery_slots', { p_days: 14 });
      } catch {}

      // 1. Try fetching real slots for today and future
      let query = supabase
        .from('delivery_slots')
        .select('*')
        .gte('slot_date', today)
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      let res = await query;
      let rawSlots = res.data;

      // Filter out test slots
      const upcomingSlots = (rawSlots || []).filter((slot: DbDeliverySlot) => {
        const name = (slot.slot_name || '').trim().toLowerCase();
        return !name.includes('test');
      });

      if (upcomingSlots.length > 0) {
        const mapped: DeliverySlotItem[] = [];
        for (const slot of upcomingSlots) {
          const isToday = slot.slot_date === today;
          const isTomorrow = slot.slot_date === tomorrow;
          const isPassed = isToday && deliveryService.isCutoffPassed(slot.order_cutoff_time, slot.end_time);
          const isFull = (slot.current_bookings || 0) >= (slot.capacity || 20);

          mapped.push({
            id: slot.id,
            name: slot.slot_name,
            time: `${deliveryService.formatTime12Hr(slot.start_time)} - ${deliveryService.formatTime12Hr(slot.end_time)}`,
            date: slot.slot_date,
            dayLabel: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : slot.slot_date,
            fee: 'Free delivery',
            isAvailable: !isPassed && !isFull,
            orderCutoffTime: slot.order_cutoff_time,
            unavailableReason: isFull ? 'Slot is fully booked' : isPassed ? 'Cutoff time passed' : undefined,
          });
        }
        const availList = mapped.filter((s) => s.isAvailable);
        if (availList.length > 0) return availList;
      }

      // Fallback: If DB does not have upcoming date rows yet, load slot templates
      let fallbackQuery = supabase
        .from('delivery_slots')
        .select('*')
        .order('slot_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (storeId) {
        fallbackQuery = fallbackQuery.eq('store_id', storeId);
      }

      const fbRes = await fallbackQuery;
      let templateSlots = fbRes.data;

      if (!templateSlots || templateSlots.length === 0) {
        const anySlots = await supabase
          .from('delivery_slots')
          .select('*')
          .order('slot_date', { ascending: false })
          .order('start_time', { ascending: true });
        templateSlots = anySlots.data || [];
      }

      const validSlots = (templateSlots || []).filter((slot: DbDeliverySlot) => {
        const name = (slot.slot_name || '').trim().toLowerCase();
        return !name.includes('test');
      });

      // Extract real UUIDs from the database
      const morningDb = validSlots.find((s: DbDeliverySlot) => (s.slot_name || '').trim().toLowerCase() === 'morning') || validSlots[0];
      const eveningDb = validSlots.find((s: DbDeliverySlot) => (s.slot_name || '').trim().toLowerCase() === 'evening') || validSlots[1] || morningDb;

      const morningId = morningDb?.id || 'e265b218-2b56-4d71-90be-f11fc5f9a58c';
      const eveningId = eveningDb?.id || '2ac2c800-1b9f-4fe4-b3c7-b5ef31c3bce9';

      const morningStart = deliveryService.formatTime12Hr(morningDb?.start_time || '11:00:00');
      const morningEnd = deliveryService.formatTime12Hr(morningDb?.end_time || '14:00:00');
      const eveningStart = deliveryService.formatTime12Hr(eveningDb?.start_time || '16:00:00');
      const eveningEnd = deliveryService.formatTime12Hr(eveningDb?.end_time || '19:00:00');

      const morningCutoff = morningDb?.order_cutoff_time || '12:30:00';
      const eveningCutoff = eveningDb?.order_cutoff_time || '17:30:00';

      const isMorningPassed = deliveryService.isCutoffPassed(morningCutoff, morningDb?.end_time || '14:00:00');
      const isEveningPassed = deliveryService.isCutoffPassed(eveningCutoff, eveningDb?.end_time || '19:00:00');

      const result: DeliverySlotItem[] = [];

      // 1. Today Morning (if cutoff has not passed)
      if (!isMorningPassed) {
        result.push({
          id: morningId,
          name: 'Morning',
          time: `${morningStart} - ${morningEnd}`,
          date: today,
          dayLabel: 'Today',
          fee: 'Free delivery',
          isAvailable: true,
          orderCutoffTime: morningCutoff,
        });
      }

      // 2. Today Evening (if cutoff has not passed)
      if (!isEveningPassed) {
        result.push({
          id: eveningId,
          name: 'Evening',
          time: `${eveningStart} - ${eveningEnd}`,
          date: today,
          dayLabel: 'Today',
          fee: 'Free delivery',
          isAvailable: true,
          orderCutoffTime: eveningCutoff,
        });
      }

      // 3. Tomorrow Morning (always available)
      result.push({
        id: morningId,
        name: 'Morning',
        time: `${morningStart} - ${morningEnd}`,
        date: tomorrow,
        dayLabel: 'Tomorrow',
        fee: 'Free delivery',
        isAvailable: true,
        orderCutoffTime: morningCutoff,
      });

      // 4. Tomorrow Evening (always available)
      result.push({
        id: eveningId,
        name: 'Evening',
        time: `${eveningStart} - ${eveningEnd}`,
        date: tomorrow,
        dayLabel: 'Tomorrow',
        fee: 'Free delivery',
        isAvailable: true,
        orderCutoffTime: eveningCutoff,
      });

      return result;
    } catch (err: any) {
      console.warn('[deliveryService] exception loading slots:', err?.message);
      return [];
    }
  },

  /**
   * Generates a full 10-day delivery schedule (maximum 10 days limit: Day 0 to Day 9).
   * For each day, queries the real database slots matching that date so each day's
   * slots carry the real DB slot UUID for checkout.
   */
  async get10DaySchedule(storeId?: string): Promise<ScheduleDayOption[]> {
    const days: ScheduleDayOption[] = [];
    const MAX_DAYS = 10;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    try {
      // 1. Try to ensure slots exist for upcoming days via DB RPC
      try {
        await supabase.rpc('ensure_delivery_slots', { p_days: 14 });
      } catch {}

      // 2. Fetch all upcoming slots for this store in a single query
      let query = supabase
        .from('delivery_slots')
        .select('*')
        .gte('slot_date', today)
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data: dbSlots } = await query;
      const allSlots: DbDeliverySlot[] = (dbSlots || []).filter((s) => {
        const name = (s.slot_name || '').trim().toLowerCase();
        return (name === 'morning' || name === 'evening') && !name.includes('test');
      });

      // 3. Build each day option
      for (let i = 0; i < MAX_DAYS; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const isToday = i === 0;
        const isTomorrow = i === 1;

        const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
        const dayOfMonth = d.getDate();

        let dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : `${dayOfWeek}, ${dayOfMonth} ${monthShort}`;

        const dayDbSlots = allSlots.filter((s) => s.slot_date === dateStr);
        const morningSlot = dayDbSlots.find((s) => (s.slot_name || '').trim().toLowerCase() === 'morning');
        const eveningSlot = dayDbSlots.find((s) => (s.slot_name || '').trim().toLowerCase() === 'evening');

        const slots: DeliverySlotItem[] = [];

        if (morningSlot) {
          const startTime = deliveryService.formatTime12Hr(morningSlot.start_time);
          const endTime = deliveryService.formatTime12Hr(morningSlot.end_time);
          const cutoffTime = morningSlot.order_cutoff_time || morningSlot.end_time;
          const hasCapacity = (morningSlot.capacity - morningSlot.current_bookings) > 0;
          const cutoffPassed = isToday && deliveryService.isCutoffPassed(cutoffTime, morningSlot.end_time);
          const isAvailable = hasCapacity && !cutoffPassed;

          let unavailableReason: string | undefined;
          if (!hasCapacity) {
            unavailableReason = 'Slot full';
          } else if (cutoffPassed) {
            unavailableReason = `Booking closed (Cutoff was ${deliveryService.formatTime12Hr(cutoffTime)})`;
          }

          slots.push({
            id: morningSlot.id,
            name: 'Morning',
            time: `${startTime} - ${endTime}`,
            date: dateStr,
            dayLabel,
            fee: 'Free delivery',
            isAvailable,
            unavailableReason,
            orderCutoffTime: cutoffTime,
          });
        }

        if (eveningSlot) {
          const startTime = deliveryService.formatTime12Hr(eveningSlot.start_time);
          const endTime = deliveryService.formatTime12Hr(eveningSlot.end_time);
          const cutoffTime = eveningSlot.order_cutoff_time || eveningSlot.end_time;
          const hasCapacity = (eveningSlot.capacity - eveningSlot.current_bookings) > 0;
          const cutoffPassed = isToday && deliveryService.isCutoffPassed(cutoffTime, eveningSlot.end_time);
          const isAvailable = hasCapacity && !cutoffPassed;

          let unavailableReason: string | undefined;
          if (!hasCapacity) {
            unavailableReason = 'Slot full';
          } else if (cutoffPassed) {
            unavailableReason = `Booking closed (Cutoff was ${deliveryService.formatTime12Hr(cutoffTime)})`;
          }

          slots.push({
            id: eveningSlot.id,
            name: 'Evening',
            time: `${startTime} - ${endTime}`,
            date: dateStr,
            dayLabel,
            fee: 'Free delivery',
            isAvailable,
            unavailableReason,
            orderCutoffTime: cutoffTime,
          });
        }

        days.push({
          date: dateStr,
          dayLabel,
          dayOfWeek,
          dayOfMonth,
          monthShort,
          isToday,
          isTomorrow,
          slots,
        });
      }

      return days;
    } catch (err: any) {
      console.warn('[deliveryService] exception in get10DaySchedule:', err?.message);
      return [];
    }
  },
};
