"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Workaround: Prisma 7.0.1 client runtime expects an options object; passing
// undefined causes a TypeError accessing `__internal`. Provide empty config.
exports.prisma = new client_1.PrismaClient({});
