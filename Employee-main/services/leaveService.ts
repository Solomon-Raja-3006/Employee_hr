import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LeaveBalance, LeaveRequest } from '../types';

const LEAVE_BALANCE_KEY = 'emp-pwa-leave-balance';

export const getLeaveBalance = (): LeaveBalance[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LEAVE_BALANCE_KEY);
  if (!raw) {
    const defaultBalance: LeaveBalance[] = [
      { type: 'casual', available: 12, consumed: 0 },
      { type: 'sick', available: 8, consumed: 0 },
      { type: 'earned', available: 15, consumed: 0 },
      { type: 'optional', available: 2, consumed: 0 },
    ];
    localStorage.setItem(LEAVE_BALANCE_KEY, JSON.stringify(defaultBalance));
    return defaultBalance;
  }
  try {
    return JSON.parse(raw) as LeaveBalance[];
  } catch {
    return [];
  }
};

export const updateLeaveBalance = (balances: LeaveBalance[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEAVE_BALANCE_KEY, JSON.stringify(balances));
};

export const listLeaves = async (userId: string): Promise<LeaveRequest[]> => {
  const q = query(
    collection(db, 'leaves'),
    where('userId', '==', userId),
    orderBy('appliedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const leaves: LeaveRequest[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    leaves.push({
      leaveId: doc.id,
      userId: data.userId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: data.status,
      appliedAt: data.appliedAt,
      attachments: data.attachments || [],
      synced: true,
    });
  });

  return leaves;
};

export const applyLeave = async (payload: {
  type: LeaveRequest['type'];
  startDate: string;
  endDate: string;
  reason: string;
  userId: string;
}): Promise<LeaveRequest> => {
  const leave = {
    userId: payload.userId,
    type: payload.type,
    startDate: payload.startDate,
    endDate: payload.endDate,
    reason: payload.reason,
    status: 'pending' as const,
    appliedAt: Date.now(),
    attachments: [],
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'leaves'), leave);

  return {
    leaveId: docRef.id,
    ...leave,
    synced: true,
  };
};

