// Share a captured card image via the system share sheet.
// react-native-view-shot turns the card View into a 1080×1080 PNG;
// expo-sharing opens the system share sheet with the image attached.
// On platforms that can't share an image, we fall back to opening the
// X (Twitter) web intent with text only.

import { Linking, Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export async function captureCardPng(view: View | number): Promise<string> {
  return await captureRef(view, {
    format: 'png',
    quality: 1,
    // Slightly upscale to land near 1080-wide for shareable resolution.
    result: 'tmpfile',
  });
}

export async function shareCardImage(
  view: View | number | null,
  text: string
): Promise<{ shared: boolean; via: 'image' | 'intent' | 'none' }> {
  // Try image share first.
  if (view) {
    try {
      const uri = await captureCardPng(view);
      const can = await Sharing.isAvailableAsync();
      if (can) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your WRAP card',
          UTI: 'public.png',
        });
        return { shared: true, via: 'image' };
      }
    } catch {
      // fall through to intent
    }
  }
  // Fallback: text-only X intent.
  try {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      await Linking.openURL(url);
      return { shared: true, via: 'intent' };
    }
  } catch {
    // ignore
  }
  return { shared: false, via: 'none' };
}

export function buildShareText(personality: string, line: string): string {
  // Compose tweet body: confident voice carries through.
  return `I'm a ${personality} on Solana. ${line} — wrap.app`;
}

export function platformShareSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
