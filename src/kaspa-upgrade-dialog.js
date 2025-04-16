import {html, css, KaspaDialog, i18n, T} from './kaspa-dialog.js';

class KaspaUpgradeDialog extends KaspaDialog{

	static get properties() {
		return {
		};
	}

	static get styles(){
		return [KaspaDialog.styles, css`
			.heading{display:none}
			.container{
				/*max-width: var(--kaspa-dialog-container-max-width, 700px);*/
				max-width:800px;
				max-height:900px;
				border:0px
				border: 1px solid var(--flow-data-badge-caption);
				border-color:#e0e0e0;
				border-radius: 10px;
				padding: 2rem;
				box-shadow: 0 0 15px var(--flow-data-badge-caption-shadow);
				text-align: center;
			}
			h2 {
				font-size: 1.5rem;
				margin-bottom: 1rem;
				color: var(--flow-primary-color);
			}

			p {
				font-size: 1rem;
				margin-bottom: 1rem;
				line-height: 1.5;
			}
			.spacer{
				height:1px;
				width:90%;
				background: linear-gradient(to right, transparent, #e0e0e0, transparent);
				margin: 2rem auto;
			}
			.highlight{color: var(--flow-primary-color)}
			.text-center, .heading{text-align:center;}
			.big-logo{max-width:150px;margin:10px auto 20px;display:block;}
			.bottom-spacer{height:200px}
			.note {
				margin-top: 1rem;
				font-size: 0.9rem;
				color: #555;
			}
		`];
	}
	constructor() {
		super();
		if(!localStorage.upgradeRC)
			localStorage.upgradeRC = 1
		if (localStorage.upgradeRC < 10){
			//window.showUpgradeDialog = (args, callback)=>{
				this.show()
			//}
		}

		window.hideUpgradeDialog = ()=>{
			this.hide();
		}
	}
	renderHeading({modeName}){
		return '';
	}
	renderBody(){
		return html`
		<h2>Welcome to the New Wallet Experience</h2>
		<p>
		We’ve launched a new version of the Kaspa Wallet at <br>
		<span class="highlight">https://kaspa-ng.org</span>
		</p>
		<flow-btn primary @click="${this.openKNG}" i18n>Go to New Wallet</flow-btn>
		<div class="spacer"></div>
		<p>
		Already have funds on the old wallet?<br>
		You can still use <span class="highlight">https://wallet.kaspanet.io</span>
		</p>
		<flow-btn primary @click="${this.continueLegacy}" i18n>Continue on Legacy Wallet</flow-btn>
		<div class="note">Thank you for being part of the Kaspa community!</div>
		
		<div class="bottom-spacer" ?hidden=${!isMobile}></div>`
	}
	continueLegacy(){
		localStorage.upgradeRC = (+localStorage.upgradeRC)+1;
		this.hide()
	}
	openKNG(){
		this.openUrl("https://kaspa-ng.org?ref=legacy-wallet")
	}
	openUrl(href, target="_blank") {
		// console.log("opening href:",this.href,"target:",this.target);
		if(!href)
			return
		if(typeof nw == 'undefined') {
			let a = document.createElement('a');
			a.href = href;
			a.target = target;
			a.click();
		} else {
			require('nw.gui').Shell.openExternal(this.href);	
		}
	}
    
}

KaspaUpgradeDialog.define("kaspa-upgrade-dialog");