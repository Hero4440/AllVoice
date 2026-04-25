import { describe, it, expect } from 'vitest';
import { parseIntent } from '../../src/pipeline/intentParser';

describe('parseIntent', () => {
  describe('describe_screen', () => {
    it('should parse "describe the screen"', () => {
      const intent = parseIntent('describe the screen');
      expect(intent.action).toBe('describe_screen');
    });

    it('should parse "what\'s on the page"', () => {
      const intent = parseIntent("what's on the page");
      expect(intent.action).toBe('describe_screen');
    });

    it('should parse "read the page"', () => {
      const intent = parseIntent('read the page');
      expect(intent.action).toBe('describe_screen');
    });
  });

  describe('add_to_cart', () => {
    it('should parse "add to cart"', () => {
      const intent = parseIntent('add to cart');
      expect(intent.action).toBe('add_to_cart');
    });

    it('should parse "add this item to my cart"', () => {
      const intent = parseIntent('add this item to my cart');
      expect(intent.action).toBe('add_to_cart');
    });
  });

  describe('purchase', () => {
    it('should parse "buy now"', () => {
      const intent = parseIntent('buy now');
      expect(intent.action).toBe('purchase');
    });

    it('should parse "purchase this"', () => {
      const intent = parseIntent('purchase this');
      expect(intent.action).toBe('purchase');
    });
  });

  describe('draft_message', () => {
    it('should parse "draft a message hello world"', () => {
      const intent = parseIntent('draft a message hello world');
      expect(intent.action).toBe('draft_message');
      expect(intent.parameters['messageContent']).toBe('hello world');
    });

    it('should parse "write a text hi there"', () => {
      const intent = parseIntent('write a text hi there');
      expect(intent.action).toBe('draft_message');
    });

    it('should parse "compose a chat hey"', () => {
      const intent = parseIntent('compose a chat hey');
      expect(intent.action).toBe('draft_message');
    });

    it('should parse "type a message good morning"', () => {
      const intent = parseIntent('type a message good morning');
      expect(intent.action).toBe('draft_message');
    });
  });

  describe('send_message', () => {
    it('should parse "send the message"', () => {
      const intent = parseIntent('send the message');
      expect(intent.action).toBe('send_message');
    });

    it('should parse "send text"', () => {
      const intent = parseIntent('send text');
      expect(intent.action).toBe('send_message');
    });
  });

  describe('confirm_pending', () => {
    it('should parse "confirm"', () => {
      const intent = parseIntent('confirm');
      expect(intent.action).toBe('confirm_pending');
    });

    it('should parse "yes"', () => {
      const intent = parseIntent('yes');
      expect(intent.action).toBe('confirm_pending');
    });

    it('should parse "proceed"', () => {
      const intent = parseIntent('proceed');
      expect(intent.action).toBe('confirm_pending');
    });
  });

  describe('click_unlabeled', () => {
    it('should parse "click the unlabeled button"', () => {
      const intent = parseIntent('click the unlabeled button');
      expect(intent.action).toBe('click_unlabeled');
    });

    it('should parse "click the mystery button"', () => {
      const intent = parseIntent('click the mystery button');
      expect(intent.action).toBe('click_unlabeled');
    });

    it('should parse "click the unknown control"', () => {
      const intent = parseIntent('click the unknown control');
      expect(intent.action).toBe('click_unlabeled');
    });
  });

  describe('unrecognized', () => {
    it('should return unrecognized for gibberish', () => {
      const intent = parseIntent('asdfghjkl');
      expect(intent.action).toBe('unrecognized');
    });

    it('should return unrecognized for empty string', () => {
      const intent = parseIntent('');
      expect(intent.action).toBe('unrecognized');
    });

    it('should return unrecognized for unrelated text', () => {
      const intent = parseIntent('the weather is nice today');
      expect(intent.action).toBe('unrecognized');
    });
  });

  describe('common properties', () => {
    it('should always include rawTranscript', () => {
      const transcript = 'add to cart';
      const intent = parseIntent(transcript);
      expect(intent.rawTranscript).toBe(transcript);
    });

    it('should default target to null', () => {
      const intent = parseIntent('add to cart');
      expect(intent.target).toBeNull();
    });

    it('should default parameters to empty object when no extraction', () => {
      const intent = parseIntent('buy now');
      expect(intent.parameters).toEqual({});
    });
  });
});
