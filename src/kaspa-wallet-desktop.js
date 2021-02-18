import {html, css, FlowFormat, KaspaWalletUI} from './kaspa-wallet-ui.js';

export class KaspaWalletDesktop extends KaspaWalletUI{

	static get properties() {
		return {
		};
	}

	static get styles(){
		return [KaspaWalletUI.styles, css`
			:host{overflow:auto}
			.container{padding:15px;position:relative}
			.wallet-warning{
				max-width:640px;margin:5px auto;padding:10px;text-align:center;
				background-color:var(--kdx-wallet-warning-bg, #fdf8e4);
			}
			.heading{margin:5px 15px 25px;font-size:1.5rem;}
			flow-btn{vertical-align:bottom;margin:5px;}
			.error-message{color:#F00;margin:10px 0px;}
			[hidden]{display:none}
			.h-box{display:flex;align-items:center}
			.h-box .label{min-width:100px}
			.top-line{
				border-top:1px solid var(--flow-primary-color);
				padding-top:5px;margin-top:10px
			}
			.flex{flex:1}
			.body{display:flex;align-items:top;flex-wrap:wrap}
			.left-area{flex:4;margin-left:20px;max-width:600px;}
			.right-area{flex:6;margin-right:20px;max-width:750px;}
			.divider{flex:1}
			@media (max-width:950px){
				.left-area,.right-area{margin:auto;min-width:none}
				.divider{min-width:100%;height:100px}
			}
			[txout] .amount{color:red}
			.buttons{margin:20px 0px;}
			/*.balances .value{text-align:right}
			.balances .balance{display:flex;justify-content: space-between;}*/
			.loading-img{width:20px;height:20px;vertical-align:text-top;}

			.balance-badge{
				display:flex;flex-direction:column;padding:10px 0px;
				border-radius:10px;max-width:fit-content;
				/*
				box-shadow:var(--flow-box-shadow);
				border:2px solid var(--flow-primary-color);
				*/
			}
			.balance{display:flex;flex-direction:column;padding:5px;}
       		.value{font-family : "Exo 2"; font-size: 36px; margin-top: 4px;}
		 	.value-pending{
		 		font-family : "Exo 2"; font-size: 20px; margin-top: 4px;
		 	} 
			.label { font-family : "Open Sans"; font-size: 20px; }
			.label-pending { font-family : "Open Sans"; font-size: 14px; }
			[row]{display:flex;flex-direction:row;justify-content:space-between;}
			flow-qrcode{width:172px;margin-top:50px;box-shadow:var(--flow-box-shadow);}
			.address-badge{padding:15px 0px;}
			.address-holder{display:flex}
			.address-holder .copy-address{cursor:pointer}
			.address-input{
				border:0px;-webkit-appearance:none;outline:none;margin:5px 10px 0px 0px;
				flex:1;overflow: hidden;text-overflow:ellipsis;font-size:16px;
				max-width:500px;
				min-width:var(--kaspa-wallet-address-input-min-width, 460px);
				background-color:transparent;color:var(--flow-primary-color);
				font-family:"Exo 2";
			}
			.qr-code-holder{
				display:flex;align-items:flex-end;justify-content:space-between;
				max-height:200px;margin-bottom:32px;
			}
			.buttons-holder {
				display:flex;
			}
			.status{
				display:flex;
				margin-top:10px;
			}
			.tx-open-icon{cursor:pointer;margin-right:10px;}
			flow-dropdown.icon-trigger{
				--flow-dropdown-trigger-bg:transparent;
				--flow-dropdown-trigger-padding:5px;
				--flow-dropdown-trigger-width:auto;
			}
			.top-menu{
				position:var(--kaspa-wallet-top-menu-position, absolute);
				right:var(--kaspa-wallet-top-menu-right, 20px);
				top:var(--kaspa-wallet-top-menu-top, -4px);
				z-index:2;
				background-color:var(--flow-background-color, #FFF);
			}
			fa-icon.md{--fa-icon-size:24px}
		`];
	}
	constructor() {
		super();
	}
	render(){
		return html`
			<div class="container">
				<fa-icon ?hidden=${!this.isLoading} 
					class="spinner" icon="sync" style="position:absolute"></fa-icon>
				
				<div class="body">
					<div class="left-area">
						<div class="error-message" 
							?hidden=${!this.errorMessage}>${this.errorMessage}</div>
						${this.renderBalance()}
						${this.renderAddress()}
						${this.renderQRAndSendBtn()}
					</div>
					<div class="divider"></div>
					<div class="right-area">
						${this.renderMenu()}
						${this.renderTX()}
					</div>
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
	renderAddress(){
		if(!this.wallet)
			return '';

		return html`
		<div class="address-badge">
			<div>Receive Address:</div>
			<div class="address-holder">
				<input class="address-input" readonly value="${this.receiveAddress||''}">
				<fa-icon ?hidden=${!this.receiveAddress} class="copy-address"
					@click="${this.copyAddress}"
					title="Copy to clipboard" icon="copy"></fa-icon>
			</div>
		</div>`
	}
	renderBalance(){
		if(!this.wallet || !this.wallet.balance)
			return html``;

		const { balance : { available, pending } } = this.wallet;
		// let availableBalance = 67580000000000;
		// let totalBalance = 100000000000000.40;
		// let pending = totalBalance - availableBalance;
		return html`
  			<div class="balance-badge">
                <div class="balance">
                    <span class="label">Available</span>
                    <span class="value">${this.formatKAS(available)} KAS</span>
                </div>
                <div class="balance pending">
                    <span class="label-pending">Pending</span>
                    <span class="value-pending">${this.formatKAS(pending)} KAS</span>
                </div>
            </div>
		`;
	}
	renderQRAndSendBtn(){
		if(!this.wallet)
			return '';
		return html`
			<div class="qr-code-holder">
				<flow-qrcode text="${this.receiveAddress||""}"></flow-qrcode>
				<div class="buttons-holder">
					<flow-btn primary @click="${this.showSendDialog}">SEND</flow-btn>
					<div style="flex:1;width:20px;"></div>
					<flow-btn primary @click="${this.showSendDialogWithQrScanner}">Scan QR code</flow-btn>
				</div>
			</div>
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
	initWallet(encryptedMnemonic){
		if(encryptedMnemonic){
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
}
