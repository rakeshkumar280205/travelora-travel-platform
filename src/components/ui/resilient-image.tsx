"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type ResilientImageProps = ImageProps & {
  fallbackSrc?: ImageProps["src"];
};

export function ResilientImage({ fallbackSrc, onError, src, alt, ...props }: ResilientImageProps) {
  const [imageSource, setImageSource] = useState(src);
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return <div aria-label={alt} role="img" className={`bg-deep-green ${props.className ?? ""}`} />;
  }

  return (
    <Image
      {...props}
      src={imageSource}
      alt={alt}
      onError={(event) => {
        onError?.(event);
        if (fallbackSrc && imageSource !== fallbackSrc) {
          setImageSource(fallbackSrc);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
