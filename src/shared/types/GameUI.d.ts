// Toolbar
type Toolbar = Frame & {
	Buttons: Frame & {
		Template: ToolbarButton;
	};

	// Tooltips
	GamepadBack: ImageLabel;
	GamepadNext: ImageLabel;
};

type ToolbarButton = TextButton & {
	ImageLabel: ImageLabel;
	KeyboardNumberLabel: TextLabel;
};

// ToolInfo
type ToolInfo = Frame & {
	NameLabel: TextLabel;
	DescriptionLabel: TextLabel;
};

// Sounds
type Sounds = Folder & {
	Building: Folder & {
		BlockPlace: Sound;
		BlockPlaceError: Sound;
		BlockRotate: Sound;
		BlockDelete: Sound;
	};
	Ride: Folder & {
		RideStart: Sound;
	};
	GuiClick: Sound;
};

interface GameUI {
	Sounds: Sounds;
	Toolbar: Toolbar;
	ToolInfo: ToolInfo;
}
