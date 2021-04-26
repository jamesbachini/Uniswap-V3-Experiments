const Web3 = require('web3');
const routerABI = require('./abis/v3SwapRouter.json');
const tickLensABI = require('./abis/v3TickLens.json');
const credentials = require('./credentials.json');

const web3 = new Web3(`https://kovan.infura.io/v3/${credentials.infuraKey}`);
const privateKey = credentials.privateKey;
const activeAccount = web3.eth.accounts.privateKeyToAccount(privateKey);

const tickLensAddress = `0xB79bDE60fc227217f4EE2102dC93fa1264E33DaB`; // Kovan Tick Lens
const routerAddress = `0x1988F2e49A72C4D73961C7f4Bb896819d3d2F6a3`; // Kovan Swap Router
const fromTokenAddress = `0xd0a1e359811322d97991e03f863a0c30c2cf029c`; // Kovan WETH
const toTokenAddress = `0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa`; // Kovan DAI
const poolAddress = `0xd744bd581403078aeafeb344bdad812c384825b1`; // Kovan WETH/DAI Pool
const tickLensContract = new web3.eth.Contract(tickLensABI, tickLensAddress);
const routerContract = new web3.eth.Contract(routerABI, routerAddress);
const expiryDate = Math.floor(Date.now() / 1000) + 900;

(async () => {
	const qty = web3.utils.toBN(web3.utils.toWei('0.01'));
  const tickBitmapIndex = 1;
	const quote = await tickLensContract.methods.getPopulatedTicksInWord(poolAddress,tickBitmapIndex).call();
	console.log(`quote`,quote);
	// approve weth spending manually at https://app.uniswap.org
  const params = {
    tokenIn: fromTokenAddress,
    tokenOut: toTokenAddress,
    fee: 3000,
    recipient: activeAccount.address ,
    deadline: expiryDate,
    amountIn: 0.1,
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