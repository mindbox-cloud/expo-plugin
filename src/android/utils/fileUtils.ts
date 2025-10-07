import * as fs from "fs";
import * as path from "path";

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
                console.log(`[Mindbox Plugin] ${fileName} already up to date.`);
                return;
            }
        }
        fs.writeFileSync(targetPath, sourceJson, { encoding: "utf8" });
        console.log(`[Mindbox Plugin] ${fileName} written successfully.`);

    } catch (error) {
        throw new Error(`Failed to copy ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    }
};

