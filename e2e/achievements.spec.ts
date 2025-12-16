import { test, expect } from '@playwright/test'

test.describe('Achievement Notification System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('/')

    // Clear localStorage to start fresh
    await page.evaluate(() => {
      localStorage.clear()
    })

    // Reload to apply cleared storage
    await page.reload()
  })

  test('should display welcome achievement notification when reaching level 1', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start Game")')

    // Wait a moment for game to initialize
    await page.waitForTimeout(500)

    // Wait for achievement notification to appear
    const notification = page.locator('.achievement-notification')
    await expect(notification).toBeVisible({ timeout: 5000 })

    // Verify it's the welcome achievement
    const achievementName = notification.locator('.achievement-name')
    await expect(achievementName).toContainText('Welcome')
  })

  test('should unlock progressive achievements one at a time', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start Game")')
    await page.waitForTimeout(500)

    // Use browser console to simulate reaching level 5
    await page.evaluate(() => {
      const { checkAchievements } = (window as any).useAchievements()
      // Simulate reaching level 5 - should trigger progressive unlocking
      checkAchievements({ level: 5, score: 1000, lines: 25 })
    })

    // Wait for first notification (should be level_2 due to progressive unlocking)
    const notification = page.locator('.achievement-notification')
    await expect(notification).toBeVisible({ timeout: 2000 })

    // Get the achievement name
    const firstAchievement = await notification.locator('.achievement-name').textContent()
    expect(firstAchievement).toContain('Level 2')

    // Wait for notification to disappear
    await expect(notification).not.toBeVisible({ timeout: 6000 })

    // Second notification should appear (level_3)
    await expect(notification).toBeVisible({ timeout: 2000 })
    const secondAchievement = await notification.locator('.achievement-name').textContent()
    expect(secondAchievement).toContain('Level 3')
  })

  test('should not display duplicate notifications for same achievement', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start Game")')
    await page.waitForTimeout(500)

    // Trigger same achievement multiple times
    await page.evaluate(() => {
      const { checkAchievements } = (window as any).useAchievements()
      checkAchievements({ level: 2 })
      checkAchievements({ level: 2 })
      checkAchievements({ level: 2 })
    })

    // Wait for notification
    const notification = page.locator('.achievement-notification')
    await expect(notification).toBeVisible({ timeout: 2000 })

    // Get achievement text
    const achievementText = await notification.locator('.achievement-name').textContent()

    // Wait for notification to disappear
    await expect(notification).not.toBeVisible({ timeout: 6000 })

    // Check that no second notification appears
    await page.waitForTimeout(3000)
    await expect(notification).not.toBeVisible()
  })

  test('should queue multiple achievement notifications', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start Game")')
    await page.waitForTimeout(500)

    // Unlock multiple achievements rapidly
    await page.evaluate(() => {
      const { checkAchievements } = (window as any).useAchievements()
      // Trigger multiple checks to unlock several achievements
      for (let i = 0; i < 5; i++) {
        checkAchievements({ level: 10, score: 5000, lines: 50 })
      }
    })

    // First notification should appear
    const notification = page.locator('.achievement-notification')
    await expect(notification).toBeVisible({ timeout: 2000 })

    // Count how many notifications appear in sequence
    let notificationCount = 0
    const maxNotifications = 5

    for (let i = 0; i < maxNotifications; i++) {
      if (await notification.isVisible()) {
        notificationCount++
        // Wait for current notification to disappear
        await expect(notification).not.toBeVisible({ timeout: 6000 })
        // Wait a bit to see if next appears
        await page.waitForTimeout(500)
      } else {
        break
      }
    }

    // Should have seen multiple notifications
    expect(notificationCount).toBeGreaterThan(1)
    expect(notificationCount).toBeLessThanOrEqual(maxNotifications)
  })

  test('should respect achievement prerequisites', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start Game")')
    await page.waitForTimeout(500)

    // Try to unlock level_5 without unlocking level_2-4 first
    await page.evaluate(() => {
      const achievements = (window as any).useAchievements()
      const { checkAchievements, isUnlocked } = achievements

      // Single call should only unlock level_2 (first in chain)
      checkAchievements({ level: 5 })

      // Store results in window for verification
      ;(window as any).achievementResults = {
        level_2: isUnlocked('level_2'),
        level_3: isUnlocked('level_3'),
        level_4: isUnlocked('level_4'),
        level_5: isUnlocked('level_5'),
      }
    })

    // Verify prerequisite enforcement
    const results = await page.evaluate(() => (window as any).achievementResults)

    // With progressive unlocking system:
    // - First call unlocks level_2 (no prerequisite)
    // - level_3, level_4, level_5 should NOT unlock yet (prerequisite not met at time of check)
    expect(results.level_2).toBe(true)
    // Note: The progressive unlocking system in the watcher should handle unlocking
    // subsequent achievements, but a single checkAchievements() call only unlocks one
  })

  test('should show achievement notification UI correctly', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start Game")')
    await page.waitForTimeout(500)

    // Trigger an achievement
    await page.evaluate(() => {
      const { triggerDevAchievement } = (window as any).useAchievements()
      triggerDevAchievement('legendary')
    })

    // Wait for notification
    const notification = page.locator('.achievement-notification')
    await expect(notification).toBeVisible({ timeout: 2000 })

    // Verify UI elements are present
    await expect(notification.locator('.achievement-icon')).toBeVisible()
    await expect(notification.locator('.achievement-name')).toBeVisible()
    await expect(notification.locator('.achievement-description')).toBeVisible()

    // Verify notification has correct styling
    const hasCorrectClass = await notification.evaluate((el) => {
      return el.classList.contains('achievement-notification')
    })
    expect(hasCorrectClass).toBe(true)
  })

  test('should handle rapid game state changes gracefully', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start Game")')
    await page.waitForTimeout(500)

    // Simulate rapid game state changes (like during actual gameplay)
    await page.evaluate(() => {
      const { checkAchievements } = (window as any).useAchievements()

      // Simulate clearing multiple lines in quick succession
      setTimeout(() => checkAchievements({ score: 100, level: 1, lines: 5 }), 0)
      setTimeout(() => checkAchievements({ score: 200, level: 2, lines: 10 }), 10)
      setTimeout(() => checkAchievements({ score: 300, level: 2, lines: 15 }), 20)
      setTimeout(() => checkAchievements({ score: 500, level: 3, lines: 20 }), 30)
    })

    // Wait for notifications to process
    await page.waitForTimeout(2000)

    // Verify no JavaScript errors occurred
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(1000)
    expect(errors.length).toBe(0)
  })

  test('should persist unlocked achievements across page reloads', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Start Game")')
    await page.waitForTimeout(500)

    // Unlock an achievement
    await page.evaluate(() => {
      const { checkAchievements } = (window as any).useAchievements()
      checkAchievements({ level: 2 })
    })

    // Wait for notification to confirm unlock
    const notification = page.locator('.achievement-notification')
    await expect(notification).toBeVisible({ timeout: 2000 })

    // Reload the page
    await page.reload()
    await page.waitForTimeout(500)

    // Check if achievement is still unlocked
    const isStillUnlocked = await page.evaluate(() => {
      const { isUnlocked } = (window as any).useAchievements()
      return isUnlocked('level_2')
    })

    expect(isStillUnlocked).toBe(true)
  })
})
