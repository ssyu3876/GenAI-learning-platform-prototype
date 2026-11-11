import { describe, expect, it } from 'vitest';
import { parseStartSeconds, parseVideoUrl } from './video-embed';

describe('parseVideoUrl', () => {
  it('recognises the usual YouTube link shapes', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=9l2o9kISio0',
      'https://youtu.be/9l2o9kISio0',
      'https://m.youtube.com/watch?v=9l2o9kISio0&feature=share',
      'https://www.youtube.com/embed/9l2o9kISio0',
      'https://www.youtube.com/shorts/9l2o9kISio0',
    ]) {
      const v = parseVideoUrl(url);
      expect(v?.provider).toBe('youtube');
      expect(v?.id).toBe('9l2o9kISio0');
      expect(v?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/9l2o9kISio0?rel=0');
    }
  });

  it('keeps a start time', () => {
    expect(parseVideoUrl('https://youtu.be/9l2o9kISio0?t=90')?.embedUrl).toContain('start=90');
    expect(parseVideoUrl('https://www.youtube.com/watch?v=9l2o9kISio0&t=1m30s')?.embedUrl).toContain('start=90');
  });

  it('recognises Bilibili videos', () => {
    const v = parseVideoUrl('https://www.bilibili.com/video/BV1xx411c7mD?p=2&t=30');
    expect(v?.provider).toBe('bilibili');
    expect(v?.embedUrl).toBe('https://player.bilibili.com/player.html?bvid=BV1xx411c7mD&page=2&autoplay=0&t=30');
  });

  it('leaves everything else alone', () => {
    for (const url of [
      'https://example.com/watch?v=9l2o9kISio0',
      'https://www.youtube.com/channel/UC123',
      'https://www.youtube.com/watch?v=short',
      'https://youtu.be.evil.com/9l2o9kISio0',
      'javascript:alert(1)',
      'not a url',
      'https://www.bilibili.com/video/av170001',
    ]) {
      expect(parseVideoUrl(url)).toBeNull();
    }
  });
});

describe('parseStartSeconds', () => {
  it('reads seconds and h/m/s forms', () => {
    expect(parseStartSeconds('75')).toBe(75);
    expect(parseStartSeconds('75s')).toBe(75);
    expect(parseStartSeconds('2m5s')).toBe(125);
    expect(parseStartSeconds('1h')).toBe(3600);
    expect(parseStartSeconds('abc')).toBe(0);
    expect(parseStartSeconds(null)).toBe(0);
  });
});
