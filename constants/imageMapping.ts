// Image mapping for character images
// React Native requires static image imports

export const characterImages: Record<string, any> = {
  'David-Goggins.jpg': require('../images/David-Goggins.jpg'),
  'Jordan_peterson.jpg': require('../images/Jordan_peterson.jpg'),
  'Naval_Ravikant).jpg': require('../images/Naval_Ravikant).jpg'),
  'Niccolo_Machiavelli.jpg': require('../images/Niccolo_Machiavelli.jpg'),
  'TheGIrlWHoRejecteYou.jpg': require('../images/TheGIrlWHoRejecteYou.jpg'),
  'Your Childhood Bully.jpg': require('../images/Your Childhood Bully.jpg'),
  'dissapointed_parents.jpg': require('../images/dissapointed_parents.jpg'),
  'Your Trash Friends.jpeg': require('../images/Your Trash Friends.jpeg'),
  'Rich_friend.jpg': require('../images/Rich_friend.jpg'),
  'incompetent friends.jpg': require('../images/incompetent friends.jpg'),
  'The Procrastination Demon.jpg': require('../images/The Procrastination Demon.jpg'),
  'The Anxiety Overlord.jpg': require('../images/The Anxiety Overlord.jpg'),
  'Depression_demon.jpg': require('../images/Depression_demon.jpg'),
  'imposter_demon.jpg': require('../images/imposter_demon.jpg'),
  'perfectionism_demon.jpg': require('../images/perfectionism_demon.jpg'),
  'your-inner-demon-lord.png': require('../images/your-inner-demon-lord.png'),
  'joker.jpg': require('../images/joker.jpg'),
  'Pennywise.jpg': require('../images/Pennywise.jpg'),
  'king-joffrey.png': require('../images/king-joffrey.png'),
  'Darth_vedar.jpg': require('../images/Darth_vedar.jpg'),
  'Dracula.jpg': require('../images/Dracula.jpg'),
};

export const getCharacterImage = (filename: string): any => {
  return characterImages[filename] || characterImages['David-Goggins.jpg'];
};
