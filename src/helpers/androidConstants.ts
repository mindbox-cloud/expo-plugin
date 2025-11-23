const VERSIONS = {
    GOOGLE_SERVICES: "4.4.0",
    HUAWEI_AGCP: "1.9.1.300",
    HUAWEI_PUSH: "6.11.0.300",
    WORK_RUNTIME_KTX: "2.8.1",
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
    HUAWEI_APP_ID_META_DATA_NAME: "com.huawei.hms.client.appid",
    RUSTORE_MAVEN_URL: "https://artifactory-external.vkpartner.ru/artifactory/maven",
    RUSTORE_MAVEN_REPO: "    maven { url = uri(\"https://artifactory-external.vkpartner.ru/artifactory/maven\") }",
    RUSTORE_PROJECT_ID_META_DATA_NAME: "ru.rustore.sdk.pushclient.project_id",
    WORK_RUNTIME_KTX_VERSION: VERSIONS.WORK_RUNTIME_KTX,
} as const;


export const REGEX_CAPTURE_GROUPS = {
    FIRST: 1,
} as const;