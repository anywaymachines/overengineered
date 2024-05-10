import { Assert } from "shared/Assert";
import { BlockWireManager } from "shared/block/BlockWireManager";

export namespace _Tests {
	export namespace WireToolTests {
		const Input = BlockWireManager.Markers.Input;
		const Output = BlockWireManager.Markers.Output;

		export function connectThrough1() {
			const newdata = (uuid: string | number) => ({
				uuid: tostring(uuid) as BlockUuid,
				instance: new Instance("Model") as BlockModel,
			});

			const block1 = newdata(1);
			const block2 = newdata(2);

			const in1 = new Input({
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block1,
				dataTypes: ["bool", "number"],
				group: "0",
			});
			const in2 = new Input({
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block1,
				dataTypes: ["bool", "number"],
				group: "0",
			});

			const out1 = new Output({
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block2,
				dataTypes: ["bool"],
				group: undefined,
			});

			BlockWireManager.groupMarkers([in1, in2, out1]);

			Assert.notNull(in1.sameGroupMarkers);
			Assert.notNull(in2.sameGroupMarkers);
			Assert.isNull(out1.sameGroupMarkers);
			Assert.sequenceEquals(in1.sameGroupMarkers, [in1, in2]);
			Assert.sequenceEquals(in2.sameGroupMarkers, [in1, in2]);

			//

			out1.connect(in1);

			print(in1.availableTypes.get().join());
			print(in2.availableTypes.get().join());
			print(out1.availableTypes.get().join());

			Assert.sequenceEquals(in1.availableTypes.get(), ["bool"]);
			Assert.sequenceEquals(in2.availableTypes.get(), ["bool"]);
			Assert.sequenceEquals(out1.availableTypes.get(), ["bool"]);
		}
		export function connectThrough2() {
			const newdata = (uuid: string | number) => ({
				uuid: tostring(uuid) as BlockUuid,
				instance: new Instance("Model") as BlockModel,
			});

			const block1 = newdata(1);
			const block2 = newdata(2);
			const block3 = newdata(3);

			const in1 = new Input({
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block1,
				dataTypes: ["bool", "number"],
				group: "0",
			});
			const in2 = new Input({
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block1,
				dataTypes: ["bool", "number"],
				group: "0",
			});
			const in3 = new Input({
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block3,
				dataTypes: ["bool", "number"],
				group: "1",
			});
			const in4 = new Input({
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block3,
				dataTypes: ["bool", "number"],
				group: "1",
			});

			const out1 = new Output({
				id: "a" as BlockConnectionName,
				name: "u",
				blockData: block2,
				dataTypes: ["bool"],
				group: undefined,
			});

			BlockWireManager.groupMarkers([in1, in2, in3, in4, out1]);

			//

			out1.connect(in3);
			out1.connect(in1);

			print(in1.availableTypes.get().join());
			print(in2.availableTypes.get().join());
			print(in3.availableTypes.get().join());
			print(in4.availableTypes.get().join());
			print(out1.availableTypes.get().join());

			Assert.sequenceEquals(in1.availableTypes.get(), ["bool"]);
			Assert.sequenceEquals(in2.availableTypes.get(), ["bool"]);
			Assert.sequenceEquals(in3.availableTypes.get(), ["bool"]);
			Assert.sequenceEquals(in4.availableTypes.get(), ["bool"]);
			Assert.sequenceEquals(out1.availableTypes.get(), ["bool"]);
		}
	}
}
