export * from './flow-ux.js';

import {dpc} from './flow-ux.js';

import {KaspaWalletDesktop} from './kaspa-wallet-desktop.js';
import {KaspaWalletMobile, isMobile, dontInitiatedComponent} from './kaspa-wallet-mobile.js';

if(isMobile)
	document.body.classList.add('is-mobile');
export {isMobile}

export const KaspaWallet = isMobile ? KaspaWalletMobile : KaspaWalletDesktop;

if(!dontInitiatedComponent)
	KaspaWallet.define("kaspa-wallet");
