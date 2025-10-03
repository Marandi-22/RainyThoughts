# Setup Instructions

## Quick Start

1. **Clear cache and start fresh:**
```bash
npx expo start -c
```

2. **If you get errors, try:**
```bash
rm -rf node_modules
npm install
npx expo start -c
```

## Common Issues

### "Text strings must be rendered within a <Text> component"
✅ Fixed - Updated tab icons to use `<Text>` component

### Image loading issues
✅ Fixed - Created imageMapping.ts with static imports

### Module resolution errors
- Make sure you're in the correct directory
- Clear Metro bundler cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `npm install`

## Running the App

### On Physical Device
```bash
npx expo start
```
- Scan QR code with Expo Go app (Android) or Camera (iOS)

### On Emulator
```bash
npx expo start --android  # Android
npx expo start --ios      # iOS (Mac only)
```

### On Web
```bash
npx expo start --web
```

## API Configuration

✅ API key is already configured in `services/characterTauntService.ts`
- Model: `x-ai/grok-4-fast:free`
- If you need to change it, edit line 5 of that file

## File Structure

```
rtv6/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx      ← Homepage
│   │   ├── pomodoro.tsx   ← Battle screen
│   │   ├── journal.tsx    ← Journal
│   │   └── _layout.tsx    ← Tab navigation
│   └── _layout.tsx        ← Root layout
├── components/            ← Reusable components
├── constants/             ← Game data & characters
├── services/              ← AI taunt service
└── images/                ← Character images
```

## Testing Checklist

- [ ] App starts without errors
- [ ] Home screen shows hero stats
- [ ] Can navigate between tabs
- [ ] Journal entries can be added
- [ ] Character selection works
- [ ] Timer starts and counts down
- [ ] Completion interface shows up
- [ ] Stats update after completion

## Troubleshooting

### Metro bundler won't start
```bash
npx expo start -c --reset-cache
```

### TypeScript errors
```bash
npm install --save-dev @types/react @types/react-native
```

### Can't find images
- All images should be in the `images/` folder
- Image mapping is in `constants/imageMapping.ts`
- Check that filenames match exactly (case-sensitive)

## Development Tips

- Use `r` in the terminal to reload the app
- Use `d` to open developer menu
- Use `j` to open debugger
- Errors will show in both terminal and app

## Ready to Go! 🔥

Run `npx expo start` and scan the QR code with Expo Go!
