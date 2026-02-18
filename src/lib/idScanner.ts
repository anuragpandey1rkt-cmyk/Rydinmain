/**
 * ID Card Scanner — Robust OCR for SRM ID Cards (V2)
 * Multi-pass OCR with aggressive preprocessing for bad quality photos
 * Handles: rotated, blurry, watermarked, faded, glare-heavy cards
 */

import { createWorker, OEM, PSM } from 'tesseract.js';

export interface IDScanResult {
  isValid: boolean;
  error?: string;
  name?: string;
  idNumber?: string;
  collegeName?: string;
  imageBase64?: string;
  confidence?: number;
}

// ─────────────────────────────────────────────
// IMAGE PREPROCESSING (Multiple Variants)
// ─────────────────────────────────────────────

const loadImage = (base64: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });

/**
 * Create a canvas from an image, optionally rotated
 */
const imageToCanvas = (img: HTMLImageElement, degrees: number = 0): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  if (degrees === 90 || degrees === 270) {
    canvas.width = img.height;
    canvas.height = img.width;
  } else {
    canvas.width = img.width;
    canvas.height = img.height;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas;
};

/**
 * Scale canvas to ensure minimum resolution for OCR
 * Tesseract works best at ~300 DPI (roughly 2000px for an ID card)
 */
const scaleCanvas = (source: HTMLCanvasElement, targetMinDim: number = 1200): HTMLCanvasElement => {
  const minDim = Math.min(source.width, source.height);
  if (minDim >= targetMinDim) return source;

  const scale = targetMinDim / minDim;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas;
};

/**
 * Convert to grayscale
 */
const toGrayscale = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const gray = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
    d[i] = gray;
    d[i + 1] = gray;
    d[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Adaptive threshold binarization (similar to OpenCV adaptiveThreshold)
 * Much better than global threshold for uneven lighting / watermarks
 */
const adaptiveThreshold = (source: HTMLCanvasElement, blockSize: number = 25, C: number = 10): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const w = canvas.width;
  const h = canvas.height;

  // Build integral image for fast mean computation
  const integral = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += d[(y * w + x) * 4];
      integral[y * w + x] = rowSum + (y > 0 ? integral[(y - 1) * w + x] : 0);
    }
  }

  // Apply adaptive threshold
  const half = Math.floor(blockSize / 2);
  const result = new Uint8ClampedArray(d.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x1 = Math.max(0, x - half);
      const y1 = Math.max(0, y - half);
      const x2 = Math.min(w - 1, x + half);
      const y2 = Math.min(h - 1, y + half);

      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      let sum = integral[y2 * w + x2];
      if (x1 > 0) sum -= integral[y2 * w + (x1 - 1)];
      if (y1 > 0) sum -= integral[(y1 - 1) * w + x2];
      if (x1 > 0 && y1 > 0) sum += integral[(y1 - 1) * w + (x1 - 1)];

      const mean = sum / area;
      const idx = (y * w + x) * 4;
      const val = d[idx] > (mean - C) ? 255 : 0;
      result[idx] = val;
      result[idx + 1] = val;
      result[idx + 2] = val;
      result[idx + 3] = 255;
    }
  }

  const outData = new ImageData(result, w, h);
  ctx.putImageData(outData, 0, 0);
  return canvas;
};

/**
 * High contrast stretch - more aggressive than before
 */
const highContrast = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  // Find histogram for contrast stretching
  const hist = new Array(256).fill(0);
  for (let i = 0; i < d.length; i += 4) hist[d[i]]++;

  const total = canvas.width * canvas.height;
  let low = 0, high = 255, cum = 0;
  for (let i = 0; i < 256; i++) {
    cum += hist[i];
    if (cum < total * 0.02) low = i;  // 2nd percentile
    if (cum < total * 0.98) high = i; // 98th percentile
  }

  const range = Math.max(high - low, 1);

  for (let i = 0; i < d.length; i += 4) {
    let val = ((d[i] - low) / range) * 255;
    // Aggressive S-curve contrast
    val = val / 255;
    val = val < 0.5
      ? 2 * val * val
      : 1 - 2 * (1 - val) * (1 - val);
    val = Math.max(0, Math.min(255, Math.round(val * 255)));
    d[i] = val;
    d[i + 1] = val;
    d[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Simple global Otsu threshold binarization
 */
const otsuThreshold = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  // Build histogram
  const hist = new Array(256).fill(0);
  const total = canvas.width * canvas.height;
  for (let i = 0; i < d.length; i += 4) hist[d[i]]++;

  // Otsu's method
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];

  let sumB = 0, wB = 0, maxVariance = 0, threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  // Apply threshold
  for (let i = 0; i < d.length; i += 4) {
    const val = d[i] > threshold ? 255 : 0;
    d[i] = val;
    d[i + 1] = val;
    d[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Invert colors (for cases where text is light on dark due to preprocessing)
 */
const invertColors = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Check if an image is mostly black (inverted)
 */
const isMostlyDark = (canvas: HTMLCanvasElement): boolean => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  let darkPixels = 0;
  const total = canvas.width * canvas.height;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < 128) darkPixels++;
  }

  return darkPixels / total > 0.6;
};

/**
 * Generate multiple preprocessed versions of the image for multi-pass OCR
 */
const generatePreprocessingVariants = (baseCanvas: HTMLCanvasElement): HTMLCanvasElement[] => {
  const scaled = scaleCanvas(baseCanvas, 1400);
  const gray = toGrayscale(scaled);

  const variants: HTMLCanvasElement[] = [];

  // Variant 1: Adaptive threshold (best for watermarks & uneven lighting)
  const adaptive = adaptiveThreshold(gray, 31, 12);
  if (isMostlyDark(adaptive)) {
    variants.push(invertColors(adaptive));
  } else {
    variants.push(adaptive);
  }

  // Variant 2: High contrast + Otsu (best for faded text)
  const contrast = highContrast(gray);
  const otsu = otsuThreshold(contrast);
  if (isMostlyDark(otsu)) {
    variants.push(invertColors(otsu));
  } else {
    variants.push(otsu);
  }

  // Variant 3: Just enhanced grayscale (sometimes simplest works best)
  variants.push(contrast);

  // Variant 4: Adaptive with smaller block (better for small text/close details)
  const adaptiveSmall = adaptiveThreshold(gray, 15, 8);
  if (isMostlyDark(adaptiveSmall)) {
    variants.push(invertColors(adaptiveSmall));
  } else {
    variants.push(adaptiveSmall);
  }

  return variants;
};

// ─────────────────────────────────────────────
// SRM-SPECIFIC NAME EXTRACTION
// ─────────────────────────────────────────────

/**
 * Common OCR character substitutions to fix
 */
const fixOCRSubstitutions = (text: string): string => {
  return text
    // Common OCR mistakes
    .replace(/[|!l1]/g, (match, offset, str) => {
      // Only fix if surrounded by uppercase letters (likely part of a name)
      const before = str[offset - 1] || '';
      const after = str[offset + 1] || '';
      if (/[A-Z]/.test(before) || /[A-Z]/.test(after)) return 'I';
      return match;
    })
    .replace(/0(?=[A-Z])/g, 'O')  // 0 before uppercase = O
    .replace(/(?<=[A-Z])0/g, 'O') // 0 after uppercase = O
    .replace(/5(?=[A-Z])/g, 'S')  // 5 before uppercase = S
    .replace(/(?<=[A-Z])5/g, 'S') // 5 after uppercase = S
    .replace(/8(?=[A-Z])/g, 'B')  // 8 before uppercase = B
    .replace(/(?<=[A-Z])8/g, 'B') // 8 after uppercase = B;
};

/**
 * Clean OCR noise — remove watermark artifacts and stray characters
 */
const cleanOCRText = (text: string): string => {
  return text
    // Remove SRM watermarks (various OCR readings of the watermark)
    .replace(/\b[OoC]?SRM\b/gi, '')
    .replace(/\bSR[MNW]\b/gi, '')
    .replace(/\bOS[RM][MW]?\b/gi, '')
    .replace(/\bCSR[MW]?\b/gi, '')
    // Remove "Institute of Science" fragments that bleed into name
    .replace(/institute\s*(of)?/gi, '')
    .replace(/science/gi, '')
    .replace(/technology/gi, '')
    // Remove single stray characters
    .replace(/\b[^a-zA-Z\s]\b/g, '')
    .replace(/\b[a-zA-Z]\b/g, '') // Single letters (except as initials which we handle separately)
    // Remove numbers
    .replace(/[0-9]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract name from OCR text using multiple strategies.
 * Returns all candidate names found, ranked by confidence.
 */
const extractNameCandidates = (text: string): string[] => {
  const candidates: string[] = [];
  const fixedText = fixOCRSubstitutions(text);

  console.log('📄 Fixed OCR text:', fixedText);

  // Strategy 1: "Name :" label followed by content (primary for SRM cards)
  const namePatterns = [
    // "Name : VISHAL SINGH" — standard format
    /[Nn][ae]m[ec]?\s*[:;.]\s*[:;.]?\s*(.+?)(?=\s*\n|\s*Programme|\s*Program|\s*Register|\s*Valid|\s*$)/i,
    // "Name:" without space
    /[Nn][ae]m[ec]?\s*[:;.]\s*(.+)/i,
    // Just "Name" followed by text on same line
    /[Nn]ame\s+([A-Z][A-Z\s]{3,})/,
  ];

  for (const pattern of namePatterns) {
    const match = fixedText.match(pattern);
    if (match && match[1]) {
      const cleaned = cleanOCRText(match[1]);
      if (cleaned.length >= 3 && /[A-Za-z]{2,}/.test(cleaned)) {
        candidates.push(cleaned.toUpperCase());
      }
    }
  }

  // Strategy 2: Find lines between known SRM card labels
  // On SRM cards: [photo area] → Name : XXX → Programme : YYY → Register No. : ZZZ
  const lines = fixedText.split('\n').map(l => l.trim()).filter(l => l.length > 1);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If this line contains "Name" and ":"
    if (/name/i.test(line) && /[:;.]/.test(line)) {
      // Extract what comes after the ":"
      const afterColon = line.split(/[:;.]/g).slice(1).join(' ').trim();
      if (afterColon) {
        const cleaned = cleanOCRText(afterColon);
        if (cleaned.length >= 3) {
          candidates.push(cleaned.toUpperCase());
        }
      }
      // Also check next line (name might wrap)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!/programme|program|register|valid|faculty|b\.?tech/i.test(nextLine)) {
          const cleaned = cleanOCRText(nextLine);
          if (cleaned.length >= 3 && /^[A-Za-z\s]+$/.test(cleaned)) {
            // This might be a continuation of the name (e.g., multi-line name)
            const prevCandidate = candidates[candidates.length - 1];
            if (prevCandidate) {
              candidates.push((prevCandidate + ' ' + cleaned).toUpperCase());
            }
            candidates.push(cleaned.toUpperCase());
          }
        }
      }
    }
  }

  // Strategy 3: Look for ALL CAPS sequences between known card sections
  for (const line of lines) {
    // Skip lines that are clearly NOT names
    if (/programme|register|valid|faculty|engineering|technology|campus|kattankulathur|chengalp|student|website|email|phone|b\.?tech|cse|mech|civil|eee|ece/i.test(line)) continue;
    if (/RA\d{4,}/i.test(line)) continue;
    if (/\d{4,}/.test(line)) continue;
    if (/jun|may|jan|feb|mar|apr|jul|aug|sep|oct|nov|dec/i.test(line)) continue;
    if (/www\.|\.com|\.in|\.edu/i.test(line)) continue;
    if (/044-|ph:/i.test(line)) continue;

    // Find sequences of 2+ uppercase words
    const capsMatches = line.match(/[A-Z][A-Z]+(?:\s+[A-Z][A-Z]+)*/g);
    if (capsMatches) {
      for (const capsMatch of capsMatches) {
        const cleaned = cleanOCRText(capsMatch);
        if (cleaned.length >= 4 && cleaned.split(' ').filter(w => w.length >= 2).length >= 1) {
          candidates.push(cleaned.toUpperCase());
        }
      }
    }
  }

  // Deduplicate and filter
  const seen = new Set<string>();
  return candidates.filter(c => {
    const normalized = c.replace(/\s+/g, ' ').trim();
    if (seen.has(normalized) || normalized.length < 3) return false;
    seen.add(normalized);
    return true;
  });
};

/**
 * Pick the best name candidate that matches the profile name
 */
const pickBestCandidate = (candidates: string[], profileName: string): { name: string; similarity: number } => {
  if (candidates.length === 0) return { name: '', similarity: 0 };

  let best = { name: candidates[0], similarity: 0 };

  for (const candidate of candidates) {
    const result = fuzzyNameMatch(profileName, candidate);
    console.log(`  📊 Candidate "${candidate}" → similarity: ${(result.similarity * 100).toFixed(0)}%`);
    if (result.similarity > best.similarity) {
      best = { name: candidate, similarity: result.similarity };
    }
  }

  return best;
};

/**
 * Extract registration number from OCR text
 */
const extractRegNoFromText = (text: string): string | null => {
  const regPatterns = [
    /(?:Register|Reg)\s*(?:No)?\.?\s*[:;.]\s*(RA\d{6,})/i,
    /(RA\d{10,})/i,
    /(RA\d{8,})/i,
    /([A-Z]{2}\d{10,})/i,
  ];

  for (const pattern of regPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
};

/**
 * Check if text looks like it came from an SRM ID card
 */
const isSRMCard = (text: string): boolean => {
  const lower = text.toLowerCase();
  const score =
    (lower.includes('srm') ? 1 : 0) +
    (lower.includes('faculty') ? 1 : 0) +
    (lower.includes('engineering') ? 1 : 0) +
    (lower.includes('kattankulathur') ? 1 : 0) +
    (lower.includes('programme') ? 1 : 0) +
    (/ra\d{6,}/i.test(text) ? 1 : 0) +
    (lower.includes('b.tech') || lower.includes('btech') ? 1 : 0);
  return score >= 2; // At least 2 SRM indicators
};

// ─────────────────────────────────────────────
// MULTI-PASS AUTO-ROTATION OCR
// ─────────────────────────────────────────────

/**
 * Score how well OCR text matches an SRM ID card
 */
const scoreOCRResult = (text: string): number => {
  let score = 0;
  const lower = text.toLowerCase();

  if (/name\s*[:;.]/i.test(text)) score += 50;
  if (lower.includes('programme')) score += 20;
  if (lower.includes('register')) score += 20;
  if (lower.includes('srm')) score += 10;
  if (lower.includes('faculty')) score += 10;
  if (lower.includes('engineering')) score += 10;
  if (/b\.?\s*tech/i.test(text)) score += 15;
  if (/ra\d{6,}/i.test(text)) score += 25;
  if (lower.includes('kattankulathur')) score += 10;
  if (lower.includes('valid')) score += 5;
  if (lower.includes('student')) score += 5;

  return score;
};

/**
 * Run OCR on a single canvas variant
 */
const ocrOnCanvas = async (
  canvas: HTMLCanvasElement,
  worker: Awaited<ReturnType<typeof createWorker>>
): Promise<string> => {
  const base64 = canvas.toDataURL('image/png'); // PNG for lossless
  const { data: { text } } = await worker.recognize(base64);
  return text;
};

/**
 * Multi-pass OCR: try all rotations × all preprocessing variants
 * Pick the result with the highest SRM score
 */
const multiPassOCR = async (
  img: HTMLImageElement,
  worker: Awaited<ReturnType<typeof createWorker>>
): Promise<{ text: string; rotation: number; score: number }> => {
  const rotations = [0, 90, 270, 180];
  let bestResult = { text: '', rotation: 0, score: -1 };

  for (const deg of rotations) {
    console.log(`\n🔄 Trying rotation: ${deg}°`);

    // Create rotated base canvas
    const rotatedCanvas = imageToCanvas(img, deg);

    // Generate preprocessing variants
    const variants = generatePreprocessingVariants(rotatedCanvas);

    for (let v = 0; v < variants.length; v++) {
      const text = await ocrOnCanvas(variants[v], worker);
      const score = scoreOCRResult(text);

      console.log(`  📝 Variant ${v} (rot ${deg}°): score=${score}`);

      if (score > bestResult.score) {
        bestResult = { text, rotation: deg, score };
      }

      // Strong match — we found the right orientation + preprocessing
      if (score >= 100) {
        console.log(`  ✅ Strong match found! Stopping early.`);
        return bestResult;
      }
    }

    // Good enough match at this rotation — skip remaining rotations
    if (bestResult.score >= 70) {
      console.log(`  ✅ Good match at ${deg}°, skipping remaining rotations.`);
      break;
    }
  }

  return bestResult;
};

// ─────────────────────────────────────────────
// FUZZY NAME MATCHING (Word-level)
// ─────────────────────────────────────────────

const levenshtein = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
};

const normalizeName = (s: string): string =>
  s.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Improved fuzzy name matching for OCR results
 * Strategies:
 * 1. Full-string Levenshtein similarity
 * 2. Word-level matching (handles garbled surname)
 * 3. First-name priority (if first name matches, likely same person)
 * 4. Substring containment (handles middle names)
 * 5. Prefix matching (handles truncated OCR output)
 */
export const fuzzyNameMatch = (
  profileName: string,
  idName: string
): { match: boolean; similarity: number } => {
  const a = normalizeName(profileName);
  const b = normalizeName(idName);

  if (!a || !b) return { match: false, similarity: 0 };
  if (a === b) return { match: true, similarity: 1.0 };

  // 1. Full-string Levenshtein
  const maxLen = Math.max(a.length, b.length);
  const fullSimilarity = 1 - levenshtein(a, b) / maxLen;

  // 2. Word-level matching
  const aWords = a.split(' ').filter(w => w.length >= 2);
  const bWords = b.split(' ').filter(w => w.length >= 2);

  let wordMatchCount = 0;
  const usedB = new Set<number>();

  for (const aw of aWords) {
    let bestWordSim = 0;
    let bestIdx = -1;

    for (let j = 0; j < bWords.length; j++) {
      if (usedB.has(j)) continue;
      const bw = bWords[j];
      const wordSim = 1 - levenshtein(aw, bw) / Math.max(aw.length, bw.length);

      // Also check if one is a prefix of the other (OCR truncation)
      const prefixMatch = aw.startsWith(bw) || bw.startsWith(aw);
      const effectiveSim = prefixMatch ? Math.max(wordSim, 0.85) : wordSim;

      if (effectiveSim > bestWordSim) {
        bestWordSim = effectiveSim;
        bestIdx = j;
      }
    }

    if (bestWordSim >= 0.6 && bestIdx >= 0) {
      wordMatchCount++;
      usedB.add(bestIdx);
    }
  }

  const totalWords = Math.max(aWords.length, bWords.length);
  const wordSimilarity = totalWords > 0 ? wordMatchCount / totalWords : 0;

  // 3. First-name priority
  const profileFirst = aWords[0] || '';
  let firstNameSim = 0;
  if (profileFirst.length >= 3) {
    for (const bw of bWords) {
      const sim = 1 - levenshtein(profileFirst, bw) / Math.max(profileFirst.length, bw.length);
      const prefixMatch = profileFirst.startsWith(bw) || bw.startsWith(profileFirst);
      firstNameSim = Math.max(firstNameSim, prefixMatch ? Math.max(sim, 0.85) : sim);
    }
  }

  // 4. Containment check
  const containsMatch =
    a.includes(b) || b.includes(a) ||
    aWords.some(w => w.length >= 3 && bWords.some(bw => bw.includes(w) || w.includes(bw)));

  // 5. Compute best similarity
  let similarity = Math.max(
    fullSimilarity,
    wordSimilarity * 0.95,
    firstNameSim >= 0.75 ? Math.max(0.80, firstNameSim * 0.9) : 0,
    containsMatch ? 0.85 : 0
  );

  // Final determination
  const isMatch =
    similarity >= 0.60 ||
    (firstNameSim >= 0.70 && wordMatchCount >= 1) ||
    wordMatchCount >= 2 ||
    containsMatch;

  return {
    match: isMatch,
    similarity: Math.min(similarity, 1.0),
  };
};

// ─────────────────────────────────────────────
// MAIN OCR PIPELINE
// ─────────────────────────────────────────────

/**
 * Process ID card image — robust multi-pass OCR pipeline
 */
export const extractIDText = async (imageBase64: string): Promise<IDScanResult> => {
  try {
    console.log('🔍 Starting multi-pass OCR pipeline (V2)...');

    const img = await loadImage(imageBase64);
    console.log(`📐 Image size: ${img.width}x${img.height}`);

    // Create Tesseract worker with optimal settings for ID cards
    const worker = await createWorker('eng', OEM.LSTM_ONLY, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`  ⏳ OCR progress: ${(m.progress * 100).toFixed(0)}%`);
        }
      },
    });

    // Set Tesseract parameters for better ID card reading
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Treat as single block of text
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.:() -/,\n',
      preserve_interword_spaces: '1',
    });

    // Run multi-pass OCR with auto-rotation
    const { text: bestText, rotation, score } = await multiPassOCR(img, worker);

    await worker.terminate();

    console.log(`\n📄 Best OCR result (rotation: ${rotation}°, score: ${score}):`);
    console.log(bestText);

    if (score < 5) {
      return {
        isValid: false,
        error: 'Could not detect an ID card. Please ensure the entire card is visible in the photo.',
        imageBase64,
      };
    }

    // Extract candidates using multiple strategies
    const nameCandidates = extractNameCandidates(bestText);
    const regNo = extractRegNoFromText(bestText);
    const srm = isSRMCard(bestText);

    console.log('🏷️ Name candidates:', nameCandidates);

    // Pick best name (first candidate if no profile comparison needed)
    const bestName = nameCandidates.length > 0 ? nameCandidates[0] : null;

    const result: IDScanResult = {
      isValid: !!bestName,
      imageBase64,
      confidence: Math.min(score / 120, 1.0),
      name: bestName || 'Could not read name',
      idNumber: regNo || 'Unknown ID',
      collegeName: srm ? 'SRM Institute of Science and Technology' : 'Unknown College',
    };

    if (!result.isValid) {
      result.error = 'Could not read the name from your ID card. Please try again with better lighting and avoid glare on the card.';
    }

    return result;
  } catch (error) {
    console.error('OCR Processing failed:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'OCR failed. Please try again.',
    };
  }
};

// ─────────────────────────────────────────────
// CAMERA, STORAGE, UTILITY
// ─────────────────────────────────────────────

export const initializeOpenCV = (): Promise<void> =>
  new Promise((resolve) => resolve());

export const captureFromCamera = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      })
      .then((stream) => {
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Wait longer for camera to auto-focus and stabilize
          setTimeout(() => {
            ctx?.drawImage(video, 0, 0);
            stream.getTracks().forEach((track) => track.stop());
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);
            resolve(imageBase64);
          }, 500);
        };
      })
      .catch((error) => {
        reject(new Error(`Camera access failed: ${error.message}`));
      });
  });
};

export const validateIDData = (data: IDScanResult): boolean => {
  if (!data.isValid) return false;
  if (!data.name || data.name.length < 3) return false;
  return true;
};

const base64ToBlob = (base64: string): Blob => {
  const bstr = atob(base64.split(',')[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: 'image/jpeg' });
};

export const uploadIDImage = async (imageBase64: string, userId: string): Promise<string | null> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const blob = base64ToBlob(imageBase64);
    const fileName = `id-${userId}-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('user-verifications')
      .upload(fileName, blob, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('user-verifications')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
};

export const saveIDVerification = async (
  userId: string,
  imageUrl: string,
  data: IDScanResult
): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');

    const { error } = await supabase
      .from('user_verifications')
      .upsert({
        user_id: userId,
        name: data.name || 'Unknown',
        id_number: data.idNumber || 'Unknown',
        college_name: data.collegeName || 'Unknown',
        photo_url: imageUrl,
        verified: true,
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('ID verification upsert error:', error);
      throw error;
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ identity_verified: true, phone_verified: true })
        .eq('id', userId);

      if (profileError) {
        console.warn('Profile update fallback:', profileError.message);
        await supabase.from('profiles').update({ phone_verified: true }).eq('id', userId);
      }
    } catch (profileErr) {
      console.warn('Profile badge update failed (non-critical):', profileErr);
    }

    return true;
  } catch (error) {
    console.error('Save verification failed:', error);
    return false;
  }
};

export const checkIDVerification = async (userId: string): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('user_verifications')
      .select('user_id')
      .eq('user_id', userId)
      .eq('verified', true)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Check verification failed:', error);
    return false;
  }
};

export const getVerificationBadge = (isVerified: boolean) => ({
  text: isVerified ? 'Verified Student' : 'Unverified',
  color: isVerified ? 'text-green-600' : 'text-gray-500',
  bg: isVerified ? 'bg-green-100' : 'bg-gray-100',
  icon: isVerified ? '✓' : '○',
});

export const formatIDNumber = (idNumber: string): string => {
  if (idNumber.length <= 4) return idNumber;
  return `****${idNumber.slice(-4)}`;
};
