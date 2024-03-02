import { TransformBuilder, TransformContainer } from "shared/component/Transform";
import { ComponentInstance } from "./ComponentInstance";
import { ContainerComponent } from "./ContainerComponent";

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

	/** Get an attribute value on the Instance */
	getAttribute<T extends AttributeValue>(name: string) {
		return this.instance.GetAttribute(name) as T | undefined;
	}

	//

	private transforms?: TransformContainer<T>;

	/** Transform the provided instance */
	runTransform<T extends Instance>(instance: T, setup: (transform: TransformBuilder<T>, instance: T) => void) {
		const builder = new TransformBuilder(instance);
		setup(builder, instance);

		return builder.build();
	}

	/** Transorm the current instance */
	transform(build: (transform: TransformBuilder<T>, instance: T) => void) {
		this.getTransform().run(build);
	}

	/** Initializes and returns the transform component */
	getTransform(): TransformContainer<T> {
		if (!this.transforms) {
			this.transforms = new TransformContainer(this.instance);
			this.onEnable(() => this.transforms?.enable());
			this.onDisable(() => this.transforms?.disable());
			this.onDestroy(() => this.transforms?.destroy());
			if (this.isEnabled()) this.transforms.enable();
		}

		return this.transforms;
	}
}
