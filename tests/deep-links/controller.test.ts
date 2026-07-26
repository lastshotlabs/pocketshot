import { describe, expect, it, vi } from 'vitest'
import {
  bindNativeDeepLinks,
  createExpoDeepLinkAdapter,
  DeepLinkController,
} from '../../src/deep-links'

describe('DeepLinkController', () => {
  it('normalizes custom-scheme hosts and queues cold delivery until navigation is ready', async () => {
    const handler = vi.fn()
    const controller = new DeepLinkController({
      allowedSchemes: ['pocketshot-party'],
      allowedHttpsHosts: ['party.example.com'],
      routes: [{ id: 'join', pattern: '/join/:code', handler }],
    })

    await expect(controller.ingest('pocketshot-party://join/HIT-427', 'cold')).resolves.toEqual({
      status: 'queued',
      source: 'cold',
    })
    expect(handler).not.toHaveBeenCalled()
    await controller.setReady()

    expect(handler).toHaveBeenCalledWith(
      { code: 'HIT-427' },
      expect.objectContaining({ pathSegments: ['join', 'HIT-427'] }),
      'cold',
    )
  })

  it('accepts allowlisted universal links and deduplicates warm redelivery', async () => {
    const handler = vi.fn()
    const controller = new DeepLinkController({
      allowedSchemes: ['pocketshot'],
      allowedHttpsHosts: ['app.example.com'],
      routes: [
        {
          id: 'thread',
          pattern: '/threads/:id',
          allowedQueryParams: ['ref'],
          handler,
        },
      ],
    })
    await controller.setReady()
    const url = 'https://app.example.com/threads/42?ref=push'
    await expect(controller.ingest(url, 'warm')).resolves.toMatchObject({
      status: 'handled',
      routeId: 'thread',
    })
    await expect(controller.ingest(url, 'cold')).resolves.toMatchObject({ status: 'duplicate' })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('rejects hostile origins, credentials, and unallowlisted query fields', async () => {
    const handler = vi.fn()
    const controller = new DeepLinkController({
      allowedSchemes: ['pocketshot'],
      allowedHttpsHosts: ['app.example.com'],
      routes: [
        {
          id: 'join',
          pattern: '/join/:code',
          allowedQueryParams: ['ref'],
          handler,
        },
      ],
    })
    await controller.setReady()
    await expect(
      controller.ingest('https://evil.example/join/CODE', 'warm'),
    ).resolves.toMatchObject({ status: 'rejected', reason: 'origin' })
    await expect(
      controller.ingest('https://user:pass@app.example.com/join/CODE', 'warm'),
    ).resolves.toMatchObject({ status: 'rejected', reason: 'origin' })
    await expect(
      controller.ingest('pocketshot://join/CODE?token=secret', 'warm'),
    ).resolves.toMatchObject({ status: 'rejected', reason: 'query' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('continues processing after a handler failure and bounds pending intents', async () => {
    const handler = vi.fn().mockRejectedValueOnce(new Error('router unavailable'))
    const controller = new DeepLinkController({
      allowedSchemes: ['pocketshot'],
      maxPending: 1,
      routes: [{ id: 'join', pattern: '/join/:code', handler }],
    })
    await controller.ingest('pocketshot://join/OLD', 'cold')
    await controller.ingest('pocketshot://join/NEW', 'cold')
    await expect(controller.setReady()).rejects.toThrow('router unavailable')
    await expect(controller.ingest('pocketshot://join/NEXT', 'warm')).resolves.toMatchObject({
      status: 'handled',
    })
    expect(handler).toHaveBeenLastCalledWith(
      { code: 'NEXT' },
      expect.any(Object),
      'warm',
    )
  })

  it('subscribes before reading the Android cold intent and deduplicates overlap', async () => {
    let listener: ((event: { url: string }) => void) | null = null
    const remove = vi.fn()
    const url = 'pocketshot://join/CODE'
    const linking = {
      addEventListener: vi.fn((_type: 'url', next: (event: { url: string }) => void) => {
        listener = next
        return { remove }
      }),
      getInitialURL: vi.fn(async () => {
        ;(listener as ((event: { url: string }) => void) | null)?.({ url })
        return url
      }),
    }
    const handler = vi.fn()
    const controller = new DeepLinkController({
      allowedSchemes: ['pocketshot'],
      routes: [{ id: 'join', pattern: '/join/:code', handler }],
    })
    await controller.setReady()
    const unbind = await bindNativeDeepLinks(createExpoDeepLinkAdapter(linking), controller)
    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce())
    expect(handler).toHaveBeenCalledWith({ code: 'CODE' }, expect.any(Object), 'cold')
    unbind()
    expect(linking.addEventListener.mock.invocationCallOrder[0]).toBeLessThan(
      linking.getInitialURL.mock.invocationCallOrder[0]!,
    )
    expect(remove).toHaveBeenCalledOnce()
  })
})
