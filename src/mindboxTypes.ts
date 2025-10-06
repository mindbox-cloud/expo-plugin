export const MindboxPushProviders = {
    Firebase: "firebase",
    Huawei: "huawei",
    Rustore: "rustore",
} as const;

export type MindboxPushProvider = typeof MindboxPushProviders[keyof typeof MindboxPushProviders];

export type MindboxPluginProps = {
    androidPushProviders?: MindboxPushProvider[];
    googleServicesFilePath?: string;
    huaweiServicesFilePath?: string;
    rustoreProjectId?: string;
};


