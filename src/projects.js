import { toEmbedUrl } from './figma.js'

/**
 * Add new projects here. Only raw Figma prototype share URLs are needed —
 * embed parameters are applied automatically via toEmbedUrl().
 *
 * Get the URL from Figma → Share → Copy link (while in Prototype view).
 */
export const RAW_PROJECTS = [
  {
    id: 'mumm-napa',
    title: 'Pernod Ricard Mumm Napa Redesign',
    protoDesktop:
      'https://www.figma.com/proto/tH3lU9nfOle4F7wxywpbY4/Redesign-Example-Screens?node-id=20-14120&viewport=310%2C88%2C0.09&t=gX7iZcKDU3WXDnYQ-1&scaling=min-zoom&content-scaling=fixed&page-id=20%3A14109',
    protoMobile:
      'https://www.figma.com/proto/tH3lU9nfOle4F7wxywpbY4/Redesign-Example-Screens?node-id=1-18155&viewport=655%2C124%2C0.18&t=TJhHyHGitdfjHxKm-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1',
  },
  {
    id: 'laurel-road',
    title: 'Laurel Road Redesign',
    protoDesktop:
      'https://www.figma.com/proto/tH3lU9nfOle4F7wxywpbY4/Redesign-Example-Screens?node-id=20-14117&viewport=310%2C88%2C0.09&t=fBQqjeakz1AAN8s9-1&scaling=min-zoom&content-scaling=fixed&page-id=20%3A14109',
    protoMobile:
      'https://www.figma.com/proto/tH3lU9nfOle4F7wxywpbY4/Redesign-Example-Screens?node-id=1-15921&viewport=655%2C124%2C0.18&t=GVvA0S2klk3AeOFP-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1',
  },
]

/**
 * Exported projects with embed URLs pre-computed.
 * App code reads embedDesktop / embedMobile — no manual URL construction needed.
 */
export const PROJECTS = RAW_PROJECTS.map((p) => ({
  ...p,
  embedDesktop: toEmbedUrl(p.protoDesktop, 'desktop'),
  embedMobile: toEmbedUrl(p.protoMobile, 'mobile'),
}))
