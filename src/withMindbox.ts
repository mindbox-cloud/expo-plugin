import { ConfigPlugin, withAppBuildGradle } from "@expo/config-plugins";
import { withMindboxAndroid } from "./withMindboxAndroid";
import { withMindboxIos } from "./withMindboxIos";
import { validatePluginProps } from "./utils/validation";
import type { MindboxPluginProps } from "./mindboxTypes";

const withMindbox: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
  validatePluginProps(props);
  config = withMindboxAndroid(config, props);
  config = withMindboxIos(config, props);
  return config;
};

export default withMindbox;
export { validatePluginProps };
