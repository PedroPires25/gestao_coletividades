export function evaluatePassword(password = "") {
    const checks = {
        length: password.length >= 8 && password.length <= 15,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[^A-Za-z\d]/.test(password),
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const missing = 5 - passed;

    let strength = "Fraca";
    if (Object.values(checks).every(Boolean) && password.length >= 10) {
        strength = "Forte";
    } else if (passed >= 3) {
        strength = "Normal";
    }

    return {
        checks,
        passed,
        missing,
        strength,
        isValid: Object.values(checks).every(Boolean),
    };
}