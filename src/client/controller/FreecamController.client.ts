import { RunService, UserInputService, Workspace } from "@rbxts/services";
import { InputController } from "client/controller/InputController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { InputHandler } from "client/event/InputHandler";
import { EventHandler } from "shared/event/EventHandler";

let disable: (() => void) | undefined = undefined;

UserInputService.InputBegan.Connect((input) => {
	if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
	if (input.KeyCode !== Enum.KeyCode.F8) return;
	if (!InputController.isShiftPressed()) return;

	if (disable) {
		disable();
	} else {
		const psub = Workspace.CurrentCamera!.CameraSubject;

		const subject = new Instance("Part", Workspace);
		subject.Anchored = true;
		subject.Transparency = 1;
		subject.CanCollide = false;
		subject.Position = psub!.IsA("Humanoid") ? (psub.Parent as Model).GetPivot().Position : psub!.Position;
		Workspace.CurrentCamera!.CameraSubject = subject;
		LocalPlayerController.getPlayerModule().GetControls().Disable();
		UserInputService.MouseIconEnabled = false;

		const eh = new EventHandler();
		const ih = new InputHandler();

		let offset = Vector3.zero;
		let actualOffset = Vector3.zero;
		eh.subscribe(RunService.Heartbeat, (dt) => {
			actualOffset = actualOffset.add(Workspace.CurrentCamera!.CFrame.VectorToWorldSpace(offset.mul(dt * 100)));

			const playerpos = psub!.IsA("Humanoid") ? (psub.Parent as Model).GetPivot().Position : psub!.Position;
			subject.Position = playerpos.add(actualOffset);
		});

		const wasd: readonly KeyCode[] = ["W", "A", "S", "D", "Q", "E"];
		const yghj: readonly KeyCode[] = ["Y", "G", "H", "J", "T", "U"];
		for (const [w, a, s, d, q, e] of [wasd, yghj]) {
			ih.onKeyDown(w, () => (offset = new Vector3(offset.X, offset.Y, -1)));
			ih.onKeyUp(w, () => (offset = new Vector3(offset.X, offset.Y, 0)));
			ih.onKeyDown(s, () => (offset = new Vector3(offset.X, offset.Y, 1)));
			ih.onKeyUp(s, () => (offset = new Vector3(offset.X, offset.Y, 0)));

			ih.onKeyDown(q, () => (offset = new Vector3(offset.X, -1, offset.Z)));
			ih.onKeyUp(q, () => (offset = new Vector3(offset.X, 0, offset.Z)));
			ih.onKeyDown(e, () => (offset = new Vector3(offset.X, 1, offset.Z)));
			ih.onKeyUp(e, () => (offset = new Vector3(offset.X, 0, offset.Z)));

			ih.onKeyDown(a, () => (offset = new Vector3(-1, offset.Y, offset.Z)));
			ih.onKeyUp(a, () => (offset = new Vector3(0, offset.Y, offset.Z)));
			ih.onKeyDown(d, () => (offset = new Vector3(1, offset.Y, offset.Z)));
			ih.onKeyUp(d, () => (offset = new Vector3(0, offset.Y, offset.Z)));
		}

		disable = () => {
			disable = undefined;
			eh.unsubscribeAll();
			ih.unsubscribeAll();

			//Workspace.CurrentCamera!.CameraType = prevc;
			Workspace.CurrentCamera!.CameraSubject = psub;
			subject.Destroy();
			LocalPlayerController.getPlayerModule().GetControls().Enable();
			UserInputService.MouseIconEnabled = true;
		};
	}
});
