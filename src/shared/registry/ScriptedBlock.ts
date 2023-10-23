import AbstractBlock from "./AbstractBlock";

export default abstract class ScriptedBlock extends AbstractBlock {
	/** Returns a boolean that enables/disables the call to the `ScriptedBlock.tick()` method */
	public abstract isTicking(): boolean;

	/** Called by **client** every frame when the unit is in a building that is in drive-in mode
	 * @param deltaTime in the last `deltaTime` seconds
	 */
	public abstract tick(block: Model, deltaTime: number): void;

	/** Method of **initializing** the unit at the start of operation */
	public abstract prepareLogic(block: Model): void;
}
