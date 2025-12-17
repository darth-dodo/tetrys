import { describe, it, expect } from 'vitest'
import {
  ACHIEVEMENTS,
  getAchievementById,
  getAchievementsByCategory,
  getAchievementsByRarity
} from '../achievements'
import type { Achievement } from '../../types/achievements'

describe('ACHIEVEMENTS data', () => {
  it('should contain all 62 achievements', () => {
    expect(ACHIEVEMENTS).toHaveLength(62)
  })

  it('should have unique achievement IDs', () => {
    const ids = ACHIEVEMENTS.map(a => a.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ACHIEVEMENTS.length)
  })

  it('should have all required properties for each achievement', () => {
    ACHIEVEMENTS.forEach(achievement => {
      expect(achievement).toHaveProperty('id')
      expect(achievement).toHaveProperty('name')
      expect(achievement).toHaveProperty('description')
      expect(achievement).toHaveProperty('icon')
      expect(achievement).toHaveProperty('category')
      expect(achievement).toHaveProperty('condition')
      expect(achievement).toHaveProperty('rarity')
    })
  })
})

describe('getAchievementById', () => {
  describe('when achievement exists', () => {
    it('should return the welcome achievement', () => {
      const achievement = getAchievementById('welcome')

      expect(achievement).toBeDefined()
      expect(achievement?.id).toBe('welcome')
      expect(achievement?.name).toBe('Welcome Player')
      expect(achievement?.description).toBe('Start your first game')
      expect(achievement?.icon).toBe('👋')
      expect(achievement?.category).toBe('progression')
      expect(achievement?.rarity).toBe('common')
    })

    it('should return the centurion achievement', () => {
      const achievement = getAchievementById('centurion')

      expect(achievement).toBeDefined()
      expect(achievement?.id).toBe('centurion')
      expect(achievement?.name).toBe('Centurion')
      expect(achievement?.category).toBe('gameplay')
      expect(achievement?.rarity).toBe('rare')
    })

    it('should return the level 20 legendary achievement', () => {
      const achievement = getAchievementById('level_20')

      expect(achievement).toBeDefined()
      expect(achievement?.id).toBe('level_20')
      expect(achievement?.name).toBe('Velocity Master')
      expect(achievement?.rarity).toBe('legendary')
    })

    it('should return achievements with different categories', () => {
      const gameplay = getAchievementById('first_blood')
      const scoring = getAchievementById('score_100')
      const skill = getAchievementById('combo_2')
      const special = getAchievementById('comeback_kid')

      expect(gameplay?.category).toBe('gameplay')
      expect(scoring?.category).toBe('scoring')
      expect(skill?.category).toBe('skill')
      expect(special?.category).toBe('special')
    })
  })

  describe('when achievement does not exist', () => {
    it('should return undefined for non-existent ID', () => {
      const achievement = getAchievementById('does_not_exist')
      expect(achievement).toBeUndefined()
    })

    it('should return undefined for empty string', () => {
      const achievement = getAchievementById('')
      expect(achievement).toBeUndefined()
    })

    it('should return undefined for random string', () => {
      const achievement = getAchievementById('random_invalid_id_12345')
      expect(achievement).toBeUndefined()
    })

    it('should return undefined for similar but incorrect ID', () => {
      const achievement = getAchievementById('Welcome') // ID is 'welcome', not 'Welcome'
      expect(achievement).toBeUndefined()
    })
  })
})

describe('getAchievementsByCategory', () => {
  describe('when filtering by gameplay category', () => {
    it('should return all gameplay achievements', () => {
      const achievements = getAchievementsByCategory('gameplay')

      expect(achievements.length).toBeGreaterThan(0)
      achievements.forEach(achievement => {
        expect(achievement.category).toBe('gameplay')
      })
    })

    it('should include expected gameplay achievements', () => {
      const achievements = getAchievementsByCategory('gameplay')
      const ids = achievements.map(a => a.id)

      expect(ids).toContain('first_blood')
      expect(ids).toContain('centurion')
      expect(ids).toContain('marathon_runner')
    })

    it('should return exactly 12 gameplay achievements', () => {
      const achievements = getAchievementsByCategory('gameplay')
      expect(achievements).toHaveLength(12)
    })
  })

  describe('when filtering by progression category', () => {
    it('should return all progression achievements', () => {
      const achievements = getAchievementsByCategory('progression')

      expect(achievements.length).toBeGreaterThan(0)
      achievements.forEach(achievement => {
        expect(achievement.category).toBe('progression')
      })
    })

    it('should include level-based achievements', () => {
      const achievements = getAchievementsByCategory('progression')
      const ids = achievements.map(a => a.id)

      expect(ids).toContain('welcome')
      expect(ids).toContain('level_10')
      expect(ids).toContain('level_20')
    })

    it('should return exactly 20 progression achievements', () => {
      const achievements = getAchievementsByCategory('progression')
      expect(achievements).toHaveLength(20)
    })
  })

  describe('when filtering by scoring category', () => {
    it('should return all scoring achievements', () => {
      const achievements = getAchievementsByCategory('scoring')

      expect(achievements.length).toBeGreaterThan(0)
      achievements.forEach(achievement => {
        expect(achievement.category).toBe('scoring')
      })
    })

    it('should include score and tetris achievements', () => {
      const achievements = getAchievementsByCategory('scoring')
      const ids = achievements.map(a => a.id)

      expect(ids).toContain('score_100')
      expect(ids).toContain('tetris_novice')
      expect(ids).toContain('unstoppable')
    })

    it('should return exactly 17 scoring achievements', () => {
      const achievements = getAchievementsByCategory('scoring')
      expect(achievements).toHaveLength(17)
    })
  })

  describe('when filtering by skill category', () => {
    it('should return all skill achievements', () => {
      const achievements = getAchievementsByCategory('skill')

      expect(achievements.length).toBeGreaterThan(0)
      achievements.forEach(achievement => {
        expect(achievement.category).toBe('skill')
      })
    })

    it('should include combo and skill-based achievements', () => {
      const achievements = getAchievementsByCategory('skill')
      const ids = achievements.map(a => a.id)

      expect(ids).toContain('combo_2')
      expect(ids).toContain('perfect_start')
      expect(ids).toContain('quick_fingers')
    })

    it('should return exactly 12 skill achievements', () => {
      const achievements = getAchievementsByCategory('skill')
      expect(achievements).toHaveLength(12)
    })
  })

  describe('when filtering by special category', () => {
    it('should return all special achievements', () => {
      const achievements = getAchievementsByCategory('special')

      expect(achievements.length).toBeGreaterThan(0)
      achievements.forEach(achievement => {
        expect(achievement.category).toBe('special')
      })
    })

    it('should include special achievements', () => {
      const achievements = getAchievementsByCategory('special')
      const ids = achievements.map(a => a.id)

      expect(ids).toContain('comeback_kid')
    })

    it('should return exactly 1 special achievement', () => {
      const achievements = getAchievementsByCategory('special')
      expect(achievements).toHaveLength(1)
    })
  })

  describe('when filtering by non-existent category', () => {
    it('should return empty array for non-existent category', () => {
      const achievements = getAchievementsByCategory('non_existent')
      expect(achievements).toEqual([])
    })

    it('should return empty array for empty string', () => {
      const achievements = getAchievementsByCategory('')
      expect(achievements).toEqual([])
    })

    it('should return empty array for invalid category name', () => {
      const achievements = getAchievementsByCategory('invalid_category_123')
      expect(achievements).toEqual([])
    })
  })

  describe('category totals validation', () => {
    it('should have all achievements accounted for across categories', () => {
      const gameplay = getAchievementsByCategory('gameplay')
      const progression = getAchievementsByCategory('progression')
      const scoring = getAchievementsByCategory('scoring')
      const skill = getAchievementsByCategory('skill')
      const special = getAchievementsByCategory('special')

      const total = gameplay.length + progression.length + scoring.length + skill.length + special.length
      expect(total).toBe(ACHIEVEMENTS.length)
    })
  })
})

describe('getAchievementsByRarity', () => {
  describe('when filtering by common rarity', () => {
    it('should return all common achievements', () => {
      const achievements = getAchievementsByRarity('common')

      expect(achievements.length).toBeGreaterThan(0)
      achievements.forEach(achievement => {
        expect(achievement.rarity).toBe('common')
      })
    })

    it('should include expected common achievements', () => {
      const achievements = getAchievementsByRarity('common')
      const ids = achievements.map(a => a.id)

      expect(ids).toContain('welcome')
      expect(ids).toContain('first_blood')
      expect(ids).toContain('score_100')
    })

    it('should return exactly 25 common achievements', () => {
      const achievements = getAchievementsByRarity('common')
      expect(achievements).toHaveLength(25)
    })
  })

  describe('when filtering by rare rarity', () => {
    it('should return all rare achievements', () => {
      const achievements = getAchievementsByRarity('rare')

      expect(achievements.length).toBeGreaterThan(0)
      achievements.forEach(achievement => {
        expect(achievement.rarity).toBe('rare')
      })
    })

    it('should include expected rare achievements', () => {
      const achievements = getAchievementsByRarity('rare')
      const ids = achievements.map(a => a.id)

      expect(ids).toContain('level_10')
      expect(ids).toContain('centurion')
      expect(ids).toContain('combo_king')
    })

    it('should return exactly 18 rare achievements', () => {
      const achievements = getAchievementsByRarity('rare')
      expect(achievements).toHaveLength(18)
    })
  })

  describe('when filtering by epic rarity', () => {
    it('should return all epic achievements', () => {
      const achievements = getAchievementsByRarity('epic')

      expect(achievements.length).toBeGreaterThan(0)
      achievements.forEach(achievement => {
        expect(achievement.rarity).toBe('epic')
      })
    })

    it('should include expected epic achievements', () => {
      const achievements = getAchievementsByRarity('epic')
      const ids = achievements.map(a => a.id)

      expect(ids).toContain('level_15')
      expect(ids).toContain('tetris_master')
      expect(ids).toContain('combo_6')
    })

    it('should return exactly 14 epic achievements', () => {
      const achievements = getAchievementsByRarity('epic')
      expect(achievements).toHaveLength(14)
    })
  })

  describe('when filtering by legendary rarity', () => {
    it('should return all legendary achievements', () => {
      const achievements = getAchievementsByRarity('legendary')

      expect(achievements.length).toBeGreaterThan(0)
      achievements.forEach(achievement => {
        expect(achievement.rarity).toBe('legendary')
      })
    })

    it('should include expected legendary achievements', () => {
      const achievements = getAchievementsByRarity('legendary')
      const ids = achievements.map(a => a.id)

      expect(ids).toContain('level_20')
      expect(ids).toContain('unstoppable')
      expect(ids).toContain('combo_10')
    })

    it('should return exactly 5 legendary achievements', () => {
      const achievements = getAchievementsByRarity('legendary')
      expect(achievements).toHaveLength(5)
    })
  })

  describe('when filtering by non-existent rarity', () => {
    it('should return empty array for non-existent rarity', () => {
      const achievements = getAchievementsByRarity('ultra_rare')
      expect(achievements).toEqual([])
    })

    it('should return empty array for empty string', () => {
      const achievements = getAchievementsByRarity('')
      expect(achievements).toEqual([])
    })

    it('should return empty array for invalid rarity name', () => {
      const achievements = getAchievementsByRarity('invalid_rarity_xyz')
      expect(achievements).toEqual([])
    })

    it('should return empty array for case-mismatched rarity', () => {
      const achievements = getAchievementsByRarity('Common') // Should be 'common'
      expect(achievements).toEqual([])
    })
  })

  describe('rarity totals validation', () => {
    it('should have all achievements accounted for across rarities', () => {
      const common = getAchievementsByRarity('common')
      const rare = getAchievementsByRarity('rare')
      const epic = getAchievementsByRarity('epic')
      const legendary = getAchievementsByRarity('legendary')

      const total = common.length + rare.length + epic.length + legendary.length
      expect(total).toBe(ACHIEVEMENTS.length)
    })
  })
})

describe('helper functions integration', () => {
  it('should allow chaining filters conceptually', () => {
    // Get all gameplay achievements
    const gameplayAchievements = getAchievementsByCategory('gameplay')

    // Manually filter for legendary rarity from gameplay
    const legendaryGameplay = gameplayAchievements.filter(a => a.rarity === 'legendary')

    expect(legendaryGameplay.length).toBeGreaterThanOrEqual(0)
  })

  it('should find specific achievement using different methods', () => {
    const byId = getAchievementById('level_20')
    const byCategory = getAchievementsByCategory('progression')
    const byRarity = getAchievementsByRarity('legendary')

    // The achievement should exist in category and rarity filters
    expect(byCategory.some(a => a.id === 'level_20')).toBe(true)
    expect(byRarity.some(a => a.id === 'level_20')).toBe(true)

    // And should match when fetched by ID
    expect(byId).toBeDefined()
    expect(byId?.rarity).toBe('legendary')
    expect(byId?.category).toBe('progression')
  })

  it('should maintain data consistency across all helper functions', () => {
    // Get an achievement by ID
    const achievement = getAchievementById('combo_king')
    expect(achievement).toBeDefined()

    if (achievement) {
      // Verify it exists in its category
      const categoryAchievements = getAchievementsByCategory(achievement.category)
      expect(categoryAchievements.some(a => a.id === achievement.id)).toBe(true)

      // Verify it exists in its rarity
      const rarityAchievements = getAchievementsByRarity(achievement.rarity)
      expect(rarityAchievements.some(a => a.id === achievement.id)).toBe(true)
    }
  })
})
