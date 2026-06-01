const BASE62_CHARACTERS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(value) {
  if (
    !(
      typeof value === "bigint" ||
      (typeof value === "number" && Number.isSafeInteger(value))
    ) ||
    value < 0
  ) {
    throw new TypeError("Base62 value must be a non-negative integer");
  }

  let remainingValue = BigInt(value);

  if (remainingValue === 0n) {
    return BASE62_CHARACTERS[0];
  }

  const base = BigInt(BASE62_CHARACTERS.length);
  let encodedValue = "";

  while (remainingValue > 0n) {
    const remainder = Number(remainingValue % base);
    encodedValue = BASE62_CHARACTERS[remainder] + encodedValue;
    remainingValue = remainingValue / base;
  }

  return encodedValue;
}

module.exports = {
  BASE62_CHARACTERS,
  encodeBase62,
};
