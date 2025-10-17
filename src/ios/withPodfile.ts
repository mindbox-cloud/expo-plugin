import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import * as fs from "fs";
import * as path from "path";
import { POD_MINDBOX_LINE, POD_MINDBOX_LOGGER_LINE, POD_MINDBOX_COMMON_LINE, POD_MINDBOX_NOTIFICATIONS_LINE, PODFILE_ANCHOR_PREPARE_RN, IOS_TARGET_NSE_NAME } from "../helpers/iosConstants";
import { logSuccess } from "../utils/errorUtils";

const withMindboxPodfile: ConfigPlugin<MindboxPluginProps> = (config) => {
    return withDangerousMod(config, [
        "ios",
        async (c) => {
            const podfilePath = path.join(c.modRequest.platformProjectRoot, "Podfile");
            if (!fs.existsSync(podfilePath)) return c;
            const source = fs.readFileSync(podfilePath, "utf8");
            const updated = insertMindboxPods(insertMindboxNotificationsTarget(source));
            if (updated !== source) {
                fs.writeFileSync(podfilePath, updated, "utf8");
                logSuccess("configure Podfile for Mindbox");
            }
            return c;
        },
    ]);
};

export default withMindboxPodfile;

function insertMindboxPods(podfile: string): string {
    if (podfile.includes(POD_MINDBOX_LINE) || podfile.includes("pod 'Mindbox',")) return podfile;

    const prepareIndex = podfile.indexOf(PODFILE_ANCHOR_PREPARE_RN);
    if (prepareIndex === -1) return podfile;

    const targetRegex = /^target\s+'[^']+'\s+do\s*\n/m;
    const afterPrepare = podfile.slice(prepareIndex);
    const targetMatch = afterPrepare.match(targetRegex);
    if (!targetMatch) return podfile;
    
    const targetIdx = prepareIndex + afterPrepare.search(targetRegex);
    const targetLineEnd = targetIdx + targetMatch[0].length;

    const useExpoModulesRegex = /^\s*use_expo_modules!\s*$/m;
    const targetBlock = podfile.slice(targetLineEnd);
    const useExpoMatch = targetBlock.match(useExpoModulesRegex);
    
    if (useExpoMatch) {
        const useExpoIdx = targetLineEnd + targetBlock.search(useExpoModulesRegex);
        const useExpoLineEnd = podfile.indexOf("\n", useExpoIdx) + 1;
        const insertion = `    ${POD_MINDBOX_LINE}\n    ${POD_MINDBOX_LOGGER_LINE}\n    ${POD_MINDBOX_COMMON_LINE}\n`;
        logSuccess("add Mindbox pods to main target after use_expo_modules!");
        return podfile.slice(0, useExpoLineEnd) + insertion + podfile.slice(useExpoLineEnd);
    } else {
        const insertion = `  use_expo_modules!\n    ${POD_MINDBOX_LINE}\n    ${POD_MINDBOX_LOGGER_LINE}\n    ${POD_MINDBOX_COMMON_LINE}\n`;
        logSuccess("add Mindbox pods to main target");
        return podfile.slice(0, targetLineEnd) + insertion + podfile.slice(targetLineEnd);
    }
}

function insertMindboxNotificationsTarget(podfile: string): string {
    const targetHeader = `target '${IOS_TARGET_NSE_NAME}' do`;
    if (podfile.includes(targetHeader)) return podfile;

    const headerLineRegex = /^target\s+'[^']+'\s+do\s*\n/m;
    const headerMatch = podfile.match(headerLineRegex);
    if (!headerMatch) return podfile;
    const headerIdx = podfile.search(headerLineRegex);
    if (headerIdx === -1) return podfile;

    const insertion = `target '${IOS_TARGET_NSE_NAME}' do\n  ${POD_MINDBOX_NOTIFICATIONS_LINE}\nend\n\n`;
    logSuccess("add NSE target to Podfile as separate target");
    return podfile.slice(0, headerIdx) + insertion + podfile.slice(headerIdx);
}


