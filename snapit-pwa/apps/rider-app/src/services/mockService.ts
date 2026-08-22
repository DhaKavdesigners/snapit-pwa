/**
 * Centralized Developer Mock Service (Dev / Test Mode Only)
 * Provides mock Time and Location inputs for testing slot booking, slot expiry,
 * geofence validation, and online eligibility without changing production business logic.
 */

export type TestAppMode = 'driver' | 'tester';

export interface MockTimeConfig {
  enabled: boolean;
  mockTimestamp: number | null; // epoch ms
  simulatedTimeStr?: string; // HH:mm format for UI display
  simulatedDateStr?: string; // YYYY-MM-DD format for UI display
}

export interface MockLocationConfig {
  enabled: boolean;
  coords: { lat: number; lng: number } | null;
  zoneId?: string;
}

let currentTestMode: TestAppMode = 'driver';

let mockTimeConfig: MockTimeConfig = {
  enabled: false,
  mockTimestamp: null,
  simulatedTimeStr: '10:00',
  simulatedDateStr: '',
};

let mockLocationConfig: MockLocationConfig = {
  enabled: false,
  coords: null,
};

// ─── LocalStorage Hydration ───────────────────────────────────────────────────

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  try {
    const savedMode = localStorage.getItem('snapit_dev_test_mode_v1');
    if (savedMode === 'tester' || savedMode === 'driver') {
      currentTestMode = savedMode;
    }
    const savedTime = localStorage.getItem('snapit_dev_mock_time_v2');
    if (savedTime) {
      mockTimeConfig = JSON.parse(savedTime);
    }
    const savedLoc = localStorage.getItem('snapit_dev_mock_location_v2');
    if (savedLoc) {
      mockLocationConfig = JSON.parse(savedLoc);
    }
  } catch (e) {
    console.warn('Could not hydrate mock settings from localStorage', e);
  }
}

// ─── Test App Mode API ─────────────────────────────────────────────────────────

export function setTestMode(mode: TestAppMode): void {
  if (process.env.NODE_ENV !== 'development') return;
  currentTestMode = mode;
  if (mode === 'driver') {
    resetMockEnvironment();
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('snapit_dev_test_mode_v1', mode);
    } catch (e) {}
  }
}

export function getTestMode(): TestAppMode {
  if (process.env.NODE_ENV !== 'development') return 'driver';
  return currentTestMode;
}

// ─── Time Mock API ─────────────────────────────────────────────────────────────

export function setMockTimeConfig(config: Partial<MockTimeConfig>): void {
  if (process.env.NODE_ENV !== 'development') return;

  mockTimeConfig = {
    ...mockTimeConfig,
    ...config,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('snapit_dev_mock_time_v2', JSON.stringify(mockTimeConfig));
    } catch (e) {}
  }
}

export function getMockTimeConfig(): MockTimeConfig {
  return mockTimeConfig;
}

/** Returns the current timestamp in ms (simulated if Mock Time is active in Dev Mode) */
export function getNow(): number {
  if (
    process.env.NODE_ENV === 'development' &&
    currentTestMode === 'tester' &&
    mockTimeConfig.enabled &&
    mockTimeConfig.mockTimestamp !== null
  ) {
    return mockTimeConfig.mockTimestamp;
  }
  return Date.now();
}

/** Returns the current Date object (simulated if Mock Time is active in Dev Mode) */
export function getNowDate(): Date {
  if (
    process.env.NODE_ENV === 'development' &&
    currentTestMode === 'tester' &&
    mockTimeConfig.enabled &&
    mockTimeConfig.mockTimestamp !== null
  ) {
    return new Date(mockTimeConfig.mockTimestamp);
  }
  return new Date();
}

// ─── Location Mock API ─────────────────────────────────────────────────────────

export function setMockLocationConfig(config: Partial<MockLocationConfig>): void {
  if (process.env.NODE_ENV !== 'development') return;

  mockLocationConfig = {
    ...mockLocationConfig,
    ...config,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('snapit_dev_mock_location_v2', JSON.stringify(mockLocationConfig));
    } catch (e) {}
  }
}

export function getMockLocationConfig(): MockLocationConfig {
  return mockLocationConfig;
}

// ─── Reset Environment API ─────────────────────────────────────────────────────

export function resetMockEnvironment(): void {
  mockTimeConfig = {
    enabled: false,
    mockTimestamp: null,
    simulatedTimeStr: '10:00',
    simulatedDateStr: '',
  };
  mockLocationConfig = {
    enabled: false,
    coords: null,
    zoneId: undefined,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('snapit_dev_mock_time_v2');
      localStorage.removeItem('snapit_dev_mock_location_v2');
    } catch (e) {}
  }
}
