export const authenticateMoodle = async (username, password) => {
    const service = 'moodle_mobile_app';
    // Use Vite proxy '/moodle-api' to bypass CORS in dev.
    // In production, might need a real backend proxy if Moodle doesn't return CORS headers.
    const url = `/moodle-api/login/token.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&service=${service}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.error) {
            return { success: false, error: data.error };
        }

        if (data.token) {
            return { success: true, token: data.token };
        }

        return { success: false, error: 'Unknown response format' };
    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, error: error.message || 'Network error' };
    }
};
