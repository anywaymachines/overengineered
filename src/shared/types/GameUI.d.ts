interface GameUI {
	Tools: Frame & GameToolsGui;
}

interface GameToolsGui {
	Buttons: Frame & {
		Build: Frame & ToolsGuiButton;
		Configure: Frame & ToolsGuiButton;
		Delete: Frame & ToolsGuiButton;
		Move: Frame & ToolsGuiButton;
		Paint: Frame & ToolsGuiButton;
	};
}

interface ToolsGuiButton {
	ImageButton: ImageButton;
	TextLabel: TextLabel;
}
