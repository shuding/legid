// Default salt prefix for ID generation
const SALT = 'legid:'

// Default length for generated IDs if not specified
const DEFAULT_ID_LENGTH = 10

// Custom alphabet for ID generation
const ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// Calculate the conversion ratio from hex to base62
// Math.log(62) / Math.log(16) ~= 1.48855
const HEX_TO_ALPHABET_RATIO = 1.48855

// SHA-1 is 160 bits, which is 40 hex characters. So the max length of the hex
// ID is 80 characters (40 from token, 40 from hash).
// 80 / 1.48855 = 54
// Maximum length for custom alphabet IDs
const MAX_ID_LENGTH = 54

/**
 * Calculate required hex length for desired alphabet length
 */
function calculateHexLength(alphabetLength: number): number {
  return Math.floor(alphabetLength * HEX_TO_ALPHABET_RATIO)
}

/**
 * Converts hex string to custom alphabet using base conversion
 */
function hexToCustomAlphabet(hex: string): string {
  if (!hex) return ''

  // Convert hex to decimal
  let decimal = BigInt('0x' + hex)
  let result = ''

  const base = BigInt(ALPHABET.length)

  do {
    const remainder = decimal % base
    result = ALPHABET[Number(remainder)] + result
    decimal = decimal / base
  } while (decimal > 0n)

  return result
}

/**
 * Converts custom alphabet string back to hex using base conversion
 */
function customAlphabetToHex(customStr: string): string {
  if (!customStr) return ''

  let decimal = 0n
  const base = BigInt(ALPHABET.length)

  for (let i = 0; i < customStr.length; i++) {
    const char = customStr[i]
    const index = ALPHABET.indexOf(char)
    if (index === -1) {
      throw new Error(`Invalid character: ${char}`)
    }
    decimal = decimal * base + BigInt(index)
  }

  // Convert decimal back to hex
  return decimal.toString(16)
}

/**
 * Generates a random hex token of specified length using crypto.getRandomValues
 */
function generateRandomHexToken(length: number): string {
  // Generate enough bytes to cover the required hex length
  // Each byte produces 2 hex characters
  const array = new Uint8Array(Math.ceil(length / 2))
  crypto.getRandomValues(array)

  // Ensure that the first byte is not zero to avoid leading zeros in hex
  while (array[0] < 16) {
    crypto.getRandomValues(array)
  }

  const hex = Array.from(array, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
  return hex.substring(0, length)
}

/**
 * Converts ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer)
  return Array.from(byteArray, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
}

/**
 * Computes SHA-1 hash using SubtleCrypto
 */
async function sha1(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  return arrayBufferToHex(hashBuffer)
}

/**
 * Creates a random ID
 * ID structure: chars at odd positions are from token, chars at even positions are from hash
 * Uses hex internally, converts to custom alphabet at the end
 */
export async function createId({
  approximateLength = DEFAULT_ID_LENGTH,
  salt = SALT,
} = {}): Promise<string> {
  if (approximateLength <= 0) {
    throw new Error('ID length must be a positive integer')
  }
  if (approximateLength > MAX_ID_LENGTH) {
    throw new Error(`ID length exceeds maximum of ${MAX_ID_LENGTH} characters`)
  }

  // Calculate required hex length for the desired alphabet ID length
  let hexLength = calculateHexLength(approximateLength)

  // Generate random token
  const hexToken = generateRandomHexToken((hexLength + 1) >> 1)

  // Calculate hash
  const hexHash = await sha1(salt + hexToken)

  // Create hex ID
  let hexId = ''

  for (let i = 0; i < hexLength; i++) {
    if (i % 2) {
      hexId += hexHash[i >> 1]
    } else {
      hexId += hexToken[i >> 1]
    }
  }

  return hexToCustomAlphabet(hexId)
}

/**
 * Verifies if an ID was created from the createId process
 * Converts from custom alphabet back to hex, then verifies
 */
export async function verifyId(
  id: string,
  { salt = SALT } = {}
): Promise<boolean> {
  if (!id || id.length > MAX_ID_LENGTH) {
    return false // Invalid ID length
  }

  try {
    // Convert custom alphabet ID back to hex without specifying expected length
    const hexId = customAlphabetToHex(id)

    let extractedHexToken = ''
    let extractedHexHash = ''

    for (let i = 0; i < hexId.length; i++) {
      if (i % 2) {
        extractedHexHash += hexId[i]
      } else {
        extractedHexToken += hexId[i]
      }
    }

    if (extractedHexHash.length === 0) {
      // If no hash part is extracted, it's invalid
      return false
    }

    // Calculate expected hex value
    const expectedHexValue = await sha1(salt + extractedHexToken)

    // It must be a prefix match
    return expectedHexValue.startsWith(extractedHexHash)
  } catch (error) {
    return false
  }
}
