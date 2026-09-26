// Platform ordering window (local device time — Ghana is single TZ).
// Per-vendor availability uses vendors.is_open from the admin panel.

export const PLATFORM_CLOSE_HOUR = 21; // 9:00 PM — last orders before this time

export interface PlatformOrderingStatus {
  isOpen: boolean;
  timeUntilClose: number;
  timeUntilOpen: number;
}

export const TEST_TIME: Date | null = null;
export const DEMO_MODE = false;

export function getNow(): Date {
  return TEST_TIME ? new Date(TEST_TIME) : new Date();
}

export function getPlatformOrderingStatus(): PlatformOrderingStatus {
  if (DEMO_MODE) {
    return {
      isOpen: true,
      timeUntilClose: 60 * 60 * 1000,
      timeUntilOpen: 0,
    };
  }

  const now = getNow();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const closeMinutes = PLATFORM_CLOSE_HOUR * 60;

  const isOpen = currentMinutes < closeMinutes;

  let timeUntilClose = 0;
  let timeUntilOpen = 0;

  if (isOpen) {
    const closeDate = new Date(now);
    closeDate.setHours(PLATFORM_CLOSE_HOUR, 0, 0, 0);
    timeUntilClose = Math.max(0, closeDate.getTime() - now.getTime());
  } else {
    const openDate = new Date(now);
    openDate.setHours(0, 0, 0, 0);
    openDate.setDate(openDate.getDate() + 1);
    timeUntilOpen = openDate.getTime() - now.getTime();
  }

  return { isOpen, timeUntilClose, timeUntilOpen };
}

/** @deprecated Use getPlatformOrderingStatus — kept for any stale imports */
export function checkOrderingStatus(): PlatformOrderingStatus {
  return getPlatformOrderingStatus();
}

export function canPlaceOrders(platformOpen: boolean, vendorIsOpen: boolean): boolean {
  return platformOpen && vendorIsOpen;
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
