import mongoose from 'mongoose';
import { userSchema } from '../models/User.js';
import { onboardingSchema } from '../models/Onboarding.js';
import { futureMeCardSchema } from '../models/FutureMeCard.js';
import { User, Onboarding, FutureMeCard } from '../models/index.js';
import { PLATFORMS } from '../config/platforms.js';
import { ApiError } from '../utils/apiError.js';

let careerBeaconModels = null;
let vidhyasaarthiModels = null;

function bindModels(connection) {
  const UserModel =
    connection.models.User || connection.model('User', userSchema, 'users');
  const OnboardingModel =
    connection.models.Onboarding ||
    connection.model('Onboarding', onboardingSchema, 'onboardings');
  const FutureMeCardModel =
    connection.models.FutureMeCard ||
    connection.model('FutureMeCard', futureMeCardSchema, 'futuremecards');

  return {
    User: UserModel,
    Onboarding: OnboardingModel,
    FutureMeCard: FutureMeCardModel,
    db: connection.db,
  };
}

export function initCareerBeaconModels(connection) {
  careerBeaconModels = bindModels(connection);
  return careerBeaconModels;
}

export function initVidhyasaarthiModels(connection) {
  vidhyasaarthiModels = bindModels(connection);
  return vidhyasaarthiModels;
}

export function isCareerBeaconConfigured() {
  return Boolean(careerBeaconModels);
}

export function isVidhyasaarthiConfigured() {
  return Boolean(vidhyasaarthiModels);
}

export function getModelsForPlatform(platform) {
  if (platform === PLATFORMS.CAREER_BEACON) {
    if (!careerBeaconModels) {
      throw new ApiError(503, 'Career Beacon database is not configured');
    }
    return careerBeaconModels;
  }

  if (platform === PLATFORMS.VIDHYASAARTHI) {
    if (!vidhyasaarthiModels) {
      throw new ApiError(503, 'Vidhyasaarthi database is not configured');
    }
    return vidhyasaarthiModels;
  }

  return {
    User,
    Onboarding,
    FutureMeCard,
    db: mongoose.connection.db,
  };
}
