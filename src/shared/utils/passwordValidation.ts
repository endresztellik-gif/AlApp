export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    if (password.length < 8) {
        errors.push('Legalább 8 karakter szükséges');
    } else {
        score += 1;
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Legalább egy kisbetű szükséges');
    } else {
        score += 1;
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Legalább egy nagybetű szükséges');
    } else {
        score += 1;
    }

    if (!/\d/.test(password)) {
        errors.push('Legalább egy szám szükséges');
    } else {
        score += 1;
    }

    if (!/[@$!%*?&]/.test(password)) {
        errors.push('Legalább egy speciális karakter szükséges (@$!%*?&)');
    } else {
        score += 1;
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (password.length >= 12 && score === 5) {
        strength = 'strong';
    } else if (score >= 4) {
        strength = 'medium';
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength
    };
}
