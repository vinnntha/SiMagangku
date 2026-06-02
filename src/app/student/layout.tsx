import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Siswa | SiMagangku",
  description:
    "Dashboard siswa SiMagangku — temukan perusahaan PKL, ajukan magang, dan pantau status pengajuan Anda.",
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
