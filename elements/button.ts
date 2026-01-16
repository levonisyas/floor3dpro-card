/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { ButtonBase } from '@material/mwc-button/mwc-button-base.js';
import { styles as buttonStyles } from '@material/mwc-button/styles.css.js';
import { customElement, property } from "lit/decorators.js";

//Faz-0 Isolation Correction: (Fix) DOM custom element isolation for pro components
@customElement("floor3dpro-button")
export class Floor3dButton extends ButtonBase {

    static get styles() {
        return buttonStyles;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "floor3dpro-button": Floor3dButton;
    }
}
