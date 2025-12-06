import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  console.log('=== useGoogleAuth Hook Called ===');
  console.log('Platform:', Platform.OS);
  
  // Generate the correct redirect URI
  const redirectUri = makeRedirectUri({
    scheme: 'ooterfrontend', // Must match app.json exactly
    path: 'oauthredirect'
  });

  // Use platform-specific client IDs for release
  const getClientId = () => {
    if (Platform.OS === 'android') {
      console.log('📱 Using Android client ID');
      return '1040218011092-hot3noidimvfpdstmkqmdl5ju3o693l5.apps.googleusercontent.com';
    } else if (Platform.OS === 'ios') {
      console.log('🍎 Using iOS client ID');
      return '1040218011092-729p9qjrmi8amnu20b32a4ua7glrrkns.apps.googleusercontent.com';
    }
    // Fallback for web/development
    console.log('🌐 Using web/development client ID');
    return '1040218011092-3rgfvedrl6fge5dshhm7qmumt0fupnob.apps.googleusercontent.com';
  };

  const clientId = getClientId();
  
  console.log('🔑 Client ID:', clientId);
  console.log('🔗 Redirect URI:', redirectUri);
  console.log('�� Scopes:', ['openid', 'profile', 'email']);
  console.log('⚙️ Extra params:', { prompt: 'select_account', access_type: 'offline' });

  const authRequest = Google.useAuthRequest({
    clientId: clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    extraParams: {
      prompt: 'select_account',
      access_type: 'offline'
    }
  });

  console.log('🔧 Auth request result:', {
    request: authRequest[0],
    response: authRequest[1],
    promptAsync: typeof authRequest[2]
  });

  return authRequest;
}