# Android Studio Setup — WRAP sprint

## Install 2026-04-30

- **Method:** `brew install --cask android-studio`
- **Brew cask version:** `2025.3.4.6,panda4` (auto_updates)
- **App path:** `/Applications/Android Studio.app`
- **Install duration:** 3m 5s real (32s user, 11s sys)
- **Disk used by cask:** 3.3GB (`/opt/homebrew/Caskroom/android-studio/2025.3.4.6,panda4`)
- **PATH entries appended to ~/.zshrc:** yes (new — no prior entries found)
  ```sh
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
  ```
- **SDK location (created on first launch):** `~/Library/Android/sdk`
- **Status:** ready for human to launch + complete setup wizard

## Next steps (human, GUI work)

1. Launch Android Studio from `/Applications/` (or Spotlight → "Android Studio")
2. "Import Settings" → choose "Do not import settings"
3. Setup wizard:
   - Welcome → Next
   - Install Type → **Standard** → Next
   - UI Theme → either
   - Verify Settings → Next
   - License Agreement → click each item → Accept all → Finish
4. SDK + Platform Tools download (~5-10 min, ~3GB)
5. Click Finish when enabled

After wizard completes, verify CLI tools work in a NEW terminal:
```sh
adb --version
emulator -version
```

## Notes

- Brew warnings: 12 outdated formulae + 1 outdated cask (codexbar) — unrelated, skip
- No errors during install
- Phase 2 (AVD creation + Phantom install) is a separate run after wizard verified
