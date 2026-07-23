import { describe, expect, it } from 'vitest'; import { resolveProviderPermissionState } from '../lib/permissions'; import { runtimeProvider } from '../lib/providers';
const gemini=runtimeProvider('gemini')!;
describe('experimental provider permission state',()=>{
  it('enables configured provider only with permission',()=>expect(resolveProviderPermissionState(gemini,true,true)).toMatchObject({enabled:true,permissionGranted:true,experimental:true,status:'experimental'}));
  it('disables configured provider when permission is missing',()=>expect(resolveProviderPermissionState(gemini,true,false)).toMatchObject({enabled:false,permissionGranted:false}));
  it('keeps disabled provider disabled with retained permission',()=>expect(resolveProviderPermissionState(gemini,false,true)).toMatchObject({enabled:false,permissionGranted:true}));
  it('keeps disabled provider disabled without permission',()=>expect(resolveProviderPermissionState(gemini,false,false)).toMatchObject({enabled:false,permissionGranted:false}));
  it('marks Aristotle access-dependent',()=>expect(resolveProviderPermissionState(runtimeProvider('aristotle')!,false,false).accessDependent).toBe(true));
});
