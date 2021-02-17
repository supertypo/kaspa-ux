import {
	html, css, FlowFormat, KaspaWalletUI, dpc,
	baseUrl, KAS, renderPagination, buildPagination, paginationStyle,
	swipeableStyle, FlowSwipeable, isMobile
} from './kaspa-wallet-ui.js';
export {isMobile};
export class KaspaWalletMobile extends KaspaWalletUI{

	static get properties() {
		return {
			txSkip:{type:Number}
		};
	}

	static get styles(){
		return [KaspaWalletUI.styles, paginationStyle, swipeableStyle, css`
			:host{
				padding:0px;display:flex;flex-direction:column;
				font-size:1rem;
				--k-pagination-active-bg:var(--flow-primary-color);
				--k-pagination-active-border-color:var(--flow-primary-color);
				--k-pagination-border-color:var(--flow-primary-color);
			}
			.header{
				display:flex;align-items:center;padding:5px;
			}

			.pagination a{
				border: var(--flow-btn-border, 2px solid var(--flow-border-color, var(--flow-primary-color, rgba(0,151,115,1))));
				border-radius:var(--flow-btn-radius, 8px);
				border-width:var(--flow-btn-border-width, 2px);
			}
			.pagination-box{
				padding:var(--kaspa-pagination-box-padding, 10px 5px;);
			}

			.logo{width:30px;height:30px;/*background-color:#DDD*/}
			.logo-img{max-width:100%;max-height:100%;}
			fa-icon.spinner{position:relative !important;margin: 0px 10px;}
			.error-message{color:#F00;margin:10px 0px;}
			.tabs-container{
				overflow:hidden;overflow-x:auto;
				border-top:2px solid var(--kaspa-wallet-tab-border-top-color, var(--flow-primary-color));
				border-bottom:1px solid var(--kaspa-wallet-tab-border-bottom-color, #DDD);
			}
			.tabs{
				display:flex;align-items:stretch;padding:0px;
				width:fit-content;
			}
			.tabs .tab{
				display:flex;align-items:center;justify-content:center;
				padding:10px;text-transform:uppercase;text-align:center;
				border-bottom:2px solid transparent;min-height:30px;
				margin:0px 5px;color:inherit;
				text-decoration:none;
			}
			.tab.selected{
				border-bottom-color:var(--kaspa-wallet-tab-active-border-color, var(--flow-primary-color));
			}
			.tab:not(.selected){cursor:pointer}
			.tab-contents{position:relative;flex:1;overflow:hidden}
			.tab-content{
				/*position:absolute;top:0px;bottom:0px;*/
				z-index:1;width:100%;height:100%;
				background-color:var(--flow-background-color, #FFF);
				/*left:100%;transition:left 0.5s ease;*/
				overflow:auto;padding:0px 0px 20px;box-sizing:border-box;
				/*background: -webkit-linear-gradient(left, #1e5799 0%,#f7858d 100%);*/
			}
			.tab-content.deactivating.selected,
			.tab-content.deactivating{
				/*left:-100%;*/
			}
			.tab-content.selected{
				/*z-index:2;left:0%;*/
			}
			.top-menu{
				background-color:var(--flow-background-color, #FFF);
			}
			.flex{flex:1}
			.address-and-qr{
				display:flex;flex-direction:row;justify-content:space-between;
				align-items:flex-start;
			}
			.address-box{padding:15px;flex:1}
			.address-holder{display:flex}
			.address-holder .copy-address{cursor:pointer;margin:3px 0px;}
			.address-input{
				border:0px;-webkit-appearance:none;outline:none;margin:5px 5px 0px 0px;
				flex:1;overflow: hidden;text-overflow:ellipsis;font-size:16px;
				max-width:500px;width:100px;
				min-width:var(--kaspa-wallet-address-input-min-width, 460px);
				background-color:transparent;color:var(--flow-primary-color);
				font-family:"Exo 2";word-wrap:break-word;height:110px;
				resize:none;
			}
			flow-qrcode{
				flex:1;width:150px;max-width:150px;margin:15px;
				box-shadow:var(--flow-box-shadow);
			}
			.balance-badge{text-align:center;margin:15px;}
			.balance{font-size:1.2rem}
			.balance.pending{font-size:0.9rem;margin:5px 0px;}
			flow-dropdown.icon-trigger{
				margin:0px;
				--flow-dropdown-trigger-bg:transparent;
				--flow-dropdown-trigger-padding:2px;
				--flow-dropdown-trigger-width:auto;
			}
			
			fa-icon.md{--fa-icon-size:24px}
			.send-scan-buttons{display:flex;justify-content:space-evenly;margin:30px 0px;}
			.send-scan-buttons a{display:block}
			.send-scan-buttons a fa-icon{
				--fa-icon-size:26px;border-radius:50%;padding:22px;
				background-color:var(--kaspa-wallet-send-button-bg, #3d4e58);
				--fa-icon-color:var(--kaspa-wallet-send-button-color, #FFF);
				box-shadow:var(--flow-box-shadow);
			}
			.send-scan-buttons .send-btn fa-icon{
				background-color:var(--kaspa-wallet-send-button-bg, #fb7470);
				--fa-icon-color:var(--kaspa-wallet-send-button-color, #FFF);
			}
			.send-scan-buttons .receive-btn fa-icon{
				background-color:var(--kaspa-wallet-send-button-bg, #60b686);
				--fa-icon-color:var(--kaspa-wallet-send-button-color, #FFF);
			}
			.send-scan-buttons a span{
				display:block;text-align:center;font-size:0.75rem;margin:8px 0px 5px;
				text-transform:uppercase;
			}
			[hidden]{display:none}
			[not-ready] .tabs,
			[not-ready] .tab-contents{display:none}
			.tx-list{flex:1;height:100px;overflow:auto}
			.tx-row{
				margin:0px 5px;
				display:flex;background-color:#ededed;
				border-bottom:1px solid #DDD;
				flex-wrap:wrap;padding:2px;
			}
			.tx-row:nth-child(2n){background-color:#f9f9f9}
			.tx-row:hover{background-color:#DDD}
			.tx-date{white-space:nowrap;}
			.tx-id,.tx-address{flex:1;overflow:hidden;text-overflow:ellipsis}
			.tx-row>div{padding:2px;}
			.tx-amount{white-space:nowrap;margin:0px 20px}
			.tx-num{min-width:60px}
			.br{min-width:100%;}
			.pb-0{padding-bottom:0px}
			.badge{margin:15px auto;width:calc(100% - 30px); font-size:1.1rem; text-align:center; }
			.center-btn{min-width:120px;max-width:180px;display:block;margin:5px auto}
			.flow-swipeable-row{position:relative;height:100%;max-height:100%;overflow:hidden;}
			.flow-swipeable{box-sizing:border-box;}
			.no-record{padding:20px; text-align:center;}

			.faucet-ux {
				margin-top:32px;
				display: flex;
				flex-direction:column;
				align-items:center;
			}

			.faucet-ux > div, .faucet-ux > flow-btn {
				margin: 8px;
			}
		`];
	}
	constructor() {
		super();
		this.selectedTab = "balance";
		this._onTXPaginationClick = this.onTXPaginationClick.bind(this);
	}
	toggleFullScreen(){
		if (this.fullscreen)
			document.webkitExitFullscreen();
		else
			document.documentElement.webkitRequestFullscreen();

		this.fullscreen = !this.fullscreen;
	}
	render(){
		let {selectedTab, wallet} = this;
		let isReady = !!wallet?.balance;

		const sCls = tab=>tab==selectedTab?'selected flow-swipeable':'flow-swipeable';
		return html`
		<div class="header" ?not-ready=${!isReady}>
			<div class="logo">
				<img class="logo-img" @click=${this.toggleFullScreen}
					src="${baseUrl+'/resources/images/logo.png'}" />
			</div>
			<div class="flex"></div>
			<fa-icon ?hidden=${!this.isLoading} 
				class="spinner" icon="spinner"
				style="position:absolute"></fa-icon>
		</div>
		<div class="tabs-container hide-scrollbar" ?not-ready=${!isReady}>
			<flow-menu class="tabs" selected="${selectedTab}"
				selector=".tab" valueAttr="tab" @select="${this.onTabSelect}">
				<a class="tab" tab="balance" href="javascript:void 0">Balance</a>
				<a class="tab" tab="transactions" href="javascript:void 0">Transactions</a>
				<a class="tab" tab="wallet" href="javascript:void 0">Wallet</a>
				<a class="tab" tab="faucet" href="javascript:void 0">Faucet</a>
				<a class="tab" tab="network" href="javascript:void 0">Network</a>
			</flow-menu>
		</div>
		<div class="tab-contents flow-swipeable-container" ?not-ready=${!isReady}>
			<div class="flow-swipeable-row">
				<div class="tab-content ${sCls('balance')}" for="balance">
					<div class="error-message" 
						?hidden=${!this.errorMessage}>${this.errorMessage}</div>
					${this.renderAddressAndQr()}
					${this.renderBalanceAndButton()}
				</div>
				<div class="tab-content v-box pb-0 ${sCls('transactions')}" for="transactions">
					${this.renderTX()}
				</div>
				<div class="tab-content ${sCls('wallet')}" for="wallet">
					<div class="badge"><span>Status:</span> ${this.status}</div>
					<div class="badge"><span>Network:</span> ${(this.receiveAddress||"").split(":")[0]||""}</div>

					<flow-btn class="center-btn primary"
						@click="${this.showSeeds}">Backup Seed</flow-btn>
					<flow-btn class="center-btn primary"
						@click="${this.showRecoverWallet}">Recover From Seed</flow-btn>
					<flow-btn class="center-btn primary"
						@click="${this.exportWalletFile}">Export Wallet Seed File (KPK)</flow-btn>
					<flow-btn class="center-btn primary"
						@click="${this.importWalletFile}">Import Wallet Seed File (KPK)</flow-btn>
				</div>
				<div class="tab-content ${sCls('faucet')}" for="faucet">
					${this.faucetStatus ? this.faucetStatus : html`

						<div class="faucet-ux">
							<div>Available:</div>
							<div>${KAS(this.faucetFundsAvailable||0)} KAS</div>

							${this.faucetPeriod ? html`
								<div>Additional funds will be<br/>available in ${FlowFormat.duration(this.faucetPeriod)}</div>
							`:``}
							${ !this.faucetFundsAvailable ? html`` : html`
								<flow-btn class="primary" @click="${this.requestFaucetFunds}">REQUEST FUNDS FROM FAUCET</flow-btn>
							`}
						</div>

					`}


				</div>
				<div class="tab-content ${sCls('network')}" for="network">

					<div>Network Status</div>
					${!this.networkName ? html`OFFLINE` : html`
						<table>
							<tr><td>Network</td><td>${this.networkName}</td></tr>
							<tr><td>DAG Blue Score</td><td>${FlowFormat.commas(this.blueScore)}</td></tr>
							<tr><td>DAG Header</td><td>${FlowFormat.commas(this.headerCount)}</td></tr>
							<tr><td>DAG Blocks</td><td>${FlowFormat.commas(this.blockCount)}</td></tr>
							<tr><td>Difficulty</td><td>${FlowFormat.commas(this.difficulty)}</td></tr>
							<tr><td>Median Latency</td><td>${FlowFormat.duration(this.pastMedianTimeDiff)}</td></tr>
							<tr><td>Median Time</td><td>${this.pastMedianTime?(new Date(this.pastMedianTime)).toJSON().replace(/T/,' '):''}</td></tr>
						</table>
					`}
				</div>
			</div>
		</div>
		`
	}
	onTabClick(e){
		//alert("onTabClick:"+e.target)
	}
	renderMenu(){
		if(!this.wallet)
			return '';

		return html`
		<flow-dropdown class="icon-trigger top-menu right-align">
			<fa-icon class="md" icon="cog" slot="trigger"></fa-icon>
			<flow-menu @click="${this.onMenuClick}" selector="_">
	 			<flow-menu-item data-action="showSeeds">Get Recovery Seed</flow-menu-item>
				<flow-menu-item data-action="showRecoverWallet">Recover Wallet From Seed</flow-menu-item>
				<!--flow-menu-item data-action="backupWallet">Backup This Wallet</flow-menu-item-->
			</flow-menu>
		</flow-dropdown>`
	}
	renderAddressAndQr(){
		if(!this.wallet)
			return '';

		let address = this.receiveAddress||"";
		//console.log("address", address)
		return html`
		<div class="address-and-qr">
			<div class="address-box">
				Receive Address:
				<div class="address-holder">
					<textarea class="address-input" readonly>${address}</textarea>
					<fa-icon ?hidden=${!address} class="copy-address"
						@click="${this.copyAddress}"
						title="Copy to clipboard" icon="copy"></fa-icon>
				</div>
			</div>
			<flow-qrcode data="${address}"></flow-qrcode>
		</div>`
	}
	renderBalanceAndButton(){
		if(!this.wallet || !this.wallet.balance)
			return html``;

		const { balance : { available, pending } } = this.wallet;
		// let availableBalance = 67580000000000;
		// let totalBalance = 100000000000000.40;
		// let pending = totalBalance - availableBalance;
		return html`
  			<div class="balance-badge">
				${ this.isLoading ? html`
					<div class="balance">
						<span class="value">SCANNING...</span>
					</div>
					<div class="balance pending">
						<span class="label-pending">PLEASE WAIT</span>
					</div>
				` : html`
					<div class="balance">
						<span class="value">${this.formatKAS(available)} KAS</span>
					</div>
					<div class="balance pending">
						<span class="label-pending">Pending:</span>
						<span class="value-pending">${this.formatKAS(pending)} KAS</span>
					</div>
				`}
            </div>
            <div class="send-scan-buttons">
				<a class="send-btn" @click="${this.showSendDialog}">
					<fa-icon icon="arrow-alt-from-bottom"></fa-icon>
					<span>Send</span>
				</a>
				<a class="scan-btn" @click="${this.showSendDialogWithQrScanner}">
					<fa-icon icon="qrcode"></fa-icon>
					<span>Scan</span>
				</a>
				<a class="receive-btn" @click="${this.showReceiveDialog}">
					<fa-icon icon="arrow-alt-to-bottom"></fa-icon>
					<span>Receive</span>
				</a>
			</div>
		`;
	}
	renderTX(){
		let {txLimit:limit=100, txs:totalItems=[], txSkip=0} = this;
		let pagination = buildPagination(totalItems.length, txSkip, limit)
		let items = totalItems.slice(txSkip, txSkip+limit);
		//console.log("renderTX:items", items)
		return html`
			${items.length?'':html`<div class="no-record">No Transactions</div>`}
			<div class="tx-list">
				${items.map((tx, i)=>{
					return html`
					<div class="tx-row">
						<div class="tx-num">#${txSkip+i+1}</div>
						<div class="tx-date">${tx.date}</div>
						<div class="tx-amount">${KAS(tx.amount)} KAS</div>
						<div class="tx-id">${tx.id.split(":")[0]}</div>
						<div class="br tx-note">${tx.note}</div>
						<div class="tx-address">${tx.address}</div>
					</div>`
				})}
			</div>
			${renderPagination(pagination, this._onTXPaginationClick)}
		`
	}
	onTXPaginationClick(e){
		let skip = e.target.closest("[data-skip]").dataset.skip;
		console.log("skip", skip, e.target)
		if(skip === undefined)
			return
		this.txSkip = +skip;
	}
	renderStatus(){
		if(!this.wallet)
			return '';
		return html`
			<div class="status">
				Wallet Status: ${this.status||'Offline'}<br/>
				${
					this.blockCount == 1 ?
					html`DAG headers: ${this.headerCount?FlowFormat.commas(this.headerCount):''}` :
					html`DAG blue score: ${this.blueScore?FlowFormat.commas(this.blueScore):''}`
				}
			</div>
		`
	}
	firstUpdated(){
		super.firstUpdated();
		let swipeableContainer = this.renderRoot.querySelector(".flow-swipeable-container");
		this.swipeable = new FlowSwipeable(swipeableContainer, {
			drag:false,
			onSwipe:({index, element})=>{
				let tab = element?.getAttribute("for");
				console.log("onSwipe:", {index, element, tab})
				if(!tab)
					return
				this.selectTab(tab);
			}
		});
	}
	onTabSelect(e){
		let {selected} = e.detail;
		this.selectTab(selected);
	}
	selectTab(tab){
		if(this.selectedTab == tab)
			return
		console.log("selectTab", tab)
		this.selectedTab = tab;
		this.requestUpdate("selectedTab", null)
		let tabEl = this.renderRoot.querySelector(`.tab[tab='${tab}']`);
		console.log("selectTab", tab, tabEl)
		if(!tabEl)
			return
		tabEl.scrollIntoView();
		let index = [...tabEl.parentNode.children].indexOf(tabEl)
		
		if(index <0)
			return
		this.swipeable.setActive(index)
		/*
		console.log("onTabSelect", selected)
		let oldContent = this.renderRoot.querySelector(".tab-content.selected");
		let newContent = this.renderRoot.querySelector(`.tab-content[for='${selected}']`);
		oldContent.classList.add("deactivating");
		oldContent.classList.remove("selected");
		newContent.classList.add("selected");
		this.selectedTab = selected;
		dpc(500, ()=>{
			oldContent.classList.remove("deactivating");
		})
		*/

	}

	showSendDialog(){
		console.log("this.sendDialog", this.sendDialog)
		this.sendDialog.open({wallet:this}, (args)=>{
			this.sendTx(args);
		})
	}
	showReceiveDialog(){
		let address = this.receiveAddress||'kaspatest:abc'
		this.receiveDialog.open({wallet:this, address}, (args)=>{
			//
		})
	}

}
