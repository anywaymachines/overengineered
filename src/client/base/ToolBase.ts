/** An abstract class of tools for working with the world */
export default abstract class ToolBase {
	/** The name of the tool, for example: `Example Mode` */
	public abstract getDisplayName(): string;

	/** Description of the tool, for example: `Splits blocks into atoms` */
	public abstract getShortDescription(): string;
}
