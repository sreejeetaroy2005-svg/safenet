/**
 * voiceCommandService.js
 * Browser Speech Recognition API wrapper for voice commands.
 */

const COMMANDS = [
  { patterns: ['send sos', 'sos', 'emergency', 'help me', 'mayday'],          action: 'SOS',     path: '/sos' },
  { patterns: ['find shelter', 'nearest shelter', 'shelter', 'safe place'],   action: 'SHELTER', path: '/map' },
  { patterns: ['call ambulance', 'ambulance', 'medical help'],                action: 'CALL_108', call: '108' },
  { patterns: ['call police', 'police'],                                       action: 'CALL_100', call: '100' },
  { patterns: ['call fire', 'fire brigade'],                                   action: 'CALL_101', call: '101' },
  { patterns: ['report incident', 'report fire', 'report flood', 'report'],   action: 'REPORT',  path: '/reports/new' },
  { patterns: ['open chat', 'chat', 'assistant', 'help'],                     action: 'CHAT',    path: '/chat' },
  { patterns: ['go home', 'home'],                                             action: 'HOME',    path: '/' },
]

export function matchCommand(transcript) {
  const lower = transcript.toLowerCase().trim()
  for (const cmd of COMMANDS) {
    if (cmd.patterns.some(p => lower.includes(p))) return cmd
  }
  return null
}

export function isSupported() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

/**
 * Start listening for a single voice command.
 * @param {function} onResult - called with matched command or null
 * @param {function} onTranscript - called with raw transcript string
 * @returns {function} stop function
 */
export function startListening(onResult, onTranscript) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { onResult(null); return () => {} }

  const recognition = new SR()
  recognition.lang = 'en-IN'
  recognition.interimResults = false
  recognition.maxAlternatives = 3

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript
    onTranscript?.(transcript)
    const cmd = matchCommand(transcript)
    onResult(cmd, transcript)
  }

  recognition.onerror = () => onResult(null)
  recognition.start()

  return () => { try { recognition.stop() } catch {} }
}
