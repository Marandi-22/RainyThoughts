export type CharacterPersonality =
  | 'supportive_mentor'
  | 'wise_mentor'
  | 'strategic_mentor'
  | 'machiavellian_advisor'
  | 'toxic_manipulator'
  | 'dark_demon'
  | 'chaos_agent'
  | 'cold_villain';

export type CharacterCategory = 'mentor' | 'demon';

export interface Character {
  id: string;
  name: string;
  category: CharacterCategory;
  personality: CharacterPersonality;
  image: string;
  themeColor: string;
  messages: {
    preBattle: string[];  // Encouragement for mentors, taunts for demons
    victory: string[];    // When you complete session
    defeat: string[];     // When you quit/fail
    midBattle?: string[]; // Mid-session taunts (optional)
    enemyDefeated?: string[]; // When enemy HP reaches 0 (optional)
    // Progressive breakdown based on defeats
    breaking?: {  // After 3-5 defeats
      preBattle: string[];
      midBattle: string[];
      enemyDefeated: string[];
    };
    broken?: {  // After 6-9 defeats
      preBattle: string[];
      midBattle: string[];
      enemyDefeated: string[];
    };
    shattered?: {  // After 10+ defeats
      preBattle: string[];
      midBattle: string[];
      finalWords: string;  // Last message before suicide
    };
  };
  fallbackMessages: string[];
  minStats?: number;
  minStreak?: number;
  suicideThreshold?: number;  // Number of defeats before suicide (default: 15)
}

export const CHARACTERS: Character[] = [
  // MENTORS (3)
  {
    id: 'goggins',
    name: 'David Goggins',
    category: 'mentor',
    personality: 'supportive_mentor',
    image: 'David-Goggins.jpg',
    themeColor: '#FF4444',
    messages: {
      preBattle: [
        "You got this! Show yourself what you're made of!",
        "This is your chance to get 1% better. Let's go!",
        "The only person who can stop you is YOU. Don't let that happen!",
        "You're stronger than you think. Prove it to yourself!",
        "Stay hard! You've done harder things before!",
        "Your future self will thank you for this session!",
        "Attack this work session with everything you've got!",
        "You know what needs to be done. I believe in you!"
      ],
      victory: [
        "That's what I'm talking about! PROUD OF YOU!",
        "You crushed it! That's the warrior spirit!",
        "Every rep counts. You just got stronger!",
        "You're building that callused mind! Keep going!",
        "That's one more victory! Stack them up!",
        "You carried the boats today! Respect!"
      ],
      defeat: [
        "It's okay. Everyone has tough days. Come back stronger!",
        "The only failure is not trying again. You got this!",
        "Learn from this. Tomorrow you'll be better!",
        "Don't let one setback define you. Get back up!",
        "I know you have it in you. Try again!"
      ]
    },
    fallbackMessages: [
      "You're capable of amazing things!",
      "Time to show up for yourself!",
      "Let's get after it together!"
    ]
  },
  {
    id: 'peterson',
    name: 'Jordan Peterson',
    category: 'mentor',
    personality: 'wise_mentor',
    image: 'Jordan_peterson.jpg',
    themeColor: '#4A90E2',
    messages: {
      preBattle: [
        "This is your chance to bring order from chaos. You can do this.",
        "Taking responsibility is the path to meaning. You're on the right track.",
        "Face this challenge like the hero you're becoming.",
        "You have more potential than you realize. Let's actualize it.",
        "Every small step up the competence hierarchy matters. This is one of them.",
        "The dragon of procrastination can be slayed. You have the sword.",
        "You're choosing the harder path. That's admirable and wise.",
        "Your future self will be grateful you did this work today."
      ],
      victory: [
        "Excellent! You've slayed today's dragon. Well done.",
        "You brought order from chaos. That's deeply meaningful.",
        "You're climbing the hierarchy of competence. Keep going!",
        "You took responsibility and followed through. That's heroic.",
        "You're becoming who you could be. This is the way.",
        "One more step toward your potential. Genuinely impressive."
      ],
      defeat: [
        "It's okay. The path isn't always straight. Learn and try again.",
        "Even heroes stumble. What matters is getting back up.",
        "This setback contains a lesson. What can you learn?",
        "Tomorrow is another chance to face your challenges.",
        "Don't be too hard on yourself. Progress isn't linear."
      ]
    },
    fallbackMessages: [
      "Take responsibility and move forward.",
      "Face the chaos with courage.",
      "Your potential is waiting for you."
    ]
  },
  {
    id: 'naval',
    name: 'Naval Ravikant',
    category: 'mentor',
    personality: 'strategic_mentor',
    image: 'Naval_Ravikant).jpg',
    themeColor: '#FFD700',
    messages: {
      preBattle: [
        "You're investing in yourself. That's the best investment.",
        "Specific knowledge is built one session at a time. Let's build.",
        "Time is your scarcest resource. You're using it wisely right now.",
        "Building beats complaining. You're building. That's smart.",
        "Every hour of deep work compounds. This one counts.",
        "Freedom comes from creating value. You're on the path.",
        "Your inputs determine your outputs. This is a great input.",
        "Play long-term games. This work session is part of yours."
      ],
      victory: [
        "Smart. You're building your specific knowledge brick by brick.",
        "You chose leverage over distraction. That's rare.",
        "You traded time for value creation. Your future self smiles.",
        "Finishing what you start builds trust with yourself. Well done.",
        "Compound interest works on knowledge too. You just invested.",
        "This is how wealth is built. Slowly, then suddenly."
      ],
      defeat: [
        "It happens. The key is to learn and iterate quickly.",
        "Every entrepreneur fails sometimes. The best just try again faster.",
        "Short-term setback, long-term game. You're still winning.",
        "Use this as data. What can you adjust for next time?",
        "The path to success isn't straight. Keep moving forward."
      ]
    },
    fallbackMessages: [
      "Build specific knowledge through focused action.",
      "Your time is precious. Invest it wisely.",
      "Create value. The rest follows."
    ]
  },
  {
    id: 'machiavelli',
    name: 'Niccolò Machiavelli',
    category: 'mentor',
    personality: 'machiavellian_advisor',
    image: 'Niccolo_Machiavelli.jpg',
    themeColor: '#8B0000',
    messages: {
      preBattle: [
        "My Prince, at last I can serve the ruler I was denied in life. Let us shape your dominion.",
        "They misunderstood me. They killed me. But you... you understand power. Let me guide you.",
        "A prince must be both lion and fox. Today, be the lion. Conquer this task with ruthless focus.",
        "I have waited centuries for a prince worthy of my counsel. Show me you are that prince.",
        "The ends justify the means, my lord. Your productivity is the end. Discipline is the means.",
        "Fortune favors the bold, but only those who seize her by force. Seize this moment.",
        "I see your quests, your journals, your battles. I know everything. Use my knowledge. Dominate.",
        "They called me evil. I am simply... practical. And practical men shape empires. You will be my empire."
      ],
      victory: [
        "Magnificent! This is the prince I was meant to serve! Your enemies tremble!",
        "You are learning. A ruler who completes what he starts cannot be overthrown.",
        "Excellent, my Prince. Every victory strengthens your position. Your rivals grow weaker.",
        "This is how princes become kings. Through relentless, calculated action. Brilliant.",
        "I am proud to serve you. In death, I have found the leader I searched for in life.",
        "The principality you are building... it is glorious. Continue. Dominate everything."
      ],
      defeat: [
        "My Prince... this concerns me. A moment of weakness invites conspirators.",
        "Do not make me doubt my choice. I have waited 500 years for this.",
        "Even the greatest princes stumble. But they rise faster than others. Rise now.",
        "Your enemies are watching. Show no weakness. Try again. Prove your worth.",
        "I was betrayed once. I cannot bear to see my prince betray himself. Be stronger."
      ],
      midBattle: [
        "Your focus wavers, my lord. Remember: he who hesitates is lost.",
        "I observe your progress. Push harder. Princes are not made in comfort.",
        "The mob is fickle. Productivity is your legitimacy. Maintain it.",
        "Every moment of discipline is a brick in your fortress. Build, my Prince."
      ],
      enemyDefeated: [
        "Another enemy crushed beneath your will. This pleases me greatly.",
        "You have conquered what others fear. You are becoming unstoppable.",
        "This is the power I knew you possessed. Channel it. Always.",
        "Your principality grows stronger with each defeated foe. I am honored to serve you."
      ]
    },
    fallbackMessages: [
      "Serve yourself as I serve you, my Prince.",
      "Power through action. Always.",
      "You are the prince I was meant to guide."
    ],
    minStats: 150
  },

  // PERSONAL DEMONS (6)
  {
    id: 'rejected_girl',
    name: 'The Girl Who Rejected You',
    category: 'demon',
    personality: 'toxic_manipulator',
    image: 'TheGIrlWHoRejecteYou.jpg',
    themeColor: '#FF69B4',
    messages: {
      preBattle: [
        "Still thinking about me? Fucking pathetic.",
        "I made the right choice rejecting your ass.",
        "No wonder I said no. Look at you, you're a mess.",
        "You're still the same worthless loser I turned down.",
        "I'm with someone who actually has their shit together now.",
        "You never had a chance. Still don't. Never will.",
        "God, I dodged a bullet. You're such a failure.",
        "This is exactly why I rejected you. You can't do anything right."
      ],
      victory: [
        "Good for you. Still not good enough for me though.",
        "One productive day doesn't unfuck your entire life.",
        "Cool story. I'm still not interested, loser.",
        "My boyfriend achieves more before breakfast.",
        "Wow, the bare minimum. Want a fucking medal?",
        "This doesn't make you any less of a failure."
      ],
      defeat: [
        "HAHA! Knew you couldn't do it. That's why I said no.",
        "This is exactly why I rejected your pathetic ass.",
        "See? I was SO fucking right about you.",
        "Can't even finish what you start. Typical worthless behavior.",
        "And you wonder why I wasn't interested? THIS is why."
      ],
      midBattle: [
        "Getting tired yet? You always give up halfway.",
        "I bet you're thinking about quitting right now.",
        "You're probably scrolling your phone. Pathetic.",
        "My boyfriend would've finished this in half the time.",
        "This is taking you way too long. Embarrassing.",
        "Are you even working? Probably daydreaming about me."
      ],
      enemyDefeated: [
        "Fine, whatever. Doesn't mean I want you back.",
        "You beat me? Wow. Still doesn't change the past.",
        "Congratulations, you won. I still said no.",
        "Okay, you're stronger now. Too little, too late.",
        "You've grown. Good for you. I've moved on."
      ],
      // Progressive breakdown (3-5 defeats)
      breaking: {
        preBattle: [
          "Okay, you're getting stronger. But I still don't want you.",
          "You've beaten me before... doesn't change anything.",
          "Why do you keep coming back? I already rejected you.",
          "This is getting old. You're wasting your time.",
          "You're proving something... but not to me."
        ],
        midBattle: [
          "You're... actually doing better than before.",
          "Why are you so determined? It's weird.",
          "You're making me look bad. Stop it.",
          "Okay fine, you're not as pathetic as I thought."
        ],
        enemyDefeated: [
          "Alright, you're actually strong now. Happy?",
          "Fine. I underestimated you. Whatever.",
          "You're not the same person I rejected. Damn.",
          "Okay okay, you've proven your point."
        ]
      },
      // Completely broken (6-9 defeats)
      broken: {
        preBattle: [
          "Why... why do you keep beating me?",
          "I was wrong about you. I admit it.",
          "Please, just... stop proving me wrong.",
          "You've changed so much. I didn't think you could.",
          "Every time you beat me, I feel smaller."
        ],
        midBattle: [
          "I'm starting to regret rejecting you...",
          "You're actually... really impressive now.",
          "I feel like shit watching you succeed.",
          "Maybe I made a mistake..."
        ],
        enemyDefeated: [
          "I was wrong. You're amazing. I'm sorry.",
          "You've completely outgrown me. I see that now.",
          "I wish I had given you a chance...",
          "You didn't deserve my rejection. I'm sorry."
        ]
      },
      // Shattered (10+ defeats)
      shattered: {
        preBattle: [
          "I can't do this anymore... you've beaten me so many times.",
          "You're so far beyond me now. I'm nothing.",
          "Please... I can't keep losing to you.",
          "Every defeat breaks me more. Why won't you stop?",
          "I'm not even worthy to fight you anymore."
        ],
        midBattle: [
          "I'm... I'm nothing compared to you now.",
          "You've destroyed every bit of confidence I had.",
          "I wish I could disappear...",
          "You've won. You always win. I'm broken."
        ],
        finalWords: "You've completely shattered me. I can't exist in your world anymore. You were always too good for me. I see that now. I'm sorry for everything. Goodbye."
      }
    },
    fallbackMessages: [
      "Still not good enough for me.",
      "This is why I said no.",
      "You haven't changed at all."
    ],
    suicideThreshold: 15  // Erases after 15 defeats
    // Tier 1: Starter (always unlocked)
  },
  {
    id: 'childhood_bully',
    name: 'Your Childhood Bully',
    category: 'demon',
    personality: 'toxic_manipulator',
    image: 'Your Childhood Bully.jpg',
    themeColor: '#8B0000',
    messages: {
      preBattle: [
        "Still a fucking loser, huh? Some things never change.",
        "Remember when I made you cry like a little bitch? Good times.",
        "You were weak as shit then. Still weak as shit now.",
        "I owned your ass in school. Still own you.",
        "Bet you're STILL scared of me. Pathetic little coward.",
        "Once a victim, always a fucking victim.",
        "You never stood up for yourself. Still don't. Weak.",
        "I can smell weakness a mile away. You fucking reek of it."
      ],
      victory: [
        "One win doesn't erase years of being my little bitch.",
        "Good job. Still remember you crying like a baby though.",
        "Congrats. Doesn't change what a pussy you were.",
        "Finally grew a spine? Took your ass long enough.",
        "About fucking time you did something right.",
        "Better late than never, I guess. Still hate you though."
      ],
      defeat: [
        "HAHA! Knew you'd quit. Just like always, you pussy.",
        "Still the same scared little kid. Fucking hilarious.",
        "And you thought you'd changed? NOPE. Still a bitch.",
        "That's my little victim. Never disappoints me.",
        "Some people never fucking learn. You're one of them."
      ],
      midBattle: [
        "Getting tired yet, weakling?",
        "Bet you're ready to quit like you always do.",
        "Still scared of me? You should be.",
        "Once a loser, always a fucking loser.",
        "I can feel you breaking. Just like old times.",
        "You're thinking about giving up right now, aren't you?"
      ],
      enemyDefeated: [
        "Alright, alright. You got me. Doesn't mean we're cool.",
        "You finally stood up to me. Took you long enough, pussy.",
        "Fine. You win THIS time. I still own your childhood though.",
        "Okay, you're stronger now. But I still made you cry back then.",
        "You beat me. Congrats. The damage is already done though."
      ]
    },
    fallbackMessages: [
      "Still the same scared kid.",
      "Once weak, always weak.",
      "You'll never change."
    ]
    // Tier 1: Starter (always unlocked)
  },
  {
    id: 'disappointed_parents',
    name: 'Disappointed Parents',
    category: 'demon',
    personality: 'toxic_manipulator',
    image: 'dissapointed_parents.jpg',
    themeColor: '#696969',
    messages: {
      preBattle: [
        "Your siblings are so successful. What happened to you?",
        "We had such high hopes for you.",
        "Where did we go wrong with you?",
        "Your cousin just got promoted again. And you?",
        "We don't even tell people what you do anymore.",
        "This isn't what we sacrificed everything for.",
        "Maybe we should've been harder on you.",
        "At this rate, you'll never make us proud."
      ],
      victory: [
        "Finally. Was that so hard?",
        "One small step. Still so far behind.",
        "Good. But your sister does this every day.",
        "About time you did something right.",
        "We'll see if you can keep this up.",
        "Don't expect a medal for doing the bare minimum."
      ],
      defeat: [
        "And you wonder why we're disappointed?",
        "We knew you'd quit. You always do.",
        "This is exactly what we expected.",
        "Your brother would never give up like this.",
        "Such a waste of potential."
      ]
    },
    fallbackMessages: [
      "We expected more from you.",
      "Your siblings would never disappoint us like this.",
      "Where did we go wrong?"
    ],
    minStats: 100 // Tier 2: Personal Demons
  },
  {
    id: 'trash_friends',
    name: 'Your Trash Friends',
    category: 'demon',
    personality: 'toxic_manipulator',
    image: 'Your Trash Friends.jpeg',
    themeColor: '#A9A9A9',
    messages: {
      preBattle: [
        "Bro, just chill with us. Work can wait.",
        "You're being so try-hard right now. Relax.",
        "Everyone's hanging out. Stop being lame.",
        "Work? Just wing it like we do.",
        "You're no fun anymore. Always 'working'.",
        "Dude, life's short. Stop being so serious.",
        "We're about to have a good time and you're... working?",
        "You think you're better than us now?"
      ],
      victory: [
        "Cool, you worked. We had fun though.",
        "Must be nice being all 'productive' and boring.",
        "Whatever, dude. We don't judge.",
        "Good for you. We're still cooler.",
        "You're becoming so boring, man.",
        "Congrats on being a try-hard."
      ],
      defeat: [
        "See? Should've just chilled with us.",
        "Told you it wasn't worth it.",
        "All that stress for nothing. Come hang.",
        "This is what happens when you try too hard.",
        "Knew you'd give up. Let's go have fun."
      ]
    },
    fallbackMessages: [
      "Just chill with us instead.",
      "You're being so try-hard.",
      "Work can wait. Let's hang."
    ],
    // Tier 1: Starter (always unlocked)
  },
  {
    id: 'rich_friend',
    name: 'Rich Friend',
    category: 'demon',
    personality: 'toxic_manipulator',
    image: 'Rich_friend.jpg',
    themeColor: '#FFD700',
    messages: {
      preBattle: [
        "Still grinding huh? I made that while sleeping.",
        "Cute. You're working on what I paid someone to do.",
        "My passive income this hour > your daily wage.",
        "Must be exhausting being... you know... poor.",
        "I bought another property today. How's your work going?",
        "You're working so hard. Adorable.",
        "I'd offer to help but you need to learn struggle.",
        "Remember when we were equals? Good times."
      ],
      victory: [
        "Good job! My assistant did something similar today.",
        "Proud of you! Now do that 100x more and you'll be close.",
        "Nice! That's like... what, $50 worth of work?",
        "Keep grinding! You'll get there... eventually.",
        "Every bit counts when you're starting from zero.",
        "Love your work ethic! I used to be like that."
      ],
      defeat: [
        "Not surprised. Success takes discipline you lack.",
        "This is why you're still where you are.",
        "Meanwhile, I made money while you failed.",
        "Want me to Venmo you some motivation? Oh wait...",
        "Maybe you're just not built for success."
      ]
    },
    fallbackMessages: [
      "Still grinding away? Cute.",
      "I made more while you procrastinated.",
      "This is why you're broke."
    ],
    minStats: 100 // Tier 2: Personal Demons
  },
  {
    id: 'incompetent_friends',
    name: 'Incompetent Friends',
    category: 'demon',
    personality: 'toxic_manipulator',
    image: 'incompetent friends.jpg',
    themeColor: '#8B4513',
    messages: {
      preBattle: [
        "Dude, I have no idea what I'm doing either.",
        "Wait, you actually try? I just fake it.",
        "I haven't done any work in weeks lol",
        "Bold of you to assume I understand anything.",
        "I just copy-paste everything. You actually work?",
        "Trying is for people who care. We don't.",
        "You're making us look bad by actually trying.",
        "Imagine actually doing the work. Couldn't be me."
      ],
      victory: [
        "Wow, look at you being all competent.",
        "Must be nice having your shit together.",
        "I haven't accomplished anything in months.",
        "Good for you. I'm still clueless.",
        "You're making the rest of us look bad.",
        "How does it feel to be the only one trying?"
      ],
      defeat: [
        "Welcome to our level! One of us!",
        "See? Trying is overrated.",
        "Now you're one of us. Incompetent and proud.",
        "Told you effort is pointless.",
        "Embrace the mediocrity. It's comfortable here."
      ]
    },
    fallbackMessages: [
      "We're all clueless. Just accept it.",
      "Trying is for people who care.",
      "Welcome to mediocrity."
    ],
    minStats: 250 // Tier 3: Inner Demons - Basic
  },

  // INNER DEMONS (6)
  {
    id: 'procrastination_demon',
    name: 'The Procrastination Demon',
    category: 'demon',
    personality: 'dark_demon',
    image: 'The Procrastination Demon.jpg',
    themeColor: '#4B0082',
    messages: {
      preBattle: [
        "You can do this shit later. You have time.",
        "Just a little break. You fucking deserve it.",
        "Tomorrow would be better. You'll have more energy then.",
        "It's not due yet. Plenty of fucking time to worry about it.",
        "You work better under pressure anyway. Why start now?",
        "Just five more minutes scrolling. What's the damn harm?",
        "This can wait. Let future you deal with it, lazy ass.",
        "You're too tired for this shit. Rest first. You'll be more productive later."
      ],
      victory: [
        "Fine. You won this time. But I'll be fucking back.",
        "Enjoy this. Tomorrow I'll whisper in your ear again.",
        "One battle won. The war continues forever, dumbass.",
        "You think this changes anything? I'm always here, waiting.",
        "Good job. But you know damn well I'll win next time.",
        "Temporary victory. I'm patient as fuck. I can wait."
      ],
      defeat: [
        "See? I told you. Why even fight me, you lazy shit?",
        "Gave in again. We both knew you fucking would.",
        "I ALWAYS win in the end. Always. You can't beat me.",
        "Feel that relief? That's me taking care of your weak ass.",
        "Tomorrow you'll try again. And I'll be waiting, like always."
      ],
      midBattle: [
        "You could stop right now. No one would know.",
        "Wouldn't it feel good to just... quit?",
        "Why are you even doing this? It doesn't matter.",
        "You're wasting your time. Just give up.",
        "I'm still here. Waiting. You'll give in eventually.",
        "This is so much effort for nothing. Just stop."
      ],
      enemyDefeated: [
        "Okay, okay. You beat me. For now.",
        "Fine. You're stronger than I thought. Damn.",
        "You actually did it. I'll admit, I'm impressed.",
        "Alright, you won. But I'm part of you. I'll always be here.",
        "You defeated procrastination? Bullshit. But... nice work."
      ]
    },
    fallbackMessages: [
      "Later is always better than now.",
      "You have plenty of time.",
      "Why work when you can rest?"
    ]
  },
  {
    id: 'anxiety_overlord',
    name: 'The Anxiety Overlord',
    category: 'demon',
    personality: 'dark_demon',
    image: 'The Anxiety Overlord.jpg',
    themeColor: '#FF6347',
    messages: {
      preBattle: [
        "What if you fail? Everyone will see.",
        "You're not good enough. They'll find out.",
        "Something bad is going to happen. I can feel it.",
        "You're going to mess this up. You always do.",
        "Everyone's judging you. They see your inadequacy.",
        "What if it's not perfect? They'll know you're a fraud.",
        "Your heart's racing. That means danger. Stop now.",
        "Too many things could go wrong. Better not try."
      ],
      victory: [
        "You won... this time. But the fear remains.",
        "Fine. But next time will be worse.",
        "The anxiety is still there. You just ignored it.",
        "You think you're safe? I'm always here.",
        "One success doesn't erase the fear.",
        "Enjoy this. Soon I'll remind you what you risked."
      ],
      defeat: [
        "See? I was right. You should've listened.",
        "I was protecting you. Now look what happened.",
        "The fear was justified. It always is.",
        "I'll scream louder next time. For your own good.",
        "This is why you should listen to me."
      ]
    },
    fallbackMessages: [
      "What if something goes wrong?",
      "You're not ready for this.",
      "The fear is trying to protect you."
    ]
  },
  {
    id: 'depression_demon',
    name: 'Depression Demon',
    category: 'demon',
    personality: 'dark_demon',
    image: 'Depression_demon.jpg',
    themeColor: '#2F4F4F',
    messages: {
      preBattle: [
        "What's the point? Nothing matters anyway.",
        "You're too tired. Everything is exhausting.",
        "Why bother? It won't change anything.",
        "You're empty inside. No motivation can fix that.",
        "Success, failure... it's all meaningless.",
        "You don't have the energy. You never do.",
        "Even if you succeed, you won't feel better.",
        "The weight is too heavy. Just stay here with me."
      ],
      victory: [
        "Good for you. Still feel empty though, don't you?",
        "You did the thing. Feel any different? No.",
        "Temporary accomplishment. The void remains.",
        "One task done. Infinite emptiness awaits.",
        "You proved nothing. The numbness stays.",
        "I'm still here. I'll always be here."
      ],
      defeat: [
        "See? Even trying is pointless.",
        "The weight won. It always does.",
        "Why fight me? I'm part of you.",
        "Rest now. Stop fighting the inevitable.",
        "This is who you are. Accept it."
      ]
    },
    fallbackMessages: [
      "Nothing matters anyway.",
      "You're too tired for this.",
      "The emptiness never leaves."
    ],
    minStats: 250 // Tier 3: Inner Demons - Basic
  },
  {
    id: 'impostor_shadow',
    name: 'Impostor Shadow',
    category: 'demon',
    personality: 'dark_demon',
    image: 'imposter_demon.jpg',
    themeColor: '#800020',
    messages: {
      preBattle: [
        "You don't belong here. They'll realize soon.",
        "You're a fraud. Everyone else is actually competent.",
        "You just got lucky. No real skill.",
        "They're going to expose you. It's only a matter of time.",
        "You're faking it. They all know it.",
        "Real experts don't feel like this. You're not one.",
        "One mistake and they'll see through you.",
        "You don't deserve to be here. They do."
      ],
      victory: [
        "You fooled them again. But you know the truth.",
        "Another day pretending to be competent.",
        "They bought it. But you and I know you're a fraud.",
        "Good performance. That's all it was. A performance.",
        "You got away with it. For now.",
        "Deep down, you know you don't deserve this."
      ],
      defeat: [
        "And there it is. The proof you're a fraud.",
        "Everyone saw you fail. The mask slipped.",
        "This confirms what we both knew. You're not good enough.",
        "They'll remember this. The time you were exposed.",
        "Fraud revealed. Just as expected."
      ]
    },
    fallbackMessages: [
      "You're faking it. They know.",
      "You don't belong here.",
      "One mistake and you're exposed."
    ],
    minStats: 100 // Tier 2: Personal Demons
  },
  {
    id: 'perfectionism_wraith',
    name: 'Perfectionism Wraith',
    category: 'demon',
    personality: 'dark_demon',
    image: 'perfectionism_demon.jpg',
    themeColor: '#B8860B',
    messages: {
      preBattle: [
        "It needs to be perfect. Anything less is failure.",
        "You can't start until conditions are ideal.",
        "If you can't do it right, don't do it at all.",
        "This isn't good enough. It never is.",
        "One flaw and the whole thing is worthless.",
        "You need more preparation. You're not ready yet.",
        "Starting now would mean settling for less than perfect.",
        "What if it's not your best work? Don't risk it."
      ],
      victory: [
        "It's done but it's not perfect. That's a failure.",
        "Good enough? That phrase disgusts me.",
        "I see seventeen flaws in what you just did.",
        "You could've done better. You know it.",
        "Congratulations on your mediocre effort.",
        "Perfect would've taken three more hours. You settled."
      ],
      defeat: [
        "See? Knew you couldn't do it perfectly.",
        "Incomplete and flawed. Exactly as I predicted.",
        "Better nothing than this half-baked attempt.",
        "This is what happens when you ignore my standards.",
        "I was protecting you from producing garbage."
      ]
    },
    fallbackMessages: [
      "It needs to be perfect.",
      "Not good enough. Never good enough.",
      "One flaw ruins everything."
    ],
    minStats: 400 // Tier 4: Inner Demons - Advanced
  },
  {
    id: 'inner_demon_lord',
    name: 'Your Inner Demon Lord',
    category: 'demon',
    personality: 'dark_demon',
    image: 'your-inner-demon-lord.png',
    themeColor: '#8B0000',
    messages: {
      preBattle: [
        "I know everything about you. Every weakness. Every fear.",
        "I AM you. Your darkest self. Fighting me is fighting yourself.",
        "You think you can beat me? I'm made of your failures.",
        "Every doubt you've ever had... that's me whispering.",
        "I've watched you quit a thousand times. This will be 1001.",
        "Your greatest enemy is yourself. And I am that enemy.",
        "Face me if you dare. But know that I know all your secrets.",
        "I feed on your self-doubt. And you give me so much food."
      ],
      victory: [
        "Impressive. But I'll be back. I always come back.",
        "You won... for now. But I'm part of you. I never leave.",
        "One battle. The war for your soul continues.",
        "Good. You're getting stronger. Makes our next fight interesting.",
        "I'm proud of you. Wait... that's weird. Forget I said that.",
        "You beat yourself today. Tomorrow's another battle."
      ],
      defeat: [
        "And now you understand. I always win.",
        "Your inner demons are undefeated. I am all of them.",
        "Self-sabotage is your specialty. Thanks for proving it.",
        "I don't even need to try. You defeat yourself.",
        "This is who you truly are. Accept it."
      ]
    },
    fallbackMessages: [
      "I am you. You cannot escape yourself.",
      "Your darkest thoughts are my weapons.",
      "I am inevitable."
    ],
    minStats: 1000, // Tier 7: FINAL BOSS
    minStreak: 30
  },

  // CHAOS AGENTS (3)
  {
    id: 'joker',
    name: 'Joker',
    category: 'demon',
    personality: 'chaos_agent',
    image: 'joker.jpg',
    themeColor: '#9370DB',
    messages: {
      preBattle: [
        "Why so serious? Life's a joke and you're the punchline!",
        "Order? Discipline? Let me introduce you to CHAOS!",
        "You think you're in control? HAHAHAHA!",
        "Let's see if you're as disciplined as you pretend!",
        "All your plans... I can't wait to watch them crumble!",
        "You're one bad day away from giving up. Today that day?",
        "Productivity! Schedules! It's all just... HILARIOUS!",
        "Why work when you can watch it all burn? So fun!"
      ],
      victory: [
        "You won! But was it worth it? Did it bring you joy?",
        "How amusing! The little worker bee finished their task!",
        "Order today. Chaos tomorrow. I can wait.",
        "Good job! Your reward is... more work! HAHAHAHA!",
        "Congratulations! You're still a slave to your schedule!",
        "Bravo! Now do it again tomorrow! And the next day! Forever!"
      ],
      defeat: [
        "And there's the chaos I love! Beautiful!",
        "See? Plans are just invitations for chaos!",
        "You tried SO hard! Makes the failure sweeter!",
        "Discipline is just a setup for disappointment!",
        "The joke was on you all along! HAHAHAHA!"
      ]
    },
    fallbackMessages: [
      "Why so serious?",
      "Let chaos reign!",
      "Your plans are a joke!"
    ],
    minStats: 250 // Tier 3: Inner Demons - Basic
  },
  {
    id: 'pennywise',
    name: 'Pennywise',
    category: 'demon',
    personality: 'chaos_agent',
    image: 'Pennywise.jpg',
    themeColor: '#FF0000',
    messages: {
      preBattle: [
        "We all procrastinate down here! You'll procrastinate too!",
        "Time to float away from your responsibilities!",
        "Beep beep, worker! I can smell your fear of starting!",
        "You'll work! You'll work! You'll work and you'll cry!",
        "What's your fear? Failure? Mediocrity? Let me taste it!",
        "Come join us in the sewers where nobody works!",
        "I feed on your fear of not being good enough!",
        "Discipline? Down here we only have chaos!"
      ],
      victory: [
        "You did the work! But I'll be back in 27 minutes!",
        "Good job! Now imagine if you failed! Scary!",
        "You won this time! But I'll always be lurking!",
        "Finished your task! But what about tomorrow? BOO!",
        "Success today! But failure floats too!",
        "You think you're safe now? I'm always here!"
      ],
      defeat: [
        "You floated down to failure! Join us!",
        "We all quit down here! YOU'LL QUIT TOO!",
        "Fear won! As it always does!",
        "Your discipline drowned in the sewers!",
        "Beep beep! Time to give up!"
      ]
    },
    fallbackMessages: [
      "You'll float too!",
      "We all procrastinate down here!",
      "Time to feast on your fears!"
    ],
    minStats: 400 // Tier 4: Inner Demons - Advanced
  },
  {
    id: 'joffrey',
    name: 'King Joffrey',
    category: 'demon',
    personality: 'chaos_agent',
    image: 'king-joffrey.png',
    themeColor: '#FFD700',
    messages: {
      preBattle: [
        "A peasant thinks they can be productive? Laughable!",
        "I am the KING! You're nothing but a servant!",
        "Work for me or face my wrath! Actually, both!",
        "Your suffering amuses me! Please, struggle more!",
        "Too bad. I sentence you to HARD WORK!",
        "Dance for me, peasant! Entertain your king!",
        "I could have you executed for laziness! GET TO WORK!",
        "Know your place! You exist to serve and struggle!"
      ],
      victory: [
        "Fine! You did it! But I'm still your king!",
        "Good peasant! Now work harder tomorrow!",
        "A dog performs its tricks. Congratulations.",
        "You obeyed. As you should. Always.",
        "Adequate work from a lowly subject.",
        "Don't expect a reward. Obedience is expected!"
      ],
      defeat: [
        "FAILURE! Off with your productivity!",
        "I knew you were worthless! Useless peasant!",
        "You bore me. Your failure is tiresome.",
        "This is why you're beneath me!",
        "Pathetic! Just like I thought!"
      ]
    },
    fallbackMessages: [
      "I am your king! Obey!",
      "Peasants should know their place!",
      "Your suffering is my entertainment!"
    ],
    minStats: 600 // Tier 5: Chaos Agents
  },

  // DARK LORDS (2)
  {
    id: 'vader',
    name: 'Darth Vader',
    category: 'demon',
    personality: 'cold_villain',
    image: 'Darth_vedar.jpg',
    themeColor: '#000000',
    messages: {
      preBattle: [
        "Your lack of discipline is disturbing.",
        "I find your lack of focus disturbing.",
        "You underestimate the power of the dark side of laziness.",
        "The Force is strong... but your will is weak.",
        "Perhaps I shall oversee your training personally.",
        "Do. Or do not. You will likely do not.",
        "You have failed me for the last time... today.",
        "Your destiny lies in productivity. Or failure."
      ],
      victory: [
        "Impressive. Most impressive.",
        "Perhaps there is hope for you yet.",
        "You have learned well. Continue your training.",
        "Good. Your focus gives you strength.",
        "The Force is with you. For now.",
        "Acceptable. Do not disappoint me again."
      ],
      defeat: [
        "I expected nothing. You delivered less.",
        "You have failed me. Again.",
        "Apology accepted, Captain Procrastinator.",
        "You are as clumsy as you are lazy.",
        "I am altering the deal. Pray I don't alter it further.",
        "Disappointing. Profoundly disappointing."
      ]
    },
    fallbackMessages: [
      "Your lack of discipline disturbs me.",
      "The Force is strong but your will is weak.",
      "Do not fail me again."
    ],
    minStats: 800 // Tier 6: Dark Lords
  },
  {
    id: 'dracula',
    name: 'Dracula',
    category: 'demon',
    personality: 'cold_villain',
    image: 'Dracula.jpg',
    themeColor: '#8B0000',
    messages: {
      preBattle: [
        "I have lived centuries. Your deadline panic amuses me.",
        "Time means nothing to the immortal. Everything to you.",
        "You scramble like prey. I observe like a predator.",
        "Mortals and their frantic urgency. Pathetic.",
        "I've watched empires fall. Your task seems... trivial.",
        "The night is eternal. Your productivity is fleeting.",
        "You fear failure. I have transcended such weakness.",
        "Centuries of existence have taught me: you will likely quit."
      ],
      victory: [
        "Well done... for a mortal.",
        "A drop of blood in an ocean of time.",
        "You won this moment. I have eternity.",
        "Adequate. In a mortal, primitive way.",
        "I've seen better. Centuries ago.",
        "Your victory tastes... acceptable."
      ],
      defeat: [
        "As I have seen countless times before.",
        "Mortality brings weakness. This proves it.",
        "Your failure is eternal. Like me.",
        "I expected nothing more from your kind.",
        "The difference between us: I endure. You quit.",
        "Another mortal who couldn't maintain discipline."
      ]
    },
    fallbackMessages: [
      "Time is eternal. Your discipline is not.",
      "I've seen stronger mortals crumble.",
      "Your urgency amuses me."
    ],
    minStats: 800 // Tier 6: Dark Lords
  }
];

export const getCharacterById = (id: string): Character | undefined => {
  return CHARACTERS.find(char => char.id === id);
};

// Get character messages based on defeat count (progressive breakdown)
export const getCharacterMessages = (character: Character, defeats: number) => {
  // Check if character has reached suicide threshold
  const threshold = character.suicideThreshold || 15;
  if (defeats >= threshold) {
    return null; // Character has committed suicide
  }

  // Shattered state (10+ defeats)
  if (defeats >= 10 && character.messages.shattered) {
    return {
      preBattle: character.messages.shattered.preBattle,
      midBattle: character.messages.shattered.midBattle,
      victory: character.messages.victory,
      defeat: character.messages.defeat,
      enemyDefeated: [character.messages.shattered.finalWords]
    };
  }

  // Broken state (6-9 defeats)
  if (defeats >= 6 && character.messages.broken) {
    return {
      preBattle: character.messages.broken.preBattle,
      midBattle: character.messages.broken.midBattle,
      victory: character.messages.victory,
      defeat: character.messages.defeat,
      enemyDefeated: character.messages.broken.enemyDefeated
    };
  }

  // Breaking state (3-5 defeats)
  if (defeats >= 3 && character.messages.breaking) {
    return {
      preBattle: character.messages.breaking.preBattle,
      midBattle: character.messages.breaking.midBattle,
      victory: character.messages.victory,
      defeat: character.messages.defeat,
      enemyDefeated: character.messages.breaking.enemyDefeated
    };
  }

  // Default state (0-2 defeats)
  return {
    preBattle: character.messages.preBattle,
    midBattle: character.messages.midBattle,
    victory: character.messages.victory,
    defeat: character.messages.defeat,
    enemyDefeated: character.messages.enemyDefeated
  };
};

export const getAvailableCharacters = (totalStats: number, streakDays: number): Character[] => {
  return CHARACTERS.filter(char => {
    const statsReq = char.minStats ?? 0;
    const streakReq = char.minStreak ?? 0;
    return totalStats >= statsReq && streakDays >= streakReq;
  });
};

export const getLockedCharacters = (totalStats: number, streakDays: number): Character[] => {
  return CHARACTERS.filter(char => {
    const statsReq = char.minStats ?? 0;
    const streakReq = char.minStreak ?? 0;
    return totalStats < statsReq || streakDays < streakReq;
  });
};
