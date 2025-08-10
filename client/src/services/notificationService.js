
class NotificationService {
  constructor() {
    this.storageKey = 'smartchef_notifications';
    this.maxNotifications = 15;
  }

  // Add a new notification
  addNotification(message, type = 'info', recipeId = null, data = {}) {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: message,
      type: type,
      recipeId: recipeId,
      timestamp: Date.now(),
      read: false,
      ...data
    };

    const notifications = this.getAll();
    notifications.unshift(notification);

    // Keep only the latest notifications
    if (notifications.length > this.maxNotifications) {
      notifications.splice(this.maxNotifications);
    }

    this.saveNotifications(notifications);
    this.triggerAlert();
    this.notifyUpdate();

    console.log('✅ Notification added:', message);
    return notification;
  }

  // Get all notifications
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch (error) {
      console.error('Error reading notifications:', error);
      return [];
    }
  }

  // Save notifications to localStorage
  saveNotifications(notifications) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Clear all notifications
  clearAll() {
    localStorage.removeItem(this.storageKey);
    this.notifyUpdate();
    console.log('��️ All notifications cleared');
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notifications = this.getAll();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications(notifications);
    }
  }

  // Trigger sound and animation
  triggerAlert() {
    if (window.triggerNotificationAlert) {
      window.triggerNotificationAlert();
    }
  }

  // Notify components about updates
  notifyUpdate() {
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  }

  // Add different types of notifications
  addWelcomeNotification() {
    return this.addNotification(
      '🎉 Welcome to SmartChef! Start exploring recipes.',
      'welcome'
    );
  }

  addRecipeSavedNotification(recipeTitle) {
    return this.addNotification(
      `💾 "${recipeTitle}" saved to your collection!`,
      'save',
      null,
      { recipeTitle }
    );
  }

  addSearchNotification(query, count) {
    return this.addNotification(
      `🔍 Found ${count} recipes for "${query}"`,
      'search',
      null,
      { query, count }
    );
  }

  addAIGeneratedNotification(recipeTitle) {
    return this.addNotification(
      `🤖 AI generated: "${recipeTitle}"`,
      'ai_generated',
      null,
      { recipeTitle }
    );
  }

  addAchievementNotification(message) {
    return this.addNotification(
      `�� ${message}`,
      'achievement'
    );
  }

  addDocumentationNotification(message) {
    return this.addNotification(
      `�� ${message}`,
      'documentation'
    );
  }

  // Batch add multiple notifications
  addMultipleNotifications(notifications) {
    notifications.forEach(({ message, type, recipeId, data }) => {
      this.addNotification(message, type, recipeId, data);
    });
  }
}

// Create global instance
const notificationService = new NotificationService();

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.SmartChefNotifications = notificationService;
}

export default notificationService;

