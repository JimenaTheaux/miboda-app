/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bordo:          '#5C1F2E',
        'bordo-mid':    '#7D2E40',
        'bordo-light':  '#A85268',
        'bordo-pale':   '#EDD5DA',
        rose:           '#C4889A',
        blush:          '#F2E8EA',
        ink:            '#1A0F12',
        'ink-mid':      '#4A2F38',
        'ink-soft':     '#7A5A64',
        surface:        '#FDFBFB',
        'surface-2':    '#F5EFF0',
        border:         '#E8D8DC',
        gold:           '#B8965A',
        'gold-pale':    '#F0E8D8',
        sage:           '#6B8070',
        'sage-pale':    '#DCE8E0',
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
}
