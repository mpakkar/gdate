// Статистика мест
// Отслеживает, сколько раз было показано каждое место

// Получение статистики мест из localStorage
function getPlaceStatisticsFromStorage() {
    try {
        const statsData = localStorage.getItem('placeStatisticsData');
        if (statsData) {
            return JSON.parse(statsData);
        }
    } catch (error) {
        console.error('Ошибка при чтении статистики мест:', error);
    }
    return {};
}

// Сохранение статистики мест в localStorage
function savePlaceStatisticsToStorage(statistics) {
    try {
        localStorage.setItem('placeStatisticsData', JSON.stringify(statistics));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении статистики мест:', error);
        return false;
    }
}

// Увеличение счетчика показов места
function incrementPlaceShowCount(placeId, placeName, categories) {
    const statistics = getPlaceStatisticsFromStorage();
    
    if (!statistics[placeId]) {
        statistics[placeId] = {
            placeId: placeId,
            placeName: placeName || '',
            showCount: 0,
            categories: categories || [],
            firstShown: new Date().toISOString(),
            lastShown: new Date().toISOString()
        };
    }
    
    statistics[placeId].showCount = (statistics[placeId].showCount || 0) + 1;
    statistics[placeId].lastShown = new Date().toISOString();
    if (placeName) {
        statistics[placeId].placeName = placeName;
    }
    if (categories && Array.isArray(categories)) {
        statistics[placeId].categories = categories;
    }
    
    savePlaceStatisticsToStorage(statistics);
    return statistics[placeId];
}

// Получение статистики места
function getPlaceStatistics(placeId) {
    const statistics = getPlaceStatisticsFromStorage();
    return statistics[placeId] || {
        placeId: placeId,
        placeName: '',
        showCount: 0,
        categories: [],
        firstShown: null,
        lastShown: null
    };
}

// Получение всех статистик мест
function getAllPlaceStatistics() {
    return getPlaceStatisticsFromStorage();
}

// Получение самых показываемых мест
function getTopPlaces(limit = 10) {
    const statistics = getPlaceStatisticsFromStorage();
    const places = Object.values(statistics);
    
    return places
        .sort((a, b) => (b.showCount || 0) - (a.showCount || 0))
        .slice(0, limit);
}

// Получение статистики по категориям
function getCategoryStatistics() {
    const statistics = getPlaceStatisticsFromStorage();
    const categoryStats = {};
    
    Object.values(statistics).forEach(place => {
        if (place.categories && Array.isArray(place.categories)) {
            place.categories.forEach(category => {
                if (!categoryStats[category]) {
                    categoryStats[category] = {
                        category: category,
                        showCount: 0,
                        placeCount: 0
                    };
                }
                categoryStats[category].showCount += place.showCount || 0;
                categoryStats[category].placeCount += 1;
            });
        }
    });
    
    return Object.values(categoryStats)
        .sort((a, b) => b.showCount - a.showCount);
}

// Получение общего количества показов
function getTotalShowCount() {
    const statistics = getPlaceStatisticsFromStorage();
    let total = 0;
    
    Object.values(statistics).forEach(place => {
        total += place.showCount || 0;
    });
    
    return total;
}

