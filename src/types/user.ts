export interface User {
  userID: number;
  username: string;
  password: string;
  usertype: 'admin' | 'member';
}

export interface UserRegister {
  username: string;
  password: string;
  usertype?: 'admin' | 'member';
}

export interface UserLogin {
  username: string;
  password: string;
}