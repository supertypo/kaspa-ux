import {
	html, css, KaspaDialog, askForPassword, KAS,
	formatForMachine, formatForHuman
} from './kaspa-dialog.js';
const pass = "";

class KaspaSendDialogMobile extends KaspaDialog{
	static get properties(){
		return {
			address:{type:String}
		}
	}
	static get styles(){
		return [KaspaDialog.styles, 
		css`
			.container{
				border-radius:0px;width:100%;height:100%;border:0px;
				padding:0px;
				max-height:none;
				--flow-input-label-font-size: 0.9rem;
				--flow-input-label-padding: 5px 7px;
				--flow-input-font-family:'Exo 2', Consolas;
				--flow-input-font-size:1rem;
				--flow-input-font-weight: normal;
				--flow-input-height:50px;
				--flow-input-margin: 20px 0px;
				--flow-input-padding: 10px 10px 10px 16px;
			
			}
			.address-option-btns{
				width:90%;max-width:450px;margin:auto;
				display:flex;flex-wrap:wrap;flex-direction:column;
				justify-content:center; align-items:center;
			}
			label{font-size:0.9rem;margin:5px;display:block}
			.address-option-btns flow-btn{flex:1;max-width:120px;min-width:120px;margin:5px}
			.buttons{justify-content:flex-end;align-items:center}
			.spinner{margin-right:20px}
			.estimate-tx-error{color:red}
			.estimate-tx span{display:block}	
			flow-checkbox{width:100%;margin:15px 0px;}
			[col] { display:flex; flex-direction: row;flex-wrap:wrap }
			[spacer] { min-width: 32px; }
			[flex] { flex:1; }
			flow-input{min-width:100px;}
			flow-input.amount,
			flow-input.fee{flex:1}
			flow-checkbox{margin:8px 0px;}
			.body-box{align-items:flex-start;}
			.center-button{
				margin:5px auto;display:block;max-width:120px;
			}
			@media (max-width:400px){
				[spacer] { min-width: 100%; }
			}
		`]
	}
	buildRenderArgs(){
		const estimating = this.estimateTxSignal && !this.estimateTxSignal.isResolved;
		const estimateFee = this.estimate?.fee;
		return {estimating, estimateFee};
	}
	renderHeading({estimating}){
		return html`${this.renderBackBtn()} SEND 
			<div class="flex"></div>
			${estimating?html`<fa-icon class="spinner" icon="spinner"
				></fa-icon>`:''}`;
	}
	renderBody({estimating, estimateFee}){
		return html`
			${this.renderAddress()}
			<flow-input class="amount full-width" suffix-btn
				label="Amount in KAS" @keyup=${this.onAmountChange}>
				<flow-btn slot="suffix" class="primary"
					@click="${this.showT9}"><fa-icon icon="keyboard"></fa-icon></flow-btn>
			</flow-input>
			<flow-input class="fee full-width" suffix-btn
				label="Priority Fee in KAS"
				@keyup="${this.onNetworkFeeChange}">
				<flow-btn slot="suffix" class="primary"
					@click="${this.showT9}"><fa-icon icon="keyboard"></fa-icon></flow-btn>
			</flow-input>
			<flow-input class="note full-width" outer-border label="Note"></flow-input>
			<flow-checkbox class="calculate-network-fee" checked
				@changed="${this.onCalculateFeeChange}">Automatically calculate network fee</flow-checkbox>
			<!--flow-input class="maximum-fee full-width" label="Maximum network fee"></flow-input-->
			<flow-checkbox class="inclusive-fee"
				@changed="${this.onInclusiveFeeChange}">Include fee in the amount</flow-checkbox>
			${this.renderEstimate()}
			<div class="error">${this.errorMessage}</div>
			<flow-btn primary class="center-button"
				?disabled=${estimating || !this.estimateTxSignal || !estimateFee}
				@click="${this.sendAfterConfirming}">SEND
			</flow-btn>
			`;
	}
	renderAddress(){
		if(this.address){
			let address = this.address!="-"?this.address:'';
			return html `
				<flow-input class="address full-width" clear-btn outer-border
					label="Address" _readonly placeholder=""
					value="${address}"
					@changed="${this.onAddressChange}">
				</flow-input>
			`
		}
		return html`
			<center>
				<label>Enter recipient address:</label>
			</center>
			<div class="address-option-btns">
				<flow-btn @click="${this.scanQRCode}"
					class="primary">Scan QR Code</flow-btn>
				<flow-btn @click="${this.copyFromClipboard}"
					class="primary">Clipboard</flow-btn>
				<flow-btn @click="${this.showAddressInputField}" 
					class="primary">Manual Entry</flow-btn>
			</div>
		`
	}
	renderEstimate(){
		if(this.estimateError)
			return html`<div class="estimate-tx-error">${this.estimateError}</div>`;
		let {dataFee, fee, totalAmount, txSize} = this.estimate||{}
		return html`<div class="estimate-tx">
			${txSize?html`<span class="tx-size">Transaction size: ${txSize.toFileSize()}<span>`:''}
			${dataFee?html`<span class="tx-data-fee">Data fee: ${KAS(dataFee)} KAS<span>`:''}
			${fee?html`<span class="tx-fee">Total fee: ${KAS(fee)} KAS<span>`:''}
			${totalAmount?html`<span class="tx-total">Total: ${KAS(totalAmount)} KAS<span>`:''}
		</div>`
	}
	renderButtons(){
		return ''
	}
	open(args, callback){
		this.callback = callback;
		this.args = args;
		this.wallet = args.wallet;
		this.estimateError = "";
		this.estimate = {};
		this.alertFeeAmount = 3000;
		this.address = args.address||"";
		if(args.amount){
			let amountField = this.qS(".amount");
			amountField.value = args.amount
		}
		this.show();
	}
	cleanUpForm(){
		this.qSAll("flow-input").forEach(input=>{
    		input.value = "";
    	})
	}
	scanQRCode(){
		this.wallet.showQRScanner({isAddressQuery:true}, ({amount, address})=>{
			console.log("scan result: amount, address", amount, address)
			if(amount){
				let amountField = this.qS(".amount");
				amountField.value = amount
			}

			this.setAddress(address)
		})
	}
	showAddressInputField(){
		this.address = "-";
	}
	async copyFromClipboard(){
		const address = await navigator.clipboard.readText();
		this.setAddress(address)
	}
	async setAddress(address){
		if(!address){
			this.address = "";
			return
		}

		[address] = address.split("?");
		let valid = await this.wallet?.isValidAddress(address);
		if(!valid){
			this.setError("Invalid address")
			return
		}

		this.address = address;
	}
	onAddressChange(e){
		let {value} = e.detail;
		if(!value)
			this.address = value;

	}

	showT9(e){
		let input = e.target.closest("flow-input");
		let {value=''} = input;
		showT9({
			value, heading:input.label.replace("in KAS", ""),
			inputLabel:input.label
		}, ({value, dialog})=>{
			console.log("t9 result", value)
			input.value = value;
			dialog.hide();
		})
	}
    cancel(){
    	this.cleanUpForm();
    	this.hide();
    }
    getFormData(){
    	let address = this.qS(".address").value;
    	let amount = this.qS(".amount").value;
    	let note = this.qS(".note").value;
    	let fee = this.qS(".fee").value;
    	let calculateNetworkFee = !!this.qS(".calculate-network-fee").checked;
    	let inclusiveFee = !!this.qS(".inclusive-fee").checked;
    	/*
    	let networkFeeMax = this.qS(".maximum-fee").value;
    	if(networkFeeMax && fee && fee>networkFeeMax){
    		this.setError("Invalid fee")
    		return
    	}
    	*/

    	return {
    		amount:formatForMachine(amount),
    		fee:formatForMachine(formatForHuman(fee)),
    		address, note, 
    		calculateNetworkFee,
    		inclusiveFee
    	};
    }
    onNetworkFeeChange(){
    	this.estimateTx();
    }
    onAmountChange(){
    	this.estimateTx();
    }
    onCalculateFeeChange(){
    	this.estimateTx();
    }
    onInclusiveFeeChange(){
    	this.estimateTx();
    }
    
	estimateTx(){
		this.debounce('estimateTx', ()=>{
			this.requestUpdate("estimateTx", null)
			let p = this._estimateTx();
			p.then(()=>{
				p.isResolved = true;
				this.requestUpdate("estimateTx", null)
			})

			this.estimateTxSignal = p;
		}, 300)
	}

	async _estimateTx(){
    	const formData = this.getFormData();
    	if(!formData)
    		return

    	console.log("formData:", formData)
    	let {error, data:estimate} = await this.wallet.estimateTx(formData);
    	console.log("estimateTx:error:", error, "estimate:", estimate)
    	this.estimateError = error;
    	if(estimate){
    		this.estimate = estimate;
    	}else{
    		this.estimate = {};
    	}
    }
    async sendAfterConfirming(){
    	let estimate = this.estimate;
    	if(!estimate)
    		return
    	if(estimate.fee > this.alertFeeAmount){
    		let {btn} = await FlowDialog.alert("Warning", 
    			html`Transaction Fee (${KAS(estimate.fee)} KAS) is very large.`,
    			'',
    			['Cancel', 'Submit:primary']);

    		if(btn !='submit')
    			return
    	}
    	const formData = this.getFormData();
    	if(!formData)
    		return
    	console.log("formData", formData)
    	askForPassword({confirmBtnText:"CONFIRM SEND", pass}, ({btn, password})=>{
    		console.log("btn, password", btn, password)
    		if(btn!="confirm")
    			return
			formData.password = password;
			this.hide();
			this.callback(formData);
    	})
    }
}

KaspaSendDialogMobile.define("kaspa-send-dialog-mobile");