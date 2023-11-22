import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import Signals from "client/event/Signals";
import EventHandler from "shared/event/EventHandler";
import ControlEventHolder from "./ControlEventHolder";

/** Wraps the Roblox GUI objects and provides methods for easy handling */
export default abstract class Control<T extends GuiObject = GuiObject> {
	// Handlers
	protected readonly eventHandler = new EventHandler();
	protected readonly inputHandler = new InputHandler();

	protected readonly event = new ControlEventHolder();

	protected readonly gui: T;
	private readonly eventChildren: Control[] = [];

	constructor(gui: T) {
		this.gui = gui;
		this.prepare();
	}

	public getGui() {
		return this.gui;
	}

	public getGuiChild(name: string) {
		return this.gui.WaitForChild(name);
	}

	/** Checks if the child exists on an object */
	protected static exists<T extends GuiObject, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): gui is T & { [key in TKey]: NonNullable<(typeof gui)[TKey]> } {
		return gui.FindFirstChild(name) !== undefined;
	}

	protected addChild(control: Control) {
		this.eventChildren.push(control);
	}
	protected removeChild(child: Control) {
		const index = this.eventChildren.indexOf(child);
		if (index === -1) return;

		this.eventChildren.remove(index);
		child.eventHandler.unsubscribeAll();
		child.inputHandler.unsubscribeAll();
	}

	/** Return a function that copies the provided object, and destroys it if specified */
	protected static asTemplate<T extends GuiObject>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}

	isVisible() {
		return this.gui.Visible;
	}
	setVisible(value: boolean) {
		this.gui.Visible = value;
	}

	getParent() {
		return this.gui.Parent;
	}
	setParent(value: GuiObject | undefined) {
		this.gui.Parent = value;
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
