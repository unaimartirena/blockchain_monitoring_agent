const { ethers } = require('ethers');

const { getBlockWithTransactions, getTransactionReceipt, provider } = require('./etherService');
const { addAlert, addTransaction, insertAlerts, insertTransactions, insertBlock, insertBlockAnalysis } = require('./mongoService');
const { calculateTPS, calculateBlockMiningTime } = require('./blockService');

const HIGH_VALUE_TRANSACTIONS_THRESHOLD = 100; // Flag transactions having a value greater than the average.
const FAILED_TRANSACTIONS_PER_BLOCK_PERCENTAGE_THRESHOLD = 0.1;
const CONTRACT_CREATION_TRANSACTIONS_PER_BLOCK_PERCENTAGE_THRESHOLD = 0.1;
const HIGH_GAS_USAGE_MODIFIER = 2;

// Queue to hold the block numbers
let blockQueue = [];

// Flag to indicate if a block is currently being processed
let isProcessing = false;

provider.on("block", async (blockNumber) => {
  console.log(`New block mined ${blockNumber}. Analyzing: ...`);
  blockQueue.push(blockNumber); // Add the new block number to the queue
  checkQueue(); // Attempt to process the next block in the queue
});

async function checkQueue() {
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
    const currentBlock = await getBlockWithTransactions(currentBlockNumber);

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
      const receipt = await getTransactionReceipt(tx.hash);

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