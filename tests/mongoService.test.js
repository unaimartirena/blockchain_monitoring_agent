// Mock MongoDB
jest.mock('mongodb', () => {
    const actualMongoDb = jest.requireActual('mongodb');
    return {
      ...actualMongoDb,
      MongoClient: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(true),
        db: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            insertMany: jest.fn().mockResolvedValue(true),
            insertOne: jest.fn().mockResolvedValue(true),
          }),
        }),
      })),
    };
  });
  
  // Mock UUID
  jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid'),
  }));
  
  const {
    addAlert,
    addTransaction,
    insertAlerts,
    insertTransactions,
    insertBlock,
    insertBlockAnalysis,
  } = require('../agent/mongoService'); // Adjust the path as necessary
  
  describe('MongoDB Operations', () => {
    it('inserts alerts into the database', async () => {
      const alerts = [
        { blockNumber: 1, txHash: '0x123', alertMsg: 'High value' },
      ];
      // Assuming `mongoClient` and its methods are correctly mocked,
      // you can check if `insertMany` was called with the expected data.
      const { MongoClient } = require('mongodb'); // Import here to use the mocked version
      await insertAlerts(alerts);
      expect(MongoClient).toHaveBeenCalledTimes(1);
      const db = MongoClient.mock.results[0].value.db();
      expect(db.collection).toHaveBeenCalledWith('alert');
      expect(db.collection().insertMany).toHaveBeenCalledWith(alerts);
    });
  
    // Additional tests for `insertTransactions`, `insertBlock`, and `insertBlockAnalysis` follow a similar structure
  });
  
  