import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import type { BlockLogicData } from "shared/block/BlockLogic";

export class Vector3ObjectWorldTransformerBlockLogic extends ConfigurableBlockLogic<
	typeof blockConfigRegistry.vec3objectworldtransformer
> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.vec3objectworldtransformer.input>) {
		super(block, blockConfigRegistry.vec3objectworldtransformer);

		const update = () => {
			const originRotation = this.input.originrot.get();
			const origin = new CFrame(this.input.originpos.get()).mul(
				CFrame.fromOrientation(originRotation.X, originRotation.Y, originRotation.Z),
			);

			const result = this.input.toobject.get()
				? origin.PointToObjectSpace(this.input.position.get())
				: origin.PointToWorldSpace(this.input.position.get());
			this.output.position.set(result);
		};

		this.input.originpos.subscribe(update);
		this.input.originrot.subscribe(update);
		this.input.position.subscribe(update);
	}
}
