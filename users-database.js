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
        registeredAt: new Date().toISOString(),
        // Статистика пользователя
        statistics: {
            totalPlacesViewed: 0,
            totalRoutesViewed: 0,
            totalCategoriesViewed: 0,
            viewedCategories: {}, // {category: count}
            viewedPlaces: {}, // {placeId: count}
            viewedRoutes: [], // [routeId1, routeId2, ...]
            lastActivity: new Date().toISOString()
        }
    };
    
    if (saveUserToStorage(user)) {
        // Записываем в историю
        if (typeof addHistoryEntry === 'function') {
            addHistoryEntry({
                userId: user.telegramId || user.name,
                userType: user.userType,
                actionType: 'user_registration',
                entityType: 'user',
                entityId: user.telegramId || user.name,
                entityName: user.name,
                metadata: {
                    userType: user.userType
                }
            });
        }
        
        // Обновляем статистику
        if (typeof incrementDailyStat === 'function') {
            incrementDailyStat(new Date(), 'user_registration', 1);
            updateUserTypeStat(new Date(), userType, 1);
        }
        
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
        // Инициализируем статистику, если её нет
        updatedUser = initUserStatistics(updatedUser);
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

// Инициализация статистики пользователя (если её нет)
function initUserStatistics(user) {
    if (!user.statistics) {
        user.statistics = {
            totalPlacesViewed: 0,
            totalRoutesViewed: 0,
            totalCategoriesViewed: 0,
            viewedCategories: {},
            viewedPlaces: {},
            viewedRoutes: [],
            lastActivity: new Date().toISOString()
        };
    }
    return user;
}

// Увеличение счетчика просмотров мест
function incrementUserPlaceView(user, placeId, placeName, categories) {
    if (!user) return null;
    
    user = initUserStatistics(user);
    
    // Увеличиваем общий счетчик
    user.statistics.totalPlacesViewed = (user.statistics.totalPlacesViewed || 0) + 1;
    
    // Увеличиваем счетчик для конкретного места
    if (!user.statistics.viewedPlaces) {
        user.statistics.viewedPlaces = {};
    }
    user.statistics.viewedPlaces[placeId] = (user.statistics.viewedPlaces[placeId] || 0) + 1;
    
    // Обновляем счетчики категорий
    if (categories && Array.isArray(categories)) {
        if (!user.statistics.viewedCategories) {
            user.statistics.viewedCategories = {};
        }
        categories.forEach(category => {
            user.statistics.viewedCategories[category] = 
                (user.statistics.viewedCategories[category] || 0) + 1;
            user.statistics.totalCategoriesViewed = 
                (user.statistics.totalCategoriesViewed || 0) + 1;
        });
    }
    
    user.statistics.lastActivity = new Date().toISOString();
    
    saveUserToStorage(user);
    return user;
}

// Увеличение счетчика просмотров маршрутов
function incrementUserRouteView(user, routeId) {
    if (!user) return null;
    
    user = initUserStatistics(user);
    
    // Увеличиваем общий счетчик
    user.statistics.totalRoutesViewed = (user.statistics.totalRoutesViewed || 0) + 1;
    
    // Добавляем маршрут в список просмотренных (если ещё нет)
    if (!user.statistics.viewedRoutes) {
        user.statistics.viewedRoutes = [];
    }
    if (!user.statistics.viewedRoutes.includes(routeId)) {
        user.statistics.viewedRoutes.push(routeId);
    }
    
    user.statistics.lastActivity = new Date().toISOString();
    
    saveUserToStorage(user);
    return user;
}

// Получение самых просматриваемых категорий пользователя
function getUserTopCategories(user, limit = 5) {
    if (!user || !user.statistics || !user.statistics.viewedCategories) {
        return [];
    }
    
    const categories = user.statistics.viewedCategories;
    const sortedCategories = Object.keys(categories)
        .map(category => ({
            category: category,
            count: categories[category]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    
    return sortedCategories;
}

// Получение статистики пользователя
function getUserStatistics(user) {
    if (!user) return null;
    
    user = initUserStatistics(user);
    
    return {
        totalPlacesViewed: user.statistics.totalPlacesViewed || 0,
        totalRoutesViewed: user.statistics.totalRoutesViewed || 0,
        totalCategoriesViewed: user.statistics.totalCategoriesViewed || 0,
        topCategories: getUserTopCategories(user, 5),
        lastActivity: user.statistics.lastActivity || null
    };
}

