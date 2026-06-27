// Separate file so Vite Fast Refresh works correctly.
// AppContext.jsx exports AppProvider (component) — this file exports useApp (hook).
// Mixing them in one file breaks HMR.
import { useContext } from 'react'
import { AppContext } from './AppContext'

export const useApp = () => useContext(AppContext)
