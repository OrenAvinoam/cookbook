const MINOR_WORDS = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up","as","is","vs"]);

export function titleCase(text) {
  if (!text) return text;
  return text
    .split(" ")
    .map((word, i) => {
      if (!word) return word;
      if (i > 0 && MINOR_WORDS.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function sentenceCase(text) {
  if (!text) return text;
  return text
    .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())
    .replace(/\bi\b/g, "I");
}
