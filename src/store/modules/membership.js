import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from '@/firebase'

const membership = {
    state: {
        plans: [
            {
                plan: '',
                type: '',
                count: 0,
                duration: 0,
                price: 0,
            }
        ],
        // userMembershipHistory: [
        //     {
        //         plan: '',
        //         type: '',
        //         count: 0,
        //         duration: 0,
        //         price: 0,
        //         assignee: '',
        //         status: '',
        //         startDate: null,
        //         endDate: null,
        //         createdAt: null,
        //         updatedAt: null,
        //     }
        // ]
    },
    mutations: {
        SET_MEMBERSHIP_PLANS(state, plans) {
            state.plans = plans;
        },
        ADD_MEMBERSHIP_PLAN(state, plan) {
            state.plans.push(plan);
        },
        REMOVE_MEMBERSHIP_PLAN(state, planName) {
            const index = state.plans.findIndex(plan => plan.plan === planName);
            if (index !== -1) {
                state.plans.splice(index, 1);
            }
        },
        
    },
    actions: {
        async getMembershipPlans({ commit }) {
            const boxName = localStorage.getItem('boxName');
            try {
                const membershipDocRef = doc(db, `box/${boxName}/membership`, "plansDoc");
        
                const docSnap = await getDoc(membershipDocRef);
        
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    commit('SET_MEMBERSHIP_PLANS', data.plans)

                    return data.plans || [];
                } else {
                    console.log("No membership document found, returning empty array.");
                    return [];
                }
            } catch (error) {
                console.error("Error fetching membership plans:", error);
                return [];
            }
        },

        async setMembershipPlans({ commit }, { plans }) {
            const boxName = localStorage.getItem('boxName');
            try {
                const membershipDocRef = doc(db, `box/${boxName}/membership`, "plansDoc");

                const docSnap = await getDoc(membershipDocRef);

                if (!docSnap.exists()) {
                    await setDoc(membershipDocRef, { plans: plans });
                    console.log("Created new membership plan document.");
                } else {
                    await setDoc(membershipDocRef, { plans: plans }, { merge: true });
                    console.log("Updated existing membership plan document.");
                }

                commit("SET_MEMBERSHIP_PLANS", plans);
            } catch (error) {
                console.error("Error setting membership plans:", error);
            }
        },

        async addMembershipPlan({ commit, state }, { plan }) {
            try {
                const boxName = localStorage.getItem('boxName');
                if (!boxName) {
                    console.error("Error: boxName is missing");
                    return;
                }

                commit('ADD_MEMBERSHIP_PLAN', plan);

                await this.dispatch("setMembershipPlans", { boxName, plans: state.plans });
                console.log("Successfully added new membership plan:", plan);
            } catch (error) {
                console.error("Error adding membership plan:", error);
            }
        },

        async deleteMembershipPlan({ commit, state }, plan) {
            try {
                const boxName = localStorage.getItem('boxName');
                if (!boxName) {
                    console.error("Error: boxName is missing");
                    return;
                }
        
                commit("REMOVE_MEMBERSHIP_PLAN", plan);
        
                await this.dispatch("setMembershipPlans", { boxName, plans: state.plans });
        
                console.log("Successfully deleted membership plan:", plan);
            } catch (error) {
                console.error("Error deleting membership plan:", error);
            }
        }
    },
    getters: {
        getMembershipPlans: (state) => state.plans,
    },
}


export default membership