import {
	html, css, BaseElement, ScrollbarStyle, SpinnerStyle,
	dpc, FlowFormat
} from './flow-ux.js'
export * from './flow-ux.js'
import {
	Deferred, GetTS, KAS, formatForMachine,
	getLocalWallet, setLocalWallet, baseUrl, debug
} from './wallet.js';
export * from './wallet.js';
import {initKaspaFramework, Wallet} from '@kaspa/wallet-worker';
Wallet.setWorkerLogLevel('none')
export {html, css, FlowFormat, dpc, baseUrl, debug};

export class KaspaWalletUI extends BaseElement{

	static get properties() {
		return {
			wallet:{type:Object},
			isLoading:{type:Boolean},
			errorMessage:{type:String},
			receiveAddress:{type:String},
			changeAddress:{type:String},
			txs:{type:Array},
			blueScore:{type:Number},
			status:{type:String},
			walletMeta:{type:Object, value:{}},

			faucetFundsAvailable:{type:Number},
			faucetPeriod:{type:Number},
			faucetStatus:{type:String},

			blockCount:{type:Number},
			headerCount:{type:Number},
			difficulty:{type:Number},
			networkName:{type:String},
			pastMedianTime:{type:Number},
			pastMediaTimeDiff:{type:Number}
		};
	}

	static get styles(){
		return [ScrollbarStyle, SpinnerStyle, css`
			.v-box{display:flex;flex-direction:column}
			.hide-scrollbar::-webkit-scrollbar-track{
			    box-shadow:none;background:transparent;
			}
			.hide-scrollbar::-webkit-scrollbar{
				width:0px;height:0px;
				background:transparent;
			}
			.hide-scrollbar::-webkit-scrollbar-thumb{
			    box-shadow:none;background:transparent;
			}
		`];
	}
	constructor() {
		super();
		this.txs = [];
		this.walletSignal = Deferred();
		this.walletMeta = {};
	}

	setRPCBuilder(rpcBuilder){
		this.rpcBuilder = rpcBuilder;
	}

	async initNetworkSettings() {
		console.log("$$$$$$$$$$$$$$$ rpcBuilder", this.rpcBuilder);

		if(this.rpc) {
			this.rpc.disconnect();
			// !!! FIXME delete wallet instance?
			delete this.rpc;
		}

		if(!this.rpcBuilder)
			return false;
		
		//const { network, port } = this.local_kaspad_settings;
		//const port = Wallet.networkTypes[network].port;
		const {rpc, network} = this.rpcBuilder();//new RPC({ clientConfig:{ host : `127.0.0.1:${port}` } });
		this.network = network;
		this.rpc = rpc;
	}
	disconnectRPC(){
		if(this.rpc)
			this.rpc.disconnect()
	}
	async connectRPC(){
		if(this.rpc)
			return this.rpc.connect()
	}

	initDaemonRPC() {
		const { rpc } = flow.app;
		this.networkStatusUpdates = rpc.subscribe(`network-status`);
		(async()=>{
			for await(const msg of this.networkStatusUpdates) {

				const {
					blockCount,
					headerCount,
					difficulty,
					networkName,
					pastMedianTime,
					pastMedianTimeDiff
				} = msg.data;

				this.blockCount = blockCount;
				this.headerCount = headerCount;
				this.difficulty = difficulty;
				this.networkName = networkName;
				this.pastMedianTime = pastMedianTime;
				this.pastMedianTimeDiff = pastMedianTimeDiff;
			}
		})().then();
	}

	render(){
		return html``
	}

	renderTX(){
		if(!this.wallet)
			return '';

		return html`
		<div class="heading">
			<fa-icon title="Show all transcations" class="tx-open-icon" 
				icon="list" @click="${this.showTxDialog}"></fa-icon>
			Recent transcations
		</div>
		<div class="transcations">
		${this.txs.slice(0, 6).map(tx=>{
			return html`
				<flow-expandable static-icon expand ?txin=${tx.in} ?txout=${!tx.in}
					icon="${tx.in?'sign-in':'sign-out'}" no-info>
					<div class="tx-title" slot="title">
						<div class="tx-date flex">${tx.date}</div>
						<div class="amount">
							${tx.in?'':'-'}${this.formatKAS(tx.amount)} KAS
						</div>
					</div>
					<div class="tx-body">
						${tx.note}
						<div class="tx-id">${tx.id}</div>
						<div class="tx-address">${tx.address}</div>
					</div>
				</flow-expandable>
			`
		})}
		</div>`
	}

	onMenuClick(e){
		let target = e.target.closest("flow-menu-item")
		let action = target.dataset.action;
		if(!action)
			return
		if(!this[action])
			return
		this[action]()
	}

	async showSeeds(){
		askForPassword({confirmBtnText:"Next"}, async({btn, password})=>{
    		console.log("btn, password", btn, password)
    		if(btn!="confirm")
    			return
    		let encryptedMnemonic = getLocalWallet().mnemonic;
    		let valid = await Wallet.checkPasswordValidity(password, encryptedMnemonic);
    		if(!valid)
    			return FlowDialog.alert("Error", "Invalid password");
			let mnemonic = await this.wallet.mnemonic;
			this.openSeedsDialog({mnemonic, hideable:true, showOnlySeed:true}, ()=>{
				//
			})
		})
	}

	async showRecoverWallet(){
		let title = html`<fa-icon class="big warning" icon="exclamation-triangle"></fa-icon> Attention !`;
		let body = html`
			<div style="min-width:300px;">
				You already have a wallet open. <br />
				Please make sure your current wallet <br />
				is backed up before proceeding!
			</div>
		`
		let {btn} = await FlowDialog.alert({title, body, cls:'with-icon', btns:['Cancel', 'Next:primary']})
		if(btn != 'next')
			return
		showWalletInitDialog({
			mode:"recover",
			wallet:this,
			backToWallet:true
		}, (err, info)=>{
			this.handleInitDialogCallback(info)
		})
	}

	copyAddress(){
		let input = this.renderRoot.querySelector(".address-input");
		input.select();
		input.setSelectionRange(0, 99999)
		document.execCommand("copy");
		input.setSelectionRange(0,0)
		input.blur();
	}
	
	formatKAS(value){
		return KAS(value);
	}
	showError(err){
		console.log("showError:err", err)
		this.errorMessage = err.error || err+"";
	}
	async setWallet(wallet){
		console.log("setWallet:", wallet)
		this.txs = [];
		this.receiveAddress = "";
		this.fire("new-wallet")
		await this.getWalletInfo(wallet);
		this.requestUpdate("txs", null)
		this.walletSignal.resolve();
		await this.loadData();
	}

	refreshStats() {
		let status = 'Online';
		if(this.blockCount == 1) {
			status = `Syncing Headers`;
		}
		else {
			if(this.sync && this.sync < 99.95)
				status = `Syncing DAG ${this.sync.toFixed(2)}% `;
		}
		this.status = status; //'Online';//TODO
		this.requestUpdate();
	}

	async getWalletInfo(wallet){
    	//this.uid = getUniqueId(await wallet.mnemonic);
    	const cache = false//getLocalSetting(`cache-${this.uid}`);
    	const {addresses} = cache||{};
    	if (cache && (addresses?.receiveCounter !== 0 || addresses?.changeCounter !== 0)) {
			wallet.restoreCache(cache);
			this._isCache = true;
	    }

	    wallet.on("blue-score-changed", (e)=>{
			this.blueScore = e.blueScore;

			this.refreshStats();

			/*
			if(this.sync && this.sync < 99.75) {
				status = `Syncing ${this.sync.toFixed(2)}% `;
				if(this.eta && !isNaN(this.eta) && isFinite(this.eta)) {
					let eta = this.eta;
					eta = eta / 1000;
					let sec = Math.round(eta % 60);
					let min = Math.round(eta / 60);
					eta = '';
					if(sec < 10)
						sec = '0'+sec;
					if(min < 10) {
						min = '0'+min;
					}
					this.status_eta = `${min}:${sec}`;
					//status += eta;
				} else 
					this.status_eta = null;
			}
			else this.status_eta = null;
			*/

	    });
	    wallet.on("balance-update", ()=>{
	    	this.requestUpdate("balance", null);
	    })
	    wallet.on("new-transaction", (tx)=>{
	    	tx.date = GetTS(new Date(tx.ts));
	    	this.txs.unshift(tx);
	    	this.txs = this.txs.slice(0, 10000);
	    	this.requestUpdate("balance", null);
	    	if(this.txDialog)
	    		this.txDialog.onNewTx(tx)
	    })
	    wallet.on("new-address", (detail)=>{
	    	let {receive, change} = detail;
	    	this.receiveAddress = receive;
	    	this.changeAddress = change;
	    })

	    this.wallet = wallet;
	}
	async loadData() {
		try {
			this.isLoading = true;
			/*if (this._isCache) {
				this.log("calling loadData-> refreshState")
				await this.refreshState();
				this.isLoading = false;
			}else{*/
				this.log("calling loadData-> wallet.addressDiscovery")
				await this.wallet.sync();
				//this.saveCache();
				this.isLoading = false;
			/*}*/
		} catch (err) {
			this.isLoading = false;
			this.showError(err);
		}

		this.updateFaucetBalance();
	}
	connectedCallback(){
		super.connectedCallback();
		let mobileSuffix = isMobile?'-mobile':'';
		let openDialog = document.createElement('kaspa-open-dialog'+mobileSuffix);
		this.parentNode.insertBefore(openDialog, this.nextSibling)
		this.sendDialog = document.createElement("kaspa-send-dialog"+mobileSuffix);
		this.parentNode.appendChild(this.sendDialog);
		this.receiveDialog = document.createElement("kaspa-receive-dialog"+mobileSuffix);
		this.parentNode.appendChild(this.receiveDialog);
		this.seedsDialog = document.createElement("kaspa-seeds-dialog");
		this.parentNode.appendChild(this.seedsDialog);
		let t9Dialog = document.createElement("kaspa-t9-dialog");
		this.parentNode.appendChild(t9Dialog);
		let qrscannerDialog = document.createElement("kaspa-qrscanner-dialog");
		this.parentNode.appendChild(qrscannerDialog);
		
		console.log("connectedCallback1", openDialog)
		initKaspaFramework({
			workerPath: "/kaspa-wallet-worker/worker.js"
		}).then(()=>{
			console.log("connectedCallback2")
			let encryptedMnemonic = getLocalWallet()?.mnemonic
			this.initWallet(encryptedMnemonic)
		})
	}
	
	initWallet(encryptedMnemonic){
		if(encryptedMnemonic){
			if(window.mobileMode){
				let info = {dialog:{mode:"open", hide:()=>{}}};
				info.encryptedMnemonic = encryptedMnemonic;
				info.password = "Asd123###";
				this.handleInitDialogCallback(info)
				return
			}
			showWalletInitDialog({
				mode:"open",
				wallet:this,
				hideable:false
			}, (err, info)=>{
				info.encryptedMnemonic = encryptedMnemonic;
				this.handleInitDialogCallback(info)
			})
		}else{
			showWalletInitDialog({
				mode:"init",
				wallet:this,
				hideable:false,
				isFresh:true
			}, (err, info)=>{
				console.log("showWalletInitDialog:result", info)
				this.handleInitDialogCallback(info)
			})
		}
	}
	async handleInitDialogCallback({dialog, password, seedPhrase, encryptedMnemonic}){
		console.log("$$$$$$$ INIT NETWORK SETTINGS - START");
		await this.initNetworkSettings();
		console.log("$$$$$$$ INIT NETWORK SETTINGS - DONE");

		const { network, rpc } = this;
		console.log("$$$$$$$ INIT NETWORK SETTINGS", { network, rpc });

		if(!rpc)
			return FlowDialog.alert("Error", "Kaspa Daemon config is missing.");

		this.initDaemonRPC();

		let {mode} = dialog;
		console.log("$$$$$$$ mode", mode)
		if(mode =="open"){
			const wallet = await Wallet.import(password, encryptedMnemonic, {network, rpc})
			.catch(error=>{
				console.log("import wallet error:", error)
				dialog.setError("Incorrect passsword.");
			});

			if(!wallet)
				return

			dialog.hide();
			this.setWallet(wallet);
			return
		}
		if(mode == "create"){
			// TODO - GET CURRENT NETWORK TYPE
			// TODO - CREATE CORRESPONDING RPC
			dialog.hide();
			const wallet = new Wallet(null,null, {network,rpc});
			const mnemonic = await wallet.mnemonic;
			this.openSeedsDialog({mnemonic, hideable:false}, async({finished})=>{
				if(!finished)
					return

				encryptedMnemonic = await wallet.export(password);
				setLocalWallet(encryptedMnemonic, this.walletMeta);
				//setLocalSetting("have-backup", 1);
				this.setWallet(wallet);
			})
			return
		}

		if(mode == "recover"){
			const { network, rpc } = this;

			console.log("recover:Wallet:seedPhrase, password", seedPhrase, password)
			let wallet;
			try{
				wallet = Wallet.fromMnemonic(seedPhrase, { network, rpc });
			}catch(error){
				console.log("recover:Wallet.fromMnemonic error", error)
				dialog.setError(`Invalid seed (${error.message})`);
			}

			if(!wallet)
				return
			const encryptedMnemonic = await wallet.export(password);
			console.log("encryptedMnemonic", encryptedMnemonic)
			/*const imported = await Wallet.import(password, encryptedMnemonic, { network, rpc })
			.catch(error=>{
				console.log("recover:Wallet.import error", error)
			})
			if(!imported){
				dialog.setError("Invalid password.");
				return
			}*/
			setLocalWallet(encryptedMnemonic, this.walletMeta);
			//setLocalSetting("have-backup", 1);
			dialog.hide();
			this.setWallet(wallet);
			return
		}
	}
	showSeedRecoveryDialog(){
		let encryptedMnemonic = getLocalWallet().mnemonic;
		this.openSeedsDialog({encryptedMnemonic, step:1}, ({finished})=>{
			if(finished){
				//setLocalSetting("have-backup", 1);
				this.requestUpdate("have-backup", null)
			}
		})
	}
	openSeedsDialog(args, callback){
		//console.log("encryptedMnemonic", encryptedMnemonic)
		this.seedsDialog.open(args, callback)
	}
	showTxDialog(){
		if(!this.txDialog){
			this.txDialog = document.createElement("kaspa-tx-dialog");
			this.parentNode.appendChild(this.txDialog);
		}
		console.log("this.txDialog", this.txDialog)
		this.txDialog.open({wallet:this}, (args)=>{})
	}
	showSendDialog(){
		console.log("this.sendDialog", this.sendDialog)
		this.sendDialog.open({wallet:this}, (args)=>{
			this.sendTx(args);
		})
	}
	showReceiveDialog(){
		let address = this.receiveAddress;
		this.receiveDialog.open({address}, (args)=>{
		})
	}

	async isValidAddress(address){
		let [prefix] = address.split(":");
		if(window.mobileMode && prefix=="kaspatest")
			return true;

		let minningAddress = await this.getMiningAddress()
		let [prefix2] = minningAddress.split(":")
		return prefix == prefix2;
	}

	async getMiningAddress(){
		await this.walletSignal
		if(this.receiveAddress)
			return Promise.resolve(this.receiveAddress);

		return this.wallet.receiveAddress;
	}

	async sendTx(args){
		const {
			address, amount, note, fee,
			calculateNetworkFee, inclusiveFee
		} = args;
		console.log("sendTx:args", args)

		const response = await this.wallet.submitTransaction({
			toAddr: address,
			amount,
			fee, calculateNetworkFee, inclusiveFee, note
		}).catch(error=>{
			console.log("error", error)
			error = (error+"").replace("Error:", '')
			FlowDialog.alert("Error", error);
		})

		console.log("sendTx: response", response)
	}

	async estimateTx(args){
		const {
			address, amount, note, fee,
			calculateNetworkFee, inclusiveFee
		} = args;
		console.log("estimateTx:args", args)

		let error = undefined;
		const data = await this.wallet.estimateTransaction({
			toAddr: address,
			amount,
			fee, calculateNetworkFee, inclusiveFee, note
		}).catch(err=>{
			console.log("error", err);
			error = 'Unable to estimate transaction fees';//(err+"").replace("Error:", '')
		})

		let result = {data, error}
		console.log("estimateTx:", data, error);

		return result;
	}



	async updateFaucetBalance() {

		flow.app.rpc.request('faucet-available', { address : this.receiveAddress })
		.then((resp) => {
			console.log(resp);
			const { available, period } = resp;
			this.faucetStatus = null;
			this.faucetFundsAvailable = available;
			this.faucetPeriod = period;

		})
		.catch(ex => {
			console.log('faucet error:', ex);
		})
	}

	async getKaspaFromFaucet(amount) {
		flow.app.rpc.request('faucet-available', { address : this.receiveAddress, amount })
		.then((resp) => {
			console.log(resp);
			const { available, period } = resp;
			this.faucetStatus = null;
			this.faucetFundsAvailable = available;
			this.faucetPeriod = period;

		})
		.catch(ex => {
			console.log('faucet error:', ex);
		})
	}

	requestFaucetFunds() {
		flow.app.rpc.request('faucet-request', { address : this.receiveAddress, amount : 123 })
		.then((resp) => {
			console.log(resp);
			const { available, period } = resp;
			this.faucetStatus = null;
			this.faucetFundsAvailable = available;
			this.faucetPeriod = period;

		})
		.catch(ex => {
			console.log('faucet error:', ex);
		})
	}

	showQRScanner(args, callback){
		args = args||{};
		args.wallet = this;
		showQRScanner(args, ({value, dialog})=>{
			console.log("SCAN result", value)
			dialog.hide();
			if(!value)
				return
			let [address, searchQuery=''] = value.split("?");
			let searchParams = new URLSearchParams(searchQuery)
			let args = Object.fromEntries(searchParams.entries());
			let {amount} = args;
			callback({address, amount})
		})
	}

	showSendDialogWithQrScanner() {
		this.showQRScanner({isAddressQuery:true}, ({amount, address})=>{
			if(!address)
				return
			dpc(100, ()=>{
				this.sendDialog.open({wallet:this, amount, address}, (args)=>{
					this.sendTx(args);
				})
			})
		})
	}

}
