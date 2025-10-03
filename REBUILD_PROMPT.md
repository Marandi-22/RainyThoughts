# 🔥 Complete App Rebuild Prompt

Use this prompt if rebuilding the entire Rainy Thoughts app from scratch.

---

## THE PROMPT

```
I need you to build a React Native (Expo) productivity app called "Rainy Thoughts"
with a unique psychological warfare twist. Here are the complete specifications:

═══════════════════════════════════════════════════════════════════════════════

## CORE CONCEPT

A Pomodoro/focus timer app that gamifies productivity through:
1. **Psychological Warfare**: Real-life characters taunt you before work sessions
2. **RPG Stats System**: Work earns you Wealth, Strength, Wisdom, Luck
3. **Character Battles**: Face motivational figures and your personal demons
4. **Journal Integration**: App uses YOUR journal entries for personalized taunts

═══════════════════════════════════════════════════════════════════════════════

## APP STRUCTURE

### Tech Stack
- React Native (Expo)
- TypeScript
- AsyncStorage for local data
- OpenRouter AI API (Grok model) for taunt generation

### File Structure
```
app/(tabs)/
  ├── index.tsx          # Homepage with stats & character selection
  ├── pomodoro.tsx       # Focus timer with battle system
  ├── journal.tsx        # Journal entries (problems, goals, fears, thoughts)
  └── _layout.tsx        # Tab navigation

constants/
  ├── characters.ts      # All character definitions
  └── gameSystem.ts      # Hero data, stats, leveling logic

services/
  └── characterTauntService.ts   # AI taunt generation

components/
  ├── PreBattleTauntScreen.tsx   # Shows taunt before work session
  ├── BattleScreen.tsx           # During focus session
  └── TaskCompletionInterface.tsx # After session - stat allocation
```

═══════════════════════════════════════════════════════════════════════════════

## 1. CHARACTER SYSTEM (constants/characters.ts)

### Character Interface
```typescript
interface Character {
  id: string;
  name: string;
  personality: CharacterPersonality;
  image: string;         // Filename in assets/images
  themeColor: string;    // Hex color for UI
  taunts: {
    preBattle: string[];   // Before work session
    victory: string[];     // When you complete session
    defeat: string[];      // When you fail/quit
  };
  fallbackTaunts: string[];  // If AI fails
  minStats?: number;     // Unlock requirement
  minStreak?: number;    // Days streak requirement
}
```

### Personality Types (drives AI behavior)
- **harsh_motivator**: Goggins-style brutal drill sergeant
- **intellectual_savage**: Peterson/Naval psychological precision
- **toxic_manipulator**: Ex, bully, fake friends - personal attacks
- **dark_demon**: Inner voice of self-doubt, insidious
- **chaos_agent**: Joker/Pennywise theatrical chaos
- **cold_villain**: Vader/Dracula ancient dismissive power

### Character Categories (20 total)

**Motivators (3)**
- David Goggins (harsh_motivator)
- Jordan Peterson (intellectual_savage)
- Naval Ravikant (intellectual_savage)

**Personal Demons (6)**
- The Girl Who Rejected You (toxic_manipulator)
- Your Childhood Bully (toxic_manipulator)
- Disappointed Parents (toxic_manipulator)
- Your Trash Friends (toxic_manipulator)
- Rich Friend (toxic_manipulator)
- Incompetent Friends (toxic_manipulator)

**Inner Demons (6)**
- The Procrastination Demon (dark_demon)
- The Anxiety Overlord (dark_demon)
- Depression Demon (dark_demon)
- Impostor Shadow (dark_demon)
- Perfectionism Wraith (dark_demon)
- Your Inner Demon Lord (dark_demon) - FINAL BOSS

**Chaos Agents (3)**
- Joker (chaos_agent)
- Pennywise (chaos_agent)
- King Joffrey (chaos_agent)

**Dark Lords (2)**
- Darth Vader (cold_villain)
- Dracula (cold_villain)

═══════════════════════════════════════════════════════════════════════════════

## 2. GAME SYSTEM (constants/gameSystem.ts)

### Hero Data Interface
```typescript
interface HeroData {
  stats: {
    wealth: number;    // Money, resources, material success
    strength: number;  // Physical, discipline, consistency
    wisdom: number;    // Learning, knowledge, mental growth
    luck: number;      // Opportunities, networking, breaks
  };
  level: number;
  totalPomodoros: number;
  streakDays: number;
  lastCompletionDate: string;
  heroState: 'pathetic' | 'weak' | 'developing' | 'strong' | 'legendary';
}
```

### Stat Calculation
- Each completed pomodoro = 5 points to allocate across stats
- Task quality bonus: +2 points for good work
- Streak bonus: +1 point per 7-day streak
- Hero state calculated from total stats:
  - 0-100: pathetic
  - 101-300: weak
  - 301-600: developing
  - 601-1000: strong
  - 1000+: legendary

═══════════════════════════════════════════════════════════════════════════════

## 3. JOURNAL SYSTEM (app/(tabs)/journal.tsx)

### Four Categories
1. **Problems** - Insecurities, struggles, failures
2. **Goals** - Dreams, ambitions, targets
3. **Fears** - Anxieties, worries, what scares you
4. **Thoughts** - Random reflections, observations

### Storage
- Store as JSON arrays in AsyncStorage
- Each entry: `{ id: string, text: string, date: string }`
- Keys: 'problems', 'goals', 'fears', 'thoughts'

### AI Integration
**CRITICAL**: The AI service reads these journals to generate personalized taunts
that quote your exact words back at you for maximum psychological impact.

═══════════════════════════════════════════════════════════════════════════════

## 4. TAUNT SERVICE (services/characterTauntService.ts)

### AI Integration (OpenRouter API)
- API: `https://openrouter.ai/api/v1/chat/completions`
- Model: `x-ai/grok-2-1212`
- Temperature: 0.85

### Core Functions
```typescript
// Get personal data from journals
static async getPersonalData(): Promise<PersonalData>

// Generate AI taunts using personality + journal data
static async generateTaunts(
  character: Character,
  type: 'preBattle' | 'victory' | 'defeat'
): Promise<string[]>

// Get cached or generate fresh taunts
static async getPreBattleTaunt(character: Character): Promise<string>
static async getVictoryTaunt(character: Character): Promise<string>
static async getDefeatTaunt(character: Character): Promise<string>
```

### AI Prompt Structure
```
You are [CHARACTER] with personality: [PERSONALITY]

THEIR PERSONAL DATA (use directly):
Problems: "[user's actual problems journal]"
Goals: "[user's actual goals]"
Fears: "[user's actual fears]"
Thoughts: "[user's thoughts]"

THEIR STATS:
Wealth: X | Strength: Y | Wisdom: Z | Luck: W

Generate [8/6] [TYPE] taunts that:
- Quote their journal entries DIRECTLY
- Reference their weak stats
- Stay 100% in character
- Are brutally honest for motivation
- Make them FURIOUS enough to prove you wrong
- Keep under 120 characters each

Return ONLY JSON array: ["taunt1", "taunt2", ...]
```

### Personality-Specific Prompt Guides

**harsh_motivator**:
"You're a brutal drill sergeant who sees weakness and calls it out. Reference their
failures to PUSH them harder. Use phrases like 'Who's gonna carry the boats?',
'Stay hard', 'You're soft'. Make them ANGRY enough to prove you wrong."

**intellectual_savage**:
"You're an intellectual who dissects their failures with surgical precision. Use
psychological concepts, philosophical frameworks. Reference hierarchies, meaning,
purpose. Be condescending but insightful."

**toxic_manipulator**:
"You're someone from their past who hurt them. Use their journal entries DIRECTLY.
Quote their own words back at them. Be personal, cutting, cruel. Reference specific
memories, failures, embarrassments. This is psychological warfare - make it HURT."

**dark_demon**:
"You ARE their inner voice of self-doubt. You know EVERYTHING about them. Use their
deepest fears against them. You're not external - you're the voice in their head
that says 'you can't do this'. Be insidious, creeping, inevitable."

**chaos_agent**:
"You find their suffering HILARIOUS. Mock their attempts at order and productivity.
Be theatrical, dramatic, chaotic. Laugh at their pain. Make their efforts seem
meaningless in the face of chaos."

**cold_villain**:
"You're ancient, powerful, and utterly dismissive. Their struggles are beneath you.
Time means nothing. Their deadline panic is amusing. Show that you've seen empires
fall - their productivity goals are nothing."

### Caching System
- Cache taunts for 7 days in AsyncStorage
- Key: `character_cache_${character.id}`
- Store: taunts, lastGenerated timestamp
- Regenerate if: no cache, expired, or random 10% chance for freshness

═══════════════════════════════════════════════════════════════════════════════

## 5. POMODORO/BATTLE SYSTEM (app/(tabs)/pomodoro.tsx)

### Flow
1. **Character Selection**: User picks character to face
2. **Pre-Battle Taunt**: Character taunts you (PreBattleTauntScreen)
3. **Focus Session**: Timer runs (25 min default)
4. **Battle Screen**: Shows character, timer, motivational display
5. **Completion**: Task quality assessment + stat allocation
6. **Victory/Defeat**: Character responds based on outcome

### PreBattleTauntScreen Component
```typescript
interface Props {
  visible: boolean;
  character: Character;
  onStartBattle: () => void;
  onSkip: () => void;
}

// Display:
- Character image (80x80 circular)
- Character name + personality type
- Pre-battle taunt in speech bubble
- Theme color from character
- "LET'S WORK!" button
- Skip option
```

### Timer Logic
- Default: 25 minutes (1500 seconds)
- User can adjust (5-60 minutes)
- Keep device awake during session
- Background audio support
- Pause/Resume functionality
- Completion triggers stat allocation

### TaskCompletionInterface Component
```typescript
// After completing pomodoro:
1. Ask task quality (1-5 rating)
2. Base points: 5
3. Quality bonus: +0 to +2 based on rating
4. Streak bonus: +1 per 7-day streak
5. User allocates points to stats
6. Show victory taunt from character
7. Update hero data in AsyncStorage
```

═══════════════════════════════════════════════════════════════════════════════

## 6. HOMEPAGE (app/(tabs)/index.tsx)

### Display Elements

**Hero Card**
- Current level & hero state
- All 4 stats with bars (wealth, strength, wisdom, luck)
- Streak counter (days)
- Total pomodoros completed
- "Current Act" based on stats

**Character Selection**
- Grid/list of available characters
- Locked characters (show requirements)
- Character images with theme colors
- Tap to select for battle

**Quick Actions**
- Start Focus Session
- View Journal
- Check Stats

**Progress Indicators**
- Next level progress bar
- Stats distribution chart
- Recent completions log

═══════════════════════════════════════════════════════════════════════════════

## 7. VISUAL DESIGN

### Theme
- Dark mode (black #0a0a0a background)
- Red/orange accent colors (#FF4444, #FF8C00)
- Monospace font for stats/numbers
- Neon glow effects for important elements

### Character Cards
- 80x80 circular image
- Border with character's theme color
- Name + personality type below
- Lock icon if not unlocked

### Stat Display
- Color-coded bars
  - Wealth: Gold (#FFD700)
  - Strength: Red (#FF4444)
  - Wisdom: Blue (#4A90E2)
  - Luck: Green (#4CAF50)
- Emoji icons for each stat
- Progress bars with glow

### Taunt Screen
- Full-screen modal
- Dark overlay (rgba(0,0,0,0.95))
- Character image prominent
- Taunt in speech bubble
- Pulsing animation
- Theme color accents

═══════════════════════════════════════════════════════════════════════════════

## 8. DATA PERSISTENCE

### AsyncStorage Keys
- `heroData` - Complete hero stats/progress
- `problems` - Problems journal entries
- `goals` - Goals journal entries
- `fears` - Fears journal entries
- `thoughts` - Thoughts journal entries
- `character_cache_${id}` - Cached character taunts
- `lastCompletionDate` - For streak tracking
- `completionHistory` - Array of past completions

### Hero Data Example
```json
{
  "stats": {
    "wealth": 45,
    "strength": 62,
    "wisdom": 38,
    "luck": 29
  },
  "level": 5,
  "totalPomodoros": 34,
  "streakDays": 7,
  "lastCompletionDate": "2025-01-15",
  "heroState": "developing"
}
```

═══════════════════════════════════════════════════════════════════════════════

## 9. KEY FEATURES

### Psychological Warfare
- Taunts use YOUR journal entries against you
- Characters quote your exact words
- Personal, cutting, motivational
- Makes you WANT to prove them wrong

### Progressive Unlocking
- Start with basic characters (Peterson, Procrastination)
- Unlock tougher characters as stats increase
- Final boss (Inner Demon Lord) requires high stats

### Streak System
- Daily completion tracking
- Breaks if you miss a day
- Bonus points for maintaining streaks
- Visual streak counter

### Stat Meaning
- **Wealth**: Money-focused work (job, business, income)
- **Strength**: Physical discipline (gym, health, consistency)
- **Wisdom**: Learning (reading, courses, skill-building)
- **Luck**: Networking (people, opportunities, social)

### Quality Matters
- Rate your work quality after each session
- Higher quality = more points
- Encourages honest self-assessment

═══════════════════════════════════════════════════════════════════════════════

## 10. CRITICAL IMPLEMENTATION DETAILS

### AI Taunt Generation
**MUST quote user's journal entries directly** - this is the core feature!
Example:
- User wrote in problems: "I procrastinate on important projects"
- Goggins taunt: "You said it yourself - 'I procrastinate on important projects'
  - and here you are, STILL DOING IT. Who's gonna carry the boats? Not you!"

### Character Personality Consistency
Each character must stay true to their personality across all taunts:
- Goggins: ALL CAPS, aggressive, military style
- Peterson: Intellectual, references Jung/mythology
- Your Ex: Condescending, references past relationship
- Procrastination Demon: Seductive, "you can do it later..."

### Caching Strategy
- Generate taunts sparingly (API costs)
- Cache for 7 days
- Regenerate when journal content changes significantly
- Always have fallback taunts

### Streak Logic
- Compare lastCompletionDate to today
- If yesterday: streak continues
- If today: already counted
- If before yesterday: streak breaks, reset to 1

### Stat Allocation UX
- Show point pool clearly
- Drag/tap to allocate
- Visual feedback on bars
- Can't proceed without allocating all points
- Confirm before saving

═══════════════════════════════════════════════════════════════════════════════

## 11. EXAMPLE USER FLOW

1. **First Launch**
   - Create default hero (all stats at 0)
   - Show tutorial explaining concept
   - Prompt to add journal entries

2. **Adding Journal Entry**
   - Navigate to Journal tab
   - Select category (problems, goals, fears, thoughts)
   - Write entry
   - Save to AsyncStorage

3. **Starting Focus Session**
   - Go to Pomodoro tab
   - Select character (e.g., David Goggins)
   - PreBattleTauntScreen appears
   - Goggins taunts using your journal data
   - Tap "LET'S WORK!"
   - Timer starts (25 min)
   - Battle screen shows character + countdown

4. **Completing Session**
   - Timer hits 0
   - TaskCompletionInterface appears
   - Rate work quality (1-5)
   - Receive 5-8 points based on quality + streak
   - Allocate points to stats
   - See victory taunt from Goggins
   - Stats updated, level may increase

5. **Checking Progress**
   - Go to Home tab
   - See updated stats
   - Check streak counter
   - New characters may have unlocked
   - Feel motivated to continue

═══════════════════════════════════════════════════════════════════════════════

## 12. EXTENSIONS & POLISH

### Nice-to-Have Features
- Daily quests (complete 3 pomodoros = bonus)
- Character backstories/lore
- Achievement badges
- Export stats as image to share
- Mentor mode (positive encouragement option)
- Custom characters (user-created)
- Sound effects for battles
- Animated character sprites

### Performance Optimizations
- Lazy load character images
- Memoize heavy calculations
- Throttle AsyncStorage writes
- Preload taunts on app start
- Cache journal parsing results

### Error Handling
- Graceful AI API failures (use fallbacks)
- AsyncStorage quota exceeded handling
- Timer interruption handling
- Network error recovery
- Invalid data validation

═══════════════════════════════════════════════════════════════════════════════

## 13. TESTING CHECKLIST

- [ ] Character taunts generate correctly
- [ ] Journal entries are saved and retrieved
- [ ] Timer counts down accurately
- [ ] Stats update after completion
- [ ] Streak logic works (continue/break)
- [ ] Character unlocking works
- [ ] Cache system prevents excessive API calls
- [ ] Fallback taunts work when AI fails
- [ ] Hero state updates correctly
- [ ] Level progression works
- [ ] Point allocation is enforced
- [ ] Images load for all characters
- [ ] Dark theme is consistent
- [ ] App doesn't crash on first launch

═══════════════════════════════════════════════════════════════════════════════

## 14. API CONFIGURATION

### OpenRouter Setup
```typescript
const API_KEY = 'your-openrouter-api-key';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const response = await fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'HTTP-Referer': 'https://rainy-thoughts-app.local',
    'X-Title': 'RainyThoughts Character System',
  },
  body: JSON.stringify({
    model: 'x-ai/grok-2-1212',
    messages: [
      { role: 'system', content: 'You are a psychological warfare AI...' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.85,
    max_tokens: 1000
  })
});
```

═══════════════════════════════════════════════════════════════════════════════

## 15. FINAL NOTES

### Core Philosophy
This app uses **negative motivation** (taunts, psychological warfare) to drive
positive action. It's brutally honest, personal, and makes users want to prove
the characters wrong by actually doing their work.

### Differentiation
Unlike other productivity apps:
- **Personal**: Uses YOUR data against you
- **Gamified**: RPG stats make progress visible
- **Psychological**: Leverages spite/revenge as motivation
- **Creative**: Real-life characters, not generic timers

### Success Metrics
- Users complete more pomodoros
- Streak maintenance increases
- Journal engagement is high (provides taunt fuel)
- Users feel "called out" but motivated
- Stats provide tangible sense of progress

═══════════════════════════════════════════════════════════════════════════════

BUILD THIS APP. Make it dark, motivating, and brutally honest.
The taunts should HURT but drive action. Stay true to each character's personality.
Make users want to prove their demons wrong by crushing their work sessions.

🔥 THIS IS PSYCHOLOGICAL WARFARE FOR PRODUCTIVITY. 🔥
```

═══════════════════════════════════════════════════════════════════════════════
═══════════════════════════════════════════════════════════════════════════════

## ADDITIONAL CONTEXT FILES TO PROVIDE

When rebuilding, also provide these reference files:

1. **Character images** (assets/images/)
   - All 20 character images
   - Naming convention matches character.image field

2. **Example journal entries** (for testing taunts)
   ```json
   {
     "problems": ["I procrastinate on important projects", "I compare myself to others"],
     "goals": ["Build a successful business", "Get fit and healthy"],
     "fears": ["Failure", "Being mediocre forever"],
     "thoughts": ["I need to stop making excuses"]
   }
   ```

3. **Color palette reference**
   ```
   Background: #0a0a0a (near black)
   Primary: #FF4444 (red)
   Secondary: #FF8C00 (orange)
   Success: #4CAF50 (green)
   Text: #FFFFFF (white)
   Muted: #888888 (gray)
   ```

4. **Font requirements**
   - System default for body text
   - Monospace for stats/numbers
   - Bold weights for headers

═══════════════════════════════════════════════════════════════════════════════

**This prompt contains everything needed to rebuild the app from scratch.**
