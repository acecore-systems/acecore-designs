// Production case studies selected for Acecore Designs.
// Sources and creator credits document the production shown in each case.
// Images are resized WebP copies; their full compositions are retained.
// Source repository is read-only. No automatic feed or sales data is imported.
export const portfolioCheckedAt = '2026-10-18'

// Home hero selected by the owner. Keep the original Hatt product image intact;
// this does not change the published portfolio case studies below.
export const homeHeroWork = {
  id: 'harushiyu-avatar',
  sourceUrl: 'https://hatt.acecore.net/shop/harushiyu-avatar/',
  image: {
    src: '/portfolio/hatt/harushiyu-avatar.jpg',
    width: 1024,
    height: 1024,
    originalUrl:
      'https://hatt.acecore.net/uploads/hatt/shop/harushiyu-avatar.jpg',
    sourceFile: 'homepage-hatt/public/uploads/hatt/shop/harushiyu-avatar.jpg',
  },
}

// Owner withdrew desert-sketch on 2026-10-24. Its bytes and translations are
// retained only in archive/withdrawn, outside Astro's public build.
export const portfolioWorks = [
  {
    id: 'centipede',
    kind: 'illustration',
    offering: 'character-design',
    sourceUrl: 'https://hatt.acecore.net/blog/article/ekaitari/',
    image: {
      src: '/portfolio/hatt/centipede.webp',
      width: 800,
      height: 800,
      originalUrl: 'https://hatt.acecore.net/uploads/hatt/article-ekaitari.jpg',
      sourceFile: 'homepage-hatt/public/uploads/hatt/article-ekaitari.jpg',
    },
    services: ['character-design', 'character-illustration'],
  },
  {
    id: 'moku',
    kind: 'avatar',
    offering: '3d-character',
    sourceUrl: 'https://hatt.acecore.net/modeling/',
    workUrl: 'https://www.youtube.com/watch?v=93fDGtPtEas',
    action: 'watch',
    image: {
      src: '/portfolio/hatt/moku.webp',
      width: 480,
      height: 360,
      originalUrl: 'https://hatt.acecore.net/uploads/hatt/modeling/moku.jpg',
      sourceFile: 'homepage-hatt/public/uploads/hatt/modeling/moku.jpg',
    },
    services: ['3d-character', '3d-customization'],
  },
  {
    id: 'bright-friend',
    kind: 'gimmick',
    offering: '3d-effects',
    sourceUrl: 'https://hatt.acecore.net/modeling/',
    workUrl: 'https://www.youtube.com/watch?v=vle0XAJ9u9I',
    action: 'watch',
    image: {
      src: '/portfolio/hatt/bright-friend.webp',
      width: 640,
      height: 480,
      originalUrl:
        'https://hatt.acecore.net/uploads/hatt/modeling/bright-friend.jpg',
      sourceFile:
        'homepage-hatt/public/uploads/hatt/modeling/bright-friend.jpg',
    },
    services: ['3d-object', '3d-effects'],
  },
  {
    id: 'letter',
    kind: 'writing',
    offering: 'story-writing',
    sourceUrl: 'https://hatt.acecore.net/novels/',
    workUrl: 'https://ncode.syosetu.com/n8209mh/',
    action: 'read',
    services: ['story-writing', 'script-writing'],
  },
  {
    id: 'buying-mittens',
    kind: 'reading',
    offering: 'voice-recording',
    sourceUrl: 'https://hatt.acecore.net/videos/',
    workUrl: 'https://www.youtube.com/watch?v=wlkbblJzmiI',
    action: 'listen',
    // Original story: Niimi Nankichi. Hatt's contribution is the reading.
    // The video thumbnail is not copied: its other visual sources are unverified.
    services: ['voice-recording'],
  },
]
