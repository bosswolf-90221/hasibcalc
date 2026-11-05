// Arabic-tolerant search shared by the home page and /search/: spelling variants and diacritics do not matter.
export const norm = (s: string) =>
  s.toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();

/** The words of a query, without the definite article. */
export const queryWords = (q: string) => norm(q).split(/\s+/).map((w) => w.replace(/^ال/, '')).filter(Boolean);

/** Every word must appear somewhere in the already normalised text. */
export const matches = (words: string[], normalisedText: string) => words.every((w) => normalisedText.includes(w));
