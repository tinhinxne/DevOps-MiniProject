import type { UserProfile } from '../types';

export const mockProfile: UserProfile = {
  firstName: 'Tinhinane',
  lastName: 'Belarbi',
  email: 'tinhinane@example.com',
  caregiver: {
    name: 'Miria Belarbi',
    email: 'miria@example.com',
  },
  
};
export type FollowedStatus = 'alert' | 'attention' | 'ok';
export type AvatarTone = 'orange' | 'green' | 'blue' | 'violet' | 'yellow' | 'red';

export type FollowedPerson = {
  id: string;
  name: string;
  initials: string;
  relation: string;
  detail: string;
  status: FollowedStatus;
  tone: AvatarTone;
};

export const mockFollowed: FollowedPerson[] = [
  { id: '1', name: 'Karim Amrani', initials: 'KA', relation: 'Papa', detail: 'Prise prévue à 12:30', status: 'alert', tone: 'orange' },
  { id: '2', name: 'Nadia Mansouri', initials: 'NM', relation: 'Maman', detail: '2 prises sur 3 aujourd’hui', status: 'attention', tone: 'green' },
  { id: '3', name: 'Yasmine Amrani', initials: 'YA', relation: 'Fille', detail: '3 prises sur 3 aujourd’hui', status: 'ok', tone: 'blue' },
  { id: '4', name: 'Samir Benali', initials: 'SB', relation: 'Oncle', detail: '2 prises sur 2 aujourd’hui', status: 'ok', tone: 'violet' },
  { id: '5', name: 'Leïla Mansouri', initials: 'LM', relation: 'Tante', detail: '1 prise sur 2 aujourd’hui', status: 'ok', tone: 'yellow' },
  { id: '6', name: 'Ahmed Amrani', initials: 'AA', relation: 'Grand-père', detail: 'Observance à 72% cette semaine', status: 'attention', tone: 'red' },
];