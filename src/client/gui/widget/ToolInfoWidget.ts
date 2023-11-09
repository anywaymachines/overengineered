import Widget from "client/base/Widget";
import GuiAnimator from "../GuiAnimator";
import Signals from "client/event/Signals";
import ToolBase from "client/base/ToolBase";

/** Widget with information about the tool used */
export default class ToolInfoWidget extends Widget {
	constructor(frame: ToolInfo) {
		super(frame);
	}

	hideWidget(hasAnimations: boolean): void {
		super.hideWidget(hasAnimations);

		this.frame.Visible = false;
	}

	prepare(): void {
		super.prepare();

		// Remove text
		(this.frame as ToolInfo).NameLabel.Text = "";
		(this.frame as ToolInfo).DescriptionLabel.Text = "";

		// Show tool info on equip
		this.eventHandler.subscribe(Signals.TOOL.EQUIPPED, (tool: ToolBase) => {
			(this.frame as ToolInfo).NameLabel.Text = tool.getDisplayName();
			(this.frame as ToolInfo).DescriptionLabel.Text = tool.getShortDescription();

			this.showWidget(true);
		});

		// Hide tool info on equip
		this.eventHandler.subscribe(Signals.TOOL.UNEQUIPPED, () => {
			(this.frame as ToolInfo).NameLabel.Text = "";
			(this.frame as ToolInfo).DescriptionLabel.Text = "";

			this.showWidget(true);
		});
	}

	prepareDesktop(): void {
		// Empty
	}

	prepareGamepad(): void {
		// Empty
	}

	prepareTouch(): void {
		// Empty
	}

	showWidget(hasAnimations: boolean): void {
		this.frame.Visible = true;

		if (hasAnimations) {
			GuiAnimator.transition(this.frame, 0.1, "up", 10);
		}

		this.prepare();
	}
}
