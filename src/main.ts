import { DictionaryService } from './dictionary';
import { SonnetAnalyzer } from './analyzer';
import type { SonnetAnalysis, LineAnalysis, SonnetForm } from './types';
import { getDictionaryUrl, SUPPORTED_LANGUAGES } from './config';

// Initialize services
const dictionary = new DictionaryService();
const analyzer = new SonnetAnalyzer(dictionary);

// Dictionary loading state
let dictionaryLoaded = false;
let currentLanguage = 'en'; // 当前使用的语言
let currentForm: SonnetForm | null = null; // 当前选择的诗歌形式

// Check if running in Tauri (desktop app)
const isTauri = '__TAURI__' in window;

// Load dictionary from remote source (web) or local file (Tauri)
async function loadDictionary(languageCode: string = 'en') {
  try {
    let dictionaryData;
    dictionaryLoaded = false; // 重置状态
    
    if (isTauri) {
      // Desktop app: load from bundled local file
      console.log(`Loading dictionary from local file (Tauri mode) - Language: ${languageCode}...`);
      const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
      if (!language) {
        throw new Error(`Unsupported language: ${languageCode}`);
      }
      const response = await fetch(`/data/${language.dictionaryFile}`);
      if (!response.ok) {
        throw new Error(`Failed to load local dictionary: ${response.statusText}`);
      }
      dictionaryData = await response.json();
      console.log(`Dictionary loaded successfully from local file - ${language.name}`);
    } else {
      // Web app: load from GitHub (saves hosting space)
      console.log(`Loading dictionary from GitHub (web mode) - Language: ${languageCode}...`);
      const dictionaryUrl = getDictionaryUrl(languageCode);
      const response = await fetch(dictionaryUrl);
      if (!response.ok) {
        throw new Error(`Failed to load dictionary: ${response.statusText}`);
      }
      dictionaryData = await response.json();
      console.log('Dictionary loaded successfully from GitHub repository');
    }
    
    await dictionary.loadDictionary(dictionaryData, languageCode);
    currentLanguage = languageCode;
    dictionaryLoaded = true;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    const errorMsg = isTauri 
      ? 'Failed to load pronunciation dictionary from local files.'
      : 'Failed to load pronunciation dictionary. Please check your internet connection.';
    alert(errorMsg);
  }
}

// Load dictionary on startup
loadDictionary();

// DOM elements
const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
const poemInput = document.getElementById('poemInput') as HTMLTextAreaElement;
const sonnetForm = document.getElementById('sonnetForm') as HTMLSelectElement;
const analyzeBtn = document.getElementById('analyzeBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const output = document.getElementById('output') as HTMLDivElement;

// Populate language selector
function initLanguageSelector() {
  languageSelect.innerHTML = '';
  for (const lang of SUPPORTED_LANGUAGES) {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    if (lang.code === currentLanguage) {
      option.selected = true;
    }
    languageSelect.appendChild(option);
  }
}

// Populate poetic form selector based on current language
function updateFormSelector() {
  sonnetForm.innerHTML = '';
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage);
  
  if (!language || language.poeticForms.length === 0) {
    const option = document.createElement('option');
    option.textContent = 'No forms available';
    option.disabled = true;
    sonnetForm.appendChild(option);
    currentForm = null;
    return;
  }

  for (const form of language.poeticForms) {
    const option = document.createElement('option');
    option.value = form.id;
    option.textContent = form.name;
    option.title = form.description;
    sonnetForm.appendChild(option);
  }
  
  // Set the first form as current
  if (language.poeticForms.length > 0) {
    currentForm = language.poeticForms[0];
  }
}

// Handle language change
languageSelect.addEventListener('change', async () => {
  const newLanguage = languageSelect.value;
  if (newLanguage !== currentLanguage) {
    console.log(`Switching language to: ${newLanguage}`);
    output.innerHTML = '<p style="color: #999; font-style: italic;">Loading dictionary...</p>';
    await loadDictionary(newLanguage);
    if (dictionaryLoaded) {
      updateFormSelector(); // Update available forms
      output.innerHTML = '<p style="color: #999; font-style: italic;">Dictionary loaded. Ready to analyze.</p>';
    }
  }
});

// Handle form change
sonnetForm.addEventListener('change', () => {
  const formId = sonnetForm.value;
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage);
  if (language) {
    currentForm = language.poeticForms.find(form => form.id === formId) || null;
  }
});

// Initialize selectors
initLanguageSelector();
updateFormSelector();

/**
 * Get color for rhyme scheme letter
 */
function getRhymeColor(letter: string): string {
  const colors: { [key: string]: string } = {
    'A': '#8B4513', // Saddle Brown
    'B': '#4682B4', // Steel Blue  
    'C': '#6B8E23', // Olive Drab
    'D': '#B8860B', // Dark Goldenrod
    'E': '#8B008B', // Dark Magenta
    'F': '#CD5C5C', // Indian Red
    'G': '#2F4F4F', // Dark Slate Gray
    'H': '#556B2F', // Dark Olive Green
  };
  return colors[letter] || '#666';
}

/**
 * Find which rhyme group has issues and which lines to highlight
 */
function getRhymeErrorLines(analysis: SonnetAnalysis): Set<number> {
  const errorLines = new Set<number>();
  
  // Check each rhyme group
  for (const [letter, lineIndices] of Object.entries(analysis.rhymeGroups)) {
    if (lineIndices.length <= 1) continue; // Skip single-line groups
    
    // Get rhyme keys for this group
    const rhymeKeys = lineIndices.map(i => analysis.lines[i].rhymeKey);
    const validRhymes = rhymeKeys.filter(r => r !== '');
    const uniqueRhymes = new Set(validRhymes);
    
    // If there are mismatches, use first line's rhyme as baseline
    if (uniqueRhymes.size > 1) {
      const rhymeCounts = new Map<string, number[]>();
      lineIndices.forEach((lineIdx, i) => {
        const key = rhymeKeys[i];
        if (!rhymeCounts.has(key)) {
          rhymeCounts.set(key, []);
        }
        rhymeCounts.get(key)!.push(lineIdx);
      });
      
      // Determine baseline rhyme: use first line's rhyme, or most common if first is empty
      let baselineRhyme = rhymeKeys[0];
      if (baselineRhyme === '') {
        // First line has no rhyme, find the most common rhyme
        let maxCount = 0;
        for (const [key, lines] of rhymeCounts.entries()) {
          if (key !== '' && lines.length > maxCount) {
            maxCount = lines.length;
            baselineRhyme = key;
          }
        }
      }
      
      // Mark all lines that don't match the baseline as errors
      lineIndices.forEach((lineIdx, i) => {
        if (rhymeKeys[i] !== baselineRhyme) {
          errorLines.add(lineIdx);
        }
      });
    }
  }
  
  return errorLines;
}

/**
 * Render a single line with syllable highlighting
 */
function renderLine(line: LineAnalysis, rhymeLetter: string, analysis: SonnetAnalysis, rhymeErrorLines: Set<number>): HTMLElement {
  const lineDiv = document.createElement('div');
  lineDiv.className = 'line';
  
  // Check if this line has meter issues (skip lines with too few/many syllables)
  const shouldCheckMeter = line.words.length > 0 && 
    Math.abs(line.stressPattern.length - (line.expectedStressPattern?.length || 10)) <= 2;
  
  if (shouldCheckMeter && !line.meterValid) {
    lineDiv.classList.add('meter-invalid');
  }

  // Line number
  const lineNumber = document.createElement('span');
  lineNumber.className = 'line-number';
  lineNumber.textContent = `${line.lineNumber}.`;
  lineDiv.appendChild(lineNumber);

  // Render each word with syllables
  for (const word of line.words) {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word';

    if (word.found && word.syllables.length > 0) {
      // Get syllable boundaries for the word
      const syllableBoundaries = dictionary.syllabifyWord(word.originalWord, word.syllables);
      const wordText = word.originalWord;
      
      // Calculate global syllable index for meter checking
      let globalSyllableIndex = 0;
      if (shouldCheckMeter && !line.meterValid && line.expectedStressPattern) {
        for (const w of line.words) {
          if (w === word) break;
          globalSyllableIndex += w.syllables.length;
        }
      }
      
      // Render each syllable part separately
      for (let i = 0; i < word.syllables.length; i++) {
        const syllable = word.syllables[i];
        const [start, end] = syllableBoundaries[i] || [0, wordText.length - 1];
        const syllableText = wordText.substring(start, end + 1);
        
        // Determine stress class - only apply color to stressed syllables
        let stressClass = 'stress-0';
        if (syllable.stress === 1) {
          stressClass = 'stress-1';
        } else if (syllable.stress === 2) {
          stressClass = 'stress-2';
        }
        
        const syllableSpan = document.createElement('span');
        syllableSpan.className = `syllable ${stressClass}`;
        syllableSpan.textContent = syllableText;
        
        // Check meter pattern and mark correct/incorrect stresses
        if (line.expectedStressPattern) {
          const expectedIndex = globalSyllableIndex + i;
          if (expectedIndex < line.expectedStressPattern.length) {
            const expected = line.expectedStressPattern[expectedIndex];
            const actual = syllable.stress;
            
            // Check if this stress matches the expected iambic pattern (light-heavy)
            // Expected 1 (heavy position) + actual 1 (primary stress) = correct!
            if (expected === 1 && actual === 1) {
              syllableSpan.classList.add('meter-correct');
            }
            // Expected 1 (heavy position) + actual 2 (secondary stress) = also correct!
            else if (expected === 1 && actual === 2) {
              syllableSpan.classList.add('meter-correct-secondary');
            }
            // Mark as error if expected stress (1) but got unstressed (0)
            else if (shouldCheckMeter && !line.meterValid && expected === 1 && actual === 0) {
              syllableSpan.classList.add('meter-error');
            }
          }
        }
        
        syllableSpan.title = `Syllable ${i + 1}/${word.syllables.length}, Stress: ${syllable.stress}`;
        wordSpan.appendChild(syllableSpan);
      }
      
      // Add overall word tooltip
      wordSpan.title = `Syllables: ${word.syllables.length}, Stress pattern: ${word.syllables.map(s => s.stress).join('')}`;
    } else {
      // Word not found in dictionary - add gray background
      const notFoundSpan = document.createElement('span');
      notFoundSpan.className = 'word-not-found';
      notFoundSpan.textContent = word.originalWord;
      notFoundSpan.title = 'Word not found in dictionary';
      wordSpan.appendChild(notFoundSpan);
    }

    lineDiv.appendChild(wordSpan);
    lineDiv.appendChild(document.createTextNode(' '));
  }

  // Add rhyme marker with color and optional error highlight
  const rhymeMarker = document.createElement('span');
  rhymeMarker.className = 'rhyme-marker';
  rhymeMarker.textContent = rhymeLetter;
  rhymeMarker.style.color = getRhymeColor(rhymeLetter);
  
  // Highlight rhyme marker if this line has a rhyme error
  if (rhymeErrorLines.has(line.lineNumber - 1)) {
    rhymeMarker.classList.add('rhyme-error');
  }
  
  lineDiv.appendChild(rhymeMarker);

  // Add line text as tooltip
  lineDiv.title = line.text;

  return lineDiv;
}

/**
 * Render the complete analysis
 */
function renderAnalysis(analysis: SonnetAnalysis): void {
  output.innerHTML = '';

  // Check for unknown words and show warning
  const unknownWords = new Set<string>();
  for (const line of analysis.lines) {
    for (const word of line.words) {
      if (!word.found) {
        unknownWords.add(word.originalWord);
      }
    }
  }

  // Show warning if there are unknown words
  if (unknownWords.size > 0) {
    const warning = document.createElement('div');
    warning.className = 'warning-box';
    warning.innerHTML = `
      <strong>⚠️ Words not in dictionary:</strong> 
      ${Array.from(unknownWords).join(', ')}
      <br><small>Analysis may be less accurate. Syllable counts and rhymes are estimated.</small>
    `;
    output.appendChild(warning);
  }

  // Get rhyme error lines
  const rhymeErrorLines = getRhymeErrorLines(analysis);

  // Render lines
  const linesContainer = document.createElement('div');
  analysis.lines.forEach((line, index) => {
    const rhymeLetter = analysis.form.rhymeScheme[index] || '?';
    const lineElement = renderLine(line, rhymeLetter, analysis, rhymeErrorLines);
    linesContainer.appendChild(lineElement);
  });
  output.appendChild(linesContainer);

  // Render summary
  const summary = document.createElement('div');
  summary.className = 'summary';

  const summaryTitle = document.createElement('h3');
  summaryTitle.textContent = 'Analysis Summary';
  summary.appendChild(summaryTitle);

  // Form info
  const formInfo = document.createElement('div');
  formInfo.className = 'summary-item';
  formInfo.innerHTML = `<strong>Form:</strong> ${analysis.form.name}<br>
                        <strong>Expected Meter:</strong> ${analysis.form.meter.name} (${analysis.form.meter.description})<br>
                        <strong>Expected Rhyme Scheme:</strong> ${analysis.form.rhymeScheme.join('')}`;
  summary.appendChild(formInfo);

  // Meter validation
  const meterItem = document.createElement('div');
  meterItem.className = `summary-item ${analysis.meterValid ? 'valid' : 'invalid'}`;
  meterItem.innerHTML = `<strong>Meter:</strong> ${analysis.meterValid ? '✓ Valid' : '✗ Issues Found'}`;
  
  if (!analysis.meterValid && analysis.meterIssues.length > 0) {
    analysis.meterIssues.forEach(issue => {
      const issueDiv = document.createElement('div');
      issueDiv.className = 'issue';
      issueDiv.textContent = issue;
      meterItem.appendChild(issueDiv);
    });
  }
  summary.appendChild(meterItem);

  // Rhyme scheme validation
  const rhymeItem = document.createElement('div');
  rhymeItem.className = `summary-item ${analysis.rhymeSchemeValid ? 'valid' : 'invalid'}`;
  rhymeItem.innerHTML = `<strong>Rhyme Scheme:</strong> ${analysis.rhymeSchemeValid ? '✓ Valid' : '✗ Issues Found'}`;
  
  if (!analysis.rhymeSchemeValid && analysis.rhymeIssues.length > 0) {
    analysis.rhymeIssues.forEach(issue => {
      const issueDiv = document.createElement('div');
      issueDiv.className = 'issue';
      issueDiv.textContent = issue;
      rhymeItem.appendChild(issueDiv);
    });
  }
  summary.appendChild(rhymeItem);

  output.appendChild(summary);
}

/**
 * Handle analyze button click
 */
analyzeBtn.addEventListener('click', () => {
  const text = poemInput.value.trim();

  if (!text) {
    alert('Please enter a sonnet to analyze.');
    return;
  }

  if (!dictionaryLoaded) {
    alert('Dictionary is still loading. Please wait a moment and try again.');
    return;
  }

  if (!currentForm) {
    alert('Please select a poetic form.');
    return;
  }

  try {
    const analysis = analyzer.analyzeSonnet(text, currentForm);
    renderAnalysis(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    output.innerHTML = `<p style="color: red;">Error analyzing sonnet: ${error}</p>`;
  }
});

// Clear button handler
clearBtn.addEventListener('click', () => {
  poemInput.value = '';
  output.innerHTML = '<p style="color: #999; font-style: italic;">Enter a sonnet and click "Analyze Sonnet" to see the results.</p>';
});

// Load sample sonnet
const sampleSonnet = `Shall I compare thee to a summer's day
Thou art more lovely and more temperate
Rough winds do shake the darling buds of May
And summer's lease hath all too short a date
Sometime too hot the eye of heaven shines
And often is his gold complexion dimmed
And every fair from fair sometime declines
By chance or nature's changing course untrimmed
But thy eternal summer shall not fade
Nor lose possession of that fair thou owest
Nor shall death brag thou wanderest in his shade
When in eternal lines to time thou grow
So long as men can breathe or eyes can see
So long lives this and this gives life to thee`;

poemInput.value = sampleSonnet;

console.log('Sonnet Checker loaded successfully!');
