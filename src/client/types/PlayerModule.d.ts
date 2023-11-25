declare namespace ControlModule {
	interface ControlModule {
		GetMoveVector(): Vector3;
		GetActiveController(): ControlModule;
		UpdateActiveControlModuleEnabled(): void;
		Enable(enable?: boolean): void;
		Disable(): void;
		SelectComputerMovementModule(): LuaTuple<[unknown, boolean]>;
		SelectTouchModule(): LuaTuple<[unknown, boolean]>;
		GetClickToMoveController(): ControlModule.ClickToMoveController.ClickToMove;
	}
	namespace ClickToMoveController {
		interface ClickToMove {
			DisconnectEvents(): void;
			Start(): void;
			Stop(): void;
			CleanupPath(): void;
			Enable(enable: boolean, enableWASD: boolean, touchJumpController: unknown): void;
			SetShowPath(value: boolean): void;
			GetShowPath(): boolean;
			SetWaypointTexture(texture: string): void;
			GetWaypointTexture(): string;
			SetWaypointRadius(radius: number): void;
			GetWaypointRadius(): number;
			SetEndWaypointTexture(): void;
			GetEndWaypointTexture(): string;
			SetWaypointsAlwaysOnTop(alwaysOnTop: boolean): void;
			GetWaypointsAlwaysOnTop(): boolean;
			SetFailureAnimationEnabled(enabled: boolean): void;
			GetFailureAnimationEnabled(): boolean;
			SetIgnoredPartsTag(tag: string): void;
			GetIgnoredPartsTag(): string;
			SetUseDirectPath(directPath: boolean): void;
			GetUseDirectPath(): boolean;
			SetAgentSizeIncreaseFactor(increaseFactorPercent: number): void;
			GetAgentSizeIncreaseFactor(): number;
			SetUnreachableWaypointTimeout(timeoutInSec: number): void;
			GetUnreachableWaypointTimeout(): number;
			SetUserJumpEnabled(jumpEnabled: boolean): boolean;
			GetUserJumpEnabled(): boolean;
			MoveTo(position: Vector3, showPath: boolean, useDirectPath: boolean): boolean;
		}
	}
}
declare namespace CameraModule {
	interface CameraUtils {
		GetCameraMovementModeFromSettings(
			enumValue:
				| Enum.TouchCameraMovementMode
				| Enum.ComputerCameraMovementMode
				| Enum.DevTouchCameraMovementMode
				| Enum.DevComputerCameraMovementMode,
		): Enum.ComputerCameraMovementMode | Enum.DevComputerCameraMovementMode;
		setMouseBehaviorOverride(this: void, value?: Enum.MouseBehavior): void;
		restoreMouseBehavior(): void;
		setMouseIconOverride(icon: string): void;
		restoreMouseIcon(): void;
	}
	interface MouseLockController {
		GetIsMouseLocked(): boolean;
		GetBindableToggleEvent(): RBXScriptSignal;
		GetMouseLockOffset(): Vector3;
		UpdateMouseLockAvailability(): void;
		OnMouseLockToggled(): void;
		DoMouseLockSwitch(name: string, state: Enum.UserInputState, input: Enum.KeyCode): Enum.ContextActionResult;
		IsMouseLocked(): boolean;
		EnableMouseLock(enable?: boolean): void;
	}
	interface BaseCamera {
		new: () => BaseCamera;
		GetModuleName(): "BaseCamera";
		OnCharacterAdded(char: Instance): void;
		GetHumanoidRootPart(): BasePart;
		GetBodyPartToFollow(humanoid: Humanoid, isDead: boolean): BasePart;
		GetSubjectCFrame(): CFrame;
		GetSubjectVelocity: Vector3;
		GetSubjectRotVelocity: Vector3;
		StepZoom(): number;
		GetSubjectPosition(): Vector3 | undefined;
		UpdateDefaultSubjectDistance(): void;
		OnViewportSizeChanged(): void;
		OnCurrentCameraChanged(): void;
		OnDynamicThumbstickEnabled(): void;
		OnDynamicThumbstickDisabled(): void;
		OnGameSettingsTouchMovementModeChanged(): void;
		OnDevTouchMovementModeChanged(): void;
		OnPlayerCameraPropertyChange(): void;
		InputTranslationToCameraAngleChange(translationVector: number, sensitivity: number): number;
		GamepadZoomPress(): void;
		Enable(): boolean;
		OnEnable(enable: boolean): boolean;
		GetEnabled(): boolean;
		Cleanup(): void;
		UpdateMouseBehavior(): void;
		UpdateForDistancePropertyChange(): void;
		SetCameraToSubjectDistance(desiredSubjectDistance: number): number;
		SetCameraType(cameraType: Enum.CameraType): void;
		GetCameraType(): Enum.CameraType;
		SetCameraMovementMode(cameraMovementMode: Enum.ComputerCameraMovementMode): void;
		GetCameraMovementMode(): Enum.ComputerCameraMovementMode;
		SetIsMouseLocked(mouseLocked: boolean): void;
		GetIsMouseLocked(): boolean;
		SetMouseLockOffset(offsetVector: Vector3): void;
		GetMouseLockOffset(): Vector3;
		InFirstPerson(): boolean;
		EnterFirstPerson(): unknown;
		LeaveFirstPerson(): unknown;
		GetCameraToSubjectDistance(): number;
		GetMeasuredDistanceToFocus(): number;
		GetCameraLookVector(): Vector3;
		CalculateNewLookCFrameFromArg(suppliedLookVector: Vector3, rotateInput: Vector2): CFrame;
		CalculateNewLookVectorFromArg(suppliedLookVector: Vector3, rotateInput: Vector2): CFrame;
		CalculateNewLookVectorVRFromArg(rotateInput: Vector2): Vector3;
		GetHumanoid(): Humanoid | undefined;
		GetHumanoidPartToFollow(humanoid: Humanoid, humanoidStateType: Enum.HumanoidStateType): BasePart;
		OnNewCameraSubject(): void;
		Update(dt: number): unknown;
		GetCameraHeight(): number;
	}
	export interface CameraModule {
		GetCameraControlChoice(): Enum.ComputerCameraMovementMode | Enum.DevComputerCameraMovementMode;
		ActivateOcclusionMode(occlusionMode: Enum.DevCameraOcclusionMode): void;
		ActivateCameraController(
			cameraMovementMode: Parameters<CameraModule.CameraUtils["GetCameraMovementModeFromSettings"]>["0"],
			legacyCameraType: Enum.CameraType,
		): void;
		ShouldUseVehicleCamera(): CameraModule;
		activeCameraController: BaseCamera;
		activeMouseLockController: MouseLockController;
	}
}
export interface PlayerModule {
	cameras: CameraModule.CameraModule;
	controls: ControlModule.ControlModule;
	GetControls(): ControlModule.ControlModule;
	GetCameras(): CameraModule.CameraModule;
	GetClickToMoveController(): ControlModule.ClickToMoveController.ClickToMove;
}
