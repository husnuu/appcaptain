import { z } from "zod";
import {
  CancellationPolicyType,
  ExperienceCategory,
  ExperiencePricingType,
  ExperienceStatus,
  ExperienceStep,
} from "../enums";

const stringItem = z.string().trim().min(1);
const stringList = z.array(stringItem);
const optionalStringList = z.array(stringItem).default([]);

export const experienceStep1Schema = z.object({
  category: z.nativeEnum(ExperienceCategory),
});

export const experienceStep2Schema = z.object({
  title: z.string().trim().min(10).max(120),
  referenceCode: z.string().trim().max(40).optional().nullable(),
  shortDescription: z.string().trim().min(20).max(300),
  fullDescription: z.string().trim().min(100).max(5000),
  highlights: stringList.min(1, "En az bir öne çıkan madde ekleyin"),
  keywords: optionalStringList,
});

export const experienceStep3Schema = z.object({
  included: stringList.min(1, "En az bir dahil olan madde ekleyin"),
  notIncluded: optionalStringList,
  notAllowed: optionalStringList,
  toBring: optionalStringList,
  knowBeforeYouGo: optionalStringList,
  emergencyContactPhone: z.string().trim().min(6).max(30).optional().nullable(),
});

export const experienceStep4Schema = z
  .object({
    durationMinutes: z.coerce.number().int().min(15).max(24 * 60),
    meetingPoint: z.string().trim().min(5).max(500),
    meetingPointLat: z.coerce.number().min(-90).max(90).optional().nullable(),
    meetingPointLng: z.coerce.number().min(-180).max(180).optional().nullable(),
    meetingTime: z.string().trim().min(2).max(100),
    endPoint: z.string().trim().max(500).optional().default(""),
    endPointLat: z.coerce.number().min(-90).max(90).optional().nullable(),
    endPointLng: z.coerce.number().min(-180).max(180).optional().nullable(),
    isSameEndPoint: z.coerce.boolean().optional().default(true),
    languages: stringList.min(1, "En az bir dil seçin"),
    minParticipants: z.coerce.number().int().min(1).max(500),
    maxParticipants: z.coerce.number().int().min(1).max(500),
    minAge: z.coerce.number().int().min(0).max(99).optional().nullable(),
    ticketType: z.string().trim().max(40).optional().nullable(),
    requiredEquipment: optionalStringList,
    accessibilityInfo: z.string().trim().max(1000).optional().nullable(),
    accessibilityOptions: optionalStringList,
  })
  .refine((v) => v.maxParticipants >= v.minParticipants, {
    message: "Maksimum katılımcı minimumdan küçük olamaz",
    path: ["maxParticipants"],
  });

export const experienceStep5Schema = z.object({
  basePrice: z.coerce.number().positive("Fiyat 0'dan büyük olmalı"),
  currency: z.string().trim().length(3).default("TRY"),
  pricingType: z.nativeEnum(ExperiencePricingType),
  childDiscountPercent: z.coerce.number().int().min(0).max(100).optional().nullable(),
});

export const experienceStep6Schema = z
  .object({
    cancellationPolicy: z.nativeEnum(CancellationPolicyType),
    cancellationPolicyText: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (v) =>
      v.cancellationPolicy !== CancellationPolicyType.CUSTOM ||
      (v.cancellationPolicyText && v.cancellationPolicyText.length >= 10),
    {
      message: "Özel iptal politikası için açıklama gerekli",
      path: ["cancellationPolicyText"],
    }
  );

export const experienceStep7Schema = z.object({
  coverPhotoUrl: z.string().url("Kapak fotoğrafı zorunlu"),
  photoUrls: optionalStringList,
  videoUrl: z.string().url().optional().nullable(),
});

export const experienceSchema = z
  .object({
    category: experienceStep1Schema.shape.category,
    title: experienceStep2Schema.shape.title,
    referenceCode: experienceStep2Schema.shape.referenceCode,
    shortDescription: experienceStep2Schema.shape.shortDescription,
    fullDescription: experienceStep2Schema.shape.fullDescription,
    highlights: experienceStep2Schema.shape.highlights,
    keywords: experienceStep2Schema.shape.keywords,
    included: experienceStep3Schema.shape.included,
    notIncluded: experienceStep3Schema.shape.notIncluded,
    notAllowed: experienceStep3Schema.shape.notAllowed,
    toBring: experienceStep3Schema.shape.toBring,
    knowBeforeYouGo: experienceStep3Schema.shape.knowBeforeYouGo,
    emergencyContactPhone: experienceStep3Schema.shape.emergencyContactPhone,
    durationMinutes: experienceStep4Schema.innerType().shape.durationMinutes,
    meetingPoint: experienceStep4Schema.innerType().shape.meetingPoint,
    meetingPointLat: experienceStep4Schema.innerType().shape.meetingPointLat,
    meetingPointLng: experienceStep4Schema.innerType().shape.meetingPointLng,
    meetingTime: experienceStep4Schema.innerType().shape.meetingTime,
    endPoint: experienceStep4Schema.innerType().shape.endPoint,
    endPointLat: experienceStep4Schema.innerType().shape.endPointLat,
    endPointLng: experienceStep4Schema.innerType().shape.endPointLng,
    isSameEndPoint: experienceStep4Schema.innerType().shape.isSameEndPoint,
    languages: experienceStep4Schema.innerType().shape.languages,
    minParticipants: experienceStep4Schema.innerType().shape.minParticipants,
    maxParticipants: experienceStep4Schema.innerType().shape.maxParticipants,
    minAge: experienceStep4Schema.innerType().shape.minAge,
    ticketType: experienceStep4Schema.innerType().shape.ticketType,
    requiredEquipment: experienceStep4Schema.innerType().shape.requiredEquipment,
    accessibilityInfo: experienceStep4Schema.innerType().shape.accessibilityInfo,
    accessibilityOptions: experienceStep4Schema.innerType().shape.accessibilityOptions,
    basePrice: experienceStep5Schema.shape.basePrice,
    currency: experienceStep5Schema.shape.currency,
    pricingType: experienceStep5Schema.shape.pricingType,
    childDiscountPercent: experienceStep5Schema.shape.childDiscountPercent,
    cancellationPolicy: experienceStep6Schema.innerType().shape.cancellationPolicy,
    cancellationPolicyText: experienceStep6Schema.innerType().shape.cancellationPolicyText,
    coverPhotoUrl: experienceStep7Schema.shape.coverPhotoUrl,
    photoUrls: experienceStep7Schema.shape.photoUrls,
    videoUrl: experienceStep7Schema.shape.videoUrl,
  })
  .refine((v) => v.maxParticipants >= v.minParticipants, {
    message: "Maksimum katılımcı minimumdan küçük olamaz",
    path: ["maxParticipants"],
  })
  .refine(
    (v) =>
      v.cancellationPolicy !== CancellationPolicyType.CUSTOM ||
      (v.cancellationPolicyText && v.cancellationPolicyText.length >= 10),
    {
      message: "Özel iptal politikası için açıklama gerekli",
      path: ["cancellationPolicyText"],
    }
  );

export const experienceStatusToggleSchema = z.object({
  status: z.enum([ExperienceStatus.ACTIVE, ExperienceStatus.PAUSED]),
});

export const experiencePhotoUploadUrlSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
});

export const experienceRegisterPhotoSchema = z.object({
  storagePath: z.string().trim().min(1),
  asCover: z.boolean().optional(),
});

export const experienceAdminReviewSchema = z.object({
  note: z.string().trim().min(5).max(2000).optional(),
});

export const EXPERIENCE_STEP_SCHEMAS: Record<ExperienceStep, z.ZodTypeAny> = {
  [ExperienceStep.CATEGORY]: experienceStep1Schema,
  [ExperienceStep.TITLE_DESCRIPTION]: experienceStep2Schema,
  [ExperienceStep.INCLUDED_INFO]: experienceStep3Schema,
  [ExperienceStep.LOGISTICS]: experienceStep4Schema,
  [ExperienceStep.PRICING]: experienceStep5Schema,
  [ExperienceStep.CANCELLATION]: experienceStep6Schema,
  [ExperienceStep.MEDIA]: experienceStep7Schema,
};

export type ExperienceStep1Input = z.infer<typeof experienceStep1Schema>;
export type ExperienceStep2Input = z.infer<typeof experienceStep2Schema>;
export type ExperienceStep3Input = z.infer<typeof experienceStep3Schema>;
export type ExperienceStep4Input = z.infer<typeof experienceStep4Schema>;
export type ExperienceStep5Input = z.infer<typeof experienceStep5Schema>;
export type ExperienceStep6Input = z.infer<typeof experienceStep6Schema>;
export type ExperienceStep7Input = z.infer<typeof experienceStep7Schema>;
