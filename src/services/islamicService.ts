import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, Qibla } from 'adhan';
import { format } from 'date-fns';

export const getPrayerTimes = (coords: { latitude: number; longitude: number }) => {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = CalculationMethod.MoonsightingCommittee();
  const date = new Date();
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  
  return [
    { id: 'fajr', name: 'Subuh', time: prayerTimes.fajr },
    { id: 'sunrise', name: 'Terbit', time: prayerTimes.sunrise },
    { id: 'dhuhr', name: 'Dzuhur', time: prayerTimes.dhuhr },
    { id: 'asr', name: 'Ashar', time: prayerTimes.asr },
    { id: 'maghrib', name: 'Maghrib', time: prayerTimes.maghrib },
    { id: 'isha', name: 'Isya', time: prayerTimes.isha },
  ];
};

export const getQiblaDirection = (coords: { latitude: number; longitude: number }) => {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  return Qibla(coordinates);
};

export const fetchSurahs = async () => {
  const res = await fetch('https://equran.id/api/v2/surat');
  const data = await res.json();
  return data.data;
};

export const fetchSurahDetail = async (nomor: number) => {
  const res = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
  const data = await res.json();
  return data.data;
};
