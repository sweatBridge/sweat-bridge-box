import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from '@/firebase'
import { getCurrentMemberships } from '@/views/admin/util/member'

const membership = {
    state: {
        plans: [
            {
                plan: '',
                type: '',
                count: '0',
                duration: 0,
                price: '0',
            }
        ],
        userMemberships: [
            {
                plan: '',
                type: '',
                count: '0',
                price: '0',
                assignee: '',
                startDate: null,
                endDate: null,
                holdStartDate: null,
                holdEndDate: null,
                createdAt: null,
                updatedAt: null,
            }
        ],
        userCurrentMemberships: [],
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
        },
        REMOVE_USER_MEMBERSHIP(state, index) {
            if (index !== -1) {
                state.userMemberships.splice(index, 1);
            }
        },

        SET_USER_CURRENT_MEMBERSHIP(state, memberships) {
            state.userCurrentMemberships = memberships
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
                    `box/${boxName}/member/${payload.email}`
                )

                const docSnap = await getDoc(memberDocRef)

                if (docSnap.exists()) {
                    const data = docSnap.data()
                    const memberships = data.memberships || []

                    commit('SET_USER_MEMBERSHIPS', memberships)

                    const currentMemberships = getCurrentMemberships(memberships)
                    commit('SET_USER_CURRENT_MEMBERSHIP', currentMemberships)
                    return memberships
                } else {
                    console.log('Member 문서를 찾을 수 없습니다.')
                    commit('SET_USER_MEMBERSHIPS', [])
                    commit('SET_USER_CURRENT_MEMBERSHIP', [])
                    return []
                }
            } catch (error) {
                console.error('회원권 정보 불러오기 중 오류 발생:', error)
                commit('SET_USER_MEMBERSHIPS', [])
                commit('SET_USER_CURRENT_MEMBERSHIP', [])
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

                // 새로운 멤버십의 시작일과 종료일
                const newStartDate = payload.membership.startDate?.toDate?.() ?? new Date(payload.membership.startDate)
                const newEndDate = payload.membership.endDate?.toDate?.() ?? new Date(payload.membership.endDate)

                // 기존 멤버십들과 날짜 겹침 체크
                for (const existingMembership of state.userMemberships) {
                    const existingStartDate = existingMembership.startDate?.toDate?.() ?? new Date(existingMembership.startDate)
                    const existingEndDate = existingMembership.endDate?.toDate?.() ?? new Date(existingMembership.endDate)

                    // 날짜 겹침 체크: (시작일1 <= 종료일2) && (시작일2 <= 종료일1)
                    if (newStartDate <= existingEndDate && existingStartDate <= newEndDate) {
                        throw new Error(`일자가 겹치는 다른 회원권이 있습니다. 회원권의 일자를 다시 확인해주세요. 기존 멤버십: ${existingStartDate.toLocaleDateString()} ~ ${existingEndDate.toLocaleDateString()}`)
                    }
                }

                commit('ADD_USER_MEMBERSHIP', payload.membership)

                const memberDocRef = doc(
                    db,
                    `box/${boxName}/member/${payload.email}`
                )
                
                await setDoc(memberDocRef, {
                    memberships: state.userMemberships
                }, { merge: true })

                console.log('Successfully added new user membership:', payload.membership)
            } catch (error) {
                console.error('Error adding user membership:', error)
                throw error // 에러를 다시 던져서 호출한 곳에서 처리할 수 있도록
            }
        },

        async removeUserMembership({ commit, state }, payload) {
            try {
                const boxName = localStorage.getItem('boxName')
                if (!boxName) {
                    console.error("Error: boxName is missing")
                    return
                }

                if (payload.index === undefined || payload.email === undefined) {
                    console.error("Error: membership index or email is missing")
                    return
                }

                commit('REMOVE_USER_MEMBERSHIP', payload.index)
                const updatedMemberships = [...state.userMemberships]

                const membershipDocRef = doc(
                    db,
                    `box/${boxName}/member/${payload.email}`
                )
                
                await setDoc(membershipDocRef, {
                    memberships: updatedMemberships
                }, { merge: true })

                console.log('Successfully removed user membership at index:', payload.index)
            } catch (error) {
                console.error('Error removing user membership:', error)
                throw error
            }
        }

    },
    getters: {
        getMembershipPlans: (state) => state.plans,
    },
}


export default membership