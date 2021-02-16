import {
	html, css, KaspaDialog, askForPassword, KAS,
	formatForMachine, formatForHuman
} from './kaspa-dialog.js';
const pass = "";

class KaspaQRScannerDialog extends KaspaDialog{
	static get properties(){
		return {
			value:{type:String}
		}
	}
	static get styles(){
		return [KaspaDialog.styles, css`
			.container{
				border-radius:0px;width:100%;height:100%;border:0px;
				padding:0px;max-height:none;
				--flow-input-label-font-size: 0.9rem;
				--flow-input-label-padding: 5px 7px;
				--flow-input-font-family: 'Consolas';
				--flow-input-font-size:14px;
				--flow-input-font-weight: normal;
				--flow-input-height:50px;
				--flow-input-margin: 20px 0px;
				--flow-input-padding: 10px 10px 10px 16px;
				--flow-menu-item-bg:#EFEFEF;
			}
			flow-t9{width:215px;margin:auto;display:block;}
			.buttons{
				justify-content:center;margin:20px 0px;width:100%;
				box-sizing:border-box;
			}
		`]
	}
	constructor(){
		super();
		window.showQRScanner = (args, callback)=>{
			this.open(args, callback)
		}
	}
	renderHeading({estimating}){
		return html`${this.renderBackBtn()} ${this.heading}`
	}
	renderBody(){
		let value = this.value || '';
		let {inputLabel='Scan result'} = this;
		return html`
		<flow-qrcode-scanner qrcode="${this.value||''}" hidecode
			@changed="${this.onQRChange}"></flow-qrcode-scanner>
		<flow-input class="full-width" clear-btn value="${value}"
			label="${inputLabel}" readonly @changed=${this.onInputChange}>
		</flow-input>
		<div class="error">${this.errorMessage}</div>
		<div class="buttons">
			<flow-btn class="primary" ?disabled=${!this.isValid}
				@click="${this.sendBack}">Next</flow-btn>
		</div>
		`;
	}
	stopQRScanning(){
		let scanner = this.qS("flow-qrcode-scanner");
		scanner.stop();
	}
	startScanning(){
		let scanner = this.qS("flow-qrcode-scanner");
		scanner.start();
	}
	sendBack(e){
		this.callback({value:this.value, dialog:this})
	}
	onInputChange(e){
		//console.log("onInputChange", e.detail)
		let value = e.detail.value;
		this.setValue(value);
	}
	onQRChange(e){
		let value = e.detail.code;
		this.setValue(value);
	}
	async setValue(value){
		let isValid = !!value;
		this.value = value;
		this.setError("")
		if(value && this.isAddressQuery){
			isValid = await this.wallet.isValidAddress(value)
			if(!isValid)
				this.setError("Invalid Address")
		}
		this.isValid = isValid;
		//console.log("onT9Change:this.value", this.value)
	}
	open(args, callback){
		this.callback = callback;
		this.args = args;
		this.value = args.value||'';
		this.heading = args.title||args.heading||'Scan QR code';
		this.inputLabel = args.inputLabel||'Scan result';
		this.isAddressQuery = !!args.isAddressQuery;
		this.wallet = args.wallet
		this.show();
		this.startScanning();
	}
	hide(){
		this.stopQRScanning();
		super.hide();
	}
    cancel(){
    	this.hide();
    }
}

KaspaQRScannerDialog.define("kaspa-qrscanner-dialog");
