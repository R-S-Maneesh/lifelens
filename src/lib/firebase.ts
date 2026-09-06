import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type {
  DayEntry,
  TaskItem,
  GoalItem,
  ReminderItem,
  UserSettings,
  UserProfile
} from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with designated custom database ID or default
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Recursively strips all undefined values from objects and arrays so Firestore SDK never throws errors.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = stripUndefined(value);
      }
    }
    return result as any;
  }
  return obj;
}

/**
 * Trigger Google Sign-In popup with error mapping
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Sign in failed:', error);
    throw error;
  }
}

/**
 * Sign out current authenticated user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Format user profile safely
 */
export function formatUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Reflective User',
    email: user.email,
    photoURL: user.photoURL
  };
}

// ----------------------------------------------------
// DAY ENTRIES (/users/{userId}/days/{dateKey})
// ----------------------------------------------------

export async function saveDayEntry(userId: string, entry: DayEntry): Promise<void> {
  if (!userId || !entry.date) {
    throw new Error('Invalid userId or date for day entry.');
  }

  const docRef = doc(db, 'users', userId, 'days', entry.date);
  const cleanData = stripUndefined({
    ...entry,
    id: entry.date,
    userId,
    updatedAt: Date.now()
  });

  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteDayEntry(userId: string, dateKey: string): Promise<void> {
  if (!userId || !dateKey) return;
  const docRef = doc(db, 'users', userId, 'days', dateKey);
  await deleteDoc(docRef);
}

export function subscribeToUserDays(
  userId: string,
  onUpdate: (days: DayEntry[]) => void,
  onError: (err: any) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const collRef = collection(db, 'users', userId, 'days');
  const q = query(collRef, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DayEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DayEntry;
        items.push({
          ...data,
          id: docSnap.id
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Days subscription error:', err);
      onError(err);
    }
  );
}

// ----------------------------------------------------
// TASKS (/users/{userId}/tasks/{taskId})
// ----------------------------------------------------

export async function saveTask(userId: string, task: TaskItem): Promise<void> {
  if (!userId || !task.id) throw new Error('Invalid userId or taskId.');
  const docRef = doc(db, 'users', userId, 'tasks', task.id);
  const cleanData = stripUndefined({
    ...task,
    userId
  });
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  if (!userId || !taskId) return;
  const docRef = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(docRef);
}

export function subscribeToUserTasks(
  userId: string,
  onUpdate: (tasks: TaskItem[]) => void,
  onError: (err: any) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const collRef = collection(db, 'users', userId, 'tasks');
  const q = query(collRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: TaskItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as TaskItem);
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Tasks subscription error:', err);
      onError(err);
    }
  );
}

// ----------------------------------------------------
// GOALS (/users/{userId}/goals/{goalId})
// ----------------------------------------------------

export async function saveGoal(userId: string, goal: GoalItem): Promise<void> {
  if (!userId || !goal.id) throw new Error('Invalid userId or goalId.');
  const docRef = doc(db, 'users', userId, 'goals', goal.id);
  const cleanData = stripUndefined({
    ...goal,
    userId
  });
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  if (!userId || !goalId) return;
  const docRef = doc(db, 'users', userId, 'goals', goalId);
  await deleteDoc(docRef);
}

export function subscribeToUserGoals(
  userId: string,
  onUpdate: (goals: GoalItem[]) => void,
  onError: (err: any) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const collRef = collection(db, 'users', userId, 'goals');
  const q = query(collRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: GoalItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as GoalItem);
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Goals subscription error:', err);
      onError(err);
    }
  );
}

// ----------------------------------------------------
// REMINDERS (/users/{userId}/reminders/{reminderId})
// ----------------------------------------------------

export async function saveReminder(userId: string, reminder: ReminderItem): Promise<void> {
  if (!userId || !reminder.id) throw new Error('Invalid userId or reminderId.');
  const docRef = doc(db, 'users', userId, 'reminders', reminder.id);
  const cleanData = stripUndefined({
    ...reminder,
    userId
  });
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteReminder(userId: string, reminderId: string): Promise<void> {
  if (!userId || !reminderId) return;
  const docRef = doc(db, 'users', userId, 'reminders', reminderId);
  await deleteDoc(docRef);
}

export function subscribeToUserReminders(
  userId: string,
  onUpdate: (reminders: ReminderItem[]) => void,
  onError: (err: any) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const collRef = collection(db, 'users', userId, 'reminders');
  const q = query(collRef, orderBy('date', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ReminderItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ReminderItem);
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Reminders subscription error:', err);
      onError(err);
    }
  );
}

// ----------------------------------------------------
// USER SETTINGS (/users/{userId}/settings/preferences)
// ----------------------------------------------------

export const DEFAULT_USER_SETTINGS: UserSettings = {
  enableEmotionalAnalysis: true,
  enableAISuggestions: true,
  enableOptionalMetrics: true,
  enableReminders: true,
  theme: 'obsidian'
};

export async function saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
  if (!userId) return;
  const docRef = doc(db, 'users', userId, 'settings', 'preferences');
  await setDoc(docRef, stripUndefined(settings), { merge: true });
}

export function subscribeToUserSettings(
  userId: string,
  onUpdate: (settings: UserSettings) => void
): () => void {
  if (!userId) {
    onUpdate(DEFAULT_USER_SETTINGS);
    return () => {};
  }

  const docRef = doc(db, 'users', userId, 'settings', 'preferences');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({ ...DEFAULT_USER_SETTINGS, ...(docSnap.data() as UserSettings) });
    } else {
      onUpdate(DEFAULT_USER_SETTINGS);
    }
  });
}

// ----------------------------------------------------
// DATA EXPORT (Privacy & User Data Sovereignty)
// ----------------------------------------------------

export async function exportUserData(userId: string): Promise<string> {
  if (!userId) throw new Error('No authenticated user.');

  const [daysSnap, tasksSnap, goalsSnap, remindersSnap] = await Promise.all([
    getDocs(collection(db, 'users', userId, 'days')),
    getDocs(collection(db, 'users', userId, 'tasks')),
    getDocs(collection(db, 'users', userId, 'goals')),
    getDocs(collection(db, 'users', userId, 'reminders'))
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    userId,
    days: daysSnap.docs.map(d => d.data()),
    tasks: tasksSnap.docs.map(d => d.data()),
    goals: goalsSnap.docs.map(d => d.data()),
    reminders: remindersSnap.docs.map(d => d.data())
  };

  return JSON.stringify(payload, null, 2);
}

export { onAuthStateChanged };
