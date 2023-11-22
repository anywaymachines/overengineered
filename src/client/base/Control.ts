import InputController from "client/controller/InputController";
import InputHandler from "client/event/InputHandler";
import Signals from "client/event/Signals";
import EventHandler from "shared/EventHandler";

/** Base class for a gui object */
export default abstract class Control<T extends GuiObject> {
	// Handlers
	protected readonly eventHandler = new EventHandler();
	protected readonly inputHandler = new InputHandler();

	protected readonly gui: T;
	protected readonly eventChildren: Control<GuiObject>[] = [];

	constructor(template: T) {
		this.gui = template.Clone();
		this.gui.Parent = template.Parent;

		template.Visible = false;
	}

	public getGuiChild(name: string) {
		return this.gui.WaitForChild(name);
	}

	protected addChild(control: Control<GuiObject>) {
		this.eventChildren.push(control);
		//control.prepare();
	}
	protected removeChild(child: Control<GuiObject>) {
		const index = this.eventChildren.indexOf(child);
		if (index === -1) return;

		this.eventChildren.remove(index);
		child.eventHandler.unsubscribeAll();
		child.inputHandler.unsubscribeAll();
	}

	/** Destroy the object and return its clone */
	protected static cloneDestroy<T extends GuiObject>(object: T) {
		const clone = object.Clone();
		object.Destroy();

		return clone;
	}

	isVisible() {
		return this.gui.Visible;
	}
	setVisible(value: boolean) {
		this.gui.Visible = value;

		/*if (value) {
			this.prepare();
		} else {
			this.eventHandler.unsubscribeAll();
			this.inputHandler.unsubscribeAll();
		}*/
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
	 * A function for preparing functionality.
	 * ! Unsubscribes from everything !
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
