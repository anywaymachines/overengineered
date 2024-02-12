import RemoteEvents from "shared/RemoteEvents";

function applyImpulse(part: BasePart, impulse: Vector3, position: Vector3 | undefined) {
	if (position) {
		part.ApplyImpulseAtPosition(impulse, position);
	} else {
		part.ApplyImpulse(impulse);
	}
}

RemoteEvents.Impulse.invoked.Connect(({ part, impulse, position }) => applyImpulse(part, impulse, position));
