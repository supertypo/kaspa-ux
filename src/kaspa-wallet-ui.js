import {
	html, css, BaseElement, ScrollbarStyle, SpinnerStyle,
	dpc, FlowFormat, buildPagination, renderPagination, txListStyle, UID
} from './flow-ux.js'
export * from './flow-ux.js'
import {
	Deferred, GetTS, KAS, formatForMachine, formatForHuman,
	getLocalWallet, setLocalWallet, baseUrl, debug, MAX_UTXOS_THRESHOLD_COMPOUND
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
			isOnline:{type:Boolean},
			isOfflineBadge:{type:Boolean},
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
			ip:{type:String},

			blockCount:{type:Number},
			headerCount:{type:Number},
			difficulty:{type:Number},
			networkName:{type:String},
			pastMedianTime:{type:Number},
			pastMediaTimeDiff:{type:Number},
			dots:{type:String},
			hideFaucet:{type:Boolean},
			hideNetwork:{type:Boolean},
			hideQRScanner:{type:Boolean},
			hideOpenWalletLogo:{type:Boolean}
			//UTXOIndexSupport:{type:Boolean}
		};
	}

	static get styles(){
		return [ScrollbarStyle, SpinnerStyle, txListStyle, css`
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
			.recent-transactions {padding:15px;max-width:555px;margin:auto;}
			.recent-transactions .tx-rows{max-height:90vh;overflow-y:auto;margin:10px 0px;padding:0px 10px;}
			.recent-transactions .tx-body{overflow:hidden;text-overflow:ellipsis;}
			.recent-transactions .tx-body .tx-id,
			.recent-transactions .tx-body .tx-address{
				font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;
			}
			.recent-transactions .tx-title{width:100%;display:flex;align-items:center;margin-bottom:10px;}
			.recent-transactions .tx-row{position:relative}
			.recent-transactions .tx-progressbar{position:absolute;left:0px;}
			.recent-transactions .amount{color:#60b686}
			.recent-transactions [txout] .amount{color:#F00}
			.recent-transactions .heading { text-align:center;}
			.tx-notification{padding:5px;text-align:center}
			.hidden-file-input{position:absolute;top:-100%;}
		`];
	}
	constructor() {
		super();
		this.txs = [];
		this.walletSignal = Deferred();
		this.walletMeta = {};
		this.isOnline = false;
		this.txLimit = Math.floor( (window.innerHeight - 165) / 72);

		this.isOfflineBadge = false;
		this.debugscanner = window.location.href.includes("debugscanner")
		this.preparingTxNotifications = new Map();
		this.dots = '';
		this.UTXOIndexSupport = true;
		this.recentTransactionsHeading = "Recent Transactions";
		window.__walletCmp = this;
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
		if(this.networkStatusUpdates || !window.flow?.app?.rpc?.subscribe)
			return
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

	initHelpers() {
		if(this._initHelpersInterval)
			return;

		this._initHelpersInterval = setInterval(()=>{
			if(this.faucetPeriod > 0) {
				this.faucetPeriod = Math.max(0,this.faucetPeriod-1000);
			}
		}, 1000);
	}

	render(){
		return html``
	}

	renderTX({hideTxBtn=false, onlyNonConfirmed=false}={}){
		if(!this.wallet)
			return '';

		let items = [], bScore;
		let {blueScore=0} = this;
		if(onlyNonConfirmed){
			if(blueScore){
				items = this.txs.slice(0, 6).filter(tx=>{
					bScore = tx.blueScore||0;
					if(blueScore<bScore || !bScore)
						return false
					return (blueScore - bScore < 100)
				})
			}
		}else{
			items = this.txs.slice(0, 10)
		}
		if(hideTxBtn && !items.length && !this.preparingTxNotifications.size)
			return '';

		let color, p, cfmP, cfm;

		let notifications = [...this.preparingTxNotifications.values()];

		return html`
		<div class="recent-transactions">
			<div class="heading">
				${this.recentTransactionsHeading}
			</div>
			<div class="tx-notifications">
				${notifications.map(n=>{
					return html`<div class="tx-notification">
						${n.compoundUTXOs?
							`Compounding UTXOs...`:
							`Preparing transaction for ${this.formatKAS(n.amount)} KAS ....`}
					</div>`
				})}
				
			</div>
			<div class="tx-rows">
			${items.map(tx=>{
				cfm = blueScore - (tx.blueScore||0);
				cfmP = Math.min(100, cfm);
				p = cfmP/100;
				if(p>0.7)
					color = '#60b686';
				else if(p>0.5)
					color = 'orange'
				else
					color = 'red';

				return html`
					<flow-expandable class="tx-row" static-icon expand ?txin=${tx.in} ?txout=${!tx.in}
						icon="${tx.in?'sign-in':'sign-out'}" no-info>
						<div class="tx-title" slot="title">
							<div class="tx-date flex">${tx.date}</div>
							<div class="amount">
								${tx.in?'':'-'}${this.formatKAS(tx.amount)} KAS
							</div>
						</div>
						${ 0<=cfm&cfm<101? html`<flow-progressbar class="tx-progressbar" 
							style="--flow-progressbar-color:${color}"
							value="${p}" text="${cfmP||''}"></flow-progressbar>`:''
						}
						<div class="tx-body">
							${tx.note}
							<div class="tx-id">${tx.id}</div>
							<div class="tx-address">${(tx.myAddress?'THIS WALLET => ':'')+tx.address}</div>
						</div>
					</flow-expandable>
				`
			})}
			</div>
		</div>`
	}
	_renderAllTX({skip, items}){
		let {blueScore=0} = this, cfm, cfmP, p, color, bScore;
		return html`
			${items.length?'':html`<div class="no-record">No Transactions</div>`}
			<div class="tx-list">
				${items.map((tx, i)=>{
					bScore = tx.blueScore||0;
					cfm = blueScore - bScore;
					if(blueScore < bScore)
						cfm = 101;
					cfmP = Math.min(100, cfm)
					p = cfmP/100;
					if(p>0.7)
						color = '#60b686';
					else if(p>0.5)
						color = 'orange'
					else
						color = 'red';
					return html`
					<div class="tx-row" ?txin=${tx.in} ?txout=${!tx.in}>
						<fa-icon class="tx-icon" icon="${tx.in?'sign-in':'sign-out'}"></fa-icon>
						${
							0<=cfm&cfm<101? html`
							<flow-progressbar class="tx-progressbar" 
								style="--flow-progressbar-color:${color}"
								value="${p}" text="${cfmP||''}"></flow-progressbar>
							`:''
						}
						<div class="tx-date" title="#${skip+i+1} Transaction">${tx.date}</div>
						<div class="tx-amount">${tx.in?'':'-'}${KAS(tx.amount)} KAS</div>
						<div class="br tx-note">${tx.note}</div>
						<div class="br tx-id">${tx.id.split(":")[0]}</div>
						<div class="tx-address">${(tx.myAddress?'THIS WALLET => ':'')+tx.address}</div>
					</div>`
				})}
			</div>
		`
	}
	renderAllTX(){
		if(!this.wallet)
			return '';
		let {txLimit:limit=20, txs:totalItems=[], txSkip=0} = this;
		let pagination = buildPagination(totalItems.length, txSkip, limit)
		let items = totalItems.slice(txSkip, txSkip+limit);
		return html`
			${this._renderAllTX({skip:txSkip, items})}
			${renderPagination(pagination, this._onTXPaginationClick)}
		`
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
	async exportWalletFile(){
		askForPassword({confirmBtnText:"Next"}, async({btn, password})=>{
    		if(btn!="confirm")
    			return
    		let wallet = getLocalWallet();
    		let encryptedMnemonic = wallet.mnemonic;
    		let valid = await Wallet.checkPasswordValidity(password, encryptedMnemonic);
    		if(!valid)
    			return FlowDialog.alert("Error", "Invalid password");
			
			this.sendDataToDownload(JSON.stringify(wallet), 'wallet.kpk')
		})
	}
	getFileInput(){
		return this.renderRoot.querySelector("input.hidden-file-input")
	}
	importWalletFile(){
		let input = this.getFileInput();
		let a = Date.now();
		let invalidFileAlert = ()=>{
			FlowDialog.alert("Error", "Invalid File");
		}
		let importWallet = (walletMeta)=>{
			let {mnemonic} = walletMeta.wallet;

			askForPassword({confirmBtnText:"Import"}, async({btn, password})=>{
	    		if(btn!="confirm")
	    			return
				let valid = await Wallet.checkPasswordValidity(password, mnemonic)
				if(!valid)
					return FlowDialog.alert("Error", "Invalid password");

				let walletInitArgs = {
					password,
					walletMeta,
					encryptedMnemonic:mnemonic,
					dialog:{
						mode:"import",
						setError:(error)=>{
							FlowDialog.alert("Error", error);
						}
					}
				}
				//console.log("walletInitArgs", walletInitArgs)
				this.handleInitDialogCallback(walletInitArgs)
			})
		}
		input.onchange = (e)=>{
			let [file] = input.files||[]
			if(!file)
				return
			let {name=''} = file;
			let ext = name.toLowerCase().split(".").pop();
			if(ext!='kpk')
				return invalidFileAlert();

			let reader = new FileReader();
			let error = false;
			reader.onload = async (evt)=>{
				input.value = "";
				let json = evt.target.result;
				try{
					let walletInfo = JSON.parse(json);
					if(!walletInfo?.wallet?.mnemonic)
						return invalidFileAlert();
					importWallet(walletInfo);
				}catch(e){
					invalidFile()
				}
				console.log("reader result", json);
			};
			reader.onerror = ()=>{
				FlowDialog.alert("Error", "Unable to read file");
				error = true;
				input.value = "";
			}
			reader.readAsText(file);
			console.log("input:onChange", a, e)
		}
		input.click();
	}

	sendDataToDownload(data, name="wallet.txt"){
		let file = new File([data], name, {
			type: "attachment/kpk",
		});
		const objectURL = URL.createObjectURL(file);
		console.log("objectURL1:", name)
		console.log("objectURL", file, objectURL)
		this.requestFileDownload(objectURL, name)
		//URL.revokeObjectURL(objectURL);
	}

	requestFileDownload(file, name){
		let link = document.createElement("a")
		link.setAttribute("href", file);
		link.setAttribute("download", name || file);
		document.body.appendChild(link);
		link.click();
		setTimeout(()=>{
			link.remove();
		}, 3000);
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
		if(localStorage.walletLogLevel)
			wallet.setLogLevel(localStorage.walletLogLevel)
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
		this.isOfflineBadge = !this.isOnline;
		if(!this.isOnline){
			this.status = 'Offline';
			return;
		}

		let status = 'Online';
		if(this.blockCount == 1) {
			status = `Syncing Headers`;
		}
		else {
			if(this.sync && this.sync < 99.95)
				status = `Syncing DAG ${this.sync.toFixed(2)}% `;
		}
		this.status = status;
	}

	async onWalletReady({confirmedUtxosCount}){
		if(confirmedUtxosCount > MAX_UTXOS_THRESHOLD_COMPOUND){
			let body = html`
				This wallet has too many transactions<br >
				would you like to compound by re-sending funds to yourself?
			`;
			let {btn} = await FlowDialog.alert({
				title:"Too many transactions", body, cls:'',
				btns:['Close', 'Yes Compound:primary:compound']
			})

			if(btn=='compound'){
				this.compoundUTXOs();
			}
    	}
			
	}

	async compoundUTXOs(){
		const uid = UID();
		this.addPreparingTransactionNotification({uid, compoundUTXOs:true})

		let response = await this.wallet.compoundUTXOs()
		.catch(err=>{
			console.log("compoundUTXOs error", err)
			let error = err.error || err.message || 'Could not compound transactions. Please Retry later.';
			FlowDialog.alert('Error', error)
		})
		if(response)
			console.log("compoundUTXOs response", response)

		this.removePreparingTransactionNotification({uid});
	}



	getWalletInfo(wallet){
		this.wallet = wallet;
		return new Promise((resolve, reject)=>{
	    	//this.uid = getUniqueId(await wallet.mnemonic);
	    	const cache = false//getLocalSetting(`cache-${this.uid}`);
	    	const {addresses} = cache||{};
	    	if (cache && (addresses?.receiveCounter !== 0 || addresses?.changeCounter !== 0)) {
				wallet.restoreCache(cache);
				this._isCache = true;
		    }
		    wallet.on("ready", (args)=>{
		    	this.onWalletReady(args)
		    })
		    wallet.on('api-connect', ()=>{
		    	this.isOnline = true;
		    	this.refreshStats();
		    })
		    wallet.on('api-disconnect', ()=>{
		    	this.isOnline = false;
		    	this.refreshStats();
		    })
		    wallet.on("blue-score-changed", (e)=>{
				this.blueScore = e.blueScore;

				this.refreshStats();
				this.txDialog?.requestUpdate()

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
		    	//console.log("############ new-transaction", tx)
		    	tx.date = GetTS(new Date(tx.ts));
		    	this.txs.unshift(tx);
		    	this.txs = this.txs.slice(0, 10000);
		    	this.requestUpdate("balance", null);
		    	if(this.txDialog)
		    		this.txDialog.onNewTx(tx)
		    })
		    wallet.on("transactions", (list)=>{
		    	//console.log("############ transactions", list.length)
		    	list.forEach(tx=>{
			    	tx.date = GetTS(new Date(tx.ts));
			    	let index = this.findTxIndex(tx);
			    	this.txs.splice(index, 0, tx);
			    })
		    })
		    wallet.on("new-address", (detail)=>{
		    	let {receive, change} = detail;
		    	this.receiveAddress = receive;
		    	this.changeAddress = change;
		    })

		    wallet.on("grpc-flags", (flags)=>{
		    	console.log("grpc-flags", flags)
		    	this.grpcFlags = flags;
		    	this.UTXOIndexSupport = !!flags.utxoIndex;
		    	if(!this.UTXOIndexSupport){
		    		this.alertUTXOIndexSupportIssue()
		    	}
		    	resolve();
		    })

		    wallet.checkGRPCFlags();
		})
	}

	async alertUTXOIndexSupportIssue(){
		let title = html`<fa-icon class="big warning" 
			icon="exclamation-triangle"></fa-icon> Attention !`;

		let body = html`
			'utxoindex' flag is missing from KASPAD config.<br />
			Please inform the wallet administrator.<br />
		`
		let {btn} = await FlowDialog.alert({
			title, body, cls:'with-icon big warning'
		})
		//if(btn != 'next')
		//	return
	}

	findTxIndex(transaction){
		let index = this.txs.findIndex(tx=>tx.ts<transaction.ts);
		if(index<0){
			return this.txs.length+100;
		}
		return index
	}
	async loadData() {
		let dots = setInterval(()=>{
			this.dots += '.';
			if(this.dots.length > 5)
				this.dots = '.';
		}, 333);
		try {
			this.isLoading = true;
			/*if (this._isCache) {
				this.log("calling loadData-> refreshState")
				await this.refreshState();
				this.isLoading = false;
			}else{*/
				this.log("calling loadData-> wallet.addressDiscovery")
				//if(this.grpcFlags.utxoIndex)
					await this.wallet.sync();
				//this.saveCache();
				this.isLoading = false;
			/*}*/
		} catch (err) {
			this.isLoading = false;
			this.showError(err);
		}
		clearInterval(dots);
		this.updateFaucetBalance();
	}
	connectedCallback(){
		super.connectedCallback();
		let mobileSuffix = isMobile?'-mobile':'';
		let openDialog = document.createElement('kaspa-open-dialog');
		openDialog.hideLogo = !!this.hideOpenWalletLogo;
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
		qrscannerDialog.debug = this.debugscanner
		this.parentNode.appendChild(qrscannerDialog);
		let uploadFileDialog = document.createElement("kaspa-upload-file-dialog");
		this.parentNode.appendChild(uploadFileDialog);

		//this.sendDataToDownload(JSON.stringify({wallet:1}), 'xxxxx.kpk')
		/*uploadFileDialog.open({}, (args)=>{
			console.log("uploadFileDialog:args", args)
		})*/
		
		console.log("connectedCallback1", openDialog)
		const {workerCorePath} = window.KaspaConfig||{}
		console.log("workerCorePath", workerCorePath)
		initKaspaFramework({
			workerPath: workerCorePath||"/kaspa-wallet-worker/worker.js?ident="+(window.KaspaConfig?.ident||"")
		}).then(()=>{
			let encryptedMnemonic = getLocalWallet()?.mnemonic
			console.log("connectedCallback2")
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
		this.initHelpers();

		let {mode} = dialog;
		console.log("$$$$$$$ mode", mode, encryptedMnemonic)
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
		if(mode == "import"){
			const wallet = await Wallet.import(password, encryptedMnemonic, {network, rpc})
			.catch(error=>{
				console.log("import wallet error:", error)
				dialog.setError("Incorrect passsword.");
			});

			//console.log("Wallet imported", encryptedMnemonic)

			if(!wallet)
				return

			encryptedMnemonic = await wallet.export(password);
			setLocalWallet(encryptedMnemonic, this.walletMeta);
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

	addPreparingTransactionNotification(args){
		this.preparingTxNotifications.set(args.uid, args);
	}

	removePreparingTransactionNotification({uid}){
		this.preparingTxNotifications.delete(uid);
	}

	/*
	updatePreparingTransactionNotification({uid, txid}){
		let info = this.preparingTxNotifications.get(uid)
		if(!info)
			info.txid = txid;
	}
	*/

	async sendTx(args){
		const {
			address, amount, note, fee,
			calculateNetworkFee, inclusiveFee
		} = args;
		console.log("sendTx:args", args)
		let uid;
		if(amount > 10){
			uid = UID();
			this.addPreparingTransactionNotification({uid, amount, address, note})
		}

		const response = await this.wallet.submitTransaction({
			toAddr: address,
			amount,
			fee, calculateNetworkFee, inclusiveFee, note
		}).catch(err=>{
			let msg = err.error || err.message || err;
			let error = (msg+"").replace("Error:", '')
			console.log("error", error)
			if(/Invalid Argument/.test(error))
				error = "Please provide correct address and amount";
			uid && this.removePreparingTransactionNotification({uid});
			FlowDialog.alert("Error", error);
		})

		if(uid){
			//if(response?.txid)
			//	this.updatePreparingTransactionNotification({uid, txid:response.txid});
			//else
				this.removePreparingTransactionNotification({uid});
		}

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
			let msg = err.error || err.message || err;
			error = (msg+"").replace("Error:", '');
			if(/Invalid Argument/.test(error))
				error = "Please provide address and amount";
			console.log("error", err);
			//error = 'Unable to estimate transaction fees';//(err+"").replace("Error:", '')
		})

		let result = {data, error}
		console.log("estimateTx:", data, error);

		return result;
	}


	makeFaucetRequest(subject, args){
		if(!window.flow?.app?.rpc?.request)
			return Promise.reject("flow.app.rpc issue")
		return flow.app.rpc.request(subject, args)
	}

	async updateFaucetBalance() {
		this.makeFaucetRequest('faucet-available', {address : this.receiveAddress})
		.then((resp) => {
			console.log(resp);
			const { available, period, ip } = resp;
			this.faucetStatus = null;
			this.faucetFundsAvailable = available;
			this.faucetPeriod = period;
			this.ip = ip;

		})
		.catch(ex => {
			console.log('faucet error:', ex);
		})
	}

	async getKaspaFromFaucet(amount) {
		this.makeFaucetRequest('faucet-request', {
			address : this.receiveAddress,
			amount: formatForMachine(amount)
		})
		.then((resp) => {
			console.log(resp);
			const { available, period, ip } = resp;
			this.faucetStatus = null;
			this.faucetFundsAvailable = available;
			this.faucetPeriod = period;
			this.ip = ip;

		})
		.catch(ex => {
			console.log('faucet error:', ex);
		})
	}


	requestFaucetFunds() {
		let max = formatForHuman(this.faucetFundsAvailable)
		showT9({
			value:'',
			max,
			heading:'Request funds',
			inputLabel:'Amount in KAS'
		}, ({value:amount, dialog})=>{
			console.log("t9 result", amount)
			let sompis = formatForMachine(amount||0);
			if(sompis > this.faucetFundsAvailable)
				return dialog.setError(`You can't request more than ${KAS(this.faucetFundsAvailable||0)} KAS.`);//'
			
			dialog.hide();

			this.getKaspaFromFaucet(amount)

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

	getTimeDelta(ts) {
		if(!ts)
			return '00:00:00';
		let delta = Math.round(ts / 1000);
		let sec = (delta % 60);
		let min = Math.floor(delta / 60 % 60);
		let hrs = Math.floor(delta / 60 / 60 % 24);
		let days = Math.floor(delta / 60 / 60 / 24);

		sec = (sec<10?'0':'')+sec;
		min = (min<10?'0':'')+min;
		hrs = (hrs<10?'0':'')+hrs;

		if(days && days >= 1) {
			return `${days.toFixed(0)} day${days>1?'s':''} ${hrs}:${min}:${sec}`;
		} else {
			return `${hrs}:${min}:${sec}`;
		}
	}

}
