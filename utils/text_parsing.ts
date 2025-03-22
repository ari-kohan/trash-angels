import { profanity } from '@2toad/profanity';

export const sqlFound = (description: string) => {
  if (description && /[<>&'"]/.test(description)) {
    return true;
  }
  return false;
}

export const profanityFound = (description: string) => {
  // Check for curses and slurs in the description
  if (description && profanity.exists(description)) {
    return true;
  }
  return false;
}