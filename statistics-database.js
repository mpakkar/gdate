// База данных статистики действий
// Сохраняет статистику действий за каждый день

// Получение статистики из localStorage
function getStatisticsFromStorage() {
    try {
        const statsData = localStorage.getItem('statisticsData');
        if (statsData) {
            return JSON.parse(statsData);
        }
    } catch (error) {
        console.error('Ошибка при чтении статистики:', error);
    }
    return {};
}

// Сохранение статистики в localStorage
function saveStatisticsToStorage(statistics) {
    try {
        localStorage.setItem('statisticsData', JSON.stringify(statistics));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении статистики:', error);
        return false;
    }
}

// Получение ключа для даты (формат: YYYY-MM-DD)
function getDateKey(date = new Date()) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Увеличение счетчика действия за день
function incrementDailyStat(date, statType, value = 1) {
    const statistics = getStatisticsFromStorage();
    const dateKey = getDateKey(date);
    
    if (!statistics[dateKey]) {
        statistics[dateKey] = {
            date: dateKey,
            totalActions: 0,
            placeViews: 0,
            routeViews: 0,
            categoryViews: 0,
            placeShows: 0,
            userRegistrations: 0,
            routeCreations: 0,
            byActionType: {},
            byUserType: {
                user: 0,
                place: 0
            },
            byCategory: {}
        };
    }
    
    const dayStats = statistics[dateKey];
    dayStats.totalActions = (dayStats.totalActions || 0) + value;
    
    // Обновляем счетчики по типам действий
    if (statType === 'place_view') {
        dayStats.placeViews = (dayStats.placeViews || 0) + value;
    } else if (statType === 'route_view') {
        dayStats.routeViews = (dayStats.routeViews || 0) + value;
    } else if (statType === 'category_view') {
        dayStats.categoryViews = (dayStats.categoryViews || 0) + value;
    } else if (statType === 'place_show') {
        dayStats.placeShows = (dayStats.placeShows || 0) + value;
    } else if (statType === 'user_registration') {
        dayStats.userRegistrations = (dayStats.userRegistrations || 0) + value;
    } else if (statType === 'route_creation') {
        dayStats.routeCreations = (dayStats.routeCreations || 0) + value;
    }
    
    // Обновляем счетчик по типу действия
    dayStats.byActionType[statType] = (dayStats.byActionType[statType] || 0) + value;
    
    saveStatisticsToStorage(statistics);
    return dayStats;
}

// Обновление статистики по типу пользователя
function updateUserTypeStat(date, userType, value = 1) {
    const statistics = getStatisticsFromStorage();
    const dateKey = getDateKey(date);
    
    if (!statistics[dateKey]) {
        statistics[dateKey] = {
            date: dateKey,
            totalActions: 0,
            byUserType: {
                user: 0,
                place: 0
            }
        };
    }
    
    const dayStats = statistics[dateKey];
    if (!dayStats.byUserType) {
        dayStats.byUserType = {
            user: 0,
            place: 0
        };
    }
    
    dayStats.byUserType[userType] = (dayStats.byUserType[userType] || 0) + value;
    saveStatisticsToStorage(statistics);
    return dayStats;
}

// Обновление статистики по категории
function updateCategoryStat(date, category, value = 1) {
    const statistics = getStatisticsFromStorage();
    const dateKey = getDateKey(date);
    
    if (!statistics[dateKey]) {
        statistics[dateKey] = {
            date: dateKey,
            totalActions: 0,
            byCategory: {}
        };
    }
    
    const dayStats = statistics[dateKey];
    if (!dayStats.byCategory) {
        dayStats.byCategory = {};
    }
    
    dayStats.byCategory[category] = (dayStats.byCategory[category] || 0) + value;
    saveStatisticsToStorage(statistics);
    return dayStats;
}

// Получение статистики за день
function getDayStatistics(date) {
    const statistics = getStatisticsFromStorage();
    const dateKey = getDateKey(date);
    return statistics[dateKey] || null;
}

// Получение статистики за период
function getPeriodStatistics(startDate, endDate) {
    const statistics = getStatisticsFromStorage();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const result = {
        totalActions: 0,
        placeViews: 0,
        routeViews: 0,
        categoryViews: 0,
        placeShows: 0,
        userRegistrations: 0,
        routeCreations: 0,
        byActionType: {},
        byUserType: {
            user: 0,
            place: 0
        },
        byCategory: {},
        days: []
    };
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
        const dateKey = getDateKey(currentDate);
        const dayStats = statistics[dateKey];
        
        if (dayStats) {
            result.totalActions += dayStats.totalActions || 0;
            result.placeViews += dayStats.placeViews || 0;
            result.routeViews += dayStats.routeViews || 0;
            result.categoryViews += dayStats.categoryViews || 0;
            result.placeShows += dayStats.placeShows || 0;
            result.userRegistrations += dayStats.userRegistrations || 0;
            result.routeCreations += dayStats.routeCreations || 0;
            
            // Объединяем статистику по типам действий
            if (dayStats.byActionType) {
                Object.keys(dayStats.byActionType).forEach(actionType => {
                    result.byActionType[actionType] = 
                        (result.byActionType[actionType] || 0) + dayStats.byActionType[actionType];
                });
            }
            
            // Объединяем статистику по типам пользователей
            if (dayStats.byUserType) {
                result.byUserType.user += dayStats.byUserType.user || 0;
                result.byUserType.place += dayStats.byUserType.place || 0;
            }
            
            // Объединяем статистику по категориям
            if (dayStats.byCategory) {
                Object.keys(dayStats.byCategory).forEach(category => {
                    result.byCategory[category] = 
                        (result.byCategory[category] || 0) + dayStats.byCategory[category];
                });
            }
            
            result.days.push(dayStats);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
}

// Получение статистики за последние N дней
function getRecentStatistics(days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return getPeriodStatistics(startDate, endDate);
}

// Получение общей статистики
function getTotalStatistics() {
    const statistics = getStatisticsFromStorage();
    const result = {
        totalActions: 0,
        placeViews: 0,
        routeViews: 0,
        categoryViews: 0,
        placeShows: 0,
        userRegistrations: 0,
        routeCreations: 0,
        byActionType: {},
        byUserType: {
            user: 0,
            place: 0
        },
        byCategory: {},
        totalDays: 0
    };
    
    Object.keys(statistics).forEach(dateKey => {
        const dayStats = statistics[dateKey];
        result.totalActions += dayStats.totalActions || 0;
        result.placeViews += dayStats.placeViews || 0;
        result.routeViews += dayStats.routeViews || 0;
        result.categoryViews += dayStats.categoryViews || 0;
        result.placeShows += dayStats.placeShows || 0;
        result.userRegistrations += dayStats.userRegistrations || 0;
        result.routeCreations += dayStats.routeCreations || 0;
        result.totalDays++;
        
        // Объединяем статистику по типам действий
        if (dayStats.byActionType) {
            Object.keys(dayStats.byActionType).forEach(actionType => {
                result.byActionType[actionType] = 
                    (result.byActionType[actionType] || 0) + dayStats.byActionType[actionType];
            });
        }
        
        // Объединяем статистику по типам пользователей
        if (dayStats.byUserType) {
            result.byUserType.user += dayStats.byUserType.user || 0;
            result.byUserType.place += dayStats.byUserType.place || 0;
        }
        
        // Объединяем статистику по категориям
        if (dayStats.byCategory) {
            Object.keys(dayStats.byCategory).forEach(category => {
                result.byCategory[category] = 
                    (result.byCategory[category] || 0) + dayStats.byCategory[category];
            });
        }
    });
    
    return result;
}

// Очистка старой статистики (старше указанного количества дней)
function clearOldStatistics(daysToKeep = 365) {
    const statistics = getStatisticsFromStorage();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTime = cutoffDate.getTime();
    
    const filteredStatistics = {};
    Object.keys(statistics).forEach(dateKey => {
        const dateTime = new Date(dateKey).getTime();
        if (dateTime >= cutoffTime) {
            filteredStatistics[dateKey] = statistics[dateKey];
        }
    });
    
    saveStatisticsToStorage(filteredStatistics);
    return Object.keys(filteredStatistics).length;
}

