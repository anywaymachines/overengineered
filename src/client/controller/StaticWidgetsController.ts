import EventHandler from "shared/event/EventHandler";
import ActionBarWidget from "client/gui/widget/static/ActionBarWidget";

export default class StaticWidgetsController {
	public static readonly actionBarWidget = new ActionBarWidget();

	// Events
	static eventHandler: EventHandler = new EventHandler();
}
