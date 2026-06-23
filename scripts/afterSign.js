// electron-builder afterSign hook.
// Re-applies an ad-hoc signature and strips any quarantine attributes that
// might have been picked up during the build, so the .app that ships inside
// the .dmg is as "clean" as possible for Gatekeeper on first launch.
const { execSync } = require('child_process')

exports.default = async function afterSign(context) {
  const { appOutDir, packager, electronPlatformName } = context
  if (electronPlatformName !== 'darwin') return

  const appName = packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  try {
    execSync(`xattr -cr "${appPath}"`, { stdio: 'inherit' })
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' })
    console.log(`✓ Ad-hoc signed and cleared quarantine attrs: ${appPath}`)
  } catch (err) {
    console.warn('⚠ afterSign step failed (non-fatal):', err.message)
  }
}
