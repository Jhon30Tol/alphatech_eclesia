import { View } from '../types';

export const PLAN_FEATURES = {
    basico: [
        View.DASHBOARD,
        View.MEMBERS,
        View.CHURCH_CONFIG,
        View.EVENTS,
        View.SETTINGS,
        View.BILLING,
    ],
    profissional: [
        View.DASHBOARD,
        View.MEMBERS,
        View.CHURCH_CONFIG,
        View.EVENTS,
        View.SETTINGS,
        View.BILLING,
        View.FINANCES, // Feature exclusiva Pro
        View.FINANCE_TYPES,
    ],
    enterprise: [
        View.DASHBOARD,
        View.MEMBERS,
        View.CHURCH_CONFIG,
        View.EVENTS,
        View.SETTINGS,
        View.BILLING,
        View.FINANCES,
        View.FINANCE_TYPES,
        View.ANALYTICS, // Feature exclusiva Enterprise
        View.AI_ASSISTANT, // Feature exclusiva Enterprise
    ],
};

export const getPlanFeatures = (planId?: string): string[] => {
    if (!planId) return PLAN_FEATURES.basico; // Fallback
    return PLAN_FEATURES[planId as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.basico;
};

export const canAccessFeature = (planId: string | undefined, view: View): boolean => {
    const features = getPlanFeatures(planId);
    return features.includes(view);
};
