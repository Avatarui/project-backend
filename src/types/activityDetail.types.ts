export interface ActivityDetail {
  act_detail_id?: number;
  uid: string;
  act_id: number;
  goal: number;
  unit: string;
  round: number;
  message: string;
  time_remind?: string[];   // ["08:00", "12:30"]
  current_value?: number;
}

export interface UpdateCurrentValueRequest {
  current_value: number;
}

export interface IncreaseCurrentValueRequest {
  amount: number;
}

export interface DailyOverallPercent {
  date: string;
  overall_percent: number;
}