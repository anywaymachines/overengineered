import ScriptedBlock from "shared/abstract/ScriptedBlock";

interface ConnectableBlock {
	/**
	 * @param `simple` is a method that can only understand power on and power off.
	 * @param `control` - method that takes keyboard control (wasd/gamepad/touchscreen).
	 */
	getConnectionType(): "simple" | "control";

	/** Called when power is received from the wire
	 * @param `block` target block
	 * @param `fromBlock` powered by the block
	 * @param `data` data received from the wire
	 */
	onWirePowered(block: ScriptedBlock, fromBlock: ScriptedBlock, data: object | undefined): void;

	/** Called when power end from the wire
	 * @param `block` target block
	 * @param `fromBlock` unpowered by the block
	 */
	onWireUnpowered(block: ScriptedBlock, fromBlock: ScriptedBlock): void;
}
