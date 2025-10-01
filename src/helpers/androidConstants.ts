const VERSIONS = {
    GOOGLE_SERVICES: "4.4.0",
} as const;


export const ANDROID_CONSTANTS = {
    IMPLEMENTATION: "implementation",
    GOOGLE_SERVICES_CLASSPATH_STRING: "com.google.gms:google-services",
    GOOGLE_SERVICES_CLASSPATH: `   classpath "com.google.gms:google-services:${VERSIONS.GOOGLE_SERVICES}"`,
    GOOGLE_SERVICES_PLUGIN_STRING: "com.google.gms.google-services",
    GOOGLE_SERVICES_PLUGIN: "apply plugin: 'com.google.gms.google-services'",
} as const;