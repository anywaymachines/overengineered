import Machine from "client/blocks/logic/Machine";
import PartUtils from "shared/utils/PartUtils";
import Component from "./Component";

export default abstract class BlockLogic<T extends BlockModel = BlockModel> extends Component<T> {
	protected readonly block: BlockModel;
	public machine?: Machine;

	constructor(block: T) {
		super(block);
		this.block = block;
	}

	protected subscribeOnDestroyed(instance: BasePart, func: () => void) {
		const update = () => {
			if (!instance.CanTouch) return;
			if (instance.Parent && instance.GetAttribute("broken") === undefined) return;

			func();
		};

		instance.AttributeChanged.Connect(update);
		instance.GetPropertyChangedSignal("Parent").Connect(update);
	}
	protected onDescendantDestroyed(func: () => void) {
		PartUtils.applyToAllDescendantsOfType("BasePart", this.instance, (part) =>
			this.subscribeOnDestroyed(part, func),
		);
	}
}
