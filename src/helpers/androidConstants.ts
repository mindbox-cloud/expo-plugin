const VERSIONS = {
    GOOGLE_SERVICES: "4.4.0",
    HUAWEI_AGCP: "1.9.1.300",
    HUAWEI_PUSH: "6.11.0.300",
} as const;


export const ANDROID_CONSTANTS = {
    IMPLEMENTATION: "implementation",
    GOOGLE_SERVICES_CLASSPATH_STRING: "com.google.gms:google-services",
    GOOGLE_SERVICES_CLASSPATH: `    classpath "com.google.gms:google-services:${VERSIONS.GOOGLE_SERVICES}"`,
    GOOGLE_SERVICES_PLUGIN_STRING: "com.google.gms.google-services",
    GOOGLE_SERVICES_PLUGIN: "apply plugin: 'com.google.gms.google-services'",
    HUAWEI_MAVEN_URL: "https://developer.huawei.com/repo/",
    HUAWEI_MAVEN_REPO: "    maven { url 'https://developer.huawei.com/repo/' }",
    HUAWEI_AGCP_CLASSPATH_STRING: "com.huawei.agconnect:agcp",
    HUAWEI_AGCP_CLASSPATH: `    classpath 'com.huawei.agconnect:agcp:${VERSIONS.HUAWEI_AGCP}'`,
    HUAWEI_PLUGIN_STRING: "com.huawei.agconnect",
    HUAWEI_PLUGIN: "apply plugin: 'com.huawei.agconnect'",
} as const;