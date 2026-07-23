import { describe, expect, it } from 'vitest'; import { resolveProviderPermissionState } from '../lib/permissions'; import { PROVIDERS, runtimeProvider } from '../lib/providers';
const claude = runtimeProvider('claude')!;
describe('optional provider permission state', () => {
  it('enables configured provider with permission', () => expect(resolveProviderPermissionState(claude, true, true)).toMatchObject({ enabled: true, permissionGranted: true }));
  it('disables configured provider when permission is missing', () => expect(resolveProviderPermissionState(claude, true, false)).toMatchObject({ enabled: false, permissionGranted: false }));
  it('does not silently enable a disabled provider with permission', () => expect(resolveProviderPermissionState(claude, false, true)).toMatchObject({ enabled: false, permissionGranted: true }));
  it('keeps disabled provider disabled without permission', () => expect(resolveProviderPermissionState(claude, false, false)).toMatchObject({ enabled: false, permissionGranted: false }));
  it('exposes planned providers without enabling or granting them', () => expect(resolveProviderPermissionState(PROVIDERS.find((provider) => provider.id === 'gemini')!, true, true)).toMatchObject({ status: 'planned', phase: 4, enabled: false, permissionGranted: false }));
});
