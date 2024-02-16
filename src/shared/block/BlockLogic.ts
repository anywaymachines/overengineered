import { PlacedBlockDataConnection } from "shared/building/BlockManager";
import SharedComponent from "shared/component/SharedComponent";
import PartUtils from "shared/utils/PartUtils";

export interface BlockLogicData<TDef extends BlockConfigTypes.Definitions, TBlock extends BlockModel = BlockModel> {
	readonly id: string;
	readonly instance: TBlock;
	readonly uuid: BlockUuid;
	readonly config: Partial<ConfigDefinitionsToConfig<keyof TDef, TDef>>;
	readonly color?: Color3;
	readonly material?: Enum.Material;

	/** Connections to this block INPUT from other blocks OUTPUTs and INPUTs */
	readonly connections: Readonly<Partial<Record<keyof TDef & BlockConnectionName, PlacedBlockDataConnection>>>;
}
export default class BlockLogic<T extends BlockModel = BlockModel> extends SharedComponent<T> {
	readonly block: BlockLogicData<BlockConfigTypes.Definitions, T>;
	readonly instance: T;

	constructor(block: BlockLogicData<BlockConfigTypes.Definitions>) {
		super(block.instance as T);
		this.block = block as typeof this.block;
		this.instance = this.block.instance;
	}

	protected subscribeOnDestroyed(instance: Instance, func: () => void) {
		const update = () => {
			if (instance.IsA("BasePart") && !instance.CanTouch) return;

			func();
		};

		instance.GetPropertyChangedSignal("Parent").Connect(update);
	}

	protected onDescendantDestroyed(func: () => void) {
		const subscribe = (instance: Instance) => {
			this.subscribeOnDestroyed(instance, func);
		};

		PartUtils.applyToAllDescendantsOfType("BasePart", this.instance, (part) => subscribe(part));
		PartUtils.applyToAllDescendantsOfType("WeldConstraint", this.instance, (part) => subscribe(part));
	}
}
