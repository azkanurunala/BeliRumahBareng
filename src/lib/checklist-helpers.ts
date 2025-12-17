/**
 * Helper functions for checklist items
 * This file is not a server action, so it can export regular functions
 */

/**
 * Get default checklist items for KYC and Closing categories
 * Returns array of default checklist items with labels and order
 */
export function getDefaultChecklistItems(category: 'kyc' | 'closing'): Array<{ label: string; order: number }> {
  if (category === 'kyc') {
    return [
      { label: 'Unggah foto KTP / identitas resmi', order: 0 },
      { label: 'Verifikasi wajah (selfie / liveness check)', order: 1 },
      { label: 'Verifikasi data NPWP (jika diperlukan)', order: 2 },
      { label: 'Verifikasi sumber dana (opsional lanjut)', order: 3 },
      { label: 'Konfirmasi informasi pribadi', order: 4 },
      { label: 'Review / dan persetujuan internal', order: 5 },
    ];
  }
  
  if (category === 'closing') {
    return [
      { label: 'Pembangunan fisik selesai', order: 0 },
      { label: 'Serah terima unit ke pemilik', order: 1 },
      { label: 'Penyelesaian Akta Jual Beli (AJB)', order: 2 },
      { label: 'Pembayaran pajak & biaya legal (mis. BPHTB)', order: 3 },
      { label: 'Balik nama / pengalihan hak', order: 4 },
      { label: 'Registrasi ke BPN / sertifikat baru', order: 5 },
      { label: 'Penyerahan dokumen kepemilikan final', order: 6 },
    ];
  }
  
  return [];
}

/**
 * Calculate progress for a single checklist item
 * Formula: (jumlah anggota yang selesai / total anggota project) × 100
 */
export function calculateChecklistItemProgress(
  completedMembersCount: number,
  totalMembersCount: number
): number {
  if (totalMembersCount === 0) {
    return 0;
  }
  const progress = (completedMembersCount / totalMembersCount) * 100;
  return Math.round(Math.min(100, Math.max(0, progress)));
}

/**
 * Calculate overall progress from multiple checklist items
 * Formula: rata-rata dari semua progress items
 */
export function calculateOverallProgressFromChecklistItems(
  itemProgresses: number[]
): number {
  if (itemProgresses.length === 0) {
    return 0;
  }
  const sum = itemProgresses.reduce((acc, progress) => acc + progress, 0);
  const average = sum / itemProgresses.length;
  return Math.round(Math.min(100, Math.max(0, average)));
}

