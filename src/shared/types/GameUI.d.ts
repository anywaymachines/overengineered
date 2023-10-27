interface GameUI {
	Sounds: Folder & GuiSounds;
	Tools: Frame & GameToolsGui;
	BuildingGuiMobile: Frame & {
		PlaceButton: TextButton;
		RotateRButton: TextButton;
		RotateTButton: TextButton;
		RotateYButton: TextButton;
	};
	DeleteAllButton: TextButton;
	CurrentToolLabel: TextLabel;
	CurrentToolDescriptionLabel: TextLabel;
}

interface GameToolsGui {
	Buttons: Frame & {
		Build: Frame & ToolsGuiButton;
		Connect: Frame & ToolsGuiButton;
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
	KeyboardButtonTooltip: TextLabel;
}
