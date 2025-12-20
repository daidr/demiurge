import * as monaco from 'monaco-editor'

/**
 * Register JSONPath language support for Monaco Editor
 * Provides syntax highlighting for JSONPath expressions
 */
export function registerJsonPathLanguage() {
  // Check if already registered
  if (monaco.languages.getLanguages().some(lang => lang.id === 'jsonpath')) {
    return
  }

  // Register the language
  monaco.languages.register({
    id: 'jsonpath',
    extensions: [],
    aliases: ['JSONPath', 'jsonpath'],
  })

  // Define tokenization rules
  monaco.languages.setMonarchTokensProvider('jsonpath', {
    defaultToken: '',

    // JSONPath operators and symbols
    operators: ['..', '.', '*', '?', '@', '$'],
    brackets: [
      { open: '[', close: ']', token: 'delimiter.bracket' },
      { open: '(', close: ')', token: 'delimiter.parenthesis' },
    ],

    tokenizer: {
      root: [
        // Root reference $
        [/\$/, 'variable.predefined'],

        // Current node reference @
        [/@/, 'variable.predefined'],

        // Recursive descent ..
        [/\.\./, 'operator'],

        // Dot notation
        [/\./, 'operator'],

        // Wildcard
        [/\*/, 'operator'],

        // Filter expression start ?( ... )
        [/\?\s*\(/, { token: 'keyword', next: '@filter' }],

        // Array slice notation [start:end:step]
        [/\[/, { token: 'delimiter.bracket', next: '@bracket' }],

        // Property names (after dot)
        [/[a-z_]\w*/i, 'identifier'],

        // Whitespace
        [/\s+/, 'white'],
      ],

      bracket: [
        // Array index
        [/-?\d+/, 'number'],

        // Slice operator
        [/:/, 'operator'],

        // Wildcard in bracket
        [/\*/, 'operator'],

        // String index 'prop' or "prop"
        [/'[^']*'/, 'string'],
        [/"[^"]*"/, 'string'],

        // Filter expression inside bracket
        [/\?\s*\(/, { token: 'keyword', next: '@filter' }],

        // Close bracket
        [/\]/, { token: 'delimiter.bracket', next: '@pop' }],

        // Property name in bracket
        [/[a-z_]\w*/i, 'identifier'],

        // Comma for union
        [/,/, 'delimiter'],

        // Whitespace
        [/\s+/, 'white'],
      ],

      filter: [
        // Current node in filter
        [/@/, 'variable.predefined'],

        // Root in filter
        [/\$/, 'variable.predefined'],

        // Comparison operators
        [/[<>=!]+/, 'operator'],

        // Logical operators
        [/&&|\|\|/, 'operator'],

        // Boolean literals
        [/\b(true|false)\b/, 'keyword'],

        // Null literal
        [/\bnull\b/, 'keyword'],

        // Numbers
        [/-?\d+(\.\d+)?/, 'number'],

        // Strings
        [/'[^']*'/, 'string'],
        [/"[^"]*"/, 'string'],

        // Property access
        [/\./, 'operator'],
        [/\[/, { token: 'delimiter.bracket', next: '@bracket' }],

        // Property names
        [/[a-z_]\w*/i, 'identifier'],

        // Nested parentheses
        [/\(/, { token: 'delimiter.parenthesis', next: '@filter' }],

        // Close filter
        [/\)/, { token: 'keyword', next: '@pop' }],

        // Whitespace
        [/\s+/, 'white'],
      ],
    },
  })

  // Set language configuration for bracket matching and auto-closing
  monaco.languages.setLanguageConfiguration('jsonpath', {
    brackets: [
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '\'', close: '\'' },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '\'', close: '\'' },
      { open: '"', close: '"' },
    ],
  })
}
