import { ConfigPlugin } from "@expo/config-plugins";
import { MindboxPushProviders } from "./mindboxTypes";
import type { MindboxPluginProps } from "./mindboxTypes";
import { withFirebase } from "./android/withFirebase";
import { withHuawei } from "./android/withHuawei";
import { withRustore } from "./android/withRustore";
import { addMindboxDependencies } from "./android/withMindboxDependencies";
import { withResources } from "./android/withResources";
import { withExpoNotification } from "./android/withExpoNotification";

export const withMindboxAndroid: ConfigPlugin<MindboxPluginProps> = (config, props = {}) => {
    config = addMindboxDependencies(config, props);
    config = withResources(config, props);

    const providerHandlers = [
        {
            provider: MindboxPushProviders.Firebase,
            handler: withFirebase,
        },
        {
            provider: MindboxPushProviders.Huawei,
            handler: withHuawei,
        },
        {
            provider: MindboxPushProviders.Rustore,
            handler: withRustore,
        },
    ] as const;

    config = providerHandlers
        .filter(({ provider }) => props.androidPushProviders?.includes(provider))
        .reduce((acc, { handler }) => handler(acc, props), config);
    
    config = withExpoNotification(config, props);

    return config;
};
