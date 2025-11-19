import { DayjsFactory, DayjsPlugin } from "./dayjs";

const jalaliday: DayjsPlugin = function (_opts, _DayjsClass, _factory: DayjsFactory) {
  // The shim does not transform calendar data; this plugin is a placeholder.
};

export default jalaliday;
