import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_STORAGE_KEY = 'journal_data';

export const useJournal = () => {
  const [thoughts, setThoughts] = useState('');
  const [problems, setProblems] = useState([]);
  const [insights, setInsights] = useState([]);
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
        if (data) {
          const { thoughts, problems, insights, quotes } = JSON.parse(data);
          setThoughts(thoughts || '');
          setProblems(problems || []);
          setInsights(insights || []);
          setQuotes(quotes || []);
        }
      } catch (error) {
        console.error('Failed to load journal data', error);
      }
    };
    loadData();
  }, []);

  const saveData = async (data) => {
    try {
      await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save journal data', error);
    }
  };

  const updateThoughts = (text) => {
    setThoughts(text);
    saveData({ thoughts: text, problems, insights, quotes });
  };

  const addProblem = (problem) => {
    const newProblems = [...problems, problem];
    setProblems(newProblems);
    saveData({ thoughts, problems: newProblems, insights, quotes });
  };

  const addInsight = (insight) => {
    const newInsights = [...insights, insight];
    setInsights(newInsights);
    saveData({ thoughts, problems, insights: newInsights, quotes });
  };

  const addQuote = (quote) => {
    const newQuotes = [...quotes, quote];
    setQuotes(newQuotes);
    saveData({ thoughts, problems, insights, quotes: newQuotes });
  };

  return { thoughts, problems, insights, quotes, updateThoughts, addProblem, addInsight, addQuote };
};
