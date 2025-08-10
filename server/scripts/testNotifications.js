import notificationService from '../services/notificationService';

// Make functions available globally immediately
if (typeof window !== 'undefined') {
  window.testNotifications = () => {
    console.log('🧪 Testing SmartChef Notification System...');

    // Test 1: Basic notification
    notificationService.addNotification('🧪 Test notification - Basic functionality', 'test');

    // Test 2: Different types
    setTimeout(() => {
      notificationService.addWelcomeNotification();
    }, 1000);

    setTimeout(() => {
      notificationService.addRecipeSavedNotification('Chicken Curry');
    }, 2000);

    setTimeout(() => {
      notificationService.addSearchNotification('pasta', 25);
    }, 3000);

    setTimeout(() => {
      notificationService.addAIGeneratedNotification('Quick Breakfast Bowl');
    }, 4000);

    setTimeout(() => {
      notificationService.addAchievementNotification('Saved 10 recipes!');
    }, 5000);

    setTimeout(() => {
      notificationService.addDocumentationNotification('New features available!');
    }, 6000);

    console.log('✅ All test notifications scheduled');
  };

  window.clearNotifications = () => {
    notificationService.clearAll();
    console.log('️ All notifications cleared');
  };

  window.showNotificationCount = () => {
    const notifications = notificationService.getAll();
    console.log(`📊 You have ${notifications.length} notifications:`, notifications);
  };
  
  console.log('🔧 Notification test functions available:');
  console.log('- testNotifications() - Run all tests');
  console.log('- clearNotifications() - Clear all notifications');
  console.log('- showNotificationCount() - Show current notifications');
}

export const testNotificationSystem = window.testNotifications;
export const clearAllNotifications = window.clearNotifications;
export const showNotificationCount = window.showNotificationCount; 