import EventHandler from "shared/event/EventHandler";
import Signals from "client/event/Signals";
import ActionBarWidget from "client/gui/widget/static/ActionBarWidget";
import ConfirmWidget from "client/gui/widget/static/popup/ConfirmWidget";

export default class StaticWidgetsController {
	public static readonly confirmWidget = undefined! as ConfirmWidget;
	public static readonly actionBarWidget = new ActionBarWidget();

	// Events
	static eventHandler: EventHandler = new EventHandler();

	static init() {
		this.eventHandler.subscribe(Signals.PLAYER.DIED, () => {
			this.confirmWidget.hideWidget();
		});
	}

	public static isPopupVisible() {
		return this.confirmWidget.isVisible();
	}
}
