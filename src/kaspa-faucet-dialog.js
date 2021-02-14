import {html, css, KaspaDialog, KAS} from './kaspa-dialog.js';

class KaspaFaucetDialog extends KaspaDialog{
	static get properties(){
		return {
			address:{type:String}
		}
	}
	static get styles(){
		return [Dialog.styles, 
		css`
			.container{max-height:400px}
			.buttons{justify-content:flex-end}
/*
            input.address{
				font-size:1px;padding:0px;margin:0px;border:0px;width:1px;height:1px;
				z-index:-1;position:absolute;opacity:0;
            }
*/
			flow-input flow-btn{margin-bottom:0px;}
		`]
	}
	renderHeading(){
		return 'Faucet';
	}
	renderBody(){
        return html`
            ${ this.status ? html`<div>${this.status}</div>` : html`
                <div>Available:</div>
                <div>${KAS(available)} KAS</div>

                ${this.period ? html`
                    <div>Additional funds will be<br/>available in ${FlowFormat.duration(this.period)}</div>
                `:``}
              
                ${ !available ? html`` : html`
                    <flow-btn class="primary" @click="${this.request}">Request Funds from Faucet</flow-btn>
                `})

            ` }
        `;
    }
    
//     ${ !available ? html`` : html`
//     <flow-input class="full-width" clear-btn value="${value}"
//         label="${inputLabel}" readonly @changed=${this.onInputChange}>
//     </flow-input>
//     <flow-t9 value="${value}" @changed="${this.onT9Change}"
//         @__btn-click=${this.onBtnClick}></flow-t9>
//     <div class="buttons">
//         <flow-btn @click="${this.setMaxValue}">Max</flow-btn>
//         <flow-btn class="primary" @click="${this.sendBack}">Get</flow-btn>
//     </div>
// `}




	renderButtons(){
		return html`<flow-btn @click="${this.hide}">CLOSE</flow-btn>`
	}
	open(args, callback){
		this.callback = callback;
		this.args = args;
		const {address} = args;
		this.qrdata = address;
		this.address = address;
		this.show();
	}
	copyAddress(){
		let input = this.renderRoot.querySelector("input.address");
		input.select();
		input.setSelectionRange(0, 99999)
		document.execCommand("copy");
		FlowDialog.alert("Address has been copied to the clipboard", input.value);
	}
}

KDXWalletReceiveDialog.define("kdx-wallet-receive-dialog");
