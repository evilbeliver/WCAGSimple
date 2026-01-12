import { describe, it, expect } from 'vitest';
import { isValidUrl, ScanError } from '@/utils/errors';

describe('Error Utilities', () => {
  describe('isValidUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should accept valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('ScanError', () => {
    it('should create error with code and details', () => {
      const error = new ScanError('Test error', 'INVALID_URL', 'test details');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('INVALID_URL');
      expect(error.details).toBe('test details');
      expect(error.name).toBe('ScanError');
    });
  });
});
