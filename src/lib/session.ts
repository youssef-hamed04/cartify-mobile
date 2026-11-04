import * as SecureStore from 'expo-secure-store';

// JWT and guest session id live in the device keychain/keystore, cached in memory for requests.
const TOKEN_KEY = 'cartify.token';
const SESSION_KEY = 'cartify.sessionId';
const ONBOARDED_KEY = 'cartify.onboarded';

let token: string | null = null;
let sessionId: string | null = null;

export const session = {
  async load() {
    [token, sessionId] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(SESSION_KEY),
    ]);
  },
  getToken: () => token,
  getSessionId: () => sessionId,
  async setToken(value: string | null) {
    token = value;
    if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
  async setSessionId(value: string | null) {
    if (value === sessionId) return;
    sessionId = value;
    if (value) await SecureStore.setItemAsync(SESSION_KEY, value);
    else await SecureStore.deleteItemAsync(SESSION_KEY);
  },
  async hasOnboarded() {
    return (await SecureStore.getItemAsync(ONBOARDED_KEY)) === '1';
  },
  async setOnboarded() {
    await SecureStore.setItemAsync(ONBOARDED_KEY, '1');
  },
};
