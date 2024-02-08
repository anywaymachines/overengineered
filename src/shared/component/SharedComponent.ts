import SharedComponentBase from "shared/component/SharedComponentBase";
import SharedComponentContainer from "shared/component/SharedComponentContainer";
import SharedComponentEventHolder from "shared/component/SharedComponentEventHolder";
import { TransformBuilder, TransformContainer } from "./Transform";

/** A component that controls an Instance and has children. */
export default class SharedComponent<
	T extends Instance = Instance,
	TChild extends SharedComponentBase = SharedComponentBase,
	TEventHolder extends SharedComponentEventHolder = SharedComponentEventHolder,
> extends SharedComponentContainer<TChild, TEventHolder> {
	protected readonly instance: T;
	private transforms?: TransformContainer<T>;

	constructor(instance: T) {
		super();
		this.instance = instance;

		(this.instance as Instance).GetPropertyChangedSignal("Parent").Connect(() => {
			if (this.instance.Parent) return;
			this.destroy();
		});
	}

	/** Checks if the child exists on an Instance */
	protected static exists<T extends Instance, TKey extends keyof T & string>(
		gui: T,
		name: TKey,
	): gui is T & { [key in TKey]: (typeof gui)[TKey] & defined } {
		return gui.FindFirstChild(name) !== undefined;
	}

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
			this.event.onEnable(() => this.transforms?.enable());
			this.event.onDisable(() => this.transforms?.disable());
			this.event.onDestroy(() => this.transforms?.destroy());
			if (this.event.isEnabled()) this.transforms.enable();
		}

		return this.transforms;
	}

	/** Get an attribute value on the Instance */
	getAttribute<T extends AttributeValue>(name: string) {
		return this.instance.GetAttribute(name) as T | undefined;
	}

	getInstance(): T {
		return this.instance;
	}

	/** Add a child */
	add<T extends TChild>(instance: T) {
		super.add(instance);

		if (
			instance instanceof SharedComponent &&
			instance.getInstance() !== this.instance &&
			instance.getInstance().Parent === undefined
		) {
			instance.getInstance().Parent = this.instance;
		}

		return instance;
	}

	/** Disable component events, destroy the Instance and free the memory */
	destroy() {
		super.destroy();

		try {
			this.instance.Destroy();
		} catch {
			// empty
		}
	}
}
