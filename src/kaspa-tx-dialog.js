import {
	html, css, KaspaDialog, askForPassword, KAS, txListStyle,
	formatForMachine, formatForHuman, paginationStyle, buildPagination, renderPagination
} from './kaspa-dialog.js';

class KaspaTXDialog extends KaspaDialog{
	static get properties(){
		return {
			skip:{type:Number}
		}
	}
	static get styles(){
		return [KaspaDialog.styles, paginationStyle, txListStyle,
		css`
			:host{
				position:fixed;
				--k-pagination-active-bg:var(--flow-primary-color);
				--k-pagination-active-border-color:var(--flow-primary-color);
				--k-pagination-border-color:var(--flow-primary-color);
			}
			.pagination a{
				border: var(--flow-btn-border, 2px solid var(--flow-border-color, var(--flow-primary-color, rgba(0,151,115,1))));
				border-radius:var(--flow-btn-radius, 8px);
				border-width:var(--flow-btn-border-width, 2px);
			}
			.pagination-box{
				padding:var(--kaspa-pagination-box-padding, 10px 5px;);
			}
			.inner-body, .buttons{width:calc(100% - 5px)}
			.inner-body{max-width:100%;padding:0px;}
			.container{
				max-height:var(--kaspa-dialog-container-max-height, 90%);
				max-width:var(--kaspa-dialog-container-max-width, 90%)
			}
			.buttons{justify-content:flex-end;align-items:center}
			.spinner{margin-right:20px}
			.tx-list{height:initial}
		`]
	}
	render(){
		const args = this.buildRenderArgs();
		return html`
			<div class="container">
				<h2 class="heading">${this.renderHeading(args)}</h2>
				<div class="body">
					<div class="inner-body">
						${this.renderBody(args)}
					</div>
				</div>
				${renderPagination(args.pagination, this._onPaginationClick)}
				<div class="buttons">
					${this.renderButtons(args)}
				</div>
				<span class="close-btn" title="Close" 
					@click="${this.onCloseClick}">&times;</span>
			</div>
		`
	}
	constructor(){
		super();
		this.skip = 0;
		this.limit = 100;
		this._onPaginationClick = this.onPaginationClick.bind(this);
	}
	renderHeading(){
		return html`${this.renderBackBtn()} Transactions <div class="flex"></div>
		${this.loading?html`<fa-icon class="spinner" icon="spinner"></fa-icon>`:''}`;
	}
	renderBody(args){
		let {skip} = this;
		let {items} = args
		return html`
			${this.wallet._renderAllTX({skip, items})}
			<div class="error">${this.errorMessage}</div>`;
	}
	open(args, callback){
		this.callback = callback;
		this.args = args;
		this.wallet = args.wallet;
		this.show();
	}
	buildRenderArgs(){
		let totalItems = this.wallet?.txs||[];
		let {limit} = this;
		let pagination = buildPagination(totalItems.length, this.skip, limit)
		let items = totalItems.slice(this.skip, this.skip+limit);
		return {items, pagination}
	}
	onPaginationClick(e){
		let skip = e.target.closest("[data-skip]").dataset.skip;
		console.log("skip", skip, e.target)
		if(skip === undefined)
			return
		this.skip = +skip;
	}
	onNewTx(){
		if(!this.classList.contains('active'))
			return
		this.requestUpdate("tx-list", null)
	}
    getFormData(){
    	let address = this.qS(".address").value;
    }
}

KaspaTXDialog.define("kaspa-tx-dialog");