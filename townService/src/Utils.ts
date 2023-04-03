/**
 * This function exists solely to help satisfy the linter + typechecker when it looks over the
 * stubbed (not yet implemented by you) functions. Remove calls to it as you go.
 *
 * @param _args
 */
// eslint-disable-next-line
export function removeThisFunctionCallWhenYouImplementThis(_args1?: any, _args2?: any): Error {
  return new Error('Unimplemented');
}

// eslint-disable-next-line
export function logError(err: any): void {
  // eslint-disable-next-line no-console
  console.trace(err);
}

enum KeyValue {
  ONE = 'one',
  TWO = 'two',
  THREE = 'three',
  FOUR = 'four',
}

function randomKey(): string {
  const values = Object.values(KeyValue);
  const random = Math.floor(Math.random() * values.length);
  return values[random];
}

export function generateKeySequence(): string[] {
  return Array(6).fill(0).map(randomKey);
}
