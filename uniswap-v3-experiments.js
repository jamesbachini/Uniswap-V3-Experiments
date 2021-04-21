const Web3 = require('web3');
const experimentalABI = require('./abis/experimentalABI.json');
const erc20ABI = require('./abis/erc20ABI.json');
const credentials = require('./credentials.json');

const web3 = new Web3(`https://ropsten.infura.io/v3/${credentials.infuraKey}`);

const privateKey = credentials.privateKey;
const activeAccount = web3.eth.accounts.privateKeyToAccount(privateKey);

const factoryAddress = '0xDbe2c61E85D06eaA6E7916049f38B93288BA30f3'; 
const positionManagerAddress = '0x865F20efC14A5186bF985aD42c64f5e71C055376'; 
const fromTokenAddress = `0xc778417e063141139fce010982780140aa0cd5ab`; // Ropsten WETH
const toTokenAddress = `0xad6d458402f60fd3bd25163575031acdce07538d`; // Ropsten DAI
const poolAddress = `0xa187d6bdee6edfc7fbfc6819464c0f31d34952d1`; // WETH/DAI Pool

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
	//let txRaw = poolContract.methods.mint(activeAccount.address,tickLower,tickUpper,amount);
	let txRaw = positionManagerContract.methods.increaseLiquidity(poolAddress,qty,minQty,qty,minQty,expiryDate);
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
