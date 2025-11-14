// База данных истории действий пользователей
// Сохраняет все действия пользователей и изменения статистики

// Получение истории из localStorage
function getHistoryFromStorage() {
    try {
        const historyData = localStorage.getItem('historyData');
        if (historyData) {
            return JSON.parse(historyData);
        }
    } catch (error) {
        console.error('Ошибка при чтении истории:', error);
    }
    return [];
}

// Сохранение истории в localStorage
function saveHistoryToStorage(history) {
    try {
        localStorage.setItem('historyData', JSON.stringify(history));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении истории:', error);
        return false;
    }
}

// Добавление записи в историю
function addHistoryEntry(action) {
    const history = getHistoryFromStorage();
    const entry = {
        id: Date.now() + Math.random(), // Уникальный ID
        timestamp: new Date().toISOString(),
        userId: action.userId || null,
        userType: action.userType || null,
        actionType: action.actionType, // 'place_view', 'route_view', 'category_view', 'place_show', etc.
        entityId: action.entityId || null, // ID места, маршрута, категории
        entityName: action.entityName || null, // Название места, маршрута, категории
        entityType: action.entityType || null, // 'place', 'route', 'category'
        metadata: action.metadata || {}, // Дополнительные данные
        ...action
    };
    
    history.push(entry);
    
    // Ограничиваем размер истории (последние 10000 записей)
    if (history.length > 10000) {
        history.shift();
    }
    
    saveHistoryToStorage(history);
    return entry;
}

// Получение истории действий пользователя
function getUserHistory(userId) {
    const history = getHistoryFromStorage();
    return history.filter(entry => entry.userId === userId);
}

// Получение истории действий по типу
function getHistoryByType(actionType) {
    const history = getHistoryFromStorage();
    return history.filter(entry => entry.actionType === actionType);
}

// Получение истории за период
function getHistoryByPeriod(startDate, endDate) {
    const history = getHistoryFromStorage();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return history.filter(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        return entryTime >= start && entryTime <= end;
    });
}

// Получение истории для конкретной сущности (место, маршрут, категория)
function getEntityHistory(entityType, entityId) {
    const history = getHistoryFromStorage();
    return history.filter(entry => 
        entry.entityType === entityType && entry.entityId === entityId
    );
}

// Очистка старой истории (старше указанного количества дней)
function clearOldHistory(daysToKeep = 365) {
    const history = getHistoryFromStorage();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTime = cutoffDate.getTime();
    
    const filteredHistory = history.filter(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        return entryTime >= cutoffTime;
    });
    
    saveHistoryToStorage(filteredHistory);
    return filteredHistory.length;
}

// Получение последних N записей истории
function getRecentHistory(limit = 100) {
    const history = getHistoryFromStorage();
    return history.slice(-limit).reverse();
}

// Экспорт истории
function exportHistory() {
    return getHistoryFromStorage();
}

// Импорт истории
function importHistory(historyData) {
    if (Array.isArray(historyData)) {
        saveHistoryToStorage(historyData);
        return true;
    }
    return false;
}

