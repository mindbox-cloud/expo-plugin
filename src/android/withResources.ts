import { ConfigPlugin, withAndroidManifest, withDangerousMod } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { addManifestMetaData, withErrorHandling, logWarning } from "./utils";
import { copyNotificationIcon, writeMindboxStringsResources, writeMindboxColorResource } from "./utils/resourceUtils";

export const withResources: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    config = withDangerousMod(config, ["android", async (modConfig) => {
        const projectRoot = modConfig.modRequest.projectRoot;
        const androidProjectRoot = modConfig.modRequest.platformProjectRoot;

        await withErrorHandling("write Mindbox strings.xml", async () => {
            await writeMindboxStringsResources(androidProjectRoot, {
                androidChannelId: props.androidChannelId,
                androidChannelName: props.androidChannelName,
                androidChannelDescription: props.androidChannelDescription,
            });
        });

        await withErrorHandling("write Mindbox colors.xml", async () => {
            await writeMindboxColorResource(androidProjectRoot, props.smallIconAccentColor);
        });

        await withErrorHandling("copy Mindbox notification icon", async () => {
            await copyNotificationIcon(projectRoot, androidProjectRoot, props.smallIcon);
        });

        return modConfig;
    }]);
    return config;
};


