import EventHandler from "client/event/EventHandler";
import ConfirmWidget from "../gui/widget/static/popup/ConfirmWidget";
import Signals from "client/event/Signals";
import LogStaticWidget from "client/gui/widget/static/LogStaticWidget";

export default class StaticWidgetsController {
	public static readonly ConfirmStaticWidget = new ConfirmWidget();
	public static readonly LogStaticWidget = new LogStaticWidget();
	// Events
	static eventHandler: EventHandler = new EventHandler();

	static init() {
		this.eventHandler.subscribe(Signals.PLAYER.DIED, () => {
			this.ConfirmStaticWidget.hideWidget();
		});
	}

	public static isPopupVisible() {
		return this.ConfirmStaticWidget.isVisible();
	}
}
