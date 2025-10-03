# 🔥 Rainy Thoughts - Mentor & Demon Productivity System

A React Native (Expo) productivity app that combines supportive mentors, psychological demons, quest-based stat allocation, and AI-powered personalized messages.

## 🎯 Core Concept

- **Mentors & Demons**: Choose mentors for support or face demons for psychological warfare
- **Quest-Based Stats**: Complete category-specific quests to earn targeted stat points
- **RPG Stats System**: Build Wealth, Strength, Wisdom, Luck through focused quests
- **Character Messages**: Mentors encourage you, demons taunt you
- **Journal Integration**: AI uses YOUR journal entries for personalized messages

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Expo Go app (for testing on mobile)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your OpenRouter API key:
   - Open `services/characterTauntService.ts`
   - Replace `YOUR_OPENROUTER_API_KEY_HERE` with your actual OpenRouter API key
   - Get your key from: https://openrouter.ai/

3. Start the development server:
```bash
npm start
```

4. Run on your device:
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator
   - Or press `w` for web browser

## 📱 Features

### 3 Supportive Mentors (Category: Mentor)

**These characters encourage and guide you:**
- David Goggins (supportive_mentor) - Motivational warrior spirit
- Jordan Peterson (wise_mentor) - Philosophical guidance
- Naval Ravikant (strategic_mentor) - Strategic wisdom

### 17 Demons (Category: Demon)

**Personal Demons:**
- The Girl Who Rejected You
- Your Childhood Bully
- Disappointed Parents
- Your Trash Friends
- Rich Friend
- Incompetent Friends

**Inner Demons:**
- The Procrastination Demon
- The Anxiety Overlord
- Depression Demon
- Impostor Shadow
- Perfectionism Wraith
- Your Inner Demon Lord (FINAL BOSS)

**Chaos Agents:**
- Joker
- Pennywise
- King Joffrey

**Dark Lords:**
- Darth Vader
- Dracula

### RPG Stats

- 💰 **Wealth**: Money, resources, material success
- 💪 **Strength**: Physical, discipline, consistency
- 🧠 **Wisdom**: Learning, knowledge, mental growth
- 🍀 **Luck**: Opportunities, networking, breaks

### Quest System (NEW!)

**Create targeted quests for each stat category:**

1. **💰 Wealth Quests** - Business, career, money tasks → Earn Wealth points
2. **💪 Strength Quests** - Exercise, health, discipline tasks → Earn Strength points
3. **🧠 Wisdom Quests** - Learning, studying, skill-building tasks → Earn Wisdom points
4. **🍀 Luck Quests** - Networking, connections, opportunities → Earn Luck points

Each quest gives you 5 points in its category when completed!

### Journal Categories

1. **Problems** - Insecurities, struggles, failures
2. **Goals** - Dreams, ambitions, targets
3. **Fears** - Anxieties, worries, what scares you
4. **Thoughts** - Random reflections, observations

## 🎮 How to Play

### Quest-First Approach (Recommended)

1. **Create Quests**: Go to Quests tab, choose a category, create specific tasks
   - Wealth quest example: "Complete client proposal"
   - Strength quest example: "Go to gym"
   - Wisdom quest example: "Read 50 pages"
   - Luck quest example: "Network with 3 people"

2. **Work on Quest**: Use Pomodoro timer to focus on your quest

3. **Complete Quest**: Mark quest as complete to earn category-specific points
   - Completing a Wealth quest → +5 Wealth points automatically!
   - No manual allocation needed - points go to the quest's category

4. **Choose Your Companion**:
   - **Mentors** (Goggins, Peterson, Naval) - Get encouragement and support
   - **Demons** (17 characters) - Face psychological warfare and taunts

5. **Add Journal Entries** (Optional): Fuel AI-powered personalized messages

### Alternative Flow

1. **Traditional Pomodoro**: Work without a specific quest
2. **Manual Point Allocation**: Choose where to allocate your 5-8 points
3. **Character Messages**: Get feedback from mentor or demon

## 🛠️ Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Storage**: AsyncStorage (local)
- **AI**: OpenRouter API (Grok model)
- **Navigation**: Expo Router
- **State Management**: React Hooks

## 📁 Project Structure

```
rtv6/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Homepage with stats & character selection
│   │   ├── quests.tsx         # Quest management (NEW!)
│   │   ├── pomodoro.tsx       # Focus timer with battle system
│   │   ├── journal.tsx        # Journal entries (4 categories)
│   │   └── _layout.tsx        # Tab navigation (4 tabs)
│   └── _layout.tsx            # Root layout
├── components/
│   ├── PreBattleTauntScreen.tsx    # Shows messages before work session
│   ├── BattleScreen.tsx            # During focus session
│   └── TaskCompletionInterface.tsx # After session - stat allocation
├── constants/
│   ├── characters.ts          # 20 characters (3 mentors + 17 demons)
│   ├── gameSystem.ts          # Hero data, stats, leveling logic
│   ├── questSystem.ts         # Quest/task system (NEW!)
│   └── imageMapping.ts        # Character image imports
├── services/
│   └── characterTauntService.ts    # AI message generation
└── images/                    # Character images
```

## ⚙️ Configuration

### API Setup

The app uses OpenRouter's Grok model for generating personalized taunts. To set it up:

1. Sign up at https://openrouter.ai/
2. Get your API key
3. Update `services/characterTauntService.ts`:

```typescript
const API_KEY = 'YOUR_OPENROUTER_API_KEY_HERE';
```

### Customization

- **Timer Duration**: Adjust in the Pomodoro screen (5-60 minutes)
- **Character Images**: Place images in the `images/` folder matching the filename in `characters.ts`
- **Theme Colors**: Modify colors in each screen's StyleSheet

## 🎨 Design Philosophy

- **Dark Mode**: Near-black (#0a0a0a) background
- **Red/Orange Accents**: #FF4444, #FF8C00
- **Neon Glow Effects**: For important elements
- **Monospace Font**: For stats/numbers
- **Color-Coded Stats**: Wealth (Gold), Strength (Red), Wisdom (Blue), Luck (Green)

## 🔥 Core Philosophy

This app uses **negative motivation** (taunts, psychological warfare) to drive positive action. It's brutally honest, personal, and makes users want to prove the characters wrong by actually doing their work.

## 📝 Notes

- Journal entries are stored locally on your device
- Taunts are cached for 7 days to reduce API costs
- All stats and progress are saved in AsyncStorage
- Character taunts quote your journal entries directly for maximum psychological impact

## 🚨 Important

**Set your OpenRouter API key** in `services/characterTauntService.ts` before running the app, or you'll only see fallback taunts.

## 📄 License

Private project

---

**🔥 THIS IS PSYCHOLOGICAL WARFARE FOR PRODUCTIVITY. 🔥**
