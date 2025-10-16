// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const uid = "oxOKctMxF1XrcyAUqs7oO3C5oYS2";

async function main() {
  await prisma.activity_history.deleteMany();
  await prisma.activity_detail.deleteMany();

 const details = [
  { uid, act_id: 300005, goal: 50,  unit: "km",  round: "week", message: "วิ่งตอนเย็น",                 time_remind: JSON.stringify(["06:00", "18:00"]), create_at: new Date("2024-10-01") },
  { uid, act_id: 300001, goal: 2000,unit: "ml",  round: "day",  message: "ดื่มน้ำให้ครบ",               time_remind: JSON.stringify(["07:00", "12:00", "18:00"]), create_at: new Date("2024-10-01") },
  { uid, act_id: 300007, goal: 5,   unit: "set", round: "day",  message: "ออกกำลังกายตอนเช้า",           time_remind: JSON.stringify(["07:00"]), create_at: new Date("2024-10-01") },
  { uid, act_id: 300009, goal: 20,  unit: "page",round: "day",  message: "อ่านหนังสือก่อนนอน",           time_remind: JSON.stringify(["21:00"]), create_at: new Date("2024-10-01") },
  { uid, act_id: 300006, goal: 30,  unit: "km",  round: "week", message: "ปั่นจักรยานชมวิว",             time_remind: JSON.stringify(["06:30"]), create_at: new Date("2024-10-01") },
  { uid, act_id: 300002, goal: 3,   unit: "ครั้ง",round:"day",  message: "รับประทานอาหารให้ครบมื้อ",    time_remind: JSON.stringify(["08:00","12:00","18:00"]), create_at: new Date("2024-10-01") },
  { uid, act_id: 300012, goal: 1,   unit: "hr",  round: "day",  message: "เรียนรู้ออนไลน์",              time_remind: JSON.stringify(["20:00"]), create_at: new Date("2024-10-01") },
  { uid, act_id: 300011, goal: 1,   unit: "ครั้ง",round:"day",  message: "จัดโต๊ะ/ล้างจานทำความสะอาดใจ", time_remind: JSON.stringify(["19:00"]), create_at: new Date("2024-10-01") },
];


  await prisma.activity_detail.createMany({ data: details });
  console.log("✅ Inserted 8 activity_detail records");

  const createdDetails = await prisma.activity_detail.findMany({
    where: { uid },
    orderBy: { act_id: "asc" },
  });

  const goals = [50, 2000, 5, 20, 30, 3, 1, 1];

  const historyData: Array<{
    uid: string;
    act_detail_id: number;
    action: number;
    create_at: Date;
  }> = [];

  const start = new Date("2024-10-01");
  const end = new Date("2025-10-01");

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    for (let i = 0; i < createdDetails.length; i++) {
      if (Math.random() < 0.7) {
        const goal = goals[i];
        const done = goal * (Math.random() * 0.7 + 0.5);
        historyData.push({
          uid,
          act_detail_id: createdDetails[i].act_detail_id,
          action: parseFloat(done.toFixed(2)),
          create_at: new Date(d),
        });
      }
    }
  }

  if (historyData.length > 0) {
    const chunk = 5000;
    for (let i = 0; i < historyData.length; i += chunk) {
      await prisma.activity_history.createMany({
        data: historyData.slice(i, i + chunk),
      });
    }
  }

  console.log(`✅ Inserted ${historyData.length} activity_history records`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
