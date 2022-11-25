import {
	html, css, FlowFormat, KaspaWalletUI, dpc,
	baseUrl, KAS, renderPagination, buildPagination, paginationStyle,
	swipeableStyle, FlowSwipeable, isMobile, dontInitiatedComponent,
	getTheme, setTheme, flow, T, i18nFormat, i18nHTMLFormat,
	FlowI18nDialog, askForPassword, i18n, getLocalWallet, Wallet
} from './kaspa-wallet-ui.js';
export {isMobile, dontInitiatedComponent};
export class KaspaWalletMobile extends KaspaWalletUI{

	static get properties() {
		return {
			txSkip:{type:Number},
			hideI18nIcon:{type:Boolean},
			locked:{type:Boolean, reflect:true},
			reloadOnLock:{type:Boolean}
		};
	}

	static get styles(){
		return [KaspaWalletUI.styles, paginationStyle, swipeableStyle, css`
			:host{
				padding:0px;display:flex;flex-direction:column;
				font-size:1.1rem;
				--k-pagination-active-bg:var(--flow-primary-color);
				--k-pagination-active-border-color:var(--flow-primary-color);
				--k-pagination-border-color:var(--flow-primary-color);
			}
			.header{
				display:flex;align-items:center;min-height:28px;
				padding:var(--kaspa-wallet-header-padding, 5px 10px);
				margin:var(--kaspa-wallet-header-margin, 0px);
			}

			.pagination a{
				border: var(--flow-btn-border, 2px solid var(--flow-border-color, var(--flow-primary-color, rgba(0,151,115,1))));
				border-radius:var(--flow-btn-radius, 8px);
				border-width:var(--flow-btn-border-width, 2px);
				padding:var(--flow-page-btn-padding, var(--flow-btn-padding, 5px))
			}
			.pagination-box{
				padding:var(--kaspa-pagination-box-padding, 10px 5px;);
			}

			.logo{
				width:30px;height:30px;/*background-color:#DDD*/
				display:var(--kaspa-wallet-header-logo-diaplay, initial);
			}
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
				width:fit-content;margin:0px auto;
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
				cursor:pointer;
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
				background-color:var(--kaspa-wallet-scan-button-bg, #3d4e58);
				--fa-icon-color:var(--kaspa-wallet-scan-button-color, #FFF);
				box-shadow:var(--flow-box-shadow);
			}
			.send-scan-buttons .send-btn fa-icon{
				background-color:var(--kaspa-wallet-send-button-bg, #fb7470);
				--fa-icon-color:var(--kaspa-wallet-send-button-color, #FFF);
			}
			.send-scan-buttons .receive-btn fa-icon{
				background-color:var(--kaspa-wallet-receive-button-bg, #60b686);
				--fa-icon-color:var(--kaspa-wallet-receive-button-color, #FFF);
			}
			.send-scan-buttons a span{
				display:block;text-align:center;font-size:0.75rem;margin:8px 0px 5px;
				text-transform:uppercase;
			}
			[hidden]{display:none}
			[not-ready].tabs-container,
			[not-ready] .tabs,
			[not-ready] .tab-contents{display:none}
			.br{min-width:100%;}
			.pb-0{padding-bottom:0px}
			.badge{margin:15px auto;width:calc(100% - 30px); font-size:1.1rem; text-align:center; }
			.center-btn{min-width:120px;max-width:180px;display:block;margin:5px auto}
			.v-margin{margin-top: 10px; margin-bottom:10px;}
			.flow-swipeable-row{position:relative;height:100%;max-height:100%;overflow:hidden;}
			.flow-swipeable{box-sizing:border-box;}
			.no-record{padding:20px; text-align:center;}

			.faucet-ux {display:flex;flex-direction:column;align-items:center;}
			.faucet-ux > flow-btn {margin: 8px;}
			.faucet-ux .margin {margin: 24px;}
			.faucet-ux .margin-bottom {margin-bottom: 24px;}
			.network-ux,
			.info-ux{display:flex;flex-direction:column;align-items:center;}
			.network-ux .caption,
			.info-ux .caption{margin-bottom: 15px;text-transform: uppercase;}
			.network-ux table tr td,
			.info-ux table tr td{ padding: 8px 4px; }
			.network-ux table tr td:nth-child(2),
			.info-ux table tr td:nth-child(2){ min-width:150px; }

			.wallet-ux, .faucet-ux, .network-ux,.info-ux{margin: 24px 15px;}
			.recent-transactions>.heading{text-align:center}
			.tx-list{flex: 1 1 0%;height:100px;overflow-y:auto;}
			.header .header{margin-left:10px;}
			.header-row { display: flex; flex-direction:row; align-items: center; }
			fa-icon.offline-icon { --fa-icon-size: 24px; --fa-icon-color:#aa0000; margin: 0px 4px 0px 8px; }
			.dots { width: 16px; display:inline-block; text-align:left;}
			.recent-transactions .tx-rows{max-height:none;}
			flow-expandable [slot="title"] fa-icon{
				--fa-icon-size: var(--flow-expandable-icon-box-svg-width,24px);
				--fa-icon-color:var(--flow-primary-color, rgba(0,151,115,1));
			    margin-right: var(--flow-expandable-icon-box-svg-margin-right,8px);
			}
			flow-expandable [slot="title"].center-icon{
				display:flex;align-items:center;justify-content:center;
			}
			flow-expandable[expand]:not([static-icon]) fa-icon{
				transform:rotate(90deg);
			}
			flow-expandable[no-icon]{
				--flow-expandable-icon-box-max-width:0px;
			}
			.developer-info{margin-top:26px;}
			.clear-used-utxos{margin:0px 10px;cursor:pointer}
			.theme-btn,.language-icon,.lock-btn{cursor:pointer}
			.language-icon{position:relative;margin:0px 10px 0 5px}
			.language-icon fa-icon{margin-right:10px}
			.language-icon:after{
				content:"";
				position:absolute;
				top:9px;
				right:-2px;
				width:0px;
				height:0px;
				border:5px solid transparent;
				border-top:5px solid var(--flow-primary-color);
			}
			.lock-screen{
				--fa-icon-size: 60px;
    			--fa-icon-margin: 35px;
				display:none;
				flex-direction:column;
				align-items:center;
				justify-content: center;
				position:absolute;
				z-index:1000000;
				background-color:var(--kaspa-lock-screen-bg-color);
				top:0px;bottom:0px;
				left:0px;right:0px;
			}
			.lock-screen .big-logo{
				max-width: 150px;
				margin: 10px auto 20px;
				display: block;
			}
			:host([locked]) .lock-screen{
				display:flex;
			}
		`];
	}
	constructor() {
		super();
		this.selectedTab = "balance";
		this.showBalanceTab = true;
		this.locked = false;
		this._onTXPaginationClick = this.onTXPaginationClick.bind(this);
		this._onUTXOPaginationClick = this.onUTXOPaginationClick.bind(this);
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
		const {inUseUTXOs={satoshis:0, count:0}} = this.walletDebugInfo;
		let PWAVersion = window.PWA?.version||'';
		return html`
		${this.renderHeaderBar()}
		<div class="tabs-container hide-scrollbar" ?not-ready=${!isReady}>
			<flow-menu class="tabs" selected="${selectedTab}"
				selector=".tab" valueAttr="tab" @select="${this.onTabSelect}">
				${this.showBalanceTab? html`<a class="tab" 
					tab="balance" href="javascript:void 0" is="i18n-a">Balance</a>`:''}
				<a class="tab" tab="transactions" href="javascript:void 0" is="i18n-a">Transactions</a>
				<a class="tab" tab="wallet" href="javascript:void 0" is="i18n-a">Wallet</a>
				${this.hideFaucet? '': html`<a class="tab"
					tab="faucet" href="javascript:void 0" is="i18n-a">Faucet</a>`}
				${this.hideNetwork? '': html`<a class="tab"
					tab="network" href="javascript:void 0" is="i18n-a">Network</a>`}
				${this.hideDebug? '': html`<a class="tab"
					tab="debuginfo" href="javascript:void 0" is="i18n-a">Debug</a>`}
				${this.hideUTXOs? '': html`<a class="tab"
					tab="utxos" href="javascript:void 0" is="i18n-a">UTXOs</a>
					<fa-icon ?hidden=${selectedTab!="utxos"}
						class="reload-utxo-btn ${this.reloadingUTXOs?'spinner':''}"
						icon="sync" @click=${this.reloadUTXOs}></fa-icon>`}
			</flow-menu>
		</div>
		<div class="tab-contents flow-swipeable-container" ?not-ready=${!isReady}>
			<div class="flow-swipeable-row">
				${this.showBalanceTab? html`<div 
					class="tab-content ${sCls('balance')}" for="balance">
					<div class="error-message" 
						?hidden=${!this.errorMessage}>${this.errorMessage}</div>
					${this.renderAddressAndQr()}
					${this.renderBalanceAndButton()}
					${this.renderTX({hideTxBtn:true, onlyNonConfirmed:true})}
				</div>`:''}
				<div class="tab-content v-box pb-0 ${sCls('transactions')}" for="transactions">
					${this.renderAllTX()}
				</div>
				<div class="tab-content ${sCls('wallet')}" for="wallet">
					<div class="wallet-ux">
						<div class="badge" is="i18n-div">KASPA WALLET</div>
						${ PWAVersion ? html`<div class="badge"><span is="i18n-span">Version</span> ${PWAVersion}</div>` : '' }
						<div class="badge"><span is="i18n-span">Status:</span> ${this.status}</div>
						<div class="badge"><span is="i18n-span">Network:</span> ${(this.receiveAddress||"").split(":")[0]||""}</div>

						<flow-btn class="center-btn primary v-margin"
							@click="${this.compoundUTXOs}" i18n>Compound Transactions</flow-btn>
						<flow-btn class="center-btn primary v-margin"
							@click="${this.exportTransactions}" i18n>Export transactions as CSV</flow-btn>
						<flow-btn class="center-btn primary v-margin"
							?disabled=${this.updatingTransactionsTime}
							@click="${this.updateTransactionsTime}" i18n>Update transactions time</flow-btn>
						${
							this.updatingTransactionsTimeStatus?
							html`
							<div class="transactions-update-status">
								${
									this.updatingTransactionsTimeStatus.total==0 || 
									(this.updatingTransactionsTimeStatus.total == this.updatingTransactionsTimeStatus.updated)?
									"All transactions updated":
									html`Transactions update:
									${this.updatingTransactionsTimeStatus.updated}
									/
									${this.updatingTransactionsTimeStatus.total}`
								}
							</div>
							`:''
						}
						<flow-btn class="center-btn primary v-margin"
							@click="${this.showSeeds}" i18n>Backup Seed</flow-btn>
						<flow-btn class="center-btn primary v-margin"
							@click="${this.showRecoverWallet}" i18n>Recover From Seed</flow-btn>
						<flow-btn class="center-btn primary v-margin"
							@click="${this.exportWalletFile}" i18n>Export Wallet Seed File (KPK)</flow-btn>
						<flow-btn class="center-btn primary v-margin"
							@click="${this.importWalletFile}" i18n>Import Wallet Seed File (KPK)</flow-btn>
						<input class="hidden-file-input" type="file" />
						<!--div class="badge">
							<hr style="margin:32px;"/>
						</div-->
						<flow-expandable class="developer-info" _expand no-info no-icon icon="-">
							<div class="badge center-icon" slot="title">
								<fa-icon icon="caret-right"></fa-icon>
								<span is="i18n-span">DEVELOPER INFO</span>
							</div>
							<div class="badge"><span is="i18n-span">Kaspa Core:</span> ${window.PWA_MODULES['@kaspa/core-lib']}</div>
							<div class="badge"><span is="i18n-span">Kaspa Wallet Framework:</span> ${window.PWA_MODULES['@kaspa/wallet']}</div>
							<div class="badge"><span is="i18n-span">Kaspa gRPC:</span> ${window.PWA_MODULES['@kaspa/grpc']}</div>
							<div class="badge"><span is="i18n-span">Kaspa gRPC Relay:</span> ${window.PWA_MODULES['@kaspa/grpc-web']}</div>
							<div class="badge"><span is="i18n-span">Kaspa UX:</span> ${window.PWA_MODULES['@kaspa/ux']}</div>
							<div class="badge"><span is="i18n-span">Flow UX:</span> ${window.PWA_MODULES['@aspectron/flow-ux']}</div>
						</flow-expandable>

					</div>
				</div>
				${this.hideFaucet? '': html`
				<div class="tab-content ${sCls('faucet')}" for="faucet">
					${this.faucetStatus ? this.faucetStatus : html`

						<div class="faucet-ux">
							<div class="margin-bottom"  is="i18n-div">KASPA FAUCET</div>
							<div>${i18nFormat('Your IP is [n]', this.ip||"")}</div>
							<div class="margin">${i18nHTMLFormat('You have <b>[n] KAS</b> available.', KAS(this.faucetFundsAvailable||0) )}</div>

							${this.faucetPeriod ? html`
								<div class="margin-bottom">${i18nHTMLFormat('Additional funds will be<br/>available in [n]', FlowFormat.duration(this.faucetPeriod))}</div>
							`:``}
							${ !this.faucetFundsAvailable ? html`` : html`
								<flow-btn class="primary" @click="${this.requestFaucetFunds}" i18n>Request Funds from Faucet</flow-btn>
							`}
						</div>

					`}
				</div>`}
				${this.hideNetwork? '': html`
				<div class="tab-content ${sCls('network')}" for="network">
					<div class='network-ux'>
						<div class='caption'>Network Status</div>
						${!this.networkName ? html`<div>OFFLINE</div>` : html`
							<div>
								<table>
									<tr><td>Network</td><td>${this.networkName}</td></tr>
									<tr><td>DAA Score</td><td>${FlowFormat.commas(this.blueScore)}</td></tr>
									<tr><td>DAG Header</td><td>${FlowFormat.commas(this.headerCount)}</td></tr>
									<tr><td>DAG Blocks</td><td>${FlowFormat.commas(this.blockCount)}</td></tr>
									<tr><td>Difficulty</td><td>${FlowFormat.commas(this.difficulty,2)}</td></tr>
									<tr><td>Median Offset</td><td>${this.getTimeDelta(this.pastMedianTimeDiff)}</td></tr>
									<tr><td>Median Time UTC</td><td>${this.pastMedianTime?(new Date(this.pastMedianTime)).toJSON().replace(/T/,' ').replace(/\..+$/,''):''}</td></tr>
								</table>
							</div>
						`}
						</div>
				</div>`}
				${this.hideDebug? '': html`
				<div class="tab-content ${sCls('debuginfo')}" for="debuginfo">
					<div class="info-ux">
						<div class='caption'>
							<flow-i18n>IN USE UTXOS</flow-i18n>
							<fa-icon class="clear-used-utxos"
								title="${T('Clear used UTXOs')}" icon="broom"
								@click="${this.clearUsedUTXOs}"></fa-icon>
						</div>
						<table>
							<tr><td is="i18n-td">COUNT</td><td>${inUseUTXOs.count}</td></tr>
							<tr><td is="i18n-td">AMOUNT</td><td>${KAS(inUseUTXOs.satoshis||0)} KAS</td></tr>
						</table>
						<flow-btn class="center-btn primary v-margin"
							@click="${this.showUTXOs}" i18n>Show UTXOs</flow-btn>
						<flow-btn class="center-btn primary v-margin"
							@click="${this.scanMoreAddresses}" i18n>Scan More Addresses</flow-btn>
						${this.renderExtraScaning()}
					</div>
				</div>`}
				${this.hideUTXOs? '': html`<div class="tab-content v-box pb-0 ${sCls('utxos')}" for="utxos">
					${this.renderUTXOs()}
				</div>`}
			</div>
		</div>
		${this.renderLockScreen()}
		`
	}
	renderHeaderBar(){
		let {wallet} = this;
		let isReady = !!wallet?.balance;
		let loadingIndicator = this.isLoading || !!this.preparingTxNotifications.size
		let theme = flow.app.getTheme("light")
		return html`
		<div class="header" ?not-ready=${!isReady}>
			<div class="logo">
				<img class="logo-img" @click=${this.toggleFullScreen}
					src="${baseUrl+'/resources/images/logo.png'}" />
			</div>
			<div class="flex"></div>
			<div class='header-status' ?hidden=${!this.isOfflineBadge}>
				<div class="header-row">
					<div>${T(this.isOnline?'ONLINE':'OFFLINE')}</div>
					<div><fa-icon class="offline-icon" icon="exclamation-triangle"></fa-icon></div>
				</div>
			</div>
			<fa-icon ?hidden=${!loadingIndicator} 
				class="spinner" icon="sync"
				style="position:absolute"></fa-icon>
			<fa-icon class="lock-btn" ?hidden=${(this.locked || !this.wallet)}
				@click=${this.lockWallet}
				icon="lock"></fa-icon>
			${this.hideI18nIcon? '': html`<div class="language-icon">
				<fa-icon icon="icons:language"
				@click="${this.onLangClick}"></fa-icon></div>`}
			<fa-icon class="theme-btn" @click=${this.toggleTheme}
				icon="${theme=="light"?'moon': 'sun'}"></fa-icon>
		</div>
		`
	}

	renderLockScreen(){
		return html`
			<div class="lock-screen">
				<div><img class="big-logo" src="/resources/images/kaspa.png"></div>
				<fa-icon icon="lock"></fa-icon>
				<flow-btn primary i18n @click="${this.unlockWallet}">UNLOCK WALLET</flow-btn>
			</div>
		`;
	}

	unlockWallet(){
		askForPassword({confirmBtnText:i18n.t("UNLOCK")}, async({btn, password})=>{
    		if(btn!="confirm")
    			return
    		let encryptedMnemonic = getLocalWallet().mnemonic;
    		let valid = await Wallet.checkPasswordValidity(password, encryptedMnemonic);
    		if(!valid)
    			return FlowDialog.alert(i18n.t("Error"), i18n.t("Invalid password"));

			this.locked = false;
			this.requestUpdate("locked", true);
		})
	}

	lockWallet(){
		if (this.reloadOnLock){
			window.location.reload();
			return
		}
		this.locked = true;
		this.requestUpdate("locked", false);
	}
	onLangClick(e){
		this.openI18nDialog(e.target);
	}
	openI18nDialog(target){
		FlowI18nDialog.open(target);
	}
	toggleTheme(){
		let theme = flow.app.getTheme("light");
		flow.app.setTheme(theme=="light"?'dark':'light');
		this.requestUpdate("theme", theme)
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
	 			<flow-menu-item data-action="showSeeds"><flow-i18n>Get Recovery Seed</flow-i18n></flow-menu-item>
				<flow-menu-item data-action="showRecoverWallet"><flow-i18n>Recover Wallet From Seed</flow-i18n></flow-menu-item>
				<!--flow-menu-item data-action="backupWallet"><flow-i18n>Backup This Wallet</flow-i18n></flow-menu-item-->
			</flow-menu>
		</flow-dropdown>`
	}
	renderAddressAndQr(){
		if(!this.wallet)
			return '';

		let address = this.receiveAddress||"";
		return html`
		<div class="address-and-qr">
			<div class="address-box">
				<flow-i18n>Receive Address:</flow-i18n>
				<div class="address-holder">
					<textarea class="address-input" readonly 
						@click="${()=>this.openAddressExplorer(address)}"
						.value="${address||""}"></textarea>
					<fa-icon ?hidden=${!address} class="copy-address"
						@click="${this.copyAddress}"
						title="${T('Copy to clipboard')}" icon="copy"></fa-icon>
				</div>
			</div>
			<flow-qrcode data="${address}"></flow-qrcode>
		</div>`
	}
	openAddressExplorer(address){
		if (!address)
			return
		let url = `https://explorer.kaspa.org/addresses/${address}`;

		window.open(url);
	}
	renderBalanceAndButton(){
		if(!this.wallet || !this.wallet.balance)
			return html``;

		const { balance : { available, pending } } = this.wallet;
		const total = available+pending;
		return html`
  			<div class="balance-badge">
				${ this.isLoading ? html`
					<div class="balance">
						<span class="value" is="i18n-span">SCANNING...</span>
					</div>
					<div class="balance pending">
						<span class="label-pending">${T('PLEASE WAIT')} <span class="dots">${this.dots}</span> ${total ? this.formatKAS(total)+' KAS':''}</span>
					</div>
				` : html`
					<div class="balance">
						<span class="value">${this.formatKAS(available)} KAS</span>
					</div>
					<div class="balance pending">
						<span class="label-pending" is="i18n-span">Pending:</span>
						<span class="value-pending">${this.formatKAS(pending)} KAS</span>
					</div>
				`}
            </div>
            <div class="send-scan-buttons">
				<a class="send-btn" @click="${this.showSendDialog}">
					<fa-icon icon="arrow-alt-from-bottom"></fa-icon>
					<span is="i18n-span">Send</span>
				</a>
				<a class="scan-btn" @click="${this.showSendDialogWithQrScanner}">
					<fa-icon icon="qrcode"></fa-icon>
					<span is="i18n-span">Scan</span>
				</a>
				<a class="receive-btn" @click="${this.showReceiveDialog}">
					<fa-icon icon="arrow-alt-to-bottom"></fa-icon>
					<span is="i18n-span">Receive</span>
				</a>
			</div>
		`;
	}

	onTXPaginationClick(e){
		let skip = e.target.closest("[data-skip]")?.dataset.skip;
		if(skip === undefined)
			return
		this.txSkip = +skip;
	}
	onUTXOPaginationClick(e){
		let skip = e.target.closest("[data-skip]")?.dataset.skip;
		if(skip === undefined)
			return
		this.utxoSkip = +skip;
	}
	/*
	renderStatus(){
		if(!this.wallet)
			return '';
		return html`
			<div class="status">
				Wallet Status: ${this.status||'Offline'}<br/>
				${
					this.blockCount == 1 ?
					html`DAG headers: ${this.headerCount?FlowFormat.commas(this.headerCount):''}` :
					html`DAA score: ${this.blueScore?FlowFormat.commas(this.blueScore):''}`
				}
			</div>
		`
	}
	*/
	firstUpdated(){
		super.firstUpdated();
		let swipeableContainer = this.renderRoot.querySelector(".flow-swipeable-container");
		this.swipeable = new FlowSwipeable(swipeableContainer, {
			drag:false,
			onSwipe:({index, element})=>{
				let tab = element?.getAttribute("for");
				//console.log("onSwipe:", {index, element, tab})
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
		//console.log("selectTab", tab)
		this.selectedTab = tab;
		this.requestUpdate("selectedTab", null)
		let tabEl = this.renderRoot.querySelector(`.tab[tab='${tab}']`);
		//console.log("selectTab", tab, tabEl)
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
		//console.log("this.sendDialog", this.sendDialog)
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
