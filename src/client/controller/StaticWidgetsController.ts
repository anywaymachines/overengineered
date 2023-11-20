import EventHandler from "client/event/EventHandler";
import Signals from "client/event/Signals";
import ActionBarWidget from "client/gui/widget/static/ActionBarWidget";
import LogStaticWidget from "client/gui/widget/static/LogStaticWidget";
import ConfirmWidget from "client/gui/widget/static/popup/ConfirmWidget";
import MaterialWidget from "client/gui/widget/static/popup/MaterialWidget";

export default class StaticWidgetsController {
	public static readonly confirmWidget = new ConfirmWidget();
	public static readonly materialWidget = new MaterialWidget();
	public static readonly logStaticWidget = new LogStaticWidget();
	public static readonly actionBarWidget = new ActionBarWidget();

	// Events
	static eventHandler: EventHandler = new EventHandler();

	static init() {
		this.eventHandler.subscribe(Signals.PLAYER.DIED, () => {
			this.confirmWidget.hideWidget();
			this.materialWidget.hideWidget();
		});
	}

	public static isPopupVisible() {
		return this.confirmWidget.isVisible() || this.materialWidget.isVisible();
	}
}
