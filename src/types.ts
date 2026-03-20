export interface Vehicle {
  name: string;
  value: number;
  tax: number;
}

export interface Negotiation {
  id: string;
  userId: string;
  vehicles: Vehicle[];
  totalTax: number;
  userProfit: number;
  timestamp: any; // Firestore Timestamp
  status: 'realized' | 'canceled';
}

export interface UserProfile {
  uid: string;
  username: string;
  createdAt: any; // Firestore Timestamp
}
