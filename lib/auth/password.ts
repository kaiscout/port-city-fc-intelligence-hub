import { hash, verify } from "@node-rs/argon2";

const options = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

export async function hashPassword(password: string) {
  if (password.length < 12 || password.length > 256)
    throw new Error("Password must contain 12–256 characters");
  return hash(password, options);
}

export async function verifyPassword(encoded: string, password: string) {
  return verify(encoded, password);
}
