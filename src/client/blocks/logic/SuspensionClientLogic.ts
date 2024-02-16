import ClientBlockLogic from "client/blocks/ClientBlockLogic";
import SuspensionLogic from "shared/block/logic/SuspensionLogic";

export class SuspensionClientLogic extends ClientBlockLogic<typeof SuspensionLogic> {
	constructor(logic: typeof SuspensionLogic) {
		super(logic);

		logic.clientEvents.destroy_beam.invoked.Connect((player, { block }) => {
			block.FindFirstChild("SpringSide")?.FindFirstChild("Beam")?.Destroy();
		});
	}
}
