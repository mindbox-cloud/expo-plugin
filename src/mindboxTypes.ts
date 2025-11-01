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
    androidChannelId?: string;
    androidChannelName?: string;
    androidChannelDescription?: string;
    smallIcon?: string;
    smallIconAccentColor?: string;
    iosMode?: "development" | "production";
    iosDevTeam?: string;
    iosDeploymentTarget?: string;
    iosNseFilePath?: string;
    iosNceFilePath?: string;
    iosAppGroupId?: string;
    nativeRequestPermission?: boolean;
    usedExpoNotification?: boolean
};


