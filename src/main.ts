import { DictionaryService } from './dictionary';
import { SonnetAnalyzer } from './analyzer';
import type { SonnetAnalysis, LineAnalysis } from './types';
import { DATA_URLS } from './config';

// Initialize services
const dictionary = new DictionaryService();
const analyzer = new SonnetAnalyzer(dictionary);

// Dictionary loading state
let dictionaryLoaded = false;

// Check if running in Tauri (desktop app)
const isTauri = '__TAURI__' in window;

// Load dictionary from remote source (web) or local file (Tauri)
async function loadDictionary() {
  try {
    let dictionaryData;
    
    if (isTauri) {
      // Desktop app: load from bundled local file
      console.log('Loading dictionary from local file (Tauri mode)...');
      const response = await fetch('/data/cmu-dict.json');
      if (!response.ok) {
        throw new Error(`Failed to load local dictionary: ${response.statusText}`);
      }
      dictionaryData = await response.json();
      console.log('Dictionary loaded successfully from local file');
    } else {
      // Web app: load from GitHub (saves hosting space)
      console.log('Loading dictionary from GitHub (web mode)...');
      const response = await fetch(DATA_URLS.cmuDict);
      if (!response.ok) {
        throw new Error(`Failed to load dictionary: ${response.statusText}`);
      }
      dictionaryData = await response.json();
      console.log('Dictionary loaded successfully from GitHub repository');
    }
    
    await dictionary.loadDictionary(dictionaryData);
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
const poemInput = document.getElementById('poemInput') as HTMLTextAreaElement;
const sonnetForm = document.getElementById('sonnetForm') as HTMLSelectElement;
const analyzeBtn = document.getElementById('analyzeBtn') as HTMLButtonElement;
const output = document.getElementById('output') as HTMLDivElement;

/**
 * Render a single line with syllable highlighting
 */
function renderLine(line: LineAnalysis, rhymeLetter: string, analysis: SonnetAnalysis): HTMLElement {
  const lineDiv = document.createElement('div');
  lineDiv.className = 'line';
  
  if (!line.meterValid) {
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
      // Create a wrapper with stress pattern shown via background
      const wordText = word.originalWord;
      
      // For simplicity, highlight the whole word based on whether it has primary stress
      const hasPrimaryStress = word.syllables.some(s => s.stress === 1);
      const hasSecondaryStress = word.syllables.some(s => s.stress === 2);
      
      let stressClass = 'stress-0';
      if (hasPrimaryStress) {
        stressClass = 'stress-1';
      } else if (hasSecondaryStress) {
        stressClass = 'stress-2';
      }
      
      const syllableSpan = document.createElement('span');
      syllableSpan.className = `syllable ${stressClass}`;
      syllableSpan.textContent = wordText;
      
      // Check if any syllable has meter error
      if (!line.meterValid && line.expectedStressPattern) {
        let globalSyllableIndex = 0;
        // Calculate starting position in line
        for (const w of line.words) {
          if (w === word) break;
          globalSyllableIndex += w.syllables.length;
        }
        
        // Check each syllable
        for (let i = 0; i < word.syllables.length; i++) {
          const syllable = word.syllables[i];
          const expectedIndex = globalSyllableIndex + i;
          if (expectedIndex < line.expectedStressPattern.length) {
            const expected = line.expectedStressPattern[expectedIndex];
            if (expected === 1 && syllable.stress !== 1) {
              syllableSpan.classList.add('meter-error');
              break;
            }
          }
        }
      }
      
      syllableSpan.title = `Syllables: ${word.syllables.length}, Stress pattern: ${word.syllables.map(s => s.stress).join('')}`;
      wordSpan.appendChild(syllableSpan);
    } else {
      // Word not found in dictionary
      wordSpan.textContent = word.originalWord;
      wordSpan.style.color = '#999';
      wordSpan.title = 'Word not found in dictionary';
    }

    lineDiv.appendChild(wordSpan);
    lineDiv.appendChild(document.createTextNode(' '));
  }

  // Add rhyme marker
  const rhymeMarker = document.createElement('span');
  rhymeMarker.className = 'rhyme-marker';
  rhymeMarker.textContent = rhymeLetter;
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

  // Render lines
  const linesContainer = document.createElement('div');
  analysis.lines.forEach((line, index) => {
    const rhymeLetter = analysis.form.rhymeScheme[index] || '?';
    const lineElement = renderLine(line, rhymeLetter, analysis);
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
  const form = sonnetForm.value;

  if (!text) {
    alert('Please enter a sonnet to analyze.');
    return;
  }

  if (!dictionaryLoaded) {
    alert('Dictionary is still loading. Please wait a moment and try again.');
    return;
  }

  try {
    const analysis = analyzer.analyzeSonnet(text, form);
    renderAnalysis(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    output.innerHTML = `<p style="color: red;">Error analyzing sonnet: ${error}</p>`;
  }
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
