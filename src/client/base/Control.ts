import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import ControlEventHolder from "./ControlEventHolder";
import EventHandler from "shared/event/EventHandler";
import Signal from "@rbxts/signal";

/** Wraps the Roblox GUI objects and provides methods for easy handling */
export default class Control<T extends GuiObject | Instance = Instance> {
	/** Main event handler. Does not register events until enabled and reregisters events when input type changes. */
	protected readonly event = new ControlEventHolder();

	/** Event handler for use in prepare***() */
	protected readonly eventHandler = new EventHandler();

	/** Input handler for use in prepare***() */
	protected readonly inputHandler = new InputHandler();

	/** Signal that fires when this element is shown */
	public readonly onShow = new Signal<() => void>();

	/** Signal that fires when this element is hidden */
	public readonly onHide = new Signal<() => void>();

	protected readonly gui: T;
	private readonly children: Control[] = [];

	constructor(gui: T) {
		this.gui = gui;
		this.event.onPrepare(() => this.prepare());
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
	): gui is T & { [key in TKey]: (typeof gui)[TKey] & defined } {
		return gui.FindFirstChild(name) !== undefined;
	}

	/** Returns a list of added children */
	public getChildren(): readonly Control[] {
		return this.children;
	}

	protected added<T extends Control>(control: T, setParent = true) {
		this.add(control, setParent);
		return control;
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

	public getAttribute<T extends AttributeValue>(name: string) {
		return this.gui.GetAttribute(name) as T | undefined;
	}

	/** Return a function that copies the provided object, and destroys it if specified */
	protected static asTemplate<T extends GuiObject>(object: T, destroyOriginal = true) {
		const template = object.Clone();
		if (destroyOriginal) object.Destroy();

		return () => template.Clone();
	}

	isVisible() {
		if (this.gui.IsA("GuiObject")) return this.gui.Visible;
		return true;
	}

	private enablePassthrough() {
		if (!this.isVisible()) return;

		this.event.enable();
		for (const child of this.children) child.enablePassthrough();
	}
	private disablePassthrough() {
		this.event.disable();
		this.inputHandler.unsubscribeAll();
		this.eventHandler.unsubscribeAll();
		for (const child of this.children) child.disablePassthrough();
	}
	private destroyPassthrough() {
		this.event.destroy();
		this.inputHandler.unsubscribeAll();
		this.eventHandler.unsubscribeAll();
		for (const child of this.children) child.destroyPassthrough();
	}

	/** Show the control */
	public show() {
		if (this.gui.IsA("GuiObject")) this.gui.Visible = true;

		this.enablePassthrough();
		this.onShow.Fire();
	}

	/** Hide the control */
	public hide() {
		if (this.gui.IsA("GuiObject")) this.gui.Visible = false;

		this.disablePassthrough();
		this.onHide.Fire();
	}

	private getParent() {
		return this.gui.Parent;
	}
	private setParent(value: Instance | undefined) {
		this.gui.Parent = value;
		if (!value) this.destroyPassthrough();
	}

	/** A function for preparing functionality for Desktop */
	protected prepareDesktop() {}
	/** A function for preparing functionality for Touch */
	protected prepareTouch() {}
	/** A function for preparing functionality for Gamepad */
	protected prepareGamepad() {}

	/** A function for preparing functionality (**Unsubscribes from every event and input handler**) */
	protected prepare() {
		// Terminate exist events
		this.inputHandler.unsubscribeAll();
		this.eventHandler.unsubscribeAll();

		// Call init
		const events = {
			Desktop: () => this.prepareDesktop(),
			Touch: () => this.prepareTouch(),
			Gamepad: () => this.prepareGamepad(),
		};

		events[InputController.inputType]();
	}
}
