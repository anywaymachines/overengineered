import Widget from "client/base/Widget";

export default class ToolInfoWidget extends Widget {
	showWidget(hasAnimations: boolean): void {
		this.frame.Visible = true;
	}
	hideWidget(hasAnimations: boolean): void {
		super.hideWidget(hasAnimations);

		this.frame.Visible = false;
	}
}
