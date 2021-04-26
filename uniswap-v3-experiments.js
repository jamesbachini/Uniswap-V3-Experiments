const Web3 = require('web3');
const experimentalABI = require('./abis/experimentalABI.json');
const erc20ABI = require('./abis/erc20ABI.json');
const credentials = require('./credentials.json');

const web3 = new Web3(`https://kovan.infura.io/v3/${credentials.infuraKey}`);

const privateKey = credentials.privateKey;
const activeAccount = web3.eth.accounts.privateKeyToAccount(privateKey);

const factoryAddress = '0x58f6b77148BE49BF7898472268ae8f26377d0AA6'; 
const positionManagerAddress = '0xA31B47971cdC5376E41CfA2D4378912156ab1F10'; 
const fromTokenAddress = `0xd0a1e359811322d97991e03f863a0c30c2cf029c`; // Kovan WETH
const toTokenAddress = `0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa`; // Kovan DAI
const poolAddress = `0xd744bd581403078aeafeb344bdad812c384825b1`; // WETH/DAI Pool

const factoryContract = new web3.eth.Contract(experimentalABI, factoryAddress);
const positionManagerContract = new web3.eth.Contract(experimentalABI, positionManagerAddress);
const poolContract = new web3.eth.Contract(experimentalABI, poolAddress);
const fromContract = new web3.eth.Contract(erc20ABI, fromTokenAddress);
const toContract = new web3.eth.Contract(erc20ABI, toTokenAddress);


// Created WETH/DAI Pool 0xa187d6bdee6edfc7fbfc6819464c0f31d34952d1
const createLiquidityPool = async () => {
	//let txRaw = positionManagerContract.methods.createAndInitializePoolIfNecessary(fromTokenAddress,toTokenAddress,500,200)	
	let txRaw = factoryContract.methods.createPool(fromTokenAddress,toTokenAddress,500);
	signAndSend(txRaw,factoryAddress);
}

// Approve poolContract to spend two erc20 tokens
const approveSpend = async() => {
	const approveQty = web3.utils.toBN(web3.utils.toWei('99999'));
	let txRaw = fromContract.methods.approve(poolAddress,approveQty);
	signAndSend(txRaw,fromTokenAddress);
	await new Promise(r => setTimeout(r, 30000));
	let txRaw2= toContract.methods.approve(poolAddress,approveQty);
	signAndSend(txRaw2,toTokenAddress);
}

// Add liquidity to pool
const addLiquidity = async () => {
	const qty = web3.utils.toBN(web3.utils.toWei('0.02'));
	const minQty = web3.utils.toBN(web3.utils.toWei('0.01'));
	const expiryDate = Math.floor(Date.now() / 1000) + 900;
	let txRaw = poolContract.methods.mint(activeAccount.address,1,2,0.2);
	//let txRaw = positionManagerContract.methods.increaseLiquidity(poolAddress,qty,minQty,qty,minQty,expiryDate);
  signAndSend(txRaw,positionManagerAddress);
}	

const signAndSend = async (tx_builder,sendToAddress) => {
	let encoded_tx = tx_builder.encodeABI();
	let transactionObject = {
		gas: 6000000,
		data: encoded_tx,
		from: activeAccount.address,
		to: sendToAddress,
	};
	web3.eth.accounts.signTransaction(transactionObject, activeAccount.privateKey, (error, signedTx) => {
		if (error) {
			console.log(error);
		} else {
			web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', (receipt) => {
				console.log(receipt);
			});
		}
	});
}

const init = async () => {
  //createLiquidityPool();
  //approveSpend();
  addLiquidity();
}

init();
