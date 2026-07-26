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
