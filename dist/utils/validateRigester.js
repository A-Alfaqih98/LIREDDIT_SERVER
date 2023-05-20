"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRigester = void 0;
const validateRigester = (username, email, password) => {
    if (username.length <= 2) {
        return [
            {
                field: 'username',
                message: 'length must be greater than 2',
            },
        ];
    }
    if (username.includes('@')) {
        return [
            {
                field: 'username',
                message: 'You cannot include an @',
            },
        ];
    }
    if (!email.includes('@')) {
        return [
            {
                field: 'email',
                message: 'Invalid Email',
            },
        ];
    }
    if (password.length <= 2) {
        return [
            {
                field: 'password',
                message: 'length must be greater than 2',
            },
        ];
    }
    return null;
};
exports.validateRigester = validateRigester;
//# sourceMappingURL=validateRigester.js.map