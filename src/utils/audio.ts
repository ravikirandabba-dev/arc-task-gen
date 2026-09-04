/**
 * Audio processing utilities.
 */

/**
 * Calculates the root mean square (RMS) of an audio buffer to determine volume/silence.
 * 
 * @param buffer - The audio data array.
 * @returns The RMS value representing the volume level.
 */
export function calculateRMS(buffer: Float32Array): number {
  if (buffer.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Checks if a given audio buffer is considered silence based on a threshold.
 * 
 * @param buffer - The audio data array.
 * @param threshold - The RMS threshold below which the audio is considered silence.
 * @returns boolean indicating if the buffer is silent.
 */
export function isSilent(buffer: Float32Array, threshold: number = 0.01): boolean {
  return calculateRMS(buffer) < threshold;
}

/**
 * Converts an ArrayBuffer to a Float32Array for processing.
 * 
 * @param buffer - The source ArrayBuffer.
 * @returns A Float32Array representation.
 */
export function convertBufferToFloat32(buffer: ArrayBuffer): Float32Array {
  return new Float32Array(buffer);
}
