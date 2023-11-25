import { ReplicatedStorage } from "@rbxts/services";
import AbstractBlock from "shared/registry/abstract/AbstractBlock";
import AbstractCategory from "../abstract/AbstractCategory";
import CategoriesRegistry from "../CategoriesRegistry";

export default class VehicleSeatBlock extends AbstractBlock {
	constructor() {
		super("vehicleseat");
	}

	public getDisplayName(): string {
		return "Vehicle Seat";
	}

	public getModel(): Model {
		return ReplicatedStorage.Assets.Blocks.FindFirstChild("VehicleSeat") as Model;
	}

	public getAvailableRotationAxis(): { x: boolean; y: boolean; z: boolean } {
		return { x: true, y: true, z: true };
	}

	public getCategory(): AbstractCategory {
		return CategoriesRegistry.SEATS_CATEGORY;
	}

	public getLimit(): number {
		return 1;
	}

	public isRequired(): boolean {
		return true;
	}
}
