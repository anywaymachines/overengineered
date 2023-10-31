interface MyGui {
	GamepadImageTooltips: Folder;
	GamepadTextTooltips: Frame & {
		Template: Frame & GamepadTextTooltipFrame;
	};
	Sounds: Folder & MyGuiSounds;
	Tools: Frame & {
		Build: Frame & MyToolsGuiButton;
		Connect: Frame & MyToolsGuiButton;
		Configure: Frame & MyToolsGuiButton;
		Delete: Frame & MyToolsGuiButton;
		Move: Frame & MyToolsGuiButton;
		Paint: Frame & MyToolsGuiButton;
	};
	BuildToolMobile: Frame & {
		PlaceButton: TextButton;
		RotateRButton: TextButton;
		RotateTButton: TextButton;
		RotateYButton: TextButton;
	};
	DeleteToolMobile: Frame & {
		DeleteButton: TextButton;
	};
	Blocks: Frame & MyBlocksGui;
	BlocksCategories: Frame & MyBlocksCategoriesGui;
	CurrentToolLabel: TextLabel;
	CurrentToolDescriptionLabel: TextLabel;
}

type GamepadTextTooltipKeys = "ButtonA" | "ButtonB" | "ButtonY" | "ButtonX";
type GamepadTextTooltip = Partial<Record<GamepadTextTooltipKeys, string | undefined>>;

interface GamepadTextTooltipFrame {
	ImageLabel: ImageLabel;
	TextLabel: TextLabel;
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

interface MyGuiSounds {
	Building: Folder & {
		BlockPlace: Sound;
		BlockPlaceError: Sound;
		BlockRotate: Sound;
		BlockDelete: Sound;
	};
	GuiClick: Sound;
}

interface MyToolsGuiButton {
	ImageButton: ImageButton;
	KeyboardButtonTooltip: TextLabel;
}
