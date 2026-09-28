const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { getJwtSecret } = require("../config/auth");
const prisma = require("../config/prisma");

const BCRYPT_SALT_ROUNDS = 12;

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

async function register(userData) {
  const passwordHash = await bcrypt.hash(
    userData.password,
    BCRYPT_SALT_ROUNDS,
  );

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: passwordHash,
      role: "USER",
      phone: userData.phone || null,
      address: userData.address || null,
    },
  });

  return publicUser(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!user || !passwordMatches) {
    return null;
  }

  const token = jwt.sign(
    { email: user.email, role: user.role },
    getJwtSecret(),
    {
      algorithm: "HS256",
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      subject: String(user.id),
    },
  );

  return { token, user: publicUser(user) };
}

module.exports = { login, register };
