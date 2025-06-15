const EMOJI_CATEGORIES = {
  happy: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
  sad: ['😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬'],
  love: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆'],
  food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦']
};

const EMOJIS = ([] as string[]).concat(...Object.values(EMOJI_CATEGORIES));

/**
 * 返回一个随机的表情符号
 * @param {string} category - 可选的表情符号类别: 'happy', 'sad', 'love', 'animals', 'food', 'all'
 * @returns {string} 随机表情符号
 */
export function randomEmoji(category = 'all') {
  // 确定使用哪个表情符号集合
  let emojis: string[];
  if (category === 'all') {
    // 合并所有类别
    emojis = EMOJIS;
  } else if (category in EMOJI_CATEGORIES) {
    emojis = EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES];
  } else {
    // 如果类别不存在，使用所有表情符号
    emojis = EMOJIS;
    console.warn(`类别 "${category}" 不存在`);
  }
  
  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}
