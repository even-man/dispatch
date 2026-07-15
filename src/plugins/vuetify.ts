import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const lightTheme = {
  dark: false,
  colors: {
    primary:    '#568203',
    secondary:  '#6b6b6b',
    accent:     '#CC5500',

    error:   '#b00020',
    warning: '#f59e0b',
    info:    '#3b82f6',
    success: '#568203',
  }
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'lightTheme',
    themes: {
      lightTheme,
    },
  },
})

export default vuetify