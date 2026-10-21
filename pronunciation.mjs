const vowels = Object.fromEntries([..."అఆఇఈఉఊఋౠఌౡఎఏఐఒఓఔ"].map((letter, i) => [letter, ["a", "aa", "i", "ee", "u", "oo", "ru", "roo", "lu", "loo", "e", "ae", "ai", "o", "oa", "au"][i]]));
const consonants = Object.fromEntries([..."కఖగఘఙచఛజఝఞటఠడఢణతథదధనపఫబభమయరఱలళవశషసహ"].map((letter, i) => [letter, ["k", "kh", "g", "gh", "ng", "ch", "chh", "j", "jh", "ny", "t", "th", "d", "dh", "n", "t", "th", "d", "dh", "n", "p", "ph", "b", "bh", "m", "y", "r", "r", "l", "l", "v", "sh", "sh", "s", "h"][i]]));
const marks = Object.fromEntries([..."ాిీుూృౄౢౣెేైొోౌ"].map((letter, i) => [letter, ["aa", "i", "ee", "u", "oo", "ru", "roo", "lu", "loo", "e", "ae", "ai", "o", "oa", "au"][i]]));
const signs = { "ం": "m", "ః": "h", "ఁ": "m", "్": "", "\u200c": "", "\u200d": "", "ఽ": "'" };

export function pronounceTelugu(value) {
  const letters = [...value.normalize("NFC").replaceAll("ఓం", "Om")];
  return letters.map((letter, index) => {
    if (consonants[letter]) {
      let next = index + 1;
      while (letters[next] === "\u200c" || letters[next] === "\u200d") next++;
      return consonants[letter] + (letters[next] === "్" || marks[letters[next]] !== undefined ? "" : "a");
    }
    if (/[౦-౯]/.test(letter)) return String(letter.charCodeAt(0) - 0x0c66);
    return vowels[letter] ?? marks[letter] ?? signs[letter] ?? letter;
  }).join("");
}
