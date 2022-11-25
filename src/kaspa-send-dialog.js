import { i18n, T } from './flow-ux.js';
import {
	html, css, KaspaDialog, askForPassword, KAS,
	formatForMachine, getLocalWallet
} from './kaspa-dialog.js';
const pass = "";
import {Wallet} from '@kaspa/wallet-worker';

class KaspaSendDialog extends KaspaDialog{
	static get properties(){
		return {
			address:{type:String}
		}
	}
	static get styles(){
		return [KaspaDialog.styles, 
		css`
			.container{
				max-height:var(--kaspa-dialog-container-max-height, 670px);
			}
			.buttons{justify-content:flex-end;align-items:center}
			.spinner{margin-right:20px}
			.estimate-tx-error{color:red}
			/*.estimate-tx span{display:block}*/
			.estimate-tx table { font-size: 1.02rem;margin-top:2px}
			.estimate-tx table tr td { padding: 2px 3px; }
			.estimate-tx table tr td:nth-child(2) { min-width:150px; }	
			flow-checkbox{width:100%;margin:15px 0px;}
			[col] { display:flex; flex-direction: row;flex-wrap:wrap }
			[spacer] { min-width: 32px; }
			[flex] { flex:1; }
			flow-input{min-width:100px;}
			flow-input.amount,
			flow-input.fee{flex:1}
			flow-checkbox{margin:8px 0px;}
			.body-box{align-items:flex-start;}
			@media (max-width:400px){
				[spacer] { min-width: 100%; }
			}
		`]
	}
	renderHeading(){
		return html`${T('SEND')}`;
	}
	renderBody(){
		return html`
			<flow-input class="address full-width" outer-border
				label="${T(`Recipient Address (Must start with 'kaspa' prefix)`)}"
				value="${this.address||''}"
				placeholder="">
			</flow-input>
			<div col>
				<flow-input class="amount full-width" outer-border
					label="${T('Amount in KAS')}" @keyup=${this.onAmountChange}
					value="${this.amount}">
				</flow-input>
				<div spacer></div>
				<flow-input class="fee full-width"
					label="${T('Priority Fee')}"
					@keyup="${this.onNetworkFeeChange}">
				</flow-input>
			</div>
			<flow-input class="note full-width" outer-border label="${T('Note')}"></flow-input>
			<flow-checkbox class="calculate-network-fee" checked
				@changed="${this.onCalculateFeeChange}">${T('Automatically calculate network fee')}</flow-checkbox>
			<flow-checkbox class="inclusive-fee"
				@changed="${this.onInclusiveFeeChange}">${T('Include fee in the amount')}</flow-checkbox>
			${this.renderEstimate()}
			<div class="error">${this.errorMessage}</div>`;
	}
	renderEstimate(){
		if(this.estimateError)
			return html`<div class="estimate-tx-error">${this.estimateError}</div>`;
		let {dataFee, fee, totalAmount, txSize} = this.estimate||{}
		return html`
		<div class="estimate-tx">
			<table>
				${txSize?html`<tr><td is="i18n-td">Transaction Size</td><td>${txSize.toFileSize()}</td></tr>`:''}
				${dataFee?html`<tr><td is="i18n-td">Data Fee</td><td>${KAS(dataFee)} KAS</td></tr>`:''}
				${fee?html`<tr><td is="i18n-td">Total Fee</td><td>${KAS(fee)} KAS</td></tr>`:''}
				${totalAmount?html`<tr is="i18n-td"><td>Total Amount</td><td> ${KAS(totalAmount)} KAS</td></tr>`:''}
			</table>
		</div>
		`
	}
	renderButtons(){
		const estimating = this.estimateTxSignal && !this.estimateTxSignal.isResolved;
		const estimateFee = this.estimate?.fee;
		return html`
			${estimating?html`<fa-icon 
				class="spinner" icon="sync"
				style__="position:absolute"></fa-icon>`:''}
			<flow-btn @click="${this.cancel}" i18n>Cancel</flow-btn>
			<flow-btn primary 
				?disabled=${estimating || !this.estimateTxSignal || !estimateFee}
				@click="${this.sendAfterConfirming}" i18n>SEND
			</flow-btn>`
	}
	open(args, callback){
		this.callback = callback;
		this.args = args;
		this.wallet = args.wallet;
		this.estimateError = "";
		this.estimate = {};
		this.address = args.address||'';
		this.amount = args.amount||''
		this.alertFeeAmount = 1e8;
		this.show();
	}
	cleanUpForm(){
		this.estimateError = "";
		this.estimate = {};
		this.requestUpdate("estimate", null)
		this.qSAll("flow-input").forEach(input=>{
    		input.value = "";
		})
		this.qS(".inclusive-fee").checked = false;
	}
	hide(skipHistory=false){
		this.cleanUpForm();
		super.hide(skipHistory)
	}
    cancel(){
    	this.hide();
    }
    getFormData(){
    	let address = this.qS(".address").value;
    	let amount = this.qS(".amount").value;
    	let note = this.qS(".note").value;
    	let fee = this.qS(".fee").value;
    	let calculateNetworkFee = !!this.qS(".calculate-network-fee").checked;
    	let inclusiveFee = !!this.qS(".inclusive-fee").checked;
    	return {
    		amount:formatForMachine(amount),
    		fee:formatForMachine(fee),
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

    	//console.log("formData:", formData)
    	let {error, data:estimate} = await this.wallet.estimateTx(formData);
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
			let msg = i18n.t('Transaction Fee ([n] KAS) is too large.');
			msg = msg.replace('[n]', KAS(estimate.fee));
    		let {btn} = await FlowDialog.alert("Warning", 
    			html`${msg}`,
    			'',
    			[{
					text:i18n.t('Cancel'),
					value:'cancel'
				},{
					text:i18n.t('Submit'),
					value:'submit',
					cls:'primary'
				}]);

    		if(btn !='submit')
    			return
    	}
    	const formData = this.getFormData();
    	if(!formData)
    		return
    	//console.log("formData", formData)
    	askForPassword({confirmBtnText:i18n.t("CONFIRM SEND"), pass}, async({btn, password})=>{
    		if(btn!="confirm")
    			return
			formData.password = password;

			let wallet = getLocalWallet();
    		let encryptedMnemonic = wallet.mnemonic;
    		let valid = await Wallet.checkPasswordValidity(password, encryptedMnemonic);
    		if(!valid)
    			return FlowDialog.alert(i18n.t("Error"), i18n.t("Invalid password"));

			this.hide();
			this.callback(formData);
    	})
    }
}

KaspaSendDialog.define("kaspa-send-dialog");