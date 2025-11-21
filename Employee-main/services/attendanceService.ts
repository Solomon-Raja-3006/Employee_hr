import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { AttendanceDay, GeoLocation, InOutEntry, PunchRecord, PunchType } from '../types';
import { sha256 } from '../utils/hash';

export const addPunch = async ({
  photo,
  location,
  type,
  userId,
}: {
  photo: string;
  location: GeoLocation;
  type: PunchType;
  userId: string;
}): Promise<void> => {
  const timestamp = Date.now();
  const hash = await sha256(`${photo.slice(0, 64)}-${location.latitude}-${location.longitude}-${timestamp}`);

  const photoRef = ref(storage, `punches/${userId}/${timestamp}.jpg`);
  await uploadString(photoRef, photo, 'data_url');
  const photoUrl = await getDownloadURL(photoRef);

  const newPunch = {
    userId,
    type,
    timestamp,
    location,
    photoUrl,
    hash,
    synced: true,
    createdAt: Timestamp.now(),
  };

  await addDoc(collection(db, 'punches'), newPunch);
};

export const getPunchHistory = async (userId: string): Promise<PunchRecord[]> => {
  const q = query(
    collection(db, 'punches'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const records: PunchRecord[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    records.push({
      id: doc.id,
      userId: data.userId,
      type: data.type,
      timestamp: data.timestamp,
      location: data.location,
      photo: data.photoUrl || '',
      hash: data.hash,
      synced: data.synced,
    });
  });

  return records;
};

export const getAttendanceDays = async (userId: string): Promise<AttendanceDay[]> => {
  const q = query(
    collection(db, 'attendance'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const days: AttendanceDay[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    days.push({
      date: data.date,
      status: data.status,
      inTime: data.inTime,
      outTime: data.outTime,
      notes: data.notes,
    });
  });

  return days;
};

export const getInOutTimeline = async (userId: string): Promise<InOutEntry[]> => {
  const punches = await getPunchHistory(userId);
  return punches.map((punch) => ({
    id: punch.id,
    date: new Date(punch.timestamp).toISOString().slice(0, 10),
    type: punch.type,
    timestamp: punch.timestamp,
    location: punch.location,
  }));
};
