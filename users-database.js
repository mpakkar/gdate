// База данных пользователей
// Использует localStorage для сохранения данных между сессиями

// Получение пользователя из localStorage
function getUserFromStorage() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            return JSON.parse(userData);
        }
    } catch (error) {
        console.error('Ошибка при чтении данных пользователя:', error);
    }
    return null;
}

// Сохранение пользователя в localStorage
function saveUserToStorage(user) {
    try {
        localStorage.setItem('userData', JSON.stringify(user));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении данных пользователя:', error);
        return false;
    }
}

// Получение пользователя из Telegram WebApp
function getUserFromTelegram() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        const tgUser = Telegram.WebApp.initDataUnsafe.user;
        return {
            id: tgUser.id,
            firstName: tgUser.first_name || '',
            lastName: tgUser.last_name || '',
            username: tgUser.username || '',
            isBot: tgUser.is_bot || false
        };
    }
    return null;
}

// Проверка, зарегистрирован ли пользователь
function isUserRegistered() {
    const user = getUserFromStorage();
    return user !== null && user.name && user.userType;
}

// Инициализация пользователя при загрузке
function initUserData() {
    // Сначала проверяем, есть ли сохраненный пользователь
    let user = getUserFromStorage();
    
    // Если пользователь найден, возвращаем его
    if (user) {
        return user;
    }
    
    // Если пользователя нет, пытаемся получить данные из Telegram
    const tgUser = getUserFromTelegram();
    if (tgUser) {
        // Ищем пользователя с таким telegramId в сохраненных данных
        // Это уже проверено выше, так что если пользователя нет, создаем базовую запись
        // Но не регистрируем автоматически - ждем регистрации пользователя
        return null;
    }
    
    return null;
}

// Регистрация нового пользователя
function registerUser(name, userType) {
    const user = {
        telegramId: getUserFromTelegram()?.id || null,
        name: name,
        userType: userType, // 'user' или 'place'
        registered: true,
        registeredAt: new Date().toISOString()
    };
    
    if (saveUserToStorage(user)) {
        return user;
    }
    return null;
}

// Обновление данных пользователя
function updateUser(userData) {
    const user = getUserFromStorage();
    if (user) {
        const updatedUser = {
            ...user,
            ...userData
        };
        if (saveUserToStorage(updatedUser)) {
            return updatedUser;
        }
    }
    return null;
}

// Получение текущего пользователя
function getCurrentUser() {
    return getUserFromStorage();
}

