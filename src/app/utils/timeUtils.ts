// Time gating utilities for Waakye Plug
// Orders are OPEN from 5:30 AM to 8:00 AM

export interface OrderingStatus {
  isOpen: boolean;
  timeUntilClose: number; // milliseconds
  timeUntilOpen: number; // milliseconds
}

// For testing: Set to a specific time, or null to use real time
// Example: new Date('2026-01-15T07:00:00')
export const TEST_TIME: Date | null = null;

// Demo mode ignores time gating
export const DEMO_MODE = false;

export function checkOrderingStatus(): OrderingStatus {

  if (DEMO_MODE) {
    return {
      isOpen: true,
      timeUntilClose: 60 * 60 * 1000,
      timeUntilOpen: 0
    };
  }

  // Use test time if provided
  const now = TEST_TIME ? new Date(TEST_TIME) : new Date();

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  // 5:30 AM
  const openTime = 0;

  // 8:00 AM
  const closeTime = 0;
      
  
  const isOpen = currentTime >= openTime && currentTime < closeTime;

  let timeUntilClose = 0;
  let timeUntilOpen = 0;

  if (isOpen) {

    const closeDate = new Date(now);
    closeDate.setHours(0, 0, 0, 0);

    timeUntilClose = closeDate.getTime() - now.getTime();

  } else {

    const openDate = new Date(now);
    openDate.setHours(0, 0, 0, 0);

    // If past today's closing time → open tomorrow
    if (currentTime >= closeTime) {
      openDate.setDate(openDate.getDate() + 1);
    }

    

    timeUntilOpen = openDate.getTime() - now.getTime();
  }

  return {
    isOpen,
    timeUntilClose,
    timeUntilOpen
  };
}

export function formatCountdown(milliseconds: number): string {

  const totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2,'0')}:${minutes
    .toString()
    .padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}