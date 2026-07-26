// electron-builder afterPack hook — runs ALWAYS, even when there is no signing
// identity (unlike afterSign, which only fires when real code signing happens).
//
// We have no Apple Developer certificate, so we apply an *ad-hoc* signature
// (`codesign -s -`). That makes the arm64 binary valid code, so Gatekeeper
// shows the normal "unidentified developer" prompt (bypassable with a
// right-click → Open) instead of the dreaded "app is damaged" error that
// forces users into `xattr -cr` in Terminal.
const { execSync } = require('child_process')

exports.default = async function afterPack(context) {
  const { appOutDir, packager, electronPlatformName } = context
  if (electronPlatformName !== 'darwin') return

  // When real Apple Developer credentials are present, electron-builder does a
  // proper Developer ID signature + notarization right after this hook — skip
  // ad-hoc signing so we don't fight it.
  const hasAppleCreds = Boolean(
    process.env.CSC_LINK &&
    process.env.APPLE_ID &&
    process.env.APPLE_APP_SPECIFIC_PASSWORD &&
    process.env.APPLE_TEAM_ID
  )
  if (hasAppleCreds) {
    console.log('✓ Apple credentials detected — skipping ad-hoc signing (Developer ID signing will run)')
    return
  }

  const appName = packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  try {
    execSync(`xattr -cr "${appPath}"`, { stdio: 'inherit' })
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' })
    console.log(`✓ Ad-hoc signed: ${appPath}`)
  } catch (err) {
    console.warn('⚠ afterPack ad-hoc signing failed (non-fatal):', err.message)
  }
}
