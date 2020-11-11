# Passwords Backup

## What is this Web App ?
This Web App allows you to backup/restore the list of `password nicknames` stored inside the `Passwords app` on your Ledger Nano S/ Nano X.
It is useful to have such a backup when you update the Passwords app on your device, or the device firmware, because the list gets erased. Another case where it's practical to have a nickname backup is when you loose your device: Restoring the [24-words recovery phrase](https://www.ledger.com/academy/crypto/what-is-a-recovery-phrase) is necessary but not sufficient to restore your passwords, you need your nickname list as well.

## What is the Ledger Passwords application ?
Look [here](https://github.com/LedgerHQ/app-passwords/blob/master/README.md) for more information on the device application itself.

## How to use this Web App ?
* Install the `Passwords app` on your Nano S/ Nano X from the [Ledger Live](https://support.ledger.com/hc/en-us/articles/360006523674-Install-uninstall-and-update-apps).
* Connect your Nano S/Nano X to your computer and open the `Passwords app`.
* You can now click on the big `Connect` button, and if it succeeds the Backup/Restore buttons should appear in place of the previous button. If you have troubles with this step, have a look [here](https://support.ledger.com/hc/en-us/articles/115005165269-Fix-connection-issues). \n* Either click on Backup/Restore depending on what you want to do.
    * `Backup` will prompt a screen requesting your approval on your device (`\"Transfer metadatas ?\"`), then save a backup file. This is your backup. it's not confidential, so for instance you can send it to yourself by e-mail to never loose it.
    * `Restore` will prompt a file input dialog where you should indicate a previous backup file. A prompt (`\"Overwite metadatas ?\"`) will then request your approval on your device.

## Which web browsers are supported ?
The communication with the device is done through `WebUSB`, which is curently supported only on `Google Chrome` / `Chromium` / `Brave` for `Linux` and `MacOS`. On `Windows`, [Zadig](https://github.com/WICG/webusb/issues/143) is required.

## Building the project

`yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Credits

This WebApp was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).