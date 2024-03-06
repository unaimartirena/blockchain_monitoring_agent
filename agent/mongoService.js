const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const url = process.env.DATABASE_URL; // Ensure this is set in your environment
// const url = "mongodb://mongo:27017"; // Ensure this is set in your environment
const dbName = 'blockchain';

let mongoDb = null;

async function mongoClient() {
    if (!mongoDb) {
        const client = new MongoClient(url);
        await client.connect();
        console.log('Connected successfully to mongo server');
        mongoDb = client.db(dbName);
    }
    return mongoDb;
}

function addAlert(blockNumber, txHash, alertMsg, alerts) {
    let alert = {
        _id: uuidv4(), created: new Date(),
        blockNumber: blockNumber,
        txHash: txHash,
        alertMsg: alertMsg
    }
    alerts.push(alert);
}
  
  
function addTransaction(blockNumber, tx, receipt, transactionsToSave) {
    let transaction = {
        _id: uuidv4(), created: new Date(),
        blockNumber: blockNumber,
        transaction: tx,
        receipt: receipt
    }
    transactionsToSave.push(transaction);
}

async function insertAlerts(alerts) {
    const mongoDb = await mongoClient();
    const transactionCollection = mongoDb.collection('alert')
    await transactionCollection.insertMany(alerts);
    console.log(`Inserted ${alerts.length} alerts in MongoDB:`);
}

async function insertTransactions(transactions) {
    const mongoDb = await mongoClient();
    const transactionCollection = mongoDb.collection('transaction')
    await transactionCollection.insertMany(transactions);
    console.log(`Inserted ${transactions.length} transaction documents in the DB:`);
}

async function insertBlock(block) {
    let blockToSave = {
      _id: uuidv4(), 
      created: new Date(),
      blockNumber: block.number,
      block: block
    }
    const mongoDb = await mongoClient();
    const transactionsCollection = mongoDb.collection('block');
    await transactionsCollection.insertOne(blockToSave);
    console.log(`Inserted ${block.number} block document in the DB:`);
  }

async function insertBlockAnalysis(block, transactionsWithHighGasUsageCount, transactionsPerSecond, blockMiningTime, failedTransactionCount, contractCreationCount, highValueTransactions, averageGasPriceVolatility) {
    let blockAnalysisToSave = {
      _id: uuidv4(), 
      created: new Date(),
      blockNumber: block.number,
      transactionsWithHighGasUsageCount: transactionsWithHighGasUsageCount,
      transactionsPerSecond: transactionsPerSecond,
      blockMiningTime: blockMiningTime,
      failedTransactionsCount: failedTransactionCount,
      contractCreationCount: contractCreationCount,
      highValueTransactions: highValueTransactions,
      averageGasPriceVolatility: averageGasPriceVolatility.toString()
    }
    const mongoDb = await mongoClient();
    const blockAnalysisCollection = mongoDb.collection('blockAnalysis');
    await blockAnalysisCollection.insertOne(blockAnalysisToSave);
    console.log(`Inserted ${block.number} blockAnalysis document in the DB:`);
}

module.exports = { addAlert, addTransaction, insertAlerts, insertTransactions, insertBlock, insertBlockAnalysis };
