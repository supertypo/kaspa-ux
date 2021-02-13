import {
	html, css, KaspaDialog, askForPassword, KAS,
	formatForMachine, formatForHuman
} from './kaspa-dialog.js';
const pass = "";

class KaspaT9Dialog extends KaspaDialog{
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
		window.showT9 = (args, callback)=>{
			this.open(args, callback)
		}
	}
	renderHeading(){
		return this.heading;
	}
	renderBody(){
		let value = this.value || '';
		let {inputLabel='Amount in KAS'} = this;
		return html`
		<flow-input class="full-width" clear-btn value="${value}"
			label="${inputLabel}" readonly @changed=${this.onInputChange}>
		</flow-input>
		<flow-t9 value="${value}" @changed="${this.onT9Change}"
			@__btn-click=${this.onBtnClick}></flow-t9>
		<div class="buttons">
			<flow-btn @click="${this.setMaxValue}">Max</flow-btn>
			<flow-btn class="primary" @click="${this.sendBack}">Next</flow-btn>
		</div>
		`;
	}
	sendBack(e){
		this.callback({value:this.value, dialog:this})
	}
	onInputChange(e){
		//console.log("onInputChange", e.detail)
		this.value = e.detail.value;
	}
	onT9Change(e){
		this.value = e.detail.value;
		//console.log("onT9Change:this.value", this.value)
	}
	open(args, callback){
		this.callback = callback;
		this.args = args;
		this.value = args.value||'';
		this.heading = args.title||args.heading||'Amount';
		this.inputLabel = args.inputLabel||'Amount in KAS';
		this.show();
	}
    cancel(){
    	this.hide();
    }
}

KaspaT9Dialog.define("kaspa-t9-dialog");