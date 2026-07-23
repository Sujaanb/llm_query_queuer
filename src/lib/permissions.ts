import type { ProviderMetadata } from './providers';
import type { ProviderPermissionState } from './types';
export function resolveProviderPermissionState(provider: ProviderMetadata, configuredEnabled: boolean, permissionGranted: boolean): ProviderPermissionState {
  const builtIn = provider.builtIn; const planned = provider.status === 'planned';
  return {
    id: provider.id, name: provider.name, phase: provider.phase, builtIn, status: provider.status,
    enabled: planned ? false : builtIn || (configuredEnabled && permissionGranted), permissionGranted: planned ? false : builtIn || permissionGranted,
    experimental: Boolean(provider.experimental), accessDependent: Boolean(provider.accessDependent),
  };
}
