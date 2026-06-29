import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

/**
 * Generate a new Curve25519 keypair for encryption/decryption
 * @returns {Object} { publicKey, secretKey } in Base64 strings
 */
export const generateKeyPair = () => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: util.encodeBase64(keyPair.publicKey),
    secretKey: util.encodeBase64(keyPair.secretKey),
  };
};

/**
 * Encrypt a message using our secret key and the recipient's public key
 * @param {string} message - Plain text message
 * @param {string} mySecretKey - Base64 string of our secret key
 * @param {string} theirPublicKey - Base64 string of recipient's public key
 * @returns {Object} { encryptedMessage, nonce }
 */
export const encryptMessage = (message, mySecretKey, theirPublicKey) => {
  const ephemeralNonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = util.decodeUTF8(message);

  const secretKeyUint8 = util.decodeBase64(mySecretKey);
  const publicKeyUint8 = util.decodeBase64(theirPublicKey);

  const encrypted = nacl.box(
    messageUint8,
    ephemeralNonce,
    publicKeyUint8,
    secretKeyUint8
  );

  return {
    encryptedMessage: util.encodeBase64(encrypted),
    nonce: util.encodeBase64(ephemeralNonce),
  };
};

/**
 * Decrypt a message using our secret key and the sender's public key
 * @param {string} encryptedMessage - Base64 string of the encrypted message
 * @param {string} nonce - Base64 string of the nonce used during encryption
 * @param {string} mySecretKey - Base64 string of our secret key
 * @param {string} theirPublicKey - Base64 string of sender's public key
 * @returns {string|null} Decrypted plain text message, or null if failed
 */
export const decryptMessage = (encryptedMessage, nonce, mySecretKey, theirPublicKey) => {
  try {
    const encryptedMessageUint8 = util.decodeBase64(encryptedMessage);
    const nonceUint8 = util.decodeBase64(nonce);
    const secretKeyUint8 = util.decodeBase64(mySecretKey);
    const publicKeyUint8 = util.decodeBase64(theirPublicKey);

    const decrypted = nacl.box.open(
      encryptedMessageUint8,
      nonceUint8,
      publicKeyUint8,
      secretKeyUint8
    );

    if (!decrypted) return null;

    return util.encodeUTF8(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};
