import {
	html, css, FlowFormat, KaspaWalletUI, dpc,
	baseUrl
} from './kaspa-wallet-ui.js';

export class KaspaWalletMobile extends KaspaWalletUI{

	static get properties() {
		return {
		};
	}

	static get styles(){
		return [KaspaWalletUI.styles, css`
			:host{
				padding:0px;display:flex;flex-direction:column;
				font-size:1rem;
			}
			.header{
				display:flex;align-items:center;padding:5px;
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
				margin:0px 5px;
			}
			.tab.selected{
				border-bottom-color:var(--kaspa-wallet-tab-active-border-color, var(--flow-primary-color));
			}
			.tab:not(.selected){cursor:pointer}
			.tab-contents{position:relative;flex:1}
			.tab-content{
				position:absolute;top:0px;bottom:0px;z-index:1;width:100%;height:100%;
				background-color:var(--flow-background-color, #FFF);
				left:100%;transition:left 0.5s ease;
				overflow:auto;padding:0px 0px 20px;box-sizing:border-box;
				/*background: -webkit-linear-gradient(left, #1e5799 0%,#f7858d 100%);*/
			}
			.tab-content.deactivating.selected,
			.tab-content.deactivating{
				left:-100%;
			}
			.tab-content.selected{
				z-index:2;left:0%;
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
				resize: none;
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
				--fa-icon-size:14px;border-radius:50%;padding:20px;
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
				display:block;text-align:center;font-size:0.5rem;margin:8px 0px 5px;
				text-transform:uppercase;
			}
			[hidden]{display:none}
		`];
	}
	constructor() {
		super();
		this.selectedTab = "balance";
		this.sendDialog = document.createElement("kaspa-send-dialog-mobile");
		this.parentNode.appendChild(this.sendDialog);
		let t9Dialog = document.createElement("kaspa-t9-dialog");
		this.parentNode.appendChild(t9Dialog);
		let qrscannerDialog = document.createElement("kaspa-qrscanner-dialog");
		this.parentNode.appendChild(qrscannerDialog);
	}
	render(){
		let {selectedTab} = this;
		const sCls = tab=>tab==selectedTab?'selected':'';
		return html`
		<div class="header">
			<div class="logo">
				<img class="logo-img" src="${baseUrl+'/resources/images/logo.png'}" />
			</div>
			<div class="flex"></div>
			<fa-icon ?hidden=${!this.isLoading} 
				class="spinner" icon="spinner"
				style="position:absolute"></fa-icon>
			${this.renderMenu()}
		</div>
		<div class="tabs-container hide-scrollbar">
			<flow-menu class="tabs" selected="${selectedTab}"
				selector=".tab" valueAttr="tab" @select="${this.onTabSelect}">
				<div class="tab" tab="balance">Balance</div>
				<div class="tab" tab="transactions">Transactions</div>
				<div class="tab" tab="wallet">Wallet</div>
				<div class="tab" tab="settings">Settings</div>
			</flow-menu>
		</div>
		<div class="tab-contents">
			<div class="tab-content ${sCls('balance')}" for="balance">
				<div class="error-message" 
					?hidden=${!this.errorMessage}>${this.errorMessage}</div>
				${this.renderAddressAndQr()}
				${this.renderBalanceAndButton()}
			</div>
			<div class="tab-content ${sCls('transactions')}" for="transactions">
				${this.renderTX()}
			</div>
			<div class="tab-content ${sCls('wallet')}" for="wallet">
				<h1>Wallet</h1>

				Network ${this.receiveAddress}

				${this.faucetStatus ? this.faucetStatus : html`
				
					TODO - ${this.faucetFundsAvailable}

					${ !this.faucetPeriod ? html`` : html`
						Additional funds will be available in ${FlowFormat.duration(this.faucetPeriod)}
					`}
				
				`}


			</div>
			<div class="tab-content ${sCls('settings')}" for="settings">
				<h1>Settings</h1>
			</div>
		</div>
		`
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

		return html`
		<div class="address-and-qr">
			<div class="address-box">
				Receive Address:
				<div class="address-holder">
					<textarea class="address-input" readonly>${this.receiveAddress||''}</textarea>
					<fa-icon ?hidden=${!this.receiveAddress} class="copy-address"
						@click="${this.copyAddress}"
						title="Copy to clipboard" icon="copy"></fa-icon>
				</div>
			</div>
			<flow-qrcode text="${this.receiveAddress||""}"></flow-qrcode>
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
                <div class="balance">
                    <span class="value">${this.formatKAS(available)} KAS</span>
                </div>
                <div class="balance pending">
                    <span class="label-pending">Pending</span>
                    <span class="value-pending">${this.formatKAS(pending)} KAS</span>
                </div>
            </div>
            <div class="send-scan-buttons">
				<a class="send-btn" @click="${this.showSendDialog}">
					<fa-icon icon="upload"></fa-icon>
					<span>Send</span>
				</a>
				<a class="scan-btn" @click="${this.showSendDialogWithQrScanner}">
					<fa-icon icon="qrcode"></fa-icon>
					<span>Scan</span>
				</a>
				<a class="receive-btn" @click="${this.showSendDialog}">
					<fa-icon icon="download"></fa-icon>
					<span>Receive</span>
				</a>
			</div>
		`;
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
	onTabSelect(e){
		let {selected} = e.detail;
		if(this.selectedTab == selected)
			return
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

	}

	showSendDialog(){
		console.log("this.sendDialog", this.sendDialog)
		this.sendDialog.open({wallet:this}, (args)=>{
			this.sendTx(args);
		})
	}

	showSendDialogWithQrScanner() {
/*
// TODO: DESKTOP VERSION WILL ALSO NEED QR CODE SCANNER
// TODO: AS DESKTOP VERSION WILL RUN / WORK ON TABLETS
// TODO: WE SHOULD HAVE SETTINGS/SWITCH TO MOBILE/DESKTOP
// TODO: AND STORE THAT IN LOCALSTORAGE
const el = document.createElement('div');
el.style.width = '300px';
el.style.height = '300px';
el.id = 'reader';
el.style.zIndex = '100;'
document.body.append(el);

// https://github.com/mebjas/html5-qrcode

		let html5QrcodeScanner = new Html5QrcodeScanner(
			"reader", { fps: 10, qrbox: 250 }, );
		html5QrcodeScanner.render((qr)=>{
			console.log('qr status',qr);
		}, (error)=>{
			// console.log('qr error',error);
		});

		// this.sendDialog.open({wallet:this}, (args)=>{
		// 	this.sendTx(args);
		// })
*/

	}




}
