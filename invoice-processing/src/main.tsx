import { StrictMode } from 'react'
import { ChakraProvider } from "@chakra-ui/react"
import theme from './theme'
import { ThemeProvider } from "next-themes"
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <App />
      </ThemeProvider>
    </ChakraProvider>
  </StrictMode>,
)
