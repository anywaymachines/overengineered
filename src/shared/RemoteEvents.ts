import Effects from "./effects/Effects";

const RemoteEvents = {
	...Effects,

	// empty method just to trigger constructors
	initialize() {},
} as const;
export default RemoteEvents;
