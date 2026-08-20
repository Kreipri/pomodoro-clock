# Nibbles

Nibbles is a tiny eldritch productivity familiar. During a focus session it
watches the active desktop window. Allowed app or browser-tab title keywords
keep it calm; distracting windows let it grow through increasingly intrusive
forms until you return.

## Run it

```sh
npm run tauri dev
```

If PowerShell blocks `npm.ps1`, use `npm.cmd run tauri dev` instead.

The active-window watcher currently targets Windows. Whitelist matching stays
on the device and only compares the visible foreground-window title.
