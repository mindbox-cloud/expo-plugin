import { ConfigPlugin, withAndroidManifest, withProjectBuildGradle } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import { ANDROID_CONSTANTS } from "../helpers/androidConstants";
import { addMavenRepository, addManifestMetaData, logWarning } from "./utils";

export const withRustore: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    config = withProjectBuildGradle(config, (buildGradle) => {
        addMavenRepository(
            buildGradle,
            ANDROID_CONSTANTS.RUSTORE_MAVEN_URL,
            ANDROID_CONSTANTS.RUSTORE_MAVEN_REPO
        );
        return buildGradle;
    });

    config = withAndroidManifest(config, (manifestConfig) => {
        if (!props.rustoreProjectId) {
            logWarning("add RuStore project ID meta-data", "rustoreProjectId is not set");
            return manifestConfig;
        }

        addManifestMetaData(
            manifestConfig,
            ANDROID_CONSTANTS.RUSTORE_PROJECT_ID_META_DATA_NAME,
            props.rustoreProjectId,
            "value"
        );

        return manifestConfig;
    });

    return config;
};
