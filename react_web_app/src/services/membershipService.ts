import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MembershipPlan } from '../types/membership';

export class MembershipService {
  private static getBoxName(): string {
    return localStorage.getItem('boxName') || 'SWEAT';
  }

  static async getMembershipPlans(): Promise<MembershipPlan[]> {
    try {
      const boxName = this.getBoxName();
      const membershipDocRef = doc(db, `box/${boxName}/membership`, "plansDoc");
      
      const docSnap = await getDoc(membershipDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.plans || [];
      } else {
        console.log("No membership document found, returning empty array.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching membership plans:", error);
      throw error;
    }
  }

  static async setMembershipPlans(plans: MembershipPlan[]): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const membershipDocRef = doc(db, `box/${boxName}/membership`, "plansDoc");

      const docSnap = await getDoc(membershipDocRef);

      if (!docSnap.exists()) {
        await setDoc(membershipDocRef, { plans: plans });
        console.log("Created new membership plan document.");
      } else {
        await setDoc(membershipDocRef, { plans: plans }, { merge: true });
        console.log("Updated existing membership plan document.");
      }
    } catch (error) {
      console.error("Error setting membership plans:", error);
      throw error;
    }
  }

  static async addMembershipPlan(plan: MembershipPlan): Promise<void> {
    try {
      const existingPlans = await this.getMembershipPlans();
      const updatedPlans = [...existingPlans, plan];
      await this.setMembershipPlans(updatedPlans);
      console.log("Successfully added new membership plan:", plan);
    } catch (error) {
      console.error("Error adding membership plan:", error);
      throw error;
    }
  }

  static async deleteMembershipPlan(planName: string): Promise<void> {
    try {
      const existingPlans = await this.getMembershipPlans();
      const updatedPlans = existingPlans.filter(plan => plan.plan !== planName);
      await this.setMembershipPlans(updatedPlans);
      console.log("Successfully deleted membership plan:", planName);
    } catch (error) {
      console.error("Error deleting membership plan:", error);
      throw error;
    }
  }
} 