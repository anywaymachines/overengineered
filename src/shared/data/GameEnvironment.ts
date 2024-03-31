import { Workspace } from "@rbxts/services";
import RobloxUnit from "shared/RobloxUnit";
import GameDefinitions from "shared/data/GameDefinitions";

const GameEnvironment = {
	EarthGravity: GameDefinitions.APRIL_FOOLS ? 60 : 180,
	EarthAirDensity: 0.2,

	ZeroGravityHeight: GameDefinitions.APRIL_FOOLS ? RobloxUnit.Meters_To_Studs(100) : 15000,
	ZeroAirHeight: 10000,

	MinSoundValue: 0.01,
} as const;

if (GameDefinitions.APRIL_FOOLS) {
	Workspace.Terrain.SetMaterialColor(Enum.Material.Basalt, new Color3(0.4, 0.2, 0.2));
}

export default GameEnvironment;
