export const addMavenRepository = (
    buildGradle: any,
    mavenUrl: string,
    mavenRepoConfig: string
): void => {
    let contents = buildGradle.modResults.contents;

    const buildscriptReposRegex = /(buildscript\s*\{[\s\S]*?repositories\s*\{)([\s\S]*?)(\n\s*\})/m;
    contents = contents.replace(buildscriptReposRegex, (_match: string, p1: string, p2: string, p3: string) => {
        if (p2.includes(mavenUrl)) {
            return `${p1}${p2}${p3}`;
        }
        return `${p1}${p2}\n${mavenRepoConfig}\n${p3}`;
    });

    const allprojectsReposRegex = /(allprojects\s*\{[\s\S]*?repositories\s*\{)([\s\S]*?)(\n\s*\})/m;
    contents = contents.replace(allprojectsReposRegex, (_match: string, p1: string, p2: string, p3: string) => {
        if (p2.includes(mavenUrl)) {
            return `${p1}${p2}${p3}`;
        }
        return `${p1}${p2}\n${mavenRepoConfig}\n${p3}`;
    });

    buildGradle.modResults.contents = contents;
};

export const addClasspathDependency = (
    buildGradle: any,
    classpathDependency: string,
    classpathMarker: string
): void => {
    const contents = buildGradle.modResults.contents;

    if (contents.includes(classpathMarker)) {
        return;
    }
    const buildscriptDepsRegex = /(buildscript[\s\S]*?dependencies\s*\{)([\s\S]*?)(\n\s*\})/m;
    const buildscriptDepsMatch = contents.match(buildscriptDepsRegex);

    if (buildscriptDepsMatch) {
        buildGradle.modResults.contents = contents.replace(
            buildscriptDepsRegex,
            `$1\n${classpathDependency}$2$3`
        );
    }
};

export const addPluginToGradle = (
    buildGradle: any,
    pluginLine: string,
    pluginMarker: string,
    insertAtTop: boolean = false
): void => {
    const contents = buildGradle.modResults.contents;
    if (contents.includes(pluginMarker)) {
        return;
    }
    if (contents.startsWith(`${pluginLine}\n`) || contents.startsWith(pluginLine)) {
        return;
    }
    if (insertAtTop) {
        buildGradle.modResults.contents = `${pluginLine}\n${contents}`;
    } else {
        const applyRegex = /^apply plugin:\s*["'][^"']+["'].*$/gm;
        const matches = [...contents.matchAll(applyRegex)];

        if (matches.length > 0) {
            const last = matches[matches.length - 1];
            const insertPos = (last.index ?? 0) + last[0].length;
            buildGradle.modResults.contents = `${contents.slice(0, insertPos)}\n${pluginLine}\n${contents.slice(insertPos)}`;
        } else {
            buildGradle.modResults.contents = `${pluginLine}\n${contents}`;
        }
    }
};
