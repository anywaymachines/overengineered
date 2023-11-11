// Toolbar
type ToolbarGui = Frame & {
	Buttons: Frame & {
		Template: ToolbarButton;
	};

	// Tooltips
	GamepadBack: ImageLabel;
	GamepadNext: ImageLabel;

	// Texts
	NameLabel: TextLabel;
	DescriptionLabel: TextLabel;
};

type ToolbarButton = TextButton & {
	ImageLabel: ImageLabel;
	KeyboardNumberLabel: TextLabel;
};

// Build Tool
type BuildToolGui = Frame & {
	Selection: Frame & {
		Buttons: ScrollingFrame & {
			BlockTemplate: TextButton & { Frame: Frame & { LimitLabel: TextLabel }; TextLabel: TextLabel };
			CategoryTemplate: TextButton & { Frame: Frame & { ImageLabel: ImageLabel }; TextLabel: TextLabel };
		};
		MaterialButton: TextButton;
		MaterialLabel: TextLabel;
	};
	TouchControls: Frame & {
		PlaceButton: TextButton;
		RotateRButton: TextButton;
		RotateTButton: TextButton;
		RotateYButton: TextButton;
	};
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
	ToolbarGui: ToolbarGui;
	BuildToolGui: BuildToolGui;
}
