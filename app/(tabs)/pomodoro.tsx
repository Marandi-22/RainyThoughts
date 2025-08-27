// app/(tabs)/pomodoro.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Audio } from "expo-av";
import LetterBox from "@/components/LetterBox";
import letters, { LetterState } from "@/constants/letters";
import AsyncStorage from "@react-native-async-storage/async-storage";

const voiceLines = [
  require("../../assets/sounds/coward_and_fool.mp3"),
  require("../../assets/sounds/crown_and_clock.mp3"),
  require("../../assets/sounds/fiend_of_time.mp3"),
  require("../../assets/sounds/fools_think_of_time.mp3"),
  require("../../assets/sounds/ledger_of_time.mp3"),
  require("../../assets/sounds/men_shadows.mp3"),
  require("../../assets/sounds/theatre_of_pelasure.mp3"),
  require("../../assets/sounds/time_coin.mp3"),
  require("../../assets/sounds/time_devours.mp3"),
  require("../../assets/sounds/agents_to_legacy.mp3"),
  require("../../assets/sounds/binding_time.mp3"),
  require("../../assets/sounds/breath_as_lone.mp3"),
  require("../../assets/sounds/clock_and_command.mp3"),
];

export default function Pomodoro() {
  // Editable timer and break
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [minutes, setMinutes] = useState(pomodoroMinutes);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);

  const [cycle, setCycle] = useState(1);
  const [streak, setStreak] = useState(0);
  const [letterState, setLetterState] = useState<LetterState>("mid");
  const [lettersQueue, setLettersQueue] = useState<string[]>([]);
  const [missedCycles, setMissedCycles] = useState(0);

  const [minPomodoros, setMinPomodoros] = useState(4); // default minimum
  const [pomodorosToday, setPomodorosToday] = useState(0);
  const [totalPomodoroTime, setTotalPomodoroTime] = useState(0); // in minutes
  const [missedDays, setMissedDays] = useState(0);
  const [lastDate, setLastDate] = useState<string>("");

  const intervalRef = useRef<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Play random voice line
  const playVoiceLine = async () => {
    const idx = Math.floor(Math.random() * voiceLines.length);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(voiceLines[idx]);
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.log("Audio error:", e);
    }
  };

  // Countdown logic
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev === 0) {
            if (minutes === 0) {
              completeCycle();
              return 0;
            }
            setMinutes((m) => m - 1);
            return 59;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    } else if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, minutes]);

  // Load stats from storage on mount
  useEffect(() => {
    (async () => {
      const today = new Date().toDateString();
      const stored = await AsyncStorage.getItem("pomodoroStats");
      if (stored) {
        const stats = JSON.parse(stored);
        setMinPomodoros(stats.minPomodoros ?? 4);
        setStreak(stats.streak ?? 0);
        setMissedDays(stats.missedDays ?? 0);
        setTotalPomodoroTime(stats.totalPomodoroTime ?? 0);
        if (stats.lastDate === today) {
          setPomodorosToday(stats.pomodorosToday ?? 0);
        } else {
          // New day: check streak/missed logic
          if ((stats.pomodorosToday ?? 0) >= (stats.minPomodoros ?? 4)) {
            setStreak((stats.streak ?? 0) + 1);
          } else if (stats.lastDate) {
            setStreak(0);
            setMissedDays((stats.missedDays ?? 0) + 1);
          }
          setPomodorosToday(0);
        }
        setLastDate(today);
      } else {
        setLastDate(today);
      }
    })();
  }, []);

  // Save stats to storage on change
  useEffect(() => {
    AsyncStorage.setItem(
      "pomodoroStats",
      JSON.stringify({
        minPomodoros,
        pomodorosToday,
        streak,
        missedDays,
        totalPomodoroTime,
        lastDate,
      })
    );
  }, [minPomodoros, pomodorosToday, streak, missedDays, totalPomodoroTime, lastDate]);

  // Complete a cycle (Pomodoro or Break)
  const completeCycle = () => {
    playVoiceLine();

    if (onBreak) {
      // End break, reset to Pomodoro
      setOnBreak(false);
      setMinutes(pomodoroMinutes);
      setSeconds(0);
      setRunning(false);
      return;
    }

    // Pomodoro complete
    setPomodorosToday((prev) => prev + 1);
    setTotalPomodoroTime((prev) => prev + pomodoroMinutes);

    const newCycle = cycle + 1;
    setCycle(newCycle);

    const newState: LetterState =
      streak >= 5
        ? "op"
        : streak >= 2
        ? "mid"
        : "down";

    setLetterState(newState);

    const filler = letters.getFillerLetter(cycle - 1);
    const main = letters.getMainLetter(cycle, newState);
    setLettersQueue((prev) => [...prev, filler, main]);

    setStreak((prev) => prev + 1);

    setMinutes(breakMinutes);
    setSeconds(0);
    setOnBreak(true);
    setRunning(false);
  };

  // At midnight, check streak/missed logic
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== lastDate) {
        if (pomodorosToday >= minPomodoros) {
          setStreak((prev) => prev + 1);
        } else {
          setStreak(0);
          setMissedDays((prev) => prev + 1);
        }
        setPomodorosToday(0);
        setLastDate(today);
      }
    }, 60000); // check every minute
    return () => clearInterval(interval);
  }, [lastDate, pomodorosToday, minPomodoros]);

  const handleStart = () => {
    if (missedCycles > 0) {
      const recovery = letters.getRecovery(missedCycles - 1);
      setLettersQueue((prev) => [...prev, recovery]);
      setMissedCycles(0);
    }
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
    setMissedCycles((prev) => prev + 1);
    checkFall();
  };

  const handleReset = () => {
    setRunning(false);
    setMinutes(pomodoroMinutes);
    setSeconds(0);
    setCycle(1);
    setStreak(0);
    setLettersQueue([]);
    setMissedCycles(0);
    setOnBreak(false);
  };

  const handleStartBreak = () => {
    setOnBreak(true);
    setMinutes(breakMinutes);
    setSeconds(0);
    setRunning(true);
  };

  const checkFall = () => {
    if (streak === 0) return;
    let severity: "mild" | "severe" | "death" = "mild";
    if (missedCycles === 1) severity = "mild";
    else if (missedCycles <= 3) severity = "severe";
    else severity = "death";

    const fallLetter = letters.getFalling(severity, missedCycles - 1);
    setLettersQueue((prev) => [...prev, fallLetter]);
    setStreak(0);
  };

  // Update timer when user edits Pomodoro or Break length
  useEffect(() => {
    if (!running && !onBreak) setMinutes(pomodoroMinutes);
  }, [pomodoroMinutes]);
  useEffect(() => {
    if (!running && onBreak) setMinutes(breakMinutes);
  }, [breakMinutes]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hacker Pomodoro</Text>
      <View style={styles.inputRow}>
        <Text style={styles.label}>Pomodoro (min):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(pomodoroMinutes)}
          onChangeText={v => setPomodoroMinutes(Number(v) || 1)}
        />
        <Text style={styles.label}>Break (min):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(breakMinutes)}
          onChangeText={v => setBreakMinutes(Number(v) || 1)}
        />
      </View>
      <View style={styles.inputRow}>
        <Text style={styles.label}>Min Pomodoros/day:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(minPomodoros)}
          onChangeText={v => setMinPomodoros(Number(v) || 1)}
        />
      </View>

      <Text style={styles.clock}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </Text>
      <Text style={styles.status}>{onBreak ? "Break Time" : "Focus Time"}</Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={handleStart}>
          <Text style={styles.btnText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={handlePause}>
          <Text style={styles.btnText}>Pause</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={handleReset}>
          <Text style={styles.btnText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={handleStartBreak}>
          <Text style={styles.btnText}>Start Break</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.info}>
        Pomodoros today: {pomodorosToday} / {minPomodoros} {"\n"}
        Total Pomodoro time: {totalPomodoroTime} min{"\n"}
        Streak: {streak} days | Missed: {missedDays} days
      </Text>

      <LetterBox letters={lettersQueue} />

      <View style={styles.explanation}>
        <Text style={styles.explainTitle}>How Streak & Missed Work:</Text>
        <Text style={styles.explainText}>
          - <Text style={{color:'#39FF14'}}>Streak</Text> increases by 1 for each day you meet or exceed your minimum Pomodoros.
        </Text>
        <Text style={styles.explainText}>
          - <Text style={{color:'#39FF14'}}>Missed</Text> increases by 1 for each day you do less than your minimum.
        </Text>
        <Text style={styles.explainText}>
          - <Text style={{color:'#39FF14'}}>Total Pomodoro time</Text> is the sum of all Pomodoro minutes completed.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 32,
    color: "#39FF14",
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    color: "#39FF14",
    fontSize: 16,
    marginHorizontal: 4,
  },
  input: {
    backgroundColor: "#111",
    color: "#39FF14",
    borderWidth: 1,
    borderColor: "#39FF14",
    borderRadius: 6,
    width: 48,
    height: 32,
    textAlign: "center",
    marginHorizontal: 4,
    fontSize: 16,
  },
  clock: {
    fontSize: 72,
    color: "#39FF14",
    fontWeight: "bold",
    marginBottom: 10,
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  status: {
    color: "#39FF14",
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
  },
  buttons: {
    flexDirection: "row",
    marginBottom: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btn: {
    backgroundColor: "#003300",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 5,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#39FF14",
  },
  btnText: {
    color: "#39FF14",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  info: {
    fontSize: 18,
    color: "#39FF14",
    marginBottom: 20,
    fontFamily: "monospace",
  },
  explanation: {
    marginTop: 16,
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 8,
    borderColor: "#39FF14",
    borderWidth: 1,
    width: "100%",
    maxWidth: 400,
  },
  explainTitle: {
    color: "#39FF14",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  explainText: {
    color: "#39FF14",
    fontSize: 14,
    marginBottom: 2,
  },
});
