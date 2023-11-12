import EventHandler from "client/event/EventHandler";
import ConfirmWidget from "../gui/widget/popup/ConfirmWidget";
import Signals from "client/event/Signals";

export default class PopupWidgetsController {
	
	public static readonly ConfirmPopupWidget = new ConfirmWidget();
// Events
	static eventHandler: EventHandler = new EventHandler();

	static init() {
		this.eventHandler.subscribe(Signals.PLAYER.DIED, () => {
			this.ConfirmPopupWidget.hideWidget();
		});
	}

	public static isPopupVisible() {
		return this.ConfirmPopupWidget.isVisible();
	}
}
