// Tiny helper: time a block, log result, return value.
// Use in dev to see which DB calls are slow.
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === 'production') return fn();
  const start = Date.now();
  try {
    return await fn();
  } finally {
    // eslint-disable-next-line no-console
    console.log(`[timing] ${label}: ${Date.now() - start}ms`);
  }
}
