interface GameUI {
	Sounds: Folder & GuiSounds;
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

interface GuiSounds {
	Building: Folder & {
		BlockPlace: Sound;
		BlockPlaceError: Sound;
		BlockRotate: Sound;
	};
	GuiClick: Sound;
}

interface ToolsGuiButton {
	ImageButton: ImageButton;
	TextLabel: TextLabel;
}
