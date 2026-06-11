import { useTheme } from '../theme/ThemeContext';
import { useLocation } from 'react-router-dom';

const LOGO_NORMAL = '/LOGO_GCDC04.png';
const LOGO_LOGIN_DARK = '/Logo branco login.png';
const LOGO_PAGES_DARK = '/Logo branco paginas.png';

export function useAppLogo() {
    const { theme } = useTheme();
    const location = useLocation();

    const isLoginPage = location.pathname === '/login' || location.pathname === '/';
    const isDarkMode = theme === 'theme-dark';

    if (isDarkMode) {
        return isLoginPage ? LOGO_LOGIN_DARK : LOGO_PAGES_DARK;
    }
    
    return LOGO_NORMAL;
}
