# 🌹 Sonnetaw - Sonnet Checker

A web application for checking stress patterns (meter) and rhyme schemes when writing sonnets in English.

![Sonnet Checker Screenshot](https://github.com/user-attachments/assets/91209b56-0571-473c-8b2d-1493c36bad6a)

## Features

- **Text Input & Preprocessing**: Enter your sonnet with manual line breaks, automatic word tokenization and punctuation removal
- **Dictionary Lookup**: Uses CMU Pronouncing Dictionary JSON format to look up word pronunciations
- **Stress Pattern Analysis**: Highlights syllables based on stress levels:
  - Gray background: Unstressed syllables
  - Yellow background: Primary stress
  - Gold background: Secondary stress
  - Red/pink background: Meter errors (incorrect stress placement)
- **Rhyme Scheme Validation**: Marks rhyme endings and validates rhyme scheme consistency
- **Meter Validation**: Checks if lines follow the expected meter pattern (e.g., Iambic Pentameter)
- **Multiple Sonnet Forms**:
  - Shakespearean (English) Sonnet: ABAB CDCD EFEF GG
  - Petrarchan (Italian) Sonnet: ABBAABBA CDECDE
- **Extensible Design**: Easy to add more languages and poetic forms

## Technology Stack

- **TypeScript**: Type-safe code for better maintainability
- **Vite**: Fast build tool and development server
- **CMU Pronouncing Dictionary**: Pronunciation data in JSON format
- **Pure JavaScript**: No heavy frameworks, easy to deploy

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ShioLilia/sonnetaw.git
cd sonnetaw

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

The built files will be in the `dist/` directory, ready to deploy to any static hosting service.

## Usage

1. **Select Sonnet Form**: Choose between Shakespearean or Petrarchan sonnet forms
2. **Enter Your Sonnet**: Type or paste your 14-line sonnet in the text area
3. **Analyze**: Click the "Analyze Sonnet" button
4. **Review Results**: 
   - See stress patterns highlighted on each word
   - Check rhyme markers (A, B, C, etc.) at the end of lines
   - Review the analysis summary for meter and rhyme validation

## Project Structure

```
sonnetaw/
├── src/
│   ├── main.ts           # Main application entry point
│   ├── types.ts          # TypeScript type definitions
│   ├── dictionary.ts     # Dictionary service for pronunciation lookup
│   ├── textProcessor.ts  # Text preprocessing utilities
│   └── analyzer.ts       # Sonnet analysis logic
├── data/
│   └── cmu-dict-sample.json  # Sample CMU pronunciation dictionary
├── index.html            # Main HTML file
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies

```

## Extending the Application

### Adding More Words to the Dictionary

Edit `data/cmu-dict-sample.json` and add more word entries:

```json
{
  "word": [["phoneme1", "phoneme2", "vowel1", ...]]
}
```

Vowels should end with stress markers: 0 (no stress), 1 (primary stress), 2 (secondary stress).

### Adding New Sonnet Forms

Edit `src/analyzer.ts` and add new forms to the `SONNET_FORMS` object:

```typescript
export const SONNET_FORMS: { [key: string]: SonnetForm } = {
  yourform: {
    name: 'Your Form Name',
    rhymeScheme: ['A', 'B', 'B', 'A', ...],
    meter: {
      name: 'Meter Name',
      description: 'Description',
      stressPattern: [0, 1, 0, 1, ...],
      syllableCount: 10
    },
    lineCount: 14
  }
};
```

### Supporting Other Languages

1. Create a new pronunciation dictionary file for your language in `data/`
2. Adapt the phoneme and stress pattern system for your language's phonology
3. Update the dictionary loader to support multiple dictionaries
4. Add language-specific meter patterns

## How It Works

1. **Text Preprocessing**: Input text is split into lines, then each line is tokenized into words
2. **Dictionary Lookup**: Each word is looked up in the CMU Pronouncing Dictionary to get its phonemes and stress pattern
3. **Syllable Extraction**: Phonemes are grouped into syllables based on vowel sounds (which carry stress information)
4. **Rhyme Key Generation**: The rhyme key is extracted from the last stressed syllable to the end of the word
5. **Meter Validation**: The stress pattern of each line is compared against the expected meter pattern
6. **Rhyme Validation**: Lines are grouped by rhyme scheme letters and checked for consistency

## Future Enhancements

- [ ] Expand CMU dictionary with more words
- [ ] Add support for Italian sonnets with Italian pronunciation dictionary
- [ ] Add support for Latin poetry (dactylic hexameter, etc.)
- [ ] Allow users to upload custom dictionaries
- [ ] Add audio pronunciation playback
- [ ] Export analysis results as PDF or image
- [ ] Add more poetic forms (haiku, villanelle, etc.)
- [ ] Suggest corrections for meter and rhyme issues

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- CMU Pronouncing Dictionary for pronunciation data
- Shakespeare's Sonnet 18 used as example text
