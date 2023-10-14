import { ReplicatedStorage } from "@rbxts/services";

export default class BlockModels {
	private static unknownBlockModel = ReplicatedStorage.Blocks.FindFirstChild("Unknown") as Model | undefined;

	/** Method to get the block model during the initialization phase. If the model does not exist, a block called **Unknown** will be used
	 * @deprecated **do not use** in normal code, instead there is ```BlocksBehavior.getNativeBlockModel(block: Block)```
	 */
	public static __getNativeBlockModelByID(name: string): Model | undefined {
		const blockModel = ReplicatedStorage.Blocks.FindFirstChild(name) as Model | undefined;
		return blockModel ? blockModel : this.unknownBlockModel;
	}
}
