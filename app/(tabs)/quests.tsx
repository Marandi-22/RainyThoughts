import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import {
  Quest,
  QuestCategory,
  loadQuests,
  saveQuests,
  completeQuest,
  deleteQuest,
  getTodayQuests,
  getOverdueQuests,
  getUpcomingQuests,
  getCategoryColor,
  getCategoryEmoji,
  getCategoryDescription,
  formatQuestDate,
  isQuestOverdue,
  resetDailyQuests,
  QUEST_EXAMPLES,
} from '../../constants/questSystem';
import { loadHeroData, saveHeroData, HeroData } from '../../constants/gameSystem';

type ViewMode = 'today' | 'all' | 'calendar';

export default function QuestsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [todayQuests, setTodayQuests] = useState<Quest[]>([]);
  const [overdueQuests, setOverdueQuests] = useState<Quest[]>([]);
  const [upcomingQuests, setUpcomingQuests] = useState<Quest[]>([]);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuestCategory | null>(null);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [deadline, setDeadline] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await resetDailyQuests();

    const all = await loadQuests();
    const today = await getTodayQuests();
    const overdue = await getOverdueQuests();
    const upcoming = await getUpcomingQuests();
    const hero = await loadHeroData();

    setQuests(all.filter(q => q.status === 'active'));
    setTodayQuests(today.filter(q => q.status === 'active'));
    setOverdueQuests(overdue);
    setUpcomingQuests(upcoming);
    setHeroData(hero);
  };

  const handleCreateQuest = async () => {
    if (!newQuestTitle.trim() || !selectedCategory) {
      Alert.alert('Error', 'Please enter a quest title and select a category');
      return;
    }

    const newQuest: Quest = {
      id: Date.now().toString(),
      title: newQuestTitle,
      description: '',
      category: selectedCategory,
      pointsReward: 5,
      status: 'active',
      createdAt: new Date().toISOString(),
      deadline: deadline || undefined,
      recurring: isRecurring ? 'daily' : 'none',
    };

    const allQuests = await loadQuests();
    allQuests.unshift(newQuest);
    await saveQuests(allQuests);

    setNewQuestTitle('');
    setDeadline('');
    setIsRecurring(false);
    setSelectedCategory(null);
    setShowAddModal(false);
    setShowDeadlinePicker(false);
    loadData();

    Alert.alert(
      '✅ Quest Created!',
      `${newQuest.recurring === 'daily' ? '🔄 Daily Quest' : deadline ? `📅 Due ${formatQuestDate(deadline)}` : '📋 New Quest'} added to ${selectedCategory.toUpperCase()}`
    );
  };

  const handleCompleteQuest = async (quest: Quest) => {
    try {
      const heroData = await loadHeroData();

      // Add points directly
      heroData.stats[quest.category] += quest.pointsReward;

      // Recalculate level and state
      const totalStats =
        heroData.stats.wealth + heroData.stats.strength + heroData.stats.wisdom + heroData.stats.luck;
      heroData.level = Math.floor(totalStats / 50) + 1;

      if (totalStats >= 1000) heroData.heroState = 'legendary';
      else if (totalStats >= 601) heroData.heroState = 'strong';
      else if (totalStats >= 301) heroData.heroState = 'developing';
      else if (totalStats >= 101) heroData.heroState = 'weak';
      else heroData.heroState = 'pathetic';

      await saveHeroData(heroData);
      await completeQuest(quest.id);

      Alert.alert(
        '🎉 Quest Completed!',
        `+${quest.pointsReward} ${getCategoryEmoji(quest.category)} ${quest.category.toUpperCase()}\n\nNew total: ${
          heroData.stats[quest.category]
        } ${quest.category}\nLevel: ${heroData.level}`,
        [{ text: 'Nice!', onPress: loadData }]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to complete quest');
    }
  };

  const handleDeleteQuest = (questId: string) => {
    Alert.alert('Delete Quest?', 'This cannot be undone', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteQuest(questId);
          loadData();
        },
      },
    ]);
  };

  const getDeadlineOptions = () => {
    const options = [];
    const today = new Date();

    // Today
    options.push({ label: 'Today', value: today.toISOString().split('T')[0] });

    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    options.push({ label: 'Tomorrow', value: tomorrow.toISOString().split('T')[0] });

    // Next 7 days
    for (let i = 2; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      options.push({ label, value: date.toISOString().split('T')[0] });
    }

    return options;
  };

  const renderQuest = (quest: Quest) => {
    const overdue = isQuestOverdue(quest);

    return (
      <View
        key={quest.id}
        style={[
          styles.questCard,
          { borderLeftColor: getCategoryColor(quest.category) },
          overdue && styles.overdueCard,
        ]}
      >
        <View style={styles.questContent}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleCompleteQuest(quest)}
          >
            <View
              style={[styles.checkboxInner, { borderColor: getCategoryColor(quest.category) }]}
            />
          </TouchableOpacity>
          <View style={styles.questInfo}>
            <Text style={styles.questText}>{quest.title}</Text>
            <View style={styles.questMeta}>
              {quest.recurring === 'daily' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🔄 DAILY</Text>
                </View>
              )}
              {quest.deadline && (
                <View style={[styles.badge, overdue && styles.overdueBadge]}>
                  <Text style={[styles.badgeText, overdue && styles.overdueBadgeText]}>
                    📅 {formatQuestDate(quest.deadline)}
                  </Text>
                </View>
              )}
              <Text style={[styles.questReward, { color: getCategoryColor(quest.category) }]}>
                +{quest.pointsReward} {getCategoryEmoji(quest.category)}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteQuest(quest.id)}>
            <Text style={styles.deleteBtn}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const categories: QuestCategory[] = ['wealth', 'strength', 'wisdom', 'luck'];

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      {heroData && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={styles.statValue}>{heroData.stats.wealth}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>💪</Text>
            <Text style={styles.statValue}>{heroData.stats.strength}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🧠</Text>
            <Text style={styles.statValue}>{heroData.stats.wisdom}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🍀</Text>
            <Text style={styles.statValue}>{heroData.stats.luck}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{heroData.level}</Text>
          </View>
        </View>
      )}

      {/* View Mode Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'today' && styles.activeTab]}
          onPress={() => setViewMode('today')}
        >
          <Text style={[styles.tabText, viewMode === 'today' && styles.activeTabText]}>
            Today ({todayQuests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'all' && styles.activeTab]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.tabText, viewMode === 'all' && styles.activeTabText]}>
            All Quests ({quests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'calendar' && styles.activeTab]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={[styles.tabText, viewMode === 'calendar' && styles.activeTabText]}>
            Calendar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* TODAY VIEW */}
        {viewMode === 'today' && (
          <>
            {overdueQuests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ OVERDUE ({overdueQuests.length})</Text>
                {overdueQuests.map(renderQuest)}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📅 TODAY</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={styles.addButtonText}>+ New Quest</Text>
                </TouchableOpacity>
              </View>
              {todayQuests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No quests for today!</Text>
                  <Text style={styles.emptySubtext}>Tap "+ New Quest" to add one</Text>
                </View>
              ) : (
                todayQuests.map(renderQuest)
              )}
            </View>
          </>
        )}

        {/* ALL QUESTS VIEW */}
        {viewMode === 'all' && (
          <>
            {categories.map((cat) => {
              const categoryQuests = quests.filter((q) => q.category === cat);
              return (
                <View key={cat} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryTitleRow}>
                      <Text style={styles.categoryEmoji}>{getCategoryEmoji(cat)}</Text>
                      <Text style={[styles.categoryTitle, { color: getCategoryColor(cat) }]}>
                        {cat.toUpperCase()}
                      </Text>
                      <View style={styles.questCount}>
                        <Text style={styles.questCountText}>{categoryQuests.length}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.addBtn, { backgroundColor: getCategoryColor(cat) }]}
                      onPress={() => {
                        setSelectedCategory(cat);
                        setShowAddModal(true);
                      }}
                    >
                      <Text style={styles.addBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>

                  {categoryQuests.length === 0 ? (
                    <View style={styles.emptyCategory}>
                      <Text style={styles.emptyText}>No {cat} quests yet</Text>
                    </View>
                  ) : (
                    categoryQuests.map(renderQuest)
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* CALENDAR VIEW */}
        {viewMode === 'calendar' && (
          <>
            {overdueQuests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ OVERDUE ({overdueQuests.length})</Text>
                {overdueQuests.map(renderQuest)}
              </View>
            )}

            {upcomingQuests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📆 UPCOMING ({upcomingQuests.length})</Text>
                {upcomingQuests.map(renderQuest)}
              </View>
            )}

            {overdueQuests.length === 0 && upcomingQuests.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No scheduled quests</Text>
                <Text style={styles.emptySubtext}>Add deadlines to see them here</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Quest Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ New Quest</Text>

            {/* Category Selection */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryPicker}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    selectedCategory === cat && {
                      backgroundColor: getCategoryColor(cat),
                      borderColor: getCategoryColor(cat),
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={styles.categoryOptionEmoji}>{getCategoryEmoji(cat)}</Text>
                  <Text
                    style={[
                      styles.categoryOptionText,
                      selectedCategory === cat && styles.categoryOptionTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedCategory && (
              <>
                <Text style={styles.categoryDesc}>
                  {getCategoryDescription(selectedCategory)}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="What do you want to accomplish?"
                  placeholderTextColor="#666"
                  value={newQuestTitle}
                  onChangeText={setNewQuestTitle}
                  autoFocus
                />

                {/* Recurring Toggle */}
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>🔄 Daily Recurring Quest</Text>
                  <Switch
                    value={isRecurring}
                    onValueChange={(value) => {
                      setIsRecurring(value);
                      if (value) setDeadline(''); // Clear deadline if recurring
                    }}
                    trackColor={{ false: '#333', true: getCategoryColor(selectedCategory) }}
                  />
                </View>

                {/* Deadline Picker */}
                {!isRecurring && (
                  <>
                    <TouchableOpacity
                      style={styles.deadlineButton}
                      onPress={() => setShowDeadlinePicker(!showDeadlinePicker)}
                    >
                      <Text style={styles.deadlineButtonText}>
                        {deadline ? `📅 Due: ${formatQuestDate(deadline)}` : '📅 Set Deadline (Optional)'}
                      </Text>
                      {deadline && (
                        <TouchableOpacity onPress={() => setDeadline('')}>
                          <Text style={styles.clearDeadline}>×</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>

                    {showDeadlinePicker && (
                      <View style={styles.deadlinePicker}>
                        {getDeadlineOptions().map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.deadlineOption,
                              deadline === option.value && styles.selectedDeadlineOption,
                            ]}
                            onPress={() => {
                              setDeadline(option.value);
                              setShowDeadlinePicker(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.deadlineOptionText,
                                deadline === option.value && styles.selectedDeadlineOptionText,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}

                <Text style={styles.examplesTitle}>💡 Examples:</Text>
                <ScrollView style={styles.exampleScroll}>
                  {QUEST_EXAMPLES[selectedCategory].map((example, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.exampleBtn}
                      onPress={() => setNewQuestTitle(example)}
                    >
                      <Text style={styles.exampleText}>• {example}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowAddModal(false);
                  setNewQuestTitle('');
                  setDeadline('');
                  setIsRecurring(false);
                  setSelectedCategory(null);
                  setShowDeadlinePicker(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.createBtn,
                  selectedCategory && { backgroundColor: getCategoryColor(selectedCategory) },
                  !selectedCategory && styles.createBtnDisabled,
                ]}
                onPress={handleCreateQuest}
                disabled={!selectedCategory}
              >
                <Text style={styles.createBtnText}>Create Quest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#FF4444',
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  levelBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF4444',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  addButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  questCount: {
    backgroundColor: '#333',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyCategory: {
    padding: 32,
    alignItems: 'center',
  },
  questCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  overdueCard: {
    borderColor: '#FF4444',
    borderWidth: 2,
    backgroundColor: '#2a1a1a',
  },
  questContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
  },
  questInfo: {
    flex: 1,
  },
  questText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
  },
  overdueBadge: {
    backgroundColor: '#FF4444',
  },
  overdueBadgeText: {
    color: '#FFFFFF',
  },
  questReward: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteBtn: {
    fontSize: 32,
    color: '#666',
    paddingHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  categoryPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#0a0a0a',
  },
  categoryOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  categoryOptionTextActive: {
    color: '#FFFFFF',
  },
  categoryDesc: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deadlineButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  deadlineButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  clearDeadline: {
    fontSize: 28,
    color: '#666',
  },
  deadlinePicker: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 200,
  },
  deadlineOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  selectedDeadlineOption: {
    backgroundColor: '#FF4444',
  },
  deadlineOptionText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  selectedDeadlineOptionText: {
    fontWeight: 'bold',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  exampleScroll: {
    maxHeight: 120,
    marginBottom: 20,
  },
  exampleBtn: {
    paddingVertical: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#888',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createBtnDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
