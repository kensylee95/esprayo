"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getTokenClient } from "@/helpers/request";
import eventService from "@/services/Event/Event";
import { EventType } from "@/services/Event/Event.dto";
import { uploadImage } from "@/services/Superbase";
import BackButton from "@/ui/components/BackButton/BackButton";
import Input from "@/ui/components/InputWithLabel/InputWithLabel";
import styles from "./Page.module.scss";

const schema = z.object({
  title: z.string().min(1, "Event title is required"),
  welcomeMessage: z.string().optional(),
  coverImage: z
    .custom<FileList>()
    .optional()
    .refine((f) => !f || f.length === 0 || f[0].size <= 5_000_000, "Max 5 MB")
    .refine(
      (f) =>
        !f ||
        f.length === 0 ||
        ["image/jpeg", "image/png", "image/webp"].includes(f[0].type),
      "JPEG, PNG or WebP only",
    ),
});

type FormValues = z.infer<typeof schema>;

// step shown below the button while submitting
const STEPS = [
  "Saving your event...",
  "Uploading cover image...",
  "Almost done...",
];

export default function Page() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const { ref: rhfRef, ...imageRest } = register("coverImage");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    imageRest.onChange(e);
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function removeImage() {
    setPreview(null);
    setValue("coverImage", undefined, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(data: FormValues) {
    try {
      setStepIndex(0);
      const token = await getTokenClient();
      if (!token) return;

      let coverUrl: string | undefined;

      if (data.coverImage?.[0]) {
        setStepIndex(1);
        coverUrl = await uploadImage(data.coverImage[0]);
      }

      setStepIndex(2);
      const event = await eventService(token).createEvent({
        title: data.title,
        type: EventType.OTHER,
        welcomeMessage: data.welcomeMessage,
        coverImageUrl: coverUrl,
      });

      router.push(`/event/success/${event.id}`);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.back}>
        <BackButton onClick={() => router.back()} />
      </div>

      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      <section className={styles.card}>
        {/* ── LEFT: image panel ── */}
        <div className={styles.imagePanel}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.hiddenInput}
            {...imageRest}
            ref={(el) => {
              rhfRef(el);
              fileInputRef.current = el;
            }}
            onChange={handleFileChange}
          />

          {preview ? (
            <div className={styles.previewWrapper}>
              <Image
                src={preview}
                alt="Cover preview"
                fill
                className={styles.previewImage}
              />
              <div className={styles.previewOverlay}>
                <button
                  type="button"
                  className={styles.changeBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change photo
                </button>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={removeImage}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.uploadZone}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.uploadIconRing}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <span className={styles.uploadLabel}>Upload cover photo</span>
              <span className={styles.uploadHint}>
                JPEG · PNG · WebP · max 5 MB
              </span>
            </button>
          )}

          {errors.coverImage && (
            <p className={styles.uploadError}>
              {errors.coverImage.message as string}
            </p>
          )}

          <div className={`${styles.corner} ${styles.cornerTL}`} />
          <div className={`${styles.corner} ${styles.cornerBR}`} />
        </div>

        {/* ── RIGHT: form panel ── */}
        <div className={styles.formPanel}>
          <div className={styles.eyebrow}>New Event</div>
          <h1 className={styles.title}>Name your event.</h1>
          <p className={styles.sub}>
            This appears at the top of the gift room and on the display screen
          </p>

          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.inputGroup}>
              <Input
                label="EVENT TITLE"
                placeholder="Adaeze & Chidi's Wedding"
                {...register("title")}
              />
              <div className={styles.errorBox}>{errors.title?.message}</div>
            </div>

            <div className={styles.inputGroup}>
              <Input
                label="Welcome message (optional)"
                placeholder="Thank you for celebrating with us!"
                {...register("welcomeMessage")}
              />
              <div className={styles.errorBox}>
                {errors.welcomeMessage?.message}
              </div>
            </div>

            <div className={styles.submitArea}>
              <button
                type="submit"
                className={styles.btn}
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Event</span>
                )}
              </button>

              {isSubmitting && (
                <p className={styles.stepText}>{STEPS[stepIndex]}</p>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
