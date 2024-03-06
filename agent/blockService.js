const { getBlock } = require('./etherService');

async function calculateTPS(currentBlock) {
    let previousBlock = await getBlock(currentBlock.number - 1);
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
    let previousBlock = await getBlock(currentBlock.number - 1);
    // Get the timestamp of the start block.
    let previousBlockTimestamp = previousBlock.timestamp;
    // Get the timestamp of the end block.
    let currentBlockTimestamp = currentBlock.timestamp;
  
    const timeDiff = currentBlockTimestamp - previousBlockTimestamp; // Time difference in seconds.
  
    console.log(`Block mining time: ${timeDiff} seconds`);
  
    return timeDiff;
  }

  module.exports = { calculateTPS, calculateBlockMiningTime };