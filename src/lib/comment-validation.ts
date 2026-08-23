const PROFANITY_PATTERNS = [
  /\bdit me\b/u,
  /\bdu me\b/u,
  /\bdu ma\b/u,
  /\bdm+\b/u,
  /\bdmm+\b/u,
  /\bdeo\b/u,
  /\bcac\b/u,
  /\blon\b/u,
  /\bbuoi\b/u,
  /\bvcl\b/u,
  /\bfuck\b/u,
  /\bshit\b/u,
  /\bbitch\b/u,
];

function stripVietnamese(value: string) {
  return value
    .normalize("NFD")
    .replace(/[đĐ]/g, (char) => (char === "đ" ? "d" : "D"))
    .replace(/\p{Diacritic}/gu, "");
}

export function normalizeCommentContent(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function hasTooManyRepeatedCharacters(value: string) {
  return /([\p{L}\p{N}])\1{9,}/u.test(value) || /([^\p{L}\p{N}\s])\1{5,}/u.test(value);
}

function hasMeaningfulCharacters(value: string) {
  const compactValue = value.replace(/\s/g, "");
  const alphaNumericChars = compactValue.match(/[\p{L}\p{N}]/gu) ?? [];
  const letterChars = compactValue.match(/[\p{L}]/gu) ?? [];

  if (compactValue.length === 0) {
    return false;
  }

  if (alphaNumericChars.length < 4 || letterChars.length < 3) {
    return false;
  }

  return alphaNumericChars.length / compactValue.length >= 0.45;
}

function containsProfanity(value: string) {
  const normalizedValue = stripVietnamese(value).toLocaleLowerCase("vi-VN");
  return PROFANITY_PATTERNS.some((pattern) => pattern.test(normalizedValue));
}

export function isRenderableCommentContent(value: string) {
  const normalizedValue = normalizeCommentContent(value);

  if (!normalizedValue) {
    return false;
  }

  if (!hasMeaningfulCharacters(normalizedValue)) {
    return false;
  }

  if (hasTooManyRepeatedCharacters(normalizedValue)) {
    return false;
  }

  if (containsProfanity(normalizedValue)) {
    return false;
  }

  return true;
}

export function validateCommentContent(value: string) {
  const normalizedValue = normalizeCommentContent(value);

  if (!normalizedValue) {
    return {
      isValid: false,
      normalizedValue,
      message: "Nội dung đánh giá không được để trống.",
    };
  }

  if (normalizedValue.length < 6) {
    return {
      isValid: false,
      normalizedValue,
      message: "Nội dung đánh giá cần rõ ý hơn, tối thiểu 6 ký tự.",
    };
  }

  if (!hasMeaningfulCharacters(normalizedValue)) {
    return {
      isValid: false,
      normalizedValue,
      message: "Nội dung đánh giá chưa có ý nghĩa rõ ràng.",
    };
  }

  if (hasTooManyRepeatedCharacters(normalizedValue)) {
    return {
      isValid: false,
      normalizedValue,
      message: "Nội dung đánh giá có dấu hiệu spam ký tự lặp lại.",
    };
  }

  if (containsProfanity(normalizedValue)) {
    return {
      isValid: false,
      normalizedValue,
      message: "Nội dung đánh giá chứa từ ngữ không phù hợp.",
    };
  }

  return {
    isValid: true,
    normalizedValue,
    message: "",
  };
}
