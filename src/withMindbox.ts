import { ConfigPlugin, withAppBuildGradle } from "@expo/config-plugins";
import { withMindboxAndroid } from "./withMindboxAndroid";
import { withMindboxIos } from "./withMindboxIos";
import type { MindboxPluginProps } from "./mindboxTypes";


const withMindbox: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
  console.log('[Mindbox Plugin] withMindbox called!');
  config = withMindboxAndroid(config, props);
  config = withMindboxIos(config, props);
  return config;
};

export default withMindbox;
