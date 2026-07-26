// electron-builder configuration.
//
// Two modes, chosen automatically from the environment:
//
//  • No Apple credentials (default, free):
//      electron-builder skips real signing → scripts/afterPack.js applies an
//      ad-hoc signature so the app runs on Apple Silicon and only triggers the
//      normal "unidentified developer" prompt (right-click → Open).
//
//  • Apple credentials present (paid Apple Developer ID):
//      full Developer ID signing + hardened runtime + notarization, so the app
//      opens with a plain double-click and no warnings.
//
// To switch to the notarized build, just set these env vars before `npm run release`:
//      CSC_LINK                     path or base64 of your Developer ID .p12
//      CSC_KEY_PASSWORD             password for that .p12
//      APPLE_ID                     your Apple ID email
//      APPLE_APP_SPECIFIC_PASSWORD  app-specific password (appleid.apple.com)
//      APPLE_TEAM_ID                your 10-char Team ID
// See NOTARIZATION.md for the full walkthrough.

const hasAppleCreds = Boolean(
  process.env.CSC_LINK &&
  process.env.APPLE_ID &&
  process.env.APPLE_APP_SPECIFIC_PASSWORD &&
  process.env.APPLE_TEAM_ID
)

const mac = {
  category: 'public.app-category.productivity',
  target: [
    { target: 'zip', arch: ['x64', 'arm64'] },
    { target: 'dmg', arch: ['x64', 'arm64'] },
  ],
}

if (hasAppleCreds) {
  // ── Paid path: Developer ID signing + notarization ──
  mac.hardenedRuntime = true
  mac.gatekeeperAssess = false
  mac.entitlements = 'build/entitlements.mac.plist'
  mac.entitlementsInherit = 'build/entitlements.mac.plist'
  mac.notarize = { teamId: process.env.APPLE_TEAM_ID }
} else {
  // ── Free path: ad-hoc signing handled in scripts/afterPack.js ──
  mac.hardenedRuntime = false
  mac.identity = null // don't fail the build if an unrelated cert sits in the keychain
}

module.exports = {
  appId: 'com.bookshelf.app',
  productName: 'Bookshelf',
  afterPack: 'scripts/afterPack.js',
  asar: true,
  asarUnpack: ['node_modules/better-sqlite3/**/*'],
  publish: {
    provider: 'github',
    owner: 'Yaposhich',
    repo: 'bookshelf-app',
  },
  directories: {
    output: 'dist-electron',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'node_modules/better-sqlite3/build/Release/**/*',
    'node_modules/better-sqlite3/lib/**/*',
    'node_modules/better-sqlite3/package.json',
    'node_modules/bindings/**/*',
    'node_modules/file-uri-to-path/**/*',
  ],
  npmRebuild: true,
  mac,
}
