import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import type { MindboxPluginProps } from "../mindboxTypes";
import * as fs from "fs";
import * as path from "path";
import { POD_MINDBOX_LINE, POD_MINDBOX_LOGGER_LINE, POD_MINDBOX_COMMON_LINE, PODFILE_ANCHOR_PREPARE_RN } from "../helpers/iosConstants";
import { logSuccess } from "../utils/errorUtils";

const withMindboxPodfile: ConfigPlugin<MindboxPluginProps> = (config) => {
    return withDangerousMod(config, [
        "ios",
        async (c) => {
            const podfilePath = path.join(c.modRequest.platformProjectRoot, "Podfile");
            if (!fs.existsSync(podfilePath)) return c;
            const source = fs.readFileSync(podfilePath, "utf8");
            const updated = insertMindboxPods(source);
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
    const anchorIndex = podfile.indexOf(PODFILE_ANCHOR_PREPARE_RN);
    if (anchorIndex === -1) return podfile;
    const afterAnchorIndex = podfile.indexOf("\n", anchorIndex);
    if (afterAnchorIndex === -1) return podfile;
    const insertion = `\n${POD_MINDBOX_LINE}\n${POD_MINDBOX_LOGGER_LINE}\n${POD_MINDBOX_COMMON_LINE}\n`;
    logSuccess("add Mindbox pods to Podfile");
    return podfile.slice(0, afterAnchorIndex + 1) + insertion + podfile.slice(afterAnchorIndex + 1);
}


