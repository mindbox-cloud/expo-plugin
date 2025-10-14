import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";

const withMindboxExtensions: ConfigPlugin<MindboxPluginProps> = (config) => {
    return withXcodeProject(config, (c) => {
        return c;
    });
};

export default withMindboxExtensions;


