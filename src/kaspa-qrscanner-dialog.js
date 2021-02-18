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
				border-radius:0px;width:100%;height:100%;
				padding:0px;max-height:none;
			}
			flow-t9{width:215px;margin:auto;display:block;}
			.body-box{align-items:flex-start;}
			.buttons {display:flex;flex-direction:column;align-items:center;}

		`]
	}
	constructor(){
		super();
		this.stoped = true;
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
		<flow-qrcode-scanner qrcode="${this.value||''}" _hidecode ?stoped=${this.stoped}
			@changed="${this.onQRChange}"></flow-qrcode-scanner>
		<!--flow-input class="full-width_" clear-btn value="${value}"
			label="${inputLabel}" readonly @changed=${this.onInputChange}>
		</flow-input-->
		<div class="error">${this.errorMessage}</div>
		<div class="buttons">
			<flow-btn class="primary" 
				@click="${this.sendBack}"> Close </flow-btn>
		</div>
		`;

		// ?disabled=${!this.isValid}
	}
	stopQRScanning(){
		let scanner = this.qS("flow-qrcode-scanner");
		scanner.stop();
		this.stoped = true;
	}
	startScanning(){
		let scanner = this.qS("flow-qrcode-scanner");
		scanner.start();
		scanner.updated();
		this.stoped = false;
	}
	sendBack(e){
		this.sendValueBack();
	}
	sendValueBack(){
		// this.stopQRScanning(); // just in case
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
		if(isValid)
			this.sendValueBack();
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
	_hide(skipHistory=false){
		this.stopQRScanning();
		super._hide(skipHistory);
	}
    cancel(){
    	this.hide();
    }
}

KaspaQRScannerDialog.define("kaspa-qrscanner-dialog");
