// Mock localStorage and window for Node.js testing environment
const mockLocalStorage: Record<string, string> = {};

const globalMock = global as unknown as { window: unknown; localStorage: Storage };

globalMock.window = {};
globalMock.localStorage = {
  getItem: (key: string) => mockLocalStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockLocalStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockLocalStorage[key];
  },
  clear: () => {
    for (const key in mockLocalStorage) {
      delete mockLocalStorage[key];
    }
  },
  length: 0,
  key: (_index: number) => null,
};
