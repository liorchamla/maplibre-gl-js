import {unicodeBlockLookup as isChar} from './is_char_in_unicode_block';

export function allowsIdeographicBreaking(chars: string) {
    for (const char of chars) {
        if (!charAllowsIdeographicBreaking(char.charCodeAt(0))) return false;
    }
    return true;
}

export function allowsVerticalWritingMode(chars: string) {
    for (const char of chars) {
        if (charHasUprightVerticalOrientation(char.charCodeAt(0))) return true;
    }
    return false;
}

export function allowsLetterSpacing(chars: string) {
    for (const char of chars) {
        if (!charAllowsLetterSpacing(char.charCodeAt(0))) return false;
    }
    return true;
}

/**
 * Returns a regular expression matching the given script codes, excluding any
 * code that the execution environment lacks support for in regular expressions.
 */
function sanitizedRegExpFromScriptCodes(scriptCodes: Array<string>): RegExp {
    const supportedPropertyEscapes = scriptCodes.map(code => {
        try {
            return new RegExp(`\\p{sc=${code}}`, 'u').source;
        } catch {
            return null;
        }
    }).filter(pe => pe);
    return new RegExp(supportedPropertyEscapes.join('|'), 'u');
}

/**
 * ISO 15924 script codes of scripts that disallow letter spacing as of Unicode
 * 16.0.0.
 *
 * In general, cursive scripts are incompatible with letter spacing.
 */
const cursiveScriptCodes = [
    'Arab', // Arabic
    'Dupl', // Duployan
    'Mong', // Mongolian
    'Ougr', // Old Uyghur
    'Syrc', // Syriac
];

const cursiveScriptRegExp = sanitizedRegExpFromScriptCodes(cursiveScriptCodes);

export function charAllowsLetterSpacing(char: number) {
    return !cursiveScriptRegExp.test(String.fromCodePoint(char));
}

/**
 * ISO 15924 script codes of scripts that allow ideographic line breaking beyond
 * the CJKV scripts that are considered ideographic in Unicode 16.0.0.
 */
const ideographicBreakingScriptCodes = [
    'Bopo', // Bopomofo
    'Hani', // Han
    'Hira', // Hiragana
    'Kana', // Katakana
    'Kits', // Khitan Small Script
    'Nshu', // Nushu
    'Tang', // Tangut
    'Yiii', // Yi
];

const ideographicBreakingRegExp = sanitizedRegExpFromScriptCodes(ideographicBreakingScriptCodes);

export function charAllowsIdeographicBreaking(char: number) {
    // Return early for characters outside all ideographic ranges.
    if (char < 0x2E80) return false;

    if (isChar['CJK Compatibility Forms'](char)) return true;
    if (isChar['CJK Compatibility'](char)) return true;
    if (isChar['CJK Strokes'](char)) return true;
    if (isChar['CJK Symbols and Punctuation'](char)) return true;
    if (isChar['Enclosed CJK Letters and Months'](char)) return true;
    if (isChar['Halfwidth and Fullwidth Forms'](char)) return true;
    if (isChar['Ideographic Description Characters'](char)) return true;
    if (isChar['Vertical Forms'](char)) return true;
    return ideographicBreakingRegExp.test(String.fromCodePoint(char));
}

// The following logic comes from
// <https://www.unicode.org/Public/16.0.0/ucd/VerticalOrientation.txt>.
// Keep it synchronized with
// <https://www.unicode.org/Public/UCD/latest/ucd/VerticalOrientation.txt>.
// The data file denotes with “U” or “Tu” any codepoint that may be drawn
// upright in vertical text but does not distinguish between upright and
// “neutral” characters.

// Blocks in the Unicode supplementary planes are excluded from this module due
// to <https://github.com/mapbox/mapbox-gl/issues/29>.

/**
 * Returns true if the given Unicode codepoint identifies a character with
 * upright orientation.
 *
 * A character has upright orientation if it is drawn upright (unrotated)
 * whether the line is oriented horizontally or vertically, even if both
 * adjacent characters can be rotated. For example, a Chinese character is
 * always drawn upright. An uprightly oriented character causes an adjacent
 * “neutral” character to be drawn upright as well.
 */
export function charHasUprightVerticalOrientation(char: number) {
    if (char === 0x02EA /* modifier letter yin departing tone mark */ ||
        char === 0x02EB /* modifier letter yang departing tone mark */) {
        return true;
    }

    // Return early for characters outside all ranges whose characters remain
    // upright in vertical writing mode.
    if (char < 0x1100) return false;

    if (isChar['CJK Compatibility Forms'](char)) {
        if (!((char >= 0xFE49 /* dashed overline */ && char <= 0xFE4F) /* wavy low line */)) {
            return true;
        }
    }
    if (isChar['CJK Compatibility'](char)) return true;
    if (isChar['CJK Strokes'](char)) return true;
    if (isChar['CJK Symbols and Punctuation'](char)) {
        if (!((char >= 0x3008 /* left angle bracket */ && char <= 0x3011) /* right black lenticular bracket */) &&
            !((char >= 0x3014 /* left tortoise shell bracket */ && char <= 0x301F) /* low double prime quotation mark */) &&
            char !== 0x3030 /* wavy dash */) {
            return true;
        }
    }
    if (isChar['Enclosed CJK Letters and Months'](char)) return true;
    if (isChar['Ideographic Description Characters'](char)) return true;
    if (isChar['Kanbun'](char)) return true;
    if (isChar['Katakana'](char)) {
        if (char !== 0x30FC /* katakana-hiragana prolonged sound mark */) {
            return true;
        }
    }
    if (isChar['Halfwidth and Fullwidth Forms'](char)) {
        if (char !== 0xFF08 /* fullwidth left parenthesis */ &&
            char !== 0xFF09 /* fullwidth right parenthesis */ &&
            char !== 0xFF0D /* fullwidth hyphen-minus */ &&
            !((char >= 0xFF1A /* fullwidth colon */ && char <= 0xFF1E) /* fullwidth greater-than sign */) &&
            char !== 0xFF3B /* fullwidth left square bracket */ &&
            char !== 0xFF3D /* fullwidth right square bracket */ &&
            char !== 0xFF3F /* fullwidth low line */ &&
            !(char >= 0xFF5B /* fullwidth left curly bracket */ && char <= 0xFFDF) &&
            char !== 0xFFE3 /* fullwidth macron */ &&
            !(char >= 0xFFE8 /* halfwidth forms light vertical */ && char <= 0xFFEF)) {
            return true;
        }
    }
    if (isChar['Small Form Variants'](char)) {
        if (!((char >= 0xFE58 /* small em dash */ && char <= 0xFE5E) /* small right tortoise shell bracket */) &&
            !((char >= 0xFE63 /* small hyphen-minus */ && char <= 0xFE66) /* small equals sign */)) {
            return true;
        }
    }
    if (isChar['Vertical Forms'](char)) return true;
    if (isChar['Yijing Hexagram Symbols'](char)) return true;

    if (/* Canadian Aboriginal */ /\p{sc=Cans}/u.test(String.fromCodePoint(char))) return true;
    if (/* Hangul */ /\p{sc=Hang}/u.test(String.fromCodePoint(char))) return true;
    if (ideographicBreakingRegExp.test(String.fromCodePoint(char))) return true;

    return false;
}

/**
 * Returns true if the given Unicode codepoint identifies a character with
 * neutral orientation.
 *
 * A character has neutral orientation if it may be drawn rotated or unrotated
 * when the line is oriented vertically, depending on the orientation of the
 * adjacent characters. For example, along a vertically oriented line, the vulgar
 * fraction ½ is drawn upright among Chinese characters but rotated among Latin
 * letters. A neutrally oriented character does not influence whether an
 * adjacent character is drawn upright or rotated.
 */
export function charHasNeutralVerticalOrientation(char: number) {
    if (isChar['Latin-1 Supplement'](char)) {
        if (char === 0x00A7 /* section sign */ ||
            char === 0x00A9 /* copyright sign */ ||
            char === 0x00AE /* registered sign */ ||
            char === 0x00B1 /* plus-minus sign */ ||
            char === 0x00BC /* vulgar fraction one quarter */ ||
            char === 0x00BD /* vulgar fraction one half */ ||
            char === 0x00BE /* vulgar fraction three quarters */ ||
            char === 0x00D7 /* multiplication sign */ ||
            char === 0x00F7 /* division sign */) {
            return true;
        }
    }
    if (isChar['General Punctuation'](char)) {
        if (char === 0x2016 /* double vertical line */ ||
            char === 0x2020 /* dagger */ ||
            char === 0x2021 /* double dagger */ ||
            char === 0x2030 /* per mille sign */ ||
            char === 0x2031 /* per ten thousand sign */ ||
            char === 0x203B /* reference mark */ ||
            char === 0x203C /* double exclamation mark */ ||
            char === 0x2042 /* asterism */ ||
            char === 0x2047 /* double question mark */ ||
            char === 0x2048 /* question exclamation mark */ ||
            char === 0x2049 /* exclamation question mark */ ||
            char === 0x2051 /* two asterisks aligned vertically */) {
            return true;
        }
    }
    if (isChar['Letterlike Symbols'](char)) return true;
    if (isChar['Number Forms'](char)) return true;
    if (isChar['Miscellaneous Technical'](char)) {
        if ((char >= 0x2300 /* diameter sign */ && char <= 0x2307 /* wavy line */) ||
            (char >= 0x230C /* bottom right crop */ && char <= 0x231F /* bottom right corner */) ||
            (char >= 0x2324 /* up arrowhead between two horizontal bars */ && char <= 0x2328 /* keyboard */) ||
            char === 0x232B /* erase to the left */ ||
            (char >= 0x237D /* shouldered open box */ && char <= 0x239A /* clear screen symbol */) ||
            (char >= 0x23BE /* dentistry symbol light vertical and top right */ && char <= 0x23CD /* square foot */) ||
            char === 0x23CF /* eject symbol */ ||
            (char >= 0x23D1 /* metrical breve */ && char <= 0x23DB /* fuse */) ||
            (char >= 0x23E2 /* white trapezium */ && char <= 0x23FF)) {
            return true;
        }
    }
    if (isChar['Control Pictures'](char) && char !== 0x2423 /* open box */) return true;
    if (isChar['Optical Character Recognition'](char)) return true;
    if (isChar['Enclosed Alphanumerics'](char)) return true;
    if (isChar['Geometric Shapes'](char)) return true;
    if (isChar['Miscellaneous Symbols'](char)) {
        if (!((char >= 0x261A /* black left pointing index */ && char <= 0x261F) /* white down pointing index */)) {
            return true;
        }
    }
    if (isChar['Miscellaneous Symbols and Arrows'](char)) {
        if ((char >= 0x2B12 /* square with top half black */ && char <= 0x2B2F /* white vertical ellipse */) ||
            (char >= 0x2B50 /* white medium star */ && char <= 0x2B59 /* heavy circled saltire */) ||
            (char >= 0x2BB8 /* upwards white arrow from bar with horizontal bar */ && char <= 0x2BEB)) {
            return true;
        }
    }
    if (isChar['CJK Symbols and Punctuation'](char)) return true;
    if (isChar['Katakana'](char)) return true;
    if (isChar['Private Use Area'](char)) return true;
    if (isChar['CJK Compatibility Forms'](char)) return true;
    if (isChar['Small Form Variants'](char)) return true;
    if (isChar['Halfwidth and Fullwidth Forms'](char)) return true;

    if (char === 0x221E /* infinity */ ||
        char === 0x2234 /* therefore */ ||
        char === 0x2235 /* because */ ||
        (char >= 0x2700 /* black safety scissors */ && char <= 0x2767 /* rotated floral heart bullet */) ||
        (char >= 0x2776 /* dingbat negative circled digit one */ && char <= 0x2793 /* dingbat negative circled sans-serif number ten */) ||
        char === 0xFFFC /* object replacement character */ ||
        char === 0xFFFD /* replacement character */) {
        return true;
    }

    return false;
}

/**
 * Returns true if the given Unicode codepoint identifies a character with
 * rotated orientation.
 *
 * A character has rotated orientation if it is drawn rotated when the line is
 * oriented vertically, even if both adjacent characters are upright. For
 * example, a Latin letter is drawn rotated along a vertical line. A rotated
 * character causes an adjacent “neutral” character to be drawn rotated as well.
 */
export function charHasRotatedVerticalOrientation(char: number) {
    return !(charHasUprightVerticalOrientation(char) ||
             charHasNeutralVerticalOrientation(char));
}

export function charInComplexShapingScript(char: number) {
    return /\p{sc=Arab}/u.test(String.fromCodePoint(char));
}

/**
 * ISO 15924 script codes of scripts that are primarily written horizontally
 * right-to-left according to Unicode 16.0.0.
 */
const rtlScriptCodes = [
    'Adlm', // Adlam
    'Arab', // Arabic
    'Armi', // Imperial Aramaic
    'Avst', // Avestan
    'Chrs', // Chorasmian
    'Cprt', // Cypriot
    'Egyp', // Egyptian Hieroglyphs
    'Elym', // Elymaic
    'Gara', // Garay
    'Hatr', // Hatran
    'Hebr', // Hebrew
    'Hung', // Old Hungarian
    'Khar', // Kharoshthi
    'Lydi', // Lydian
    'Mand', // Mandaic
    'Mani', // Manichaean
    'Mend', // Mende Kikakui
    'Merc', // Meroitic Cursive
    'Mero', // Meroitic Hieroglyphs
    'Narb', // Old North Arabian
    'Nbat', // Nabataean
    'Nkoo', // NKo
    'Orkh', // Old Turkic
    'Palm', // Palmyrene
    'Phli', // Inscriptional Pahlavi
    'Phlp', // Psalter Pahlavi
    'Phnx', // Phoenician
    'Prti', // Inscriptional Parthian
    'Rohg', // Hanifi Rohingya
    'Samr', // Samaritan
    'Sarb', // Old South Arabian
    'Sogo', // Old Sogdian
    'Syrc', // Syriac
    'Thaa', // Thaana
    'Todr', // Todhri
    'Yezi', // Yezidi
];

const rtlScriptRegExp = sanitizedRegExpFromScriptCodes(rtlScriptCodes);

export function charInRTLScript(char: number) {
    return rtlScriptRegExp.test(String.fromCodePoint(char));
}

export function charInSupportedScript(char: number, canRenderRTL: boolean) {
    // This is a rough heuristic: whether we "can render" a script
    // actually depends on the properties of the font being used
    // and whether differences from the ideal rendering are considered
    // semantically significant.

    // Even in Latin script, we "can't render" combinations such as the fi
    // ligature, but we don't consider that semantically significant.
    if (!canRenderRTL && charInRTLScript(char)) {
        return false;
    }
    if ((char >= 0x0900 && char <= 0x0DFF) ||
        // Main blocks for Indic scripts and Sinhala
        (char >= 0x0F00 && char <= 0x109F) ||
        // Main blocks for Tibetan and Myanmar
        isChar['Khmer'](char)) {
        // These blocks cover common scripts that require
        // complex text shaping, based on unicode script metadata:
        // https://www.unicode.org/repos/cldr/trunk/common/properties/scriptMetadata.txt
        // where "Web Rank <= 32" "Shaping Required = YES"
        return false;
    }
    return true;
}

export function stringContainsRTLText(chars: string): boolean {
    for (const char of chars) {
        if (charInRTLScript(char.charCodeAt(0))) {
            return true;
        }
    }
    return false;
}

export function isStringInSupportedScript(chars: string, canRenderRTL: boolean) {
    for (const char of chars) {
        if (!charInSupportedScript(char.charCodeAt(0), canRenderRTL)) {
            return false;
        }
    }
    return true;
}
