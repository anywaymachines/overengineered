import EventHandler from "shared/event/EventHandler";
import InputHandler from "client/event/InputHandler";
import Control from "./Control";
import Signals from "client/event/Signals";
import InputController from "client/controller/InputController";

/** The scene is the interface on which the widgets are located */
export default abstract class Scene<T extends GuiObject = GuiObject> {
	// Handlers
	protected readonly eventHandler = new EventHandler();
	protected readonly inputHandler = new InputHandler();

	protected readonly gui: T;

	private readonly children: Control[] = [];

	constructor(gui: T) {
		this.gui = gui;
	}

	/** Add a control to a scene */
	protected add<T extends Control>(widget: T): T {
		this.children.push(widget);
		return widget;
	}

	/** Displaying the scene */
	public showScene(): void {
		this.gui.Visible = true;
	}

	/** Hide the scene */
	public hideScene(): void {
		this.gui.Visible = false;
	}

	public destroy() {
		this.children.clear();
		this.eventHandler.unsubscribeAll();
		this.inputHandler.unsubscribeAll();
	}

	/** A function for preparing functionality for Desktop */
	protected prepareDesktop() {}
	/** A function for preparing functionality for Touch */
	protected prepareTouch() {}
	/** A function for preparing functionality for Gamepad */
	protected prepareGamepad() {}

	/**
	 * A function for preparing functionality (**Unsubscribes from everything**)
	 */
	protected prepare() {
		// Terminate exist events
		this.eventHandler.unsubscribeAll();
		this.inputHandler.unsubscribeAll();

		// Required event
		this.eventHandler.subscribeOnce(Signals.INPUT_TYPE_CHANGED_EVENT, () => this.prepare());

		// Call init
		const events = {
			Desktop: () => this.prepareDesktop(),
			Touch: () => this.prepareTouch(),
			Gamepad: () => this.prepareGamepad(),
		};

		events[InputController.inputType]();
	}
}
