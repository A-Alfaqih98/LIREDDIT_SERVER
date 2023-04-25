"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
const sleep = (ms) => new Promise((resolve, _reject) => {
    setTimeout(() => {
        resolve(true);
    }, ms);
});
exports.sleep = sleep;
//# sourceMappingURL=sleep.js.map