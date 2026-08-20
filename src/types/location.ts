export type Location = {
  id: number;
  tenViTri: string;
  tinhThanh: string;
  quocGia: string;
  hinhAnh: string;
};

export type LocationPayload = {
  id?: number;
  tenViTri: string;
  tinhThanh: string;
  quocGia: string;
  hinhAnh?: string;
};
