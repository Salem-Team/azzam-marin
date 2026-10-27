export const MOCK_USER = {
  name: "Ahmed Azzam",
  nameAr: "أحمد عزام",
  role: "System Administrator",
  roleAr: "مدير النظام",
  email: "ahmed.azzam@azzammarine.local",
  initials: "AA",
} as const;

export type NotificationTone =
  | "alert"
  | "success"
  | "info"
  | "finance"
  | "shipping";

/** Frontend demo notifications — not live operational alerts. */
export const MOCK_NOTIFICATIONS: readonly {
  id: string;
  tone: NotificationTone;
  unread: boolean;
  href: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  timeEn: string;
  timeAr: string;
}[] = [
  {
    id: "n1",
    tone: "alert",
    unread: true,
    href: "/spare-parts/sp-001",
    titleEn: "Low stock alert",
    titleAr: "تنبيه مخزون منخفض",
    bodyEn: "Fuel Filter Element is below the minimum level (3 / 10).",
    bodyAr: "عنصر فلتر الوقود أقل من الحد الأدنى (٣ / ١٠).",
    timeEn: "10 min ago",
    timeAr: "منذ ١٠ دقائق",
  },
  {
    id: "n2",
    tone: "success",
    unread: true,
    href: "/purchase-orders/PO-2025-0031",
    titleEn: "Purchase order approved",
    titleAr: "اعتماد أمر شراء",
    bodyEn: "PO-2025-0031 was approved for Mitsubishi Marine.",
    bodyAr: "تم اعتماد أمر الشراء PO-2025-0031 لميتسوبيشي مارين.",
    timeEn: "1 hour ago",
    timeAr: "منذ ساعة",
  },
  {
    id: "n3",
    tone: "shipping",
    unread: true,
    href: "/import-shipments",
    titleEn: "Shipment update",
    titleAr: "تحديث شحنة",
    bodyEn: "Container arrived at port and awaits customs clearance.",
    bodyAr: "وصلت الحاوية إلى الميناء وبانتظار التخليص الجمركي.",
    timeEn: "3 hours ago",
    timeAr: "منذ ٣ ساعات",
  },
  {
    id: "n4",
    tone: "finance",
    unread: true,
    href: "/receipts-payments",
    titleEn: "Payment received",
    titleAr: "استلام دفعة",
    bodyEn: "EGP 250,000 received from Delta Marine.",
    bodyAr: "تم استلام ٢٥٠٬٠٠٠ ج.م من دلتا مارين.",
    timeEn: "Yesterday",
    timeAr: "أمس",
  },
  {
    id: "n5",
    tone: "info",
    unread: false,
    href: "/exchange-rates",
    titleEn: "Exchange rate updated",
    titleAr: "تحديث سعر الصرف",
    bodyEn: "USD demonstration rate refreshed to 50.25 EGP.",
    bodyAr: "تم تحديث سعر الدولار التجريبي إلى ٥٠٫٢٥ ج.م.",
    timeEn: "Yesterday",
    timeAr: "أمس",
  },
];
