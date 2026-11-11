/**
 * Utilitário de Autenticação Biométrica WebAuthn para PWA de Campo
 * Permite ao tratador cadastrar e fazer login usando Touch ID, Face ID,
 * leitor de impressão digital ou PIN nativo do Android / iOS / Windows Hello.
 */

// Converte string base64url para Uint8Array
function bufferDecode(value: string): ArrayBuffer {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)).buffer;
}

// Converte ArrayBuffer para string base64url
function bufferEncode(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Verifica se o dispositivo móvel suporta autenticação biométrica via WebAuthn
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (err) {
    return false;
  }
}

/**
 * Registra a credencial biométrica do tratador no dispositivo
 */
export async function registerBiometricCredential(
  cpf: string,
  userName: string = 'Tratador JHoston'
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (!(await isBiometricsAvailable())) {
    return { success: false, error: 'Biometria não suportada neste dispositivo móvel.' };
  }

  try {
    const cleanCpf = cpf.replace(/\D/g, '');
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(cleanCpf);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'JHPCS Campo - JHoston Pools',
          id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        },
        user: {
          id: userId,
          name: cleanCpf,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },  // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Falha ao registrar biometria.' };
    }

    const credId = bufferEncode(credential.rawId);
    // Salva a credencial associada ao CPF localmente
    localStorage.setItem(`jhpcs_bio_${cleanCpf}`, credId);

    return { success: true, credentialId: credId };
  } catch (err: any) {
    console.error('Erro no registro biométrico:', err);
    return { success: false, error: err?.message || 'Biometria cancelada ou não autorizada.' };
  }
}

/**
 * Realiza autenticação biométrica (FaceID / Digital)
 */
export async function authenticateWithBiometrics(
  cpf: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (!(await isBiometricsAvailable())) {
    return { success: false, error: 'Biometria não disponível.' };
  }

  try {
    const cleanCpf = cpf.replace(/\D/g, '');
    const savedCredId = localStorage.getItem(`jhpcs_bio_${cleanCpf}`);
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const allowCredentials: PublicKeyCredentialDescriptor[] = savedCredId
      ? [{ id: bufferDecode(savedCredId), type: 'public-key' }]
      : [];

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        allowCredentials,
      },
    })) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: 'Autenticação biométrica não concluída.' };
    }

    return { success: true, credentialId: bufferEncode(assertion.rawId) };
  } catch (err: any) {
    console.warn('Falha na autenticação biométrica:', err);
    return { success: false, error: err?.message || 'Biometria recusada ou cancelada.' };
  }
}

