import React, { useEffect, useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Button, Platform } from 'react-native';
import MindboxSdk, { LogLevel } from 'mindbox-sdk';
import { requestNotificationPermission } from '../utils/RequestPermission';
import { sendAsync, sendSync } from '../utils/MindboxOperations';

const configuration = {
  domain: 'api.mindbox.ru',
  endpointId: Platform.OS === 'ios' ? '' : 'Mpush-test.AndroidExpo',
  subscribeCustomerIfCreated: true,
  shouldCreateCustomer: true,
};

export default function HomeScreen(): JSX.Element {
  const [deviceUUID, setDeviceUUID] = useState('Empty');
  const [token, setToken] = useState('Empty');
  const [sdkVersion, setSdkVersion] = useState('Empty');
  const [pushData, setPushData] = useState({
    pushUrl: null,
    pushPayload: null,
  })
  

  const appInitializationCallback = useCallback(async () => {
    try {
      await MindboxSdk.initialize(configuration);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
    appInitializationCallback();
    MindboxSdk.setLogLevel(LogLevel.DEBUG);
    MindboxSdk.getDeviceUUID(setDeviceUUID);
    MindboxSdk.getTokens(setToken);
    MindboxSdk.getSdkVersion((version: string) => {
      setSdkVersion(version);
    });
  }, [appInitializationCallback]);

  const getPushData = useCallback(
    (pushUrl: String | null, pushPayload: String | null) => {
      setTimeout(() => {
        // https://developers.mindbox.ru/docs/flutter-push-navigation-react-native
        setPushData({ pushUrl, pushPayload })
      }, 600)
    },
    []
  )

  useEffect(() => {
    // https://developers.mindbox.ru/docs/%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-react-natice-sdk#onpushclickreceived
    MindboxSdk.onPushClickReceived(getPushData)
  }, [getPushData])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
       <Text style={styles.text}>{`Mindbox expo example`}</Text>
        <Text style={styles.text}>{`Device UUID: ${deviceUUID}`}</Text>
        <Text style={styles.text}>{`Token: ${token}`}</Text>
        <Text style={styles.text}>{`SdkVersion: ${sdkVersion}`}</Text>
        <Text style={styles.text}>{`Push URL: ${pushData.pushUrl ?? 'Empty'}`}</Text>
        <Text style={styles.text} selectable numberOfLines={10}>{`Push Payload: ${pushData.pushPayload ?? 'Empty'}`}</Text>
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
    justifyContent: 'center',
    alignItems: 'center'
  },
  textContainer: {
    alignItems: 'flex-start'
  },
  buttonsContainer: {
    marginTop: 20,
    width: '80%'
  },
  buttonSpacing: {
    height: 10
  },
  text: {
    fontSize: 16,
    marginVertical: 5
  }
});

