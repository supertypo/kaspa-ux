export * from '/flow/flow-ux/src/flow-format.js';
export * from '/flow/flow-ux/src/base-element.js';
export * from '/flow/flow-ux/src/flow-swipeable.js';
import {paginationStyle as pCss, css} from '/flow/flow-ux/src/base-element.js';
export const paginationStyle = [pCss, css`
	.pagination a{
		padding:var(--flow-btn-padding);
	}
`]
