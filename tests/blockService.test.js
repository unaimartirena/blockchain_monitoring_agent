const { calculateTPS, calculateBlockMiningTime } = require('../agent/blockService'); // Adjust the path as necessary
const { getBlock } = require('../agent/etherService');

// Mock the getBlock function
jest.mock('../agent/etherService', () => ({
  getBlock: jest.fn()
}));

describe('Blockchain Calculations', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    getBlock.mockClear();
  });

  it('calculates TPS correctly', async () => {
    const mockCurrentBlock = {
      number: 2,
      timestamp: 1000,
      transactions: new Array(10) // Simulate 10 transactions
    };

    const mockPreviousBlock = {
      number: 1,
      timestamp: 960 // 40 seconds before current block
    };

    getBlock.mockResolvedValueOnce(mockPreviousBlock);

    const tps = await calculateTPS(mockCurrentBlock);
    expect(tps).toBe(0.25); // 10 transactions / 40 seconds
    expect(getBlock).toHaveBeenCalledTimes(1);
    expect(getBlock).toHaveBeenCalledWith(1);
  });

  it('calculates block mining time correctly', async () => {
    const mockCurrentBlock = {
      number: 2,
      timestamp: 1000
    };

    const mockPreviousBlock = {
      number: 1,
      timestamp: 960 // 40 seconds before current block
    };

    getBlock.mockResolvedValueOnce(mockPreviousBlock);

    const miningTime = await calculateBlockMiningTime(mockCurrentBlock);
    expect(miningTime).toBe(40); // 1000 - 960
    expect(getBlock).toHaveBeenCalledTimes(1);
    expect(getBlock).toHaveBeenCalledWith(1);
  });
});
