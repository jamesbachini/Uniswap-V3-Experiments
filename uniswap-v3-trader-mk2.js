const Web3 = require('web3');
const routerABI = require('./abis/v3SwapRouterABI.json');
const credentials = require('./credentials.json');

const web3 = new Web3(`https://kovan.infura.io/v3/${credentials.infuraKey}`);
const privateKey = credentials.privateKey;
const activeAccount = web3.eth.accounts.privateKeyToAccount(privateKey);

const routerAddress = `0xE592427A0AEce92De3Edee1F18E0157C05861564`; // Kovan Swap Router
const fromTokenAddress = `0xd0a1e359811322d97991e03f863a0c30c2cf029c`; // Kovan WETH
const toTokenAddress = `0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa`; // Kovan DAI
const routerContract = new web3.eth.Contract(routerABI, routerAddress);
const expiryDate = Math.floor(Date.now() / 1000) + 900;

(async () => {
	const qty = web3.utils.toWei('0.0274', 'ether');
	console.log('qty',qty);
  const params = {
    tokenIn: fromTokenAddress,
    tokenOut: toTokenAddress,
    fee: 3000,
    recipient: activeAccount.address ,
    deadline: expiryDate,
    amountIn: qty,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

	let tx_builder = routerContract.methods.exactInputSingle(params);
	let encoded_tx = tx_builder.encodeABI();
	let transactionObject = {
		gas: 238989, // gas fee needs updating?
		data: encoded_tx,
		from: activeAccount.address,
		to: routerAddress
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
	
})();