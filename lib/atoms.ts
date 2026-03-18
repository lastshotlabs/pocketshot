import { atom } from 'jotai'
import type { MfaChallenge } from './auth'

export const pendingMfaChallengeAtom = atom<MfaChallenge | null>(null)
