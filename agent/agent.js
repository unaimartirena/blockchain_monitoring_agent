const { ethers } = require('ethers');

// Import the MongoDB client
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const provider = new ethers.providers.WebSocketProvider('wss://mainnet.infura.io/ws/v3/c815f60fda364fd0aa960c3226f6a144');

const HIGH_VALUE_TRANSACTIONS_THRESHOLD = 100; // Flag transactions having a value greater than the average.
const FAILED_TRANSACTIONS_PER_BLOCK_PERCENTAGE_THRESHOLD = 0.1;
const CONTRACT_CREATION_TRANSACTIONS_PER_BLOCK_PERCENTAGE_THRESHOLD = 0.1;
const HIGH_GAS_USAGE_MODIFIER = 2;

// Queue to hold the block numbers
let blockQueue = [];

// Flag to indicate if a block is currently being processed
let isProcessing = false;

let mongoDb = null;

provider.on("block", async (blockNumber) => {
  console.log(`New block mined ${blockNumber}. Analyzing: ...`);
  blockQueue.push(blockNumber); // Add the new block number to the queue
  checkQueue(); // Attempt to process the next block in the queue
});

async function checkQueue() {
  if (mongoDb === null) {
    // Singleton
    mongoDb = await mongoClient();
  }
  if (blockQueue.length > 0 && !isProcessing) {

    const nextBlockNumber = blockQueue.shift(); // Remove the next block from the queue
    processBlockWithTransactions(nextBlockNumber).catch(console.error);
  }
}

async function processBlockWithTransactions(currentBlockNumber) {
  try {
    isProcessing = true; // Indicate block processing has started
    console.log(`Starting processing of block #${currentBlockNumber}`);

    // Get current and previous blocks
    const currentBlock = await provider.getBlockWithTransactions(currentBlockNumber);

    // Initialize block variables
    const transactionsAverageGasUsed = currentBlock.gasUsed.div(currentBlock.transactions.length);
    console.log(`Block ${currentBlockNumber} transactions average gas usage ${transactionsAverageGasUsed}`);

    let transactionsToSave = [];
    let alerts = [];

    let gasPriceChanges = []; // Store the gas prices to monitor volatility
    let failedTransactionCount = 0;
    let contractCreationCount = 0;
    let highValueTransactionsCount = 0;
    let transactionsWithHighGasUsageCount = 0;
    let previousGasPrice = ethers.BigNumber.from(0);

    const amountOfTransactionsInBlock = currentBlock.transactions.length;

    for (const tx of currentBlock.transactions) {
      const receipt = await provider.getTransactionReceipt(tx.hash);

      // Monitor contract creations
      if (tx.to === null) {
        contractCreationCount++;
        console.log(`Contract with address ${tx.from} created in transaction ${tx.hash}`);
      }

      // Monitor for high gas usage
      if (receipt.gasUsed > transactionsAverageGasUsed * HIGH_GAS_USAGE_MODIFIER) {
        transactionsWithHighGasUsageCount++;
        console.log(`High gas usage ${receipt.gasUsed} in transaction ${tx.hash}`);
      }

      // Monitor for failed transactions
      if (receipt.status === 0) {
        failedTransactionCount++;
        console.log(`Failed transaction detected: ${tx.hash}`);
      }

      // High-value transaction (e.g., > 100 ETH)
      if (ethers.utils.formatEther(tx.value) > HIGH_VALUE_TRANSACTIONS_THRESHOLD) {
        highValueTransactionsCount++;
        let msg = `Transaction with value greater than ${HIGH_VALUE_TRANSACTIONS_THRESHOLD}: Hash: ${tx.hash}`;
        addAlert(currentBlockNumber, currentBlock.hash, msg, alerts);
        console.log(msg);
      }

      // Track gas price changes for volatility
      if (!previousGasPrice.isZero() && !tx.gasPrice.eq(previousGasPrice)) {
        gasPriceChanges.push(tx.gasPrice.sub(previousGasPrice).abs());
      }
      previousGasPrice = tx.gasPrice;

      addTransaction(currentBlockNumber, tx, receipt, transactionsToSave);
    }

    // Check failed transactions rate
    let failedTransactionsRate = failedTransactionCount / (amountOfTransactionsInBlock);
    if (failedTransactionsRate > FAILED_TRANSACTIONS_PER_BLOCK_PERCENTAGE_THRESHOLD) {
      let msg = `Too many transactions (${failedTransactionsRate.multiply(100)}%) failed in the block ${currentBlockNumber}`;
      addAlert(currentBlockNumber, currentBlock.hash, msg, alerts);
      console.log(msg);
    }

    // Check new contract creations transactions rate
    let contractCreationTransactionsRate = contractCreationCount / (amountOfTransactionsInBlock);
    if (failedTransactionsRate > CONTRACT_CREATION_TRANSACTIONS_PER_BLOCK_PERCENTAGE_THRESHOLD) {
      let msg = `Too many contract creation transactions, (${contractCreationTransactionsRate.multiply(100)}%) in the block ${currentBlockNumber}`;
      addAlert(currentBlockNumber, currentBlock.hash, msg, alerts);
      console.log(msg);
    }

    // Calculate gas price volatility (simplified)
    let totalGasPriceVolatility = gasPriceChanges.reduce((acc, change) => acc.add(change), ethers.BigNumber.from(0));
    let averageGasPriceVolatility = gasPriceChanges.length > 0 ? totalGasPriceVolatility.div(gasPriceChanges.length) : ethers.BigNumber.from(0);

    // Transactions per second in the current block.
    let tps = await calculateTPS(currentBlock);
    let blockMiningTime = await calculateBlockMiningTime(currentBlock)
    console.log(`Block ${currentBlockNumber}: Transactions with high gas use: ${transactionsWithHighGasUsageCount}, TPS: ${tps}, Block MiningTime: ${blockMiningTime} Failed Transactions: ${failedTransactionCount}, Contract Creations: ${contractCreationCount}, High-value Transactions: ${highValueTransactionsCount}, Average Gas Price Volatility: ${averageGasPriceVolatility.toString()}`);

    // Insert transactions data, block data and block analysis
    if (alerts.length > 0) {
      await insertAlerts(alerts);
    }
    await insertTransactions(transactionsToSave);
    await insertBlock(currentBlock);
    await insertBlockAnalysis(currentBlock, transactionsWithHighGasUsageCount, tps, blockMiningTime, failedTransactionCount, contractCreationCount, highValueTransactionsCount, averageGasPriceVolatility)
    
    isProcessing = false; // Indicate block processing has finished
    checkQueue(); // Check the queue for the next block
  } catch (error) {
    console.error(`Error fetching block transactions: ${error}`);
  }
};

console.log("Subscribed to new Ethereum blocks...");

async function mongoClient() {
  // Connection URL and Database Name
  // const url = 'mongodb://mongo:27017'; // Replace with your MongoDB URI if not local
  const url = process.env.DATABASE_URL;
  console.log(`process.env.DATABASE_URL: ${url}`);
  const dbName = 'blockchain'; // Replace with your database name

  const client = new MongoClient(url); 

  await client.connect();
  console.log('Connected successfully to mongo server');
  return client.db(dbName);
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

async function insertAlerts(alerts) {
  const transactionCollection = mongoDb.collection('alert')
  await transactionCollection.insertMany(alerts);
  console.log(`Inserted ${alerts.length} alerts in MongoDB:`);
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

async function insertTransactions(transactions) {
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
  const blockAnalysisCollection = mongoDb.collection('blockAnalysis');
  await blockAnalysisCollection.insertOne(blockAnalysisToSave);
  console.log(`Inserted ${block.number} blockAnalysis document in the DB:`);
}

async function calculateTPS(currentBlock) {
  let previousBlock = await provider.getBlock(currentBlock.number - 1);
  // Get the timestamp of the start block.
  let previousBlockTimestamp = previousBlock.timestamp;
  // Get the timestamp of the end block.
  let currentBlockTimestamp = currentBlock.timestamp;
  let totalTransactions = currentBlock.transactions.length;

  const timeDiff = currentBlockTimestamp - previousBlockTimestamp; // Time difference in seconds.
  const tps = totalTransactions / timeDiff; // Transactions per second.

  console.log(`TPS: ${tps}`);

  return tps;
}

async function calculateBlockMiningTime(currentBlock) {
  let previousBlock = await provider.getBlock(currentBlock.number - 1);
  // Get the timestamp of the start block.
  let previousBlockTimestamp = previousBlock.timestamp;
  // Get the timestamp of the end block.
  let currentBlockTimestamp = currentBlock.timestamp;

  const timeDiff = currentBlockTimestamp - previousBlockTimestamp; // Time difference in seconds.

  console.log(`Block mining time: ${timeDiff} seconds`);

  return timeDiff;
}

