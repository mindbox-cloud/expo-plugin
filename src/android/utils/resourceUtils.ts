import * as fs from "fs";
import * as path from "path";
import { withErrorHandling, logWarning } from "../../utils/errorUtils";

const VALUES_DIR_NAME = "values";
const STRINGS_FILE_NAME = "strings.xml";
const COLORS_FILE_NAME = "colors.xml";
const DRAWABLE_DIR_NAME = "drawable";
const DRAWABLE_ICON_NAME = "mindbox_notification_small_icon";

type ChannelValues = {
    androidChannelId?: string;
    androidChannelName?: string;
    androidChannelDescription?: string;
};

export const getAndroidResDir = (androidProjectRoot: string): string => {
    return path.join(androidProjectRoot, "app", "src", "main", "res");
};

const ensureDir = (dir: string): void => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const escapeXml = (value: string): string => {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
};

const ensureResourceFile = (filePath: string): void => {
    const dir = path.dirname(filePath);
    ensureDir(dir);
    if (!fs.existsSync(filePath)) {
        const content = [
            `<?xml version="1.0" encoding="utf-8"?>`,
            `<resources>`,
            `</resources>`,
            ``
        ].join("\n");
        fs.writeFileSync(filePath, content, { encoding: "utf8" });
    }
};

const upsertResourceLines = (filePath: string, lines: string[]): void => {
    ensureResourceFile(filePath);
    const original = fs.readFileSync(filePath, { encoding: "utf8" });
    const resourceNames = lines.map((line) => {
        const match = line.match(/name=\"([^\"]+)\"/);
        return match ? match[1] : null;
    }).filter(Boolean) as string[];

    const filtered = original
        .split("\n")
        .filter((line) => {
            if (!line.includes("name=")) return true;
            const match = line.match(/name=\"([^\"]+)\"/);
            if (!match) return true;
            return !resourceNames.includes(match[1]);
        });

    const closingIndex = filtered.findIndex((l) => l.trim() === "</resources>");
    if (closingIndex === -1) {
        const content = [
            `<?xml version="1.0" encoding="utf-8"?>`,
            `<resources>`,
            ...lines,
            `</resources>`,
            ``
        ].join("\n");
        fs.writeFileSync(filePath, content, { encoding: "utf8" });
        return;
    }

    const updated = [
        ...filtered.slice(0, closingIndex),
        ...lines,
        ...filtered.slice(closingIndex),
    ].join("\n");
    if (lines.length > 0 || updated.trim() !== original.trim()) {
        fs.writeFileSync(filePath, updated, { encoding: "utf8" });
    }
};

export const writeMindboxStringsResources = async (
    androidProjectRoot: string,
    values: ChannelValues
): Promise<boolean> => {
    const { androidChannelId, androidChannelName, androidChannelDescription } = values;
    const entries: string[] = [];
    if (androidChannelId) entries.push(`    <string name="mindbox_default_channel_id">${escapeXml(androidChannelId)}</string>`);
    if (androidChannelName) entries.push(`    <string name="mindbox_default_channel_name">${escapeXml(androidChannelName)}</string>`);
    if (androidChannelDescription) entries.push(`    <string name="mindbox_default_channel_description">${escapeXml(androidChannelDescription)}</string>`);

    if (entries.length === 0) {
        logWarning("write strings.xml", "no string values provided, skipping update");
        return false;
    }

    const resDir = getAndroidResDir(androidProjectRoot);
    const stringsPath = path.join(resDir, VALUES_DIR_NAME, STRINGS_FILE_NAME);
    await withErrorHandling("write strings.xml", async () => {
        upsertResourceLines(stringsPath, entries);
    }, { path: stringsPath });
    return true;
};

export const writeMindboxColorResource = async (
    androidProjectRoot: string,
    iconColor?: string
): Promise<boolean> => {
    if (!iconColor) {
        logWarning("write colors.xml", "no color provided, skipping update");
        return false;
    }
    const entry = `    <color name=\"mindbox_default_notification_color\">${escapeXml(iconColor)}</color>`;

    const resDir = getAndroidResDir(androidProjectRoot);
    const colorsPath = path.join(resDir, VALUES_DIR_NAME, COLORS_FILE_NAME);
    await withErrorHandling("write colors.xml", async () => {
        upsertResourceLines(colorsPath, [entry]);
    }, { path: colorsPath });
    return true;
};

const validateIconExtension = (ext: string): void => {
    const allowed = [".png", ".xml"];
    if (!allowed.includes(ext)) {
        throw new Error(`Unsupported icon extension: ${ext}. Use .png or .xml`);
    }
};

export type CopyIconResult = {
    resourceName: string;
    resourceRef: string;
} | null;

export const copyNotificationIcon = async (
    projectRoot: string,
    androidProjectRoot: string,
    sourceRelativePath?: string
): Promise<CopyIconResult> => {
    if (!sourceRelativePath) {
        logWarning("copy notification icon", "no source path provided, skipping update");
        return null;
    }

    const sourcePath = path.resolve(projectRoot, sourceRelativePath);
    if (!fs.existsSync(sourcePath)) {
        logWarning("copy notification icon", `Icon file not found: ${sourcePath}`);
        return null;
    }

    const ext = path.extname(sourcePath).toLowerCase();
    validateIconExtension(ext);

    const resDir = getAndroidResDir(androidProjectRoot);
    const drawableDir = path.join(resDir, DRAWABLE_DIR_NAME);
    ensureDir(drawableDir);

    const destPath = path.join(drawableDir, `${DRAWABLE_ICON_NAME}${ext}`);

    const copyResult = await withErrorHandling("copy notification icon", async () => {
        const src = fs.readFileSync(sourcePath);
        const prev = fs.existsSync(destPath) ? fs.readFileSync(destPath) : null;
        if (prev && Buffer.compare(prev, src) === 0) {
            return;
        }
        fs.writeFileSync(destPath, src);
    }, { sourcePath, destPath });

    if (copyResult === null) {
        logWarning("copy notification icon", "failed to copy icon");
        return null;
    }

    return {
        resourceName: DRAWABLE_ICON_NAME,
        resourceRef: `@drawable/${DRAWABLE_ICON_NAME}`,
    };
};
