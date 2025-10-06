import { ConfigPlugin, withAppBuildGradle, withProjectBuildGradle, withDangerousMod, withAndroidManifest, AndroidConfig } from "@expo/config-plugins";
import { MindboxPushProviders } from "./mindboxTypes";
import type { MindboxPluginProps, MindboxPushProvider } from "./mindboxTypes";
import { ANDROID_CONSTANTS } from "./helpers/androidConstants";
import * as fs from "fs";
import * as path from "path";

const libraryMap: Record<MindboxPushProvider, string> = {
    firebase: "cloud.mindbox:mindbox-firebase-starter",
    huawei: "cloud.mindbox:mindbox-huawei-starter",
    rustore: "cloud.mindbox:mindbox-rustore-starter",
};

const addMindboxDependencies: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    console.log('[Mindbox Plugin] addMindboxDependencies called!')
    if (!props.androidPushProviders || props.androidPushProviders.length === 0) {
        return config;
    }
    return withAppBuildGradle(config, (buildGradle) => {
        console.log('[Mindbox Plugin] withMindboxAndroid called with props:', props)
        const dependencies = props.androidPushProviders!.map(lib => `    ${ANDROID_CONSTANTS.IMPLEMENTATION} '${libraryMap[lib as MindboxPushProvider]}'`).join('\n');
        buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
            /(\s*)dependencies\s*\{/,
            `$1dependencies {\n${dependencies}`
        );
        return buildGradle;
    });
};

export const withMindboxAndroid: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    console.log('[Mindbox Plugin] withMindboxAndroid called with props:', props);
    config = addMindboxDependencies(config, props);
    if (props.androidPushProviders?.includes(MindboxPushProviders.Firebase)) {
        config = withFirebase(config, props);
    }
    if (props.androidPushProviders?.includes(MindboxPushProviders.Huawei)) {
        config = withHuawei(config, props);
    }
    return config;
};

const withFirebase: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    console.log('[Mindbox Plugin] withFirebase called with props:', props);
    config = withDangerousMod(config, ["android", async (modConfig) => {
        try {
            const projectRoot = modConfig.modRequest.projectRoot;
            const androidProjectRoot = modConfig.modRequest.platformProjectRoot;
            const targetFilePath = path.join(androidProjectRoot, "app", "google-services.json");

            if (!props.googleServicesFilePath) {
                console.warn('[Mindbox Plugin] googleServicesFilePath is not set. google-services.json will not be copied.');
                return modConfig;
            }

            const absoluteSource = path.resolve(projectRoot, props.googleServicesFilePath);
            if (!fs.existsSync(absoluteSource)) {
                console.warn(`[Mindbox Plugin] googleServicesFilePath not found: ${absoluteSource}`);
                return modConfig;
            }

            const sourceJson = fs.readFileSync(absoluteSource, { encoding: "utf8" });

            const targetDir = path.dirname(targetFilePath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            if (fs.existsSync(targetFilePath)) {
                const existing = fs.readFileSync(targetFilePath, { encoding: "utf8" });
                if (existing.trim() === sourceJson.trim()) {
                    console.log('[Mindbox Plugin] google-services.json already up to date.');
                    return modConfig;
                }
            }

            fs.writeFileSync(targetFilePath, sourceJson, { encoding: "utf8" });
            console.log('[Mindbox Plugin] google-services.json written to android/app.');
        } catch (e) {
            console.warn('[Mindbox Plugin] Failed to place google-services.json:', e);
        }
        return modConfig;
    }]);
    config = withProjectBuildGradle(config, (buildGradle) => {
        const googleServicesClasspath = ANDROID_CONSTANTS.GOOGLE_SERVICES_CLASSPATH;
        if (!buildGradle.modResults.contents.includes(ANDROID_CONSTANTS.GOOGLE_SERVICES_CLASSPATH_STRING)) {
            buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
                /(\s*)dependencies\s*\{/,
                `$1dependencies {\n${googleServicesClasspath}`
            );
        }
        return buildGradle;
    });

    config = withAppBuildGradle(config, (buildGradle) => {
        const applyPlugin = ANDROID_CONSTANTS.GOOGLE_SERVICES_PLUGIN;
        const pluginMarker = ANDROID_CONSTANTS.GOOGLE_SERVICES_PLUGIN_STRING;
        const contents = buildGradle.modResults.contents;
        if (!contents.includes(pluginMarker)) {
            const applyRegex = /^apply plugin:\s*["'][^"']+["'].*$/gm;
            const matches = [...contents.matchAll(applyRegex)];
            if (matches.length > 0) {
                const last = matches[matches.length - 1];
                const insertPos = (last.index ?? 0) + last[0].length;
                buildGradle.modResults.contents = `${contents.slice(0, insertPos)}\n${applyPlugin}\n${contents.slice(insertPos)}`;
            } else {
                buildGradle.modResults.contents = `${applyPlugin}\n${contents}`;
            }
        }
        return buildGradle;
    });

    return config;
};

const withHuawei: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    console.log('[Mindbox Plugin] withHuawei called with props:', props);
    config = withDangerousMod(config, ["android", async (modConfig) => {
        try {
            const projectRoot = modConfig.modRequest.projectRoot;
            const androidProjectRoot = modConfig.modRequest.platformProjectRoot;
            const targetFilePath = path.join(androidProjectRoot, "app", "agconnect-services.json");

            if (!props.huaweiServicesFilePath) {
                console.warn('[Mindbox Plugin] huaweiServicesFilePath is not set. agconnect-services.json will not be copied.');
                return modConfig;
            }

            const absoluteSource = path.resolve(projectRoot, props.huaweiServicesFilePath);
            if (!fs.existsSync(absoluteSource)) {
                console.warn(`[Mindbox Plugin] huaweiServicesFilePath not found: ${absoluteSource}`);
                return modConfig;
            }

            const sourceJson = fs.readFileSync(absoluteSource, { encoding: "utf8" });
            const targetDir = path.dirname(targetFilePath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            if (fs.existsSync(targetFilePath)) {
                const existing = fs.readFileSync(targetFilePath, { encoding: "utf8" });
                if (existing.trim() === sourceJson.trim()) {
                    console.log('[Mindbox Plugin] agconnect-services.json already up to date.');
                    return modConfig;
                }
            }

            fs.writeFileSync(targetFilePath, sourceJson, { encoding: "utf8" });
            console.log('[Mindbox Plugin] agconnect-services.json written to android/app.');
        } catch (e) {
            console.warn('[Mindbox Plugin] Failed to place agconnect-services.json:', e);
        }
        return modConfig;
    }]);

    // Fallback: ensure AndroidManifest contains Huawei appid meta-data if missing (Expo manifest API)
    config = withAndroidManifest(config, (manifestConfig) => {
        try {
            const androidProjectRoot = manifestConfig.modRequest.platformProjectRoot;
            // Resolve application package name from app/build.gradle
            const appBuildGradlePath = path.join(androidProjectRoot, "app", "build.gradle");
            let packageName: string | null = null;
            if (fs.existsSync(appBuildGradlePath)) {
                const gradle = fs.readFileSync(appBuildGradlePath, { encoding: "utf8" });
                const appIdMatch = gradle.match(/applicationId\s+['\"]([^'\"]+)['\"]/);
                if (appIdMatch) packageName = appIdMatch[1];
                if (!packageName) {
                    const nsMatch = gradle.match(/namespace\s+['\"]([^'\"]+)['\"]/);
                    if (nsMatch) packageName = nsMatch[1];
                }
            }
            if (!packageName) return manifestConfig;

            // Read app_id from agconnect-services.json in app/ for the resolved package
            const agcPath = path.join(androidProjectRoot, "app", "agconnect-services.json");
            if (!fs.existsSync(agcPath)) return manifestConfig;
            let appId: string | null = null;
            try {
                const json = JSON.parse(fs.readFileSync(agcPath, { encoding: "utf8" }));
                if (json?.client?.package_name === packageName && json?.client?.app_id) {
                    appId = String(json.client.app_id);
                }
                if (!appId && json?.app_info?.package_name === packageName && json?.app_info?.app_id) {
                    appId = String(json.app_info.app_id);
                }
                if (!appId && Array.isArray(json?.appInfos)) {
                    const matchItem = json.appInfos.find((it: any) => (
                        it?.package_name === packageName ||
                        it?.app_info?.package_name === packageName
                    ));
                    if (matchItem) {
                        if (matchItem?.client?.app_id) appId = String(matchItem.client.app_id);
                        else if (matchItem?.app_info?.app_id) appId = String(matchItem.app_info.app_id);
                    }
                }
            } catch {}
            if (!appId) return manifestConfig;

            const name = "com.huawei.hms.client.appid";
            const value = `appid=${appId}`;
            const mainApp = AndroidConfig.Manifest.getMainApplicationOrThrow(manifestConfig.modResults);
            AndroidConfig.Manifest.removeMetaDataItemFromMainApplication(mainApp, name);
            AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApp, name, value, "value");
            console.log('[Mindbox Plugin] Ensured Huawei appid meta-data in AndroidManifest.xml');
        } catch (e) {
            console.warn('[Mindbox Plugin] Failed to ensure Huawei appid meta-data via manifest mod:', e);
        }
        return manifestConfig;
    });

    config = withProjectBuildGradle(config, (buildGradle) => {
        const repoMarker = ANDROID_CONSTANTS.HUAWEI_MAVEN_URL;
        const agcpMarker = ANDROID_CONSTANTS.HUAWEI_AGCP_CLASSPATH_STRING;

        // Ensure Huawei Maven in allprojects.repositories
        const allprojectsReposRegex = /(allprojects\s*\{[\s\S]*?repositories\s*\{)([\s\S]*?)(\n\s*\})/m;
        const allprojectsReposMatch = buildGradle.modResults.contents.match(allprojectsReposRegex);
        if (allprojectsReposMatch && !allprojectsReposMatch[2].includes(repoMarker)) {
            buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
                allprojectsReposRegex,
                `$1$2\n${ANDROID_CONSTANTS.HUAWEI_MAVEN_REPO}$3`
            );
        }

        // Ensure Huawei Maven in buildscript.repositories
        const buildscriptReposRegex = /(buildscript\s*\{[\s\S]*?repositories\s*\{)([\s\S]*?)(\n\s*\})/m;
        const buildscriptReposMatch = buildGradle.modResults.contents.match(buildscriptReposRegex);
        if (buildscriptReposMatch && !buildscriptReposMatch[2].includes(repoMarker)) {
            buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
                buildscriptReposRegex,
                `$1$2\n${ANDROID_CONSTANTS.HUAWEI_MAVEN_REPO}$3`
            );
        }

        // Ensure AGCP classpath in buildscript.dependencies
        const buildscriptDepsRegex = /(buildscript[\s\S]*?dependencies\s*\{)([\s\S]*?)(\n\s*\})/m;
        const buildscriptDepsMatch = buildGradle.modResults.contents.match(buildscriptDepsRegex);
        if (buildscriptDepsMatch && !buildscriptDepsMatch[2].includes(agcpMarker)) {
            buildGradle.modResults.contents = buildGradle.modResults.contents.replace(
                buildscriptDepsRegex,
                `$1\n${ANDROID_CONSTANTS.HUAWEI_AGCP_CLASSPATH}$2$3`
            );
        }

        return buildGradle;
    });

    config = withAppBuildGradle(config, (buildGradle) => {
        const contents = buildGradle.modResults.contents;
        const pluginMarker = ANDROID_CONSTANTS.HUAWEI_PLUGIN_STRING;
        const pluginLine = ANDROID_CONSTANTS.HUAWEI_PLUGIN;
        if (contents.startsWith(`${pluginLine}\n`) || contents.startsWith(pluginLine)) {
            return buildGradle;
        }
        const hasPluginAnywhere = contents.includes(pluginMarker);
        if (!hasPluginAnywhere) {
            buildGradle.modResults.contents = `${pluginLine}\n${contents}`;
            return buildGradle;
        }
        const removedExisting = contents.replace(/^[\t ]*apply plugin:\s*['\"]com\.huawei\.agconnect['\"][\t ]*\n?/gm, "");
        buildGradle.modResults.contents = `${pluginLine}\n${removedExisting}`;
        return buildGradle;
    });

    return config;
};