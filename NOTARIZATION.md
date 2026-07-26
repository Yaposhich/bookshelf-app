# Підпис і нотаризація macOS

Апка збирається у двох режимах — вибір автоматичний, залежно від змінних середовища.

## Зараз (безкоштовно, ad-hoc)

Нічого робити не треба. `npm run release` збирає апку з **ad-hoc-підписом**
(`scripts/afterPack.js`). Друзям достатньо один раз відкрити через
**правий клік → Open** (без термінала).

## Коли купиш Apple Developer ($99/рік) — повна нотаризація

Тоді апка відкриватиметься звичайним подвійним кліком **без жодних попереджень**.
Правити код/конфіг не треба — просто задай 5 змінних середовища перед релізом.

### 1. Отримай сертифікат «Developer ID Application»

- Зайди в [developer.apple.com](https://developer.apple.com/account) → Certificates
- Створи **Developer ID Application** сертифікат
- Завантаж його, відкрий (додасться в Keychain), потім експортуй у `.p12`:
  Keychain Access → правий клік по сертифікату → Export → формат `.p12` → задай пароль

### 2. Створи app-specific password

- [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security →
  App-Specific Passwords → згенеруй новий (напр. назви «bookshelf-notarize»)

### 3. Дізнайся Team ID

- [developer.apple.com/account](https://developer.apple.com/account) → Membership →
  **Team ID** (10 символів, напр. `A1B2C3D4E5`)

### 4. Задай змінні й релізь

```bash
cd ~/bookshelf-app

export GH_TOKEN=твій_github_токен

export CSC_LINK="/шлях/до/DeveloperID.p12"      # або base64 сертифіката
export CSC_KEY_PASSWORD="пароль_від_p12"
export APPLE_ID="твій@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="A1B2C3D4E5"

npm run release
```

Наявність усіх чотирьох (`CSC_LINK`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`,
`APPLE_TEAM_ID`) вмикає в `electron-builder.config.js` гілку з hardened runtime,
entitlements (`build/entitlements.mac.plist`) і нотаризацією через notarytool.

Нотаризація займає кілька хвилин (electron-builder чекає відповідь Apple, потім
«степлить» тикет у DMG). Після цього — публікуй Draft-реліз як завжди.

### Перевірка результату

```bash
spctl -a -vv "dist-electron/mac/Bookshelf.app"     # має бути: accepted, source=Notarized Developer ID
codesign -dv --verbose=2 "dist-electron/mac/Bookshelf.app"
```

> ⚠️ Не коміть `.p12`, паролі й токени в git. Тримай їх лише у змінних середовища.
