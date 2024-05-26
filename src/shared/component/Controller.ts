import { ComponentEvents } from "shared/component/ComponentEvents";
import { DestroyableComponent } from "shared/component/ComponentParts";

/** A component that is enabled on creation and can only be destroyed */
export class Controller extends DestroyableComponent {
	protected readonly event: Omit<ComponentEvents, "destroy" | "disable" | "enable" | "isDestroyed" | "isEnabled">;

	constructor() {
		super();

		const event = new ComponentEvents();
		event.enable();
		this.onDestroy(() => event.destroy());
		this.event = event;
	}
}
