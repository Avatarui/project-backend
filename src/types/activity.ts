export interface Activity {
    act_id: number;
    uid: string;
    cate_id: number;
    act_name: string;
    act_pic: string;
}
// ใช้สำหรับสรุปผลกิจกรรมตาม act_detail_id
export interface ActivityItemSummary {
  act_detail_id: number;
  total_goal: number;    // ปัดทศนิยม 2 ตำแหน่ง
  total_action: number;  // ปัดทศนิยม 2 ตำแหน่ง
  is_success: boolean;   // total_action == total_goal ?
}

export interface ActivitySummary {
  uid: string;
  total_activities: number;     // จำนวน act_detail_id ของ user
  success_activities: number;   // รายการที่สำเร็จ
  failed_activities: number;    // รายการที่ไม่สำเร็จ
  items: ActivityItemSummary[];
}