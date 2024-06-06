import { ContextActionService, Players } from "@rbxts/services";
import { InputController } from "client/controller/InputController";
import { LocalPlayer } from "client/controller/LocalPlayer";
import { ObservableValue } from "shared/event/ObservableValue";
import { HostedService } from "shared/GameHost";
import { PartUtils } from "shared/utils/PartUtils";

class SprintLogic extends HostedService {
	constructor(sprintSpeed: number) {
		super();

		const isSprinting = new ObservableValue<boolean>(false);

		// Update character walkspeed
		isSprinting.subscribe((value) => {
			const humanoid = LocalPlayer.humanoid.get();
			if (!humanoid) return;

			const walkSpeed = 20;
			humanoid.WalkSpeed = value ? sprintSpeed : walkSpeed;
		});

		this.event.subscribeObservable(
			InputController.inputType,
			(inputType) => {
				// Remove old action (if exists)
				ContextActionService.UnbindAction("Sprint");

				// Bind new action
				ContextActionService.BindAction(
					"Sprint",
					(name, inputState) => {
						isSprinting.set(inputState === Enum.UserInputState.Begin);
						return Enum.ContextActionResult.Pass;
					},
					inputType === "Touch",
					Enum.KeyCode.LeftShift,
					Enum.KeyCode.ButtonY,
				);
				ContextActionService.SetImage("Sprint", "rbxassetid://9555118706");
				ContextActionService.SetDescription("Sprint", "Allows you to move more quickly");
				ContextActionService.SetPosition("Sprint", new UDim2(0, 20, 0, 50));
				ContextActionService.SetTitle("Sprint", "Sprint");
			},
			true,
		);
	}
}

/** By default, character has `EnableFluidForces`, but because of the huge `Workspace.AirDensity`, it just flies like a feather */
class DisableFluidForces extends HostedService {
	constructor() {
		super();

		this.event.subscribeObservable(
			LocalPlayer.character,
			(char) => {
				if (!char) return;

				PartUtils.applyToAllDescendantsOfType("BasePart", char, (part) => (part.EnableFluidForces = false));
				char.DescendantAdded.Connect((child) => {
					if (child.IsA("BasePart")) {
						child.EnableFluidForces = false;
					}
				});
			},
			true,
		);
	}
}

class SetCameraMaxZoomDistance extends HostedService {
	constructor(distance: number) {
		super();

		const defaultDistance = Players.LocalPlayer.CameraMaxZoomDistance;
		this.onEnable(() => (Players.LocalPlayer.CameraMaxZoomDistance = distance));
		this.onDestroy(() => (Players.LocalPlayer.CameraMaxZoomDistance = defaultDistance));
	}
}

export namespace LocalPlayerController {
	export function initializeDisablingFluidForces(host: GameHostBuilder): void {
		host.services.registerService(DisableFluidForces);
	}
	export function initializeSprintLogic(host: GameHostBuilder, sprintSpeed: number): void {
		host.services.registerService(SprintLogic).withArgs([sprintSpeed]);
	}
	export function initializeCameraMaxZoomDistance(host: GameHostBuilder, distance: number): void {
		host.services.registerService(SetCameraMaxZoomDistance).withArgs([distance]);
	}
}
