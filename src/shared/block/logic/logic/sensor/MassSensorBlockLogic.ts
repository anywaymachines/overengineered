import { blockConfigRegistry } from "shared/block/config/BlockConfigRegistry";
import { ConfigurableBlockLogic } from "shared/block/ConfigurableBlockLogic";
import { DisconnectBlockLogic } from "shared/block/logic/DisconnectBlockLogic";
import { BuildingManager } from "shared/building/BuildingManager";
import { RemoteEvents } from "shared/RemoteEvents";
import { RobloxUnit } from "shared/RobloxUnit";
import type { BlockLogicData } from "shared/block/BlockLogic";

export class MassSensorBlockLogic extends ConfigurableBlockLogic<typeof blockConfigRegistry.masssensor> {
	constructor(block: BlockLogicData<typeof blockConfigRegistry.masssensor.input>) {
		super(block, blockConfigRegistry.masssensor);

		this.event.subscribe(DisconnectBlockLogic.events.disconnect.clientInvoked, () => this.update());
		this.event.subscribe(RemoteEvents.ImpactBreak.clientInvoked, () => this.update());

		this.onEnable(() => this.update());
	}

	private update() {
		if (!this.block.instance.PrimaryPart) {
			this.disable();
			return;
		}

		this.output.result.set(
			RobloxUnit.RMU_To_Kilograms(
				this.input.assemblyonly.get() ? this.block.instance.PrimaryPart.AssemblyMass : this.getBuildingMass(),
			),
		);
	}

	private getBuildingMass() {
		let mass = 0;
		for (const block of BuildingManager.getMachineBlocks(this.instance)) {
			for (const desc of block.GetDescendants()) {
				if (!desc.IsA("BasePart")) continue;
				mass += desc.Mass;
			}
		}

		return mass;
	}
}
