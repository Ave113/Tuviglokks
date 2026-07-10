/** Giá trị birthplace — một nguồn duy nhất cho UI, normalizeToHanoi và lưu hồ sơ. */
export const BIRTHPLACE = {
  SOUTH: "Miền Nam VN",
  CENTRAL_SOUTH_OF_17:
    "Miền Trung VN (Vĩ tuyến 17 trở vào: Huế, Đà Nẵng, Khánh Hòa...)",
  CENTRAL_NORTH_OF_17:
    "Miền Trung VN (Vĩ tuyến 17 trở ra: Thanh Hóa, Nghệ An, Hà Tĩnh, Quảng Bình)",
  NORTH: "Miền Bắc VN / Khác",
  OVERSEAS: "Nước ngoài (Quy đổi GMT+7)",
} as const;

export type BirthplaceRegion = (typeof BIRTHPLACE)[keyof typeof BIRTHPLACE];

/** Dropdown Địa danh sinh — label ngắn cho UI, value luôn là BIRTHPLACE.* */
export const BIRTHPLACE_OPTIONS: ReadonlyArray<{
  value: BirthplaceRegion;
  label: string;
}> = [
  { value: BIRTHPLACE.SOUTH, label: "Miền Nam VN" },
  {
    value: BIRTHPLACE.CENTRAL_SOUTH_OF_17,
    label: "Miền Trung (Quảng Trị trở vào)",
  },
  {
    value: BIRTHPLACE.CENTRAL_NORTH_OF_17,
    label: "Miền Trung (Quảng Bình trở ra)",
  },
  { value: BIRTHPLACE.NORTH, label: "Miền Bắc VN / Khác" },
  { value: BIRTHPLACE.OVERSEAS, label: "Nước ngoài (Quy đổi GMT+7)" },
];

/** Miền Nam + Miền Trung vĩ tuyến 17 trở vào: GMT+8 trong giai đoạn 1960–1975. */
export function isGmt8HistoricalRegion(birthplace: BirthplaceRegion): boolean {
  return (
    birthplace === BIRTHPLACE.SOUTH ||
    birthplace === BIRTHPLACE.CENTRAL_SOUTH_OF_17
  );
}

export function isOverseasBirthplace(birthplace: BirthplaceRegion): boolean {
  return birthplace === BIRTHPLACE.OVERSEAS;
}

/** Nhãn rút gọn cho danh sách hồ sơ. */
export function birthplaceShortLabel(birthplace: BirthplaceRegion): string {
  if (birthplace === BIRTHPLACE.SOUTH) return "M.Nam";
  if (
    birthplace === BIRTHPLACE.CENTRAL_SOUTH_OF_17 ||
    birthplace === BIRTHPLACE.CENTRAL_NORTH_OF_17
  ) {
    return "M.Trung";
  }
  if (birthplace === BIRTHPLACE.OVERSEAS) return "N.Ngoài";
  return "M.Bắc";
}

/** Nhãn hiển thị đầy đủ hơn (vd. banner hiệu chỉnh giờ). */
export function birthplaceDisplayLabel(birthplace: BirthplaceRegion): string {
  const opt = BIRTHPLACE_OPTIONS.find((o) => o.value === birthplace);
  if (opt) return opt.label;
  return birthplace;
}