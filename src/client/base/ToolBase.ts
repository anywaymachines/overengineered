/** An abstract class of tools for working with the world */
export default abstract class ToolBase {
	/** The name of the tool, for example: `Example Mode` */
	abstract getDisplayName(): string;

	/** Image of the tool*/
	abstract getImageID(): string;

	/** Description of the tool, for example: `Splits blocks into atoms` */
	abstract getShortDescription(): string;
}
