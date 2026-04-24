---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx,**/globals.css,**/accessibility*"
---

# Accessibility Checklist

AllVoice is built for blind and low-vision users. Every UI component must meet these standards.

## Visual

- [ ] High-contrast mode is the default (7:1 foreground-to-background ratio for all text)
- [ ] Standard theme maintains minimum 4.5:1 contrast ratio
- [ ] Body text minimum 16px, secondary labels minimum 14px
- [ ] Focus indicators: 3px outline, 4.5:1 contrast ratio
- [ ] Response panel color-codes by type while meeting contrast requirements

## Keyboard

- [ ] All interactive elements reachable via Tab key in logical order
- [ ] No keyboard traps — user can always Tab away
- [ ] Escape closes popup and returns focus to previously focused page element
- [ ] Keyboard shortcuts work: Alt+Shift+V (mic), Alt+Shift+L (log), Alt+Shift+C (contrast)

## Screen Reader

- [ ] All interactive elements have `aria-label` or visible text
- [ ] Dynamic content uses `aria-live="assertive"` regions
- [ ] Listening state announced via live region ("listening" / "stopped listening")
- [ ] Response messages announced via live region without requiring focus change
- [ ] Lists use `role="list"` and `role="listitem"`
- [ ] Buttons have descriptive labels

## Voice

- [ ] Audible confirmation tone within 300ms when mic activates/deactivates
- [ ] All responses spoken via Chrome TTS API
- [ ] Errors announced via Chrome TTS when Web Speech API fails

## Tailwind Theme Tokens

Use these custom theme tokens for consistent accessible styling:
- `text-hc-foreground` / `bg-hc-background` — high-contrast mode (7:1+)
- `text-std-foreground` / `bg-std-background` — standard mode (4.5:1+)
- `ring-focus` — focus indicator color (4.5:1+ against background)
- `focus:outline-3` — 3px focus outline width
