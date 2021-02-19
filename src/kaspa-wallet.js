export * from './flow-ux.js';

import {dpc} from './flow-ux.js';

import {KaspaWalletDesktop} from './kaspa-wallet-desktop';
import {KaspaWalletMobile, isMobile} from './kaspa-wallet-mobile';

if(isMobile)
	document.body.classList.add('is-mobile');
export {isMobile}

const BaseClass = isMobile ? KaspaWalletMobile : KaspaWalletDesktop;
/*
class KaspaWallet extends BaseClass{
	static get properties() {
		return { };
	}
	constructor() {
		super();
	}
}
*/

BaseClass.define("kaspa-wallet");
/*
dpc(1000, ()=>{
	askForPassword({confirmBtnText:"Next"}, async({btn, password})=>{

	})
})
*/