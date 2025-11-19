import { DayjsFactory, DayjsPlugin } from "../index";

const plugin: DayjsPlugin = function (_opts, _DayjsClass, _factory: DayjsFactory) {
  // The core shim already exposes `isBetween`, so no extra wiring is required.
};

export default plugin;
