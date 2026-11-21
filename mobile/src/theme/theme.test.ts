import { colors, spacing } from './index';

test('le thème définit le bleu patient et le vert aidant', () => {
  expect(colors.patient).toBeDefined();
  expect(colors.aidant).toBeDefined();
  expect(spacing.md).toBe(16);
});