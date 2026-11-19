import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type UsageMode = 'patient' | 'aidant';

export type Caregiver = {
  name: string;
  email: string;
};

export type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  caregiver?: Caregiver;
};