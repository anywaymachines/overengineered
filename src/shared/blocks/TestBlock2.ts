import ScriptedBlock from "shared/abstract/ScriptedBlock";
import { ConnectableBlock } from "shared/interfaces/building/ConnectableBlock";

export default class TestBlock2 extends ScriptedBlock implements ConnectableBlock {
	public isTicking(): boolean {
		throw new Error("Method not implemented.");
	}
	public tick(block: Model, deltaTime: number): void {
		throw new Error("Method not implemented.");
	}
	public prepareLogic(block: Model): void {
		throw new Error("Method not implemented.");
	}
	public getDisplayName(): string {
		throw new Error("Method not implemented.");
	}
	public getAssetID(): number {
		throw new Error("Method not implemented.");
	}
	public getModel(): Model {
		throw new Error("Method not implemented.");
	}
	getConnectionType(): "simple" | "control" {
		throw new Error("Method not implemented.");
	}
	onWirePowered(block: ScriptedBlock, fromBlock: ScriptedBlock, data: object | undefined): void {
		throw new Error("Method not implemented.");
	}
	onWireUnpowered(block: ScriptedBlock, fromBlock: ScriptedBlock): void {
		throw new Error("Method not implemented.");
	}
}
