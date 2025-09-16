// types/expectation.ts

// ใช้สำหรับ request body ตอนสร้าง expectation
export interface ExpectationBody {
  act_id: number;
  uid: string;
  user_exp: string;
}

// ใช้เวลาอ่านจาก database หรืออัปเดต/ลบ
export interface ExpectationRow extends ExpectationBody {
  exp_id: number;
}
