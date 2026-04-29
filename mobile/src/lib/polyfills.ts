// Must be imported once at app entry, before any @solana/web3.js call.
// React Native lacks Buffer and crypto.getRandomValues — both are required
// by web3.js and the MWA web3.js plugin.

import 'react-native-get-random-values';
import { Buffer } from 'buffer';

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}
