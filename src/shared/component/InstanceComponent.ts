import { ComponentInstance } from "shared/component/ComponentInstance";
import { ContainerComponent } from "shared/component/ContainerComponent";
import { TransformService } from "shared/component/TransformService";
import type { TransformBuilder } from "shared/component/Transform";

/** Component with an `Instance` and children */
export class InstanceComponent<
	T extends Instance,
	TChild extends IComponent = IComponent,
> extends ContainerComponent<TChild> {
	readonly instance;

	constructor(instance: T) {
		super();
		this.instance = instance;

		ComponentInstance.init(this, instance);

		this.children.onAdded.Connect((child) => {
			if (child instanceof InstanceComponent && typeIs(child.instance, "Instance")) {
				ComponentInstance.setParentIfNeeded(child.instance, this.instance);
			}
		});
	}

	/** Checks if the child exists on an Instance */
	protected static exists<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): gui is T & { [key in TKey]: (typeof gui)[TKey] & defined } {
		return gui.FindFirstChild(name) !== undefined;
	}
	protected static findFirstChild<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): T[TKey] | undefined {
		return gui.FindFirstChild(name) as T[TKey] | undefined;
	}
	protected static waitForChild<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): T[TKey] & defined {
		return gui.WaitForChild(name) as defined as T[TKey] & defined;
	}

	/** Get an attribute value on the Instance */
	getAttribute<T extends AttributeValue>(name: string) {
		return this.instance.GetAttribute(name) as T | undefined;
	}

	cancelTransforms() {
		TransformService.cancel(this.instance);
	}
	/** Transform the current instance */
	transform(setup: (transform: TransformBuilder<T>, instance: T) => void) {
		TransformService.run(this.instance, setup);
	}
}
