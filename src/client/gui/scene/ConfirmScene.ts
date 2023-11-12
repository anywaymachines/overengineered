import PopupScene from "client/base/PopupScene";
import ConfirmWidget from "../widget/popup/ConfirmWidget";

export default class ConfirmScene extends PopupScene {
	private readonly confirmWidget: ConfirmWidget;

	constructor() {
		super();

		this.confirmWidget = this.addWidget(new ConfirmWidget());
	}

	showScene(): void {
		this.confirmWidget.showWidget(true);
	}

	hideScene(): void {
		this.confirmWidget.hideWidget(true);
	}
}
