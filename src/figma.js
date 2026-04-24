/**
 * Standardised Figma prototype embed parameters.
 * Desktop: fit-width scaling so the design fills the iframe width and scrolls vertically.
 * Mobile:  scale-down so the device chrome fits within the iframe bounds.
 */
const EMBED_PARAMS = {
  desktop: {
    scaling: 'fit-width',
    'content-scaling': 'fixed',
    footer: 'false',
    'embed-host': 'share',
  },
  mobile: {
    scaling: 'scale-down',
    'content-scaling': 'fixed',
    footer: 'false',
    'embed-host': 'share',
  },
}

/**
 * Convert a Figma prototype share URL (www.figma.com/proto/…) into a
 * standardised embed URL (embed.figma.com/proto/…).
 *
 * - Applies the correct scaling / footer / embed-host params for the breakpoint.
 * - Auto-derives `starting-point-node-id` from `node-id` when absent.
 *   (Figma node-ids use a hyphen in URLs, e.g. "4-7064", but
 *    starting-point-node-id uses a colon, e.g. "4:7064".)
 *
 * @param {string} protoUrl  Raw share URL from Figma's Share dialog.
 * @param {'desktop'|'mobile'} type
 * @returns {string} Ready-to-use embed src.
 */
export function toEmbedUrl(protoUrl, type = 'desktop') {
  const url = new URL(
    protoUrl.replace('//www.figma.com/', '//embed.figma.com/'),
  )

  for (const [key, value] of Object.entries(EMBED_PARAMS[type])) {
    url.searchParams.set(key, value)
  }

  // Auto-derive starting-point-node-id when the share URL omits it
  if (!url.searchParams.has('starting-point-node-id')) {
    const nodeId = url.searchParams.get('node-id')
    if (nodeId) {
      // node-id format: "1234-5678"  →  starting-point format: "1234:5678"
      url.searchParams.set('starting-point-node-id', nodeId.replace('-', ':'))
    }
  }

  return url.toString()
}
