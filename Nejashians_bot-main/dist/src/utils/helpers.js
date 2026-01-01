"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapOptionToCount = void 0;
const mapOptionToCount = (index) => {
    switch (index) {
        case 0: return 100;
        case 1: return 200;
        case 2: return 300;
        default: return 0;
    }
};
exports.mapOptionToCount = mapOptionToCount;
