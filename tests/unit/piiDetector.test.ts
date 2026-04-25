import { describe, it, expect } from 'vitest';
import { containsPII, detectPIITypes } from '../../src/utils/piiDetector';

describe('containsPII', () => {
  describe('email detection', () => {
    it('should detect a standard email pattern', () => {
      expect(containsPII('contact me at test.user@example.com')).toBe(true);
    });

    it('should detect email with subdomains', () => {
      expect(containsPII('info@mail.example.co.uk')).toBe(true);
    });

    it('should not flag text without email', () => {
      expect(containsPII('hello world')).toBe(false);
    });
  });

  describe('phone detection', () => {
    it('should detect phone with dashes', () => {
      expect(containsPII('call 555-867-5309')).toBe(true);
    });

    it('should detect phone with dots', () => {
      expect(containsPII('call 555.867.5309')).toBe(true);
    });

    it('should detect phone without separators', () => {
      expect(containsPII('call 5558675309')).toBe(true);
    });
  });

  describe('SSN detection', () => {
    it('should detect SSN pattern', () => {
      expect(containsPII('my SSN is 123-45-6789')).toBe(true);
    });

    it('should not flag partial SSN-like numbers', () => {
      expect(containsPII('order 12345')).toBe(false);
    });
  });

  describe('no PII', () => {
    it('should return false for clean text', () => {
      expect(containsPII('hello world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(containsPII('')).toBe(false);
    });
  });
});

describe('detectPIITypes', () => {
  it('should return empty array for clean text', () => {
    expect(detectPIITypes('hello')).toEqual([]);
  });

  it('should detect email type', () => {
    const types = detectPIITypes('test.user@example.com');
    expect(types).toContain('email address');
  });

  it('should detect phone type', () => {
    const types = detectPIITypes('555-867-5309');
    expect(types).toContain('phone number');
  });

  it('should detect SSN type', () => {
    const types = detectPIITypes('123-45-6789');
    expect(types).toContain('Social Security Number');
  });

  it('should detect multiple PII types', () => {
    const types = detectPIITypes('test.user@example.com and 123-45-6789');
    expect(types).toContain('email address');
    expect(types).toContain('Social Security Number');
  });
});
