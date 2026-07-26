import { describe, expect, it, vi } from 'vitest'
import { FreshAuthenticationController } from '../../src/biometrics'

describe('FreshAuthenticationController', () => {
  it('coalesces prompts, reuses fresh proof, and invalidates it', async () => {
    const prompt = vi.fn(async () => ({ success: true }))
    const auth = new FreshAuthenticationController(prompt, () => 1_000, 500)
    expect(await Promise.all([auth.authenticate(), auth.authenticate()])).toEqual([true, true])
    expect(prompt).toHaveBeenCalledOnce()
    await auth.require(vi.fn())
    expect(prompt).toHaveBeenCalledOnce()
    auth.invalidate()
    await auth.authenticate()
    expect(prompt).toHaveBeenCalledTimes(2)
  })

  it('does not run a gated action after authentication denial', async () => {
    const action = vi.fn()
    const auth = new FreshAuthenticationController(async () => ({ success: false }))
    await expect(auth.require(action)).rejects.toThrow('Fresh')
    expect(action).not.toHaveBeenCalled()
  })
})
