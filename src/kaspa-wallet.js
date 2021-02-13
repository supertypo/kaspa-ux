import {isSmallScreen} from '/node_modules/@aspectron/flow-ux/src/base-element.js';
//let isSmallScreen = true;
import {KaspaWalletDesktop} from './kaspa-wallet-desktop';
import {KaspaWalletMobile} from './kaspa-wallet-mobile';

if(isSmallScreen)
	document.body.classList.add('small-screen');
export {isSmallScreen}

const BaseClass = isSmallScreen? KaspaWalletMobile : KaspaWalletDesktop;
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