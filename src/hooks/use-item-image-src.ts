"use client";

import { useEffect, useState } from "react";

import {
  getItemImageBlob,
  isLocalItemImageRef,
} from "@/lib/items/item-images";

/**
 * Resolves a displayable image URL for an item.
 * Public paths pass through; IndexedDB markers become object URLs (revoked on cleanup).
 */
export function useItemImageSrc(
  itemId: string,
  imageSrc: string | null,
): string | null {
  const isLocal = isLocalItemImageRef(imageSrc);
  const cacheKey = `${itemId}:${imageSrc ?? ""}`;
  const [resolved, setResolved] = useState<{
    key: string;
    url: string | null;
  }>({ key: cacheKey, url: null });

  useEffect(() => {
    if (!isLocal) return;

    let cancelled = false;
    let created: string | null = null;

    void getItemImageBlob(itemId).then((blob) => {
      if (cancelled || !blob) return;
      created = URL.createObjectURL(blob);
      setResolved({ key: cacheKey, url: created });
    });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [cacheKey, isLocal, itemId]);

  if (!isLocal) return imageSrc;
  return resolved.key === cacheKey ? resolved.url : null;
}
