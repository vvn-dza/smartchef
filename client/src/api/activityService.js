// client/src/api/activityService.js
export async function logUserActivity({ userId, idToken, type, recipeId, query }) {
  const maxRetries = 2;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      console.log(`Activity logging attempt ${attempt + 1}/${maxRetries + 1}: ${type}`);
      
      const response = await fetch('http://localhost:5000/api/activity/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId, type, recipeId, query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Activity logging failed: ${response.status}`);
      }

      console.log(`Activity logged successfully: ${type}`);
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`Activity logging timed out (attempt ${attempt + 1}/${maxRetries + 1})`);
        if (attempt === maxRetries) {
          console.warn('Activity logging failed after all retries, continuing...');
          return;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      } else {
        console.error(`Activity logging error (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        if (attempt === maxRetries) {
          console.warn('Activity logging failed after all retries, continuing...');
          return;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  }
}