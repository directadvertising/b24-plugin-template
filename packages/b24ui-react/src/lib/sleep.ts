/**
 * Pause for specified milliseconds
 */
export async function sleepAction(timeout: number = 1000): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
}
