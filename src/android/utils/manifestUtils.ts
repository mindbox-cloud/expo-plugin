import { AndroidConfig } from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";
import { REGEX_CAPTURE_GROUPS } from "../../helpers/androidConstants";

export const extractPackageName = (buildGradlePath: string): string | null => {
    if (!fs.existsSync(buildGradlePath)) {
        return null;
    }
    const gradle = fs.readFileSync(buildGradlePath, { encoding: "utf8" });
    const appIdMatch = gradle.match(/applicationId\s+['"]([^'"]+)['"]/);
    if (appIdMatch) {
        return appIdMatch[REGEX_CAPTURE_GROUPS.FIRST];
    }
    const nsMatch = gradle.match(/namespace\s+['"]([^'"]+)['"]/);
    if (nsMatch) {
        return nsMatch[REGEX_CAPTURE_GROUPS.FIRST];
    }

    return null;
};

export const extractAppIdFromAgc = (agcPath: string, packageName: string): string | null => {
    if (!fs.existsSync(agcPath)) {
        return null;
    }
    try {
        const json = JSON.parse(fs.readFileSync(agcPath, { encoding: "utf8" }));

        if (json?.client?.package_name === packageName && json?.client?.app_id) {
            return String(json.client.app_id);
        }

        if (json?.app_info?.package_name === packageName && json?.app_info?.app_id) {
            return String(json.app_info.app_id);
        }

        if (Array.isArray(json?.appInfos)) {
            const matchItem = json.appInfos.find((it: any) => (
                it?.package_name === packageName ||
                it?.app_info?.package_name === packageName
            ));
            if (matchItem) {
                if (matchItem?.client?.app_id) return String(matchItem.client.app_id);
                else if (matchItem?.app_info?.app_id) return String(matchItem.app_info.app_id);
            }
        }
        return null;
    } catch {
        return null;
    }
};

export const addManifestMetaData = (
    manifestConfig: any,
    name: string,
    value: string,
    valueType: "value" | "resource" = "value"
): any => {
    try {
        const mainApp = AndroidConfig.Manifest.getMainApplicationOrThrow(manifestConfig.modResults);
        AndroidConfig.Manifest.removeMetaDataItemFromMainApplication(mainApp, name);
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApp, name, value, valueType);
        return manifestConfig;
    } catch (error) {
        throw new Error(`Failed to add meta-data ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
};
