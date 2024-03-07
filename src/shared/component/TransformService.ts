import { TransformContainer, type TransformBuilder } from "shared/component/Transform";

export class TransformService {
	private static readonly transforms = new Map<object, TransformContainer<Instance>>();

	static run<T extends Instance>(instance: T, setup: (transform: TransformBuilder<T>, instance: T) => void) {
		this.transforms.get(instance)?.finish();

		const container = new TransformContainer(instance);
		this.transforms.set(instance, container);
		container.run((transform, instance) => {
			setup(transform, instance);
			transform.then().func(() => {
				container.destroy();
				this.transforms.delete(instance);
			});
		});
		container.enable();
	}
}
