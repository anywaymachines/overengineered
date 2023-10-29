interface MyGui {
	Sounds: Folder & MyGuiSounds;
	Tools: Frame & MyToolsGui;
	BuildingGuiMobile: Frame & {
		PlaceButton: TextButton;
		RotateRButton: TextButton;
		RotateTButton: TextButton;
		RotateYButton: TextButton;
	};
	Blocks: Frame & MyBlocksGui;
	BlocksCategories: Frame & MyBlocksCategoriesGui;
	DeleteAllButton: TextButton;
	CurrentToolLabel: TextLabel;
	CurrentToolDescriptionLabel: TextLabel;
}

interface MyBlocksCategoriesGui {
	Buttons: ScrollingFrame & {
		UIListLayout: UIListLayout;
		Template: TextButton;
	};
}

interface MyBlocksGui {
	Buttons: ScrollingFrame & {
		UIListLayout: UIListLayout;
		Template: TextButton & MyBlocksGuiButton;
	};
}

interface MyBlocksGuiButton {
	ViewportFrame: ViewportFrame;
	NameLabel: TextLabel;
}

interface MyToolsGui {
	Buttons: Frame & {
		Build: Frame & MyToolsGuiButton;
		Connect: Frame & MyToolsGuiButton;
		Configure: Frame & MyToolsGuiButton;
		Delete: Frame & MyToolsGuiButton;
		Move: Frame & MyToolsGuiButton;
		Paint: Frame & MyToolsGuiButton;
	};
}

interface MyGuiSounds {
	Building: Folder & {
		BlockPlace: Sound;
		BlockPlaceError: Sound;
		BlockRotate: Sound;
	};
	GuiClick: Sound;
}

interface MyToolsGuiButton {
	ImageButton: ImageButton;
	KeyboardButtonTooltip: TextLabel;
}
