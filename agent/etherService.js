const { ethers } = require('ethers');
const network = 'mainnet';
const apiKey = 'c815f60fda364fd0aa960c3226f6a144';
const providerUrl = `wss://${network}.infura.io/ws/v3/${apiKey}`;
const provider = new ethers.providers.WebSocketProvider(providerUrl);

async function getBlockWithTransactions(blockNumber) {
    return await provider.getBlockWithTransactions(blockNumber);
}

async function getTransactionReceipt(txHash) {
    return await provider.getTransactionReceipt(txHash);
}

async function getBlock(blockNumber) {
    return await provider.getBlock(blockNumber);
}

module.exports = { getBlockWithTransactions, getTransactionReceipt, getBlock, provider };