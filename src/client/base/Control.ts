import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import Signals from "client/event/Signals";
import ControlEventHolder from "./ControlEventHolder";

/** Wraps the Roblox GUI objects and provides methods for easy handling */
export default abstract class Control<T extends GuiObject = GuiObject> {
	// Handlers
	protected readonly inputHandler = new InputHandler();
	protected readonly event = new ControlEventHolder();

	protected readonly gui: T;
	private readonly children: Control[] = [];

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

	/** Checks if the child exists on this gui object */
	protected static exists<T extends GuiObject, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): gui is T & { [key in TKey]: NonNullable<(typeof gui)[TKey]> } {
		return gui.FindFirstChild(name) !== undefined;
	}

	/** Returns a list of added children */
	public getChildren(): readonly Control[] {
		return this.children;
	}

	/** Add a child */
	public add(control: Control, setParent = true) {
		this.children.push(control);
		if (this.isVisible()) control.enablePassthrough();
		if (setParent) control.setParent(this.gui);
	}

	/** Remove a child */
	public remove(child: Control, setParent = true) {
		const index = this.children.indexOf(child);
		if (index === -1) return;

		this.children.remove(index);
		if (setParent) child.setParent(undefined);
		child.inputHandler.unsubscribeAll();
	}

	/** Clear all added children */
	public clear(setParents = true) {
		[...this.children].forEach((child) => this.remove(child, setParents));
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

	private enablePassthrough() {
		if (!this.gui.Visible) return;

		this.event.enable();
		for (const child of this.children) child.enablePassthrough();
	}
	private disablePassthrough() {
		this.event.disable();
		for (const child of this.children) child.enablePassthrough();
	}
	private destroyPassthrough() {
		this.event.destroy();
		for (const child of this.children) child.destroyPassthrough();
	}

	setVisible(value: boolean) {
		this.gui.Visible = value;

		if (value) this.enablePassthrough();
		else this.disablePassthrough();
	}

	getParent() {
		return this.gui.Parent;
	}
	setParent(value: GuiObject | undefined) {
		this.gui.Parent = value;
		if (!value) this.destroyPassthrough();
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
		this.inputHandler.unsubscribeAll();

		// Required event
		this.event.subscribeOnce("All", Signals.INPUT_TYPE_CHANGED_EVENT, () => this.prepare());

		// Call init
		const events = {
			Desktop: () => this.prepareDesktop(),
			Touch: () => this.prepareTouch(),
			Gamepad: () => this.prepareGamepad(),
		};

		events[InputController.inputType]();
	}
}
