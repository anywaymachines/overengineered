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

// Confirm popup
type ConfirmGui = Frame & {
	CloseButton: TextButton;
	HeadingLabel: TextLabel;
	DescriptionLabel: TextLabel;
	Answers: Frame & {
		YesButton: TextButton;
		NoButton: TextButton;
	};
};

// Tooltips
type GamepadTooltip = Frame & {
	ImageLabel: ImageLabel;
	TextLabel: TextLabel;
};

type KeyboardTooltip = Frame & {
	Keys: Frame & {
		ImageLabel: ImageLabel & {
			KeyLabel: TextLabel;
		};
	};
	TextLabel: TextLabel;
};

type ToolTooltipGui = Frame & {
	GamepadTemplate: GamepadTooltip;
	KeyboardTemplate: KeyboardTooltip;
};

// Material popup
type MaterialGuiButton = TextButton & {
	TextLabel: TextLabel;
};
type MaterialGui = Frame & {
	CloseButton: TextButton;
	HeadingLabel: TextLabel;
	Answers: ScrollingFrame & {
		Template: MaterialGuiButton;
	};
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

type DeleteToolGui = Frame & {
	TouchControls: Frame & {
		DeleteButton: TextButton;
	};
	DeleteAllButton: TextButton;
};

type ActionBarGui = Frame & {
	Buttons: Frame & {
		Run: TextButton;
		Save: TextButton;
		Settings: TextButton;
	};
};

type LogFrame = Frame & {
	TextLabel: TextLabel;
};

type LogGui = Frame & {
	Template: LogFrame;
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
	DeleteToolGui: DeleteToolGui;
	ConfirmGui: ConfirmGui;
	LogGui: LogGui;
	MaterialGui: MaterialGui;
	ControlTooltips: ToolTooltipGui;
	ActionBarGui: ActionBarGui;
}
