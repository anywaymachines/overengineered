import { DestroyableComponent } from "shared/component/ComponentBase";
import { ComponentEvents } from "shared/component/ComponentEvents";
import { SlimSignal } from "shared/event/SlimSignal";

export interface IController {
	parent<T extends DestroyableComponent | IComponent>(component: T): T;
}

/** A component that is enabled on creation and can only be destroyed */
export class Controller extends DestroyableComponent implements IController {
	protected readonly event: Omit<ComponentEvents, "destroy" | "disable" | "enable" | "isDestroyed" | "isEnabled">;

	constructor() {
		super();

		const event = new ComponentEvents();
		event.enable();
		this.onDestroy(() => event.destroy());
		this.event = event;
	}

	parent<T extends DestroyableComponent | IComponent>(component: T): T {
		if ("enable" in component) {
			component.enable();
		}

		this.onDestroy(() => component.destroy());
		return component;
	}
}

/** A component that can be enabled once and then can only be destroyed */
export class ControllerInitializer extends DestroyableComponent implements IController {
	protected readonly event: Omit<ComponentEvents, "destroy" | "disable" | "enable" | "isDestroyed" | "isEnabled">;
	private readonly onEnabled = new SlimSignal();
	private isEnabled = false;

	constructor() {
		super();

		const event = new ComponentEvents();
		this.onDestroy(() => event.destroy());
		this.event = event;
	}

	onEnable(func: () => void): void {
		this.onEnabled.Connect(func);
	}

	enable(): void {
		if (this.isDestroyed()) return;
		if (this.isEnabled) return;

		this.isEnabled = true;
		this.onEnabled.Fire();
		(this.event as ComponentEvents).enable();
	}

	destroy(): void {
		this.isEnabled = false;
		super.destroy();
	}

	parent<T extends DestroyableComponent | IComponent>(component: T): T {
		if (this.isEnabled && "enable" in component) {
			component.enable();
		}

		this.onDestroy(() => component.destroy());
		return component;
	}
}
