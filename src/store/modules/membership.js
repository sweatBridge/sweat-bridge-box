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
        userMemberships: [
            {
                plan: '',
                type: '',
                count: 0,
                price: 0,
                assignee: '',
                startDate: null,
                endDate: null,
                holdStartDate: null,
                holdEndDate: null,
                createdAt: null,
                updatedAt: null,
            }
        ],
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

        SET_USER_MEMBERSHIPS(state, memberships) {
            state.userMemberships = memberships
        },
        ADD_USER_MEMBERSHIP(state, membership) {
            state.userMemberships.push(membership)
        }
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
        },

        async getUserMemberships({ commit }, payload) {
            try {
                const boxName = localStorage.getItem('boxName')
                if (!boxName || !payload.email) {
                    console.warn('boxName 또는 email이 없습니다.')
                    return
                }

                const memberDocRef = doc(
                    db,
                    `box/${boxName}/member/${payload.email}/membership/membership_doc`
                )

                const docSnap = await getDoc(memberDocRef)

                if (docSnap.exists()) {
                    const data = docSnap.data()
                    const memberships = data.memberships || []

                    commit('SET_USER_MEMBERSHIPS', memberships)
                    return memberships
                } else {
                    console.log('Membership 문서를 찾을 수 없습니다.')
                    commit('SET_USER_MEMBERSHIPS', [])
                    return []
                }
            } catch (error) {
                console.error('회원권 정보 불러오기 중 오류 발생:', error)
                commit('SET_USER_MEMBERSHIPS', [])
                return []
            }
        },

        async addUserMembership({ commit, state }, payload) {
            try {
                const boxName = localStorage.getItem('boxName')
                if (!boxName) {
                    console.error("Error: boxName is missing")
                    return
                }

                if (!payload.email || !payload.membership) {
                    console.error("Error: email or membership data is missing")
                    return
                }

                commit('ADD_USER_MEMBERSHIP', payload.membership)

                const membershipDocRef = doc(
                    db,
                    `box/${boxName}/member/${payload.email}/membership/membership_doc`
                )
                
                await setDoc(membershipDocRef, {
                    memberships: state.userMemberships
                })

                console.log('Successfully added new user membership:', payload.membership)
            } catch (error) {
                console.error('Error adding user membership:', error)
            }
        }

    },
    getters: {
        getMembershipPlans: (state) => state.plans,
    },
}


export default membership