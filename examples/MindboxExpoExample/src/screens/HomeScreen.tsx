import React, { useEffect, useCallback, useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    Button,
    Platform,
} from "react-native";
import MindboxSdk, { LogLevel } from "mindbox-sdk";
import { sendAsync, sendSync } from "../utils/MindboxOperations";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// used with expo-notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

function handleRegistrationError(errorMessage: string): never {
    alert(errorMessage);
    throw new Error(errorMessage);
}

// used with expo-notifications
async function registerForPushNotificationsAsync(): Promise<
    string | undefined
> {
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    // request permission
    const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus == "granted") {
        MindboxSdk.updateNotificationPermissionStatus(true);
    }

    // used with expo-notifications
    const projectId =
        (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
        (Constants as any)?.easConfig?.projectId;
    if (!projectId) {
        handleRegistrationError("Project ID not found");
    }
    try {
        const pushTokenString = (
            await Notifications.getExpoPushTokenAsync({
                projectId,
            })
        ).data;
        const token = await Notifications.getDevicePushTokenAsync();
        console.log("Native token:", token);
        console.log("Expo Token is " + pushTokenString);

        return pushTokenString;
    } catch (e: unknown) {
        handleRegistrationError(`${e}`);
    }
}
const configuration = {
    domain: "api.mindbox.ru",
    endpointId: Platform.OS === "ios" ? "" : "Mpush-test.AndroidExpo",
    subscribeCustomerIfCreated: true,
    shouldCreateCustomer: true,
};

export default function HomeScreen(): JSX.Element {
    const [deviceUUID, setDeviceUUID] = useState("Empty");
    const [token, setToken] = useState("Empty");
    const [sdkVersion, setSdkVersion] = useState("Empty");
    const [expoPushToken, setExpoPushToken] = useState("");
    const [notification, setNotification] = useState<
        Notifications.Notification | undefined
    >(undefined);
    const [pushData, setPushData] = useState({
        pushUrl: null,
        pushPayload: null,
    });

    const appInitializationCallback = useCallback(async () => {
        try {
            await MindboxSdk.initialize(configuration);
        } catch (error) {
            console.log(error);
        }
    }, []);

    useEffect(() => {
        appInitializationCallback();
        MindboxSdk.setLogLevel(LogLevel.DEBUG);
        MindboxSdk.getDeviceUUID(setDeviceUUID);
        MindboxSdk.getTokens(setToken);
        MindboxSdk.getSdkVersion((version: string) => {
            setSdkVersion(version);
        });

        // Expo-notification: Check whether a notification was opened at app launch (when the app was killed
        try {
            const response = Notifications.getLastNotificationResponse();
            if (response) {
                const identifier = response.notification.request.identifier;
                if (identifier === null) {
                    console.log(
                        "App opened from Mindbox notification (when app was killed)",
                    );
                    return;
                }
            }
            console.log(
                "App opened from expo notification (when app was killed)",
            );
        } catch (error) {
            console.log("Error getting last notification response:", error);
        }
    }, [appInitializationCallback]);

    // used with expo-notifications
    useEffect(() => {
        registerForPushNotificationsAsync()
            .then((tokenValue) => setExpoPushToken(tokenValue ?? ""))
            .catch((error: unknown) => setExpoPushToken(`${error}`));

        const notificationListener =
            Notifications.addNotificationReceivedListener((value) => {
                console.log("addNotificationReceivedListener");
                setNotification(value);
            });

        const responseListener =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    const identifier = response.notification.request.identifier;
                    if (identifier === null) {
                        console.log(
                            "Skipping Mindbox notification (identifier is null)",
                        );
                        return;
                    } else {
                        console.log("Click on expo-notification");
                    }
                },
            );

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, []);

    const getPushData = useCallback(
        (pushUrl: String | null, pushPayload: String | null) => {
            console.log("MindboxSdk.onPushClickReceived called!", {
                pushUrl,
                pushPayload,
            });
            setTimeout(() => {
                // https://developers.mindbox.ru/docs/flutter-push-navigation-react-native
                setPushData({ pushUrl, pushPayload });
            }, 600);
        },
        [],
    );

    useEffect(() => {
        // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#onpushclickreceived
        MindboxSdk.onPushClickReceived(getPushData);
    }, [getPushData]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.textContainer}>
                <Text style={styles.text}>{`Mindbox expo example`}</Text>
                <Text style={styles.text}>{`Device UUID: ${deviceUUID}`}</Text>
                <Text style={styles.text}>{`Token: ${token}`}</Text>
                <Text style={styles.text}>{`SdkVersion: ${sdkVersion}`}</Text>
                <Text
                    style={styles.text}
                >{`Push URL: ${pushData.pushUrl ?? "Empty"}`}</Text>
                <Text
                    style={styles.text}
                    selectable
                    numberOfLines={10}
                >{`Push Payload: ${pushData.pushPayload ?? "Empty"}`}</Text>
                <Text
                    style={styles.text}
                >{`Expo push token: ${expoPushToken}`}</Text>
                <Text
                    style={styles.text}
                >{`Expo notification title: ${notification?.request.content.title ?? ""}`}</Text>
                <Text
                    style={styles.text}
                >{`Expo notification body: ${notification?.request.content.body ?? ""}`}</Text>
                <Text
                    style={styles.text}
                    selectable
                    numberOfLines={10}
                >{`Notification data: ${notification ? JSON.stringify(notification.request.content.data) : ""}`}</Text>
            </View>
            <View style={styles.buttonsContainer}>
                <Button title="Send Async" onPress={sendAsync} />
                <View style={styles.buttonSpacing} />
                <Button title="Send Sync" onPress={sendSync} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    textContainer: {
        alignItems: "flex-start",
    },
    buttonsContainer: {
        marginTop: 20,
        width: "80%",
    },
    buttonSpacing: {
        height: 10,
    },
    text: {
        fontSize: 16,
        marginVertical: 5,
    },
});
