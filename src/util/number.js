/*
 * Returns a random integer from min to (min + range).
 *
 * https://stackoverflow.com/questions/13997793/generate-random-number-between-2-numbers
 */
export function randomInt(min = 0, range = 0) {
  return Math.floor((Math.random() * (range + 1)) + min);
}