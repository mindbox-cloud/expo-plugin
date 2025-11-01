import * as fs from "fs";
import * as path from "path";
import { logSuccess } from "../../utils/errorUtils";

export const copyServiceJsonFile = async (
    sourcePath: string,
    targetPath: string,
    fileName: string
): Promise<void> => {
    try {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source file not found: ${sourcePath}`);
        }

        const sourceJson = fs.readFileSync(sourcePath, { encoding: "utf8" });

        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        if (fs.existsSync(targetPath)) {
            const existing = fs.readFileSync(targetPath, { encoding: "utf8" });
            if (existing.trim() === sourceJson.trim()) {
                logSuccess(`check ${fileName}`, { status: "already up to date" });
                return;
            }
        }
        fs.writeFileSync(targetPath, sourceJson, { encoding: "utf8" });
        logSuccess(`write ${fileName}`);

    } catch (error) {
        throw new Error(`Failed to copy ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const copyKotlinFile = async (
    sourcePath: string,
    targetPath: string,
    fileName: string
): Promise<void> => {
    try {
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source file not found: ${sourcePath}`);
        }
        const sourceContent = fs.readFileSync(sourcePath, { encoding: "utf8" });
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        if (fs.existsSync(targetPath)) {
            const existing = fs.readFileSync(targetPath, { encoding: "utf8" });
            if (existing.trim() === sourceContent.trim()) {
                logSuccess(`check ${fileName}`, { status: "already up to date" });
                return;
            }
        }
        fs.writeFileSync(targetPath, sourceContent, { encoding: "utf8" });
        logSuccess(`write ${fileName}`);

    } catch (error) {
        throw new Error(`Failed to copy ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
};



