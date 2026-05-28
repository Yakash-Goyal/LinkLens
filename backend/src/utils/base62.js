const BASE62_CHARACTERS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("Base62 value must be a non-negative safe integer");
  }

  if (value === 0) {
    return BASE62_CHARACTERS[0];
  }

  let remainingValue = value;
  let encodedValue = "";

  while (remainingValue > 0) {
    const remainder = remainingValue % BASE62_CHARACTERS.length;
    encodedValue = BASE62_CHARACTERS[remainder] + encodedValue;
    remainingValue = Math.floor(remainingValue / BASE62_CHARACTERS.length);
  }

  return encodedValue;
}

module.exports = {
  BASE62_CHARACTERS,
  encodeBase62,
};
